import { createBrowserClient } from '@/lib/database/client'
import { verificationService } from './verification-service'
import type { VerificationEntry } from '@/types'
import { logAuditEntry } from '@/lib/audit'
import type { Database, Json } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

type PendingBookingsRow = Database['public']['Tables']['pending_bookings']['Row']

/**
 * Internal helper to get the correct Supabase client (passed in or default browser).
 * This makes the service "Universal" (safe for both Client and Server/AI).
 */
function getSupabase(client?: SupabaseClient<Database>) {
  return client || createBrowserClient()
}

// =============================================================================
// Types
// =============================================================================

export type PendingBookingSourceType =
  | 'payslip'
  | 'customer_invoice'
  | 'supplier_invoice'
  | 'invoice_payment'
  | 'transaction'
  | 'receipt'
  | 'dividend_decision'
  | 'dividend_payment'
  | 'owner_withdrawal'
  | 'egenavgifter'
  | 'ai_entry'

export type PendingBookingStatus = 'pending' | 'booked' | 'dismissed'

export interface PendingBookingRow {
  id: string
  source_type: string
  source_id: string
  description: string
  proposed_entries: VerificationEntry[]
  proposed_series: string | null
  proposed_date: string
  status: string
  user_id: string | null
  company_id: string | null
  created_at: string
  booked_at: string | null
  verification_id: string | null
  metadata: Record<string, unknown> | null
}

export interface PendingBooking {
  id: string
  sourceType: PendingBookingSourceType
  sourceId: string
  description: string
  proposedEntries: VerificationEntry[]
  proposedSeries: string
  proposedDate: string
  status: PendingBookingStatus
  createdAt: string
  bookedAt: string | null
  verificationId: string | null
  metadata: Record<string, unknown> | null
}

export interface CreatePendingBookingParams {
  sourceType: PendingBookingSourceType
  sourceId: string
  description: string
  entries: VerificationEntry[]
  series?: string
  date: string
  metadata?: Record<string, unknown>
}

export interface GetPendingBookingsFilters {
  sourceType?: PendingBookingSourceType
  status?: PendingBookingStatus
}

// =============================================================================
// Row mapper
// =============================================================================

function mapDbRowToPendingBooking(row: PendingBookingsRow): PendingBooking {
  const meta = (row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata))
    ? row.metadata as Record<string, unknown>
    : null
  return {
    id: row.id,
    sourceType: (row.source_type ?? 'ai_entry') as PendingBookingSourceType,
    sourceId: row.source_id ?? row.item_id ?? '',
    description: row.description ?? '',
    proposedEntries: (meta?.entries ?? []) as VerificationEntry[],
    proposedSeries: ((meta?.series as string) ?? 'A'),
    proposedDate: ((meta?.date as string) ?? row.created_at ?? new Date().toISOString()),
    status: (row.status ?? 'pending') as PendingBookingStatus,
    createdAt: row.created_at ?? new Date().toISOString(),
    bookedAt: null,
    verificationId: null,
    metadata: meta,
  }
}

// =============================================================================
// Source entity status update table
// =============================================================================

type SupabaseTableName = keyof Database['public']['Tables']

const SOURCE_TABLE_MAP: Record<string, { table: SupabaseTableName; statusValue: string }> = {
  payslip: { table: 'payslips', statusValue: 'booked' },
  customer_invoice: { table: 'customer_invoices', statusValue: 'Bokförd' },
  supplier_invoice: { table: 'supplier_invoices', statusValue: 'Bokförd' },
  invoice_payment: { table: 'customer_invoices', statusValue: 'Betald' },
  transaction: { table: 'transactions', statusValue: 'Bokförd' },
  dividend_decision: { table: 'dividends', statusValue: 'booked' },
  dividend_payment: { table: 'dividends', statusValue: 'paid' },
}

// =============================================================================
// Service
// =============================================================================

export const pendingBookingService = {
  /**
   * Create a new pending booking in the queue.
   * Called by API routes after saving the source entity (payslip, invoice, etc.)
   */
  async createPendingBooking(params: CreatePendingBookingParams, client?: SupabaseClient<Database>): Promise<PendingBooking> {
    const supabase = getSupabase(client)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Ingen inloggad användare')

    // Get company_id from membership
    const { data: membership } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    // The DB schema stores simplified pending booking info.
    // Complex multi-line entries are stored in metadata.
    const firstEntry = params.entries[0]
    const totalAmount = params.entries.reduce((sum, e) => sum + (e.debit || 0), 0)

    const { data, error } = await supabase
      .from('pending_bookings')
      .insert({
        source_type: params.sourceType,
        source_id: params.sourceId,
        description: params.description,
        account_debit: firstEntry?.account?.toString() ?? null,
        account_credit: params.entries.find(e => (e.credit || 0) > 0)?.account?.toString() ?? null,
        amount: totalAmount,
        item_type: params.sourceType,
        item_id: params.sourceId,
        user_id: user.id,
        company_id: membership?.company_id ?? null,
        metadata: {
          entries: params.entries,
          series: params.series ?? 'A',
          date: params.date,
          ...(params.metadata ?? {}),
        } as unknown as Json,
      })
      .select()
      .single()

    if (error) {
      console.error('[PendingBookingService] create error:', error)
      throw error
    }

    return mapDbRowToPendingBooking(data)
  },

  /**
   * Fetch pending bookings with optional filters.
   */
  async getPendingBookings(filters?: GetPendingBookingsFilters, client?: SupabaseClient<Database>): Promise<PendingBooking[]> {
    const supabase = getSupabase(client)

    let query = supabase
      .from('pending_bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.sourceType) {
      query = query.eq('source_type', filters.sourceType)
    }

    // Default to pending only unless explicitly requesting another status
    query = query.eq('status', filters?.status || 'pending')

    const { data, error } = await query

    if (error) {
      console.error('[PendingBookingService] getPendingBookings error:', error)
      return []
    }

    return (data || []).map(mapDbRowToPendingBooking)
  },

  /**
   * Book a single pending item:
   * 1. Validate entries balance
   * 2. Create verification via verificationService
   * 3. Atomically update pending_booking + source entity status via RPC
   *    (if RPC fails, compensate by deleting the orphaned verification)
   */
  async bookPendingItem(
    id: string,
    finalEntries?: VerificationEntry[],
    client?: SupabaseClient<Database>
  ): Promise<{ verificationId: string; verificationNumber: string }> {
    const supabase = getSupabase(client)

    // 1. Fetch the pending booking
    const { data: row, error: fetchError } = await supabase
      .from('pending_bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !row) {
      throw new Error('Pending booking hittades inte')
    }

    const pending = mapDbRowToPendingBooking(row)

    if (pending.status !== 'pending') {
      throw new Error(`Kan inte bokföra — status är redan "${pending.status}"`)
    }

    // Use final entries if provided (wizard may have adjusted), otherwise use proposed
    const entries = finalEntries || pending.proposedEntries

    // 2. Validate entries balance
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0)
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Verifikationen balanserar inte: debet ${totalDebit.toFixed(2)}, kredit ${totalCredit.toFixed(2)}`
      )
    }

    // 3. Create the verification (header + lines)
    const verification = await verificationService.createVerification({
      series: pending.proposedSeries,
      date: pending.proposedDate,
      description: pending.description,
      entries,
      sourceType: pending.sourceType,
      sourceId: pending.sourceId,
    }, client)

    // 4. Atomically update pending_booking status + source entity status via RPC
    //    Both updates happen in one DB transaction — either both succeed or both roll back.
    //    The RPC also guards against double-booking (WHERE status = 'pending').
    const { error: rpcError } = await supabase.rpc('book_pending_item_status', {
      p_pending_id: id,
      p_verification_id: verification.id,
      p_entries: entries as unknown as Json,
      p_source_type: pending.sourceType,
      p_source_id: pending.sourceId,
    })

    if (rpcError) {
      // Compensate: delete the orphaned verification so the user can retry
      console.error('[PendingBookingService] Atomic status update failed, compensating:', rpcError)
      try {
        await supabase.from('verification_lines').delete().eq('verification_id', verification.id)
        await supabase.from('verifications').delete().eq('id', verification.id)
      } catch (cleanupErr) {
        console.error('[PendingBookingService] Compensation cleanup also failed:', cleanupErr)
      }
      throw new Error(
        `Bokföring misslyckades — verifikation och statusuppdatering har rullats tillbaka. ` +
        `Försök igen. Fel: ${rpcError.message}`
      )
    }

    logAuditEntry({
      action: 'booked',
      entityType: 'verifications',
      entityId: verification.id,
      entityName: `${verification.series}${verification.number}`,
      metadata: { sourceType: pending.sourceType, sourceId: pending.sourceId, pendingBookingId: id },
    })

    return {
      verificationId: verification.id,
      verificationNumber: `${verification.series}${verification.number}`,
    }
  },

  /**
   * Batch book multiple pending items (for simple items that need no wizard steps).
   */
  async bookPendingItems(
    ids: string[],
    client?: SupabaseClient<Database>
  ): Promise<{ booked: number; errors: Array<{ id: string; error: string }> }> {
    const results = { booked: 0, errors: [] as Array<{ id: string; error: string }> }

    for (const id of ids) {
      try {
        await this.bookPendingItem(id, undefined, client)
        results.booked++
      } catch (err) {
        results.errors.push({
          id,
          error: err instanceof Error ? err.message : 'Okänt fel',
        })
      }
    }

    return results
  },

  /**
   * Dismiss a pending booking (user chose not to book).
   */
  async dismissPendingBooking(id: string, client?: SupabaseClient<Database>): Promise<void> {
    const supabase = getSupabase(client)

    const { error } = await supabase
      .from('pending_bookings')
      .update({ status: 'dismissed' })
      .eq('id', id)

    if (error) {
      console.error('[PendingBookingService] dismiss error:', error)
      throw error
    }
  },

  /**
   * Dismiss multiple pending bookings.
   */
  async dismissPendingBookings(ids: string[], client?: SupabaseClient<Database>): Promise<void> {
    const supabase = getSupabase(client)

    const { error } = await supabase
      .from('pending_bookings')
      .update({ status: 'dismissed' })
      .in('id', ids)

    if (error) {
      console.error('[PendingBookingService] batch dismiss error:', error)
      throw error
    }
  },

  /**
   * Get the deterministic status of a pending booking.
   */
  async getStatus(id: string, client?: SupabaseClient<Database>): Promise<PendingBookingStatus> {
    const supabase = getSupabase(client)
    const { data } = await supabase
      .from('pending_bookings')
      .select('status')
      .eq('id', id)
      .single()
    
    return (data?.status as PendingBookingStatus) || 'pending'
  },

  /**
   * Get count of pending (unbooked) items for badge display.
   */
  async getPendingCount(client?: SupabaseClient<Database>): Promise<number> {
    const supabase = getSupabase(client)

    const { count, error } = await supabase
      .from('pending_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (error) {
      console.error('[PendingBookingService] getPendingCount error:', error)
      return 0
    }

    return count || 0
  },

  /**
   * Update the source entity's status to 'booked'/'bokförd'.
   * Note: For normal booking flow, this is handled atomically by the
   * book_pending_item_status RPC. This method is kept for manual/admin use.
   */
  async updateSourceEntityStatus(sourceType: string, sourceId: string, client?: SupabaseClient<Database>): Promise<void> {
    const mapping = SOURCE_TABLE_MAP[sourceType]
    if (!mapping) return // owner_withdrawal, ai_entry — no status update needed

    const supabase = getSupabase(client)

    // Each source table has its own Supabase type signature, so we update
    // them individually to keep the compiler happy.
    async function updateStatus(table: SupabaseTableName, status: string, id: string) {
      switch (table) {
        case 'payslips':
          return supabase.from('payslips').update({ status }).eq('id', id)
        case 'customer_invoices':
          return supabase.from('customer_invoices').update({ status }).eq('id', id)
        case 'supplier_invoices':
          return supabase.from('supplier_invoices').update({ status }).eq('id', id)
        case 'transactions':
          return supabase.from('transactions').update({ status }).eq('id', id)
        case 'dividends':
          return supabase.from('dividends').update({ status }).eq('id', id)
        default:
          return { error: { message: `Okänd tabell: ${table}` } }
      }
    }

    const { error } = await updateStatus(mapping.table, mapping.statusValue, sourceId)

    if (error) {
      throw new Error(
        `Kunde inte uppdatera status på ${mapping.table} (${sourceId}): ${error.message}`
      )
    }

    logAuditEntry({
      action: 'booked',
      entityType: 'verifications',
      entityId: sourceId,
      entityName: `${sourceType}:${sourceId}`,
      metadata: { sourceType, status: mapping.statusValue },
    })
  },
}
