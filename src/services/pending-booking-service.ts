import { getSupabaseClient } from '@/lib/database/supabase'
import { verificationService, type VerificationEntry } from './verification-service'
import { logAuditEntry } from '@/lib/audit'

// pending_bookings generated types don't match PendingBookingRow — needs migration to align columns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db() { return getSupabaseClient() as any }

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

function mapRowToPendingBooking(row: PendingBookingRow): PendingBooking {
  return {
    id: row.id,
    sourceType: row.source_type as PendingBookingSourceType,
    sourceId: row.source_id,
    description: row.description,
    proposedEntries: row.proposed_entries || [],
    proposedSeries: row.proposed_series || 'A',
    proposedDate: row.proposed_date,
    status: row.status as PendingBookingStatus,
    createdAt: row.created_at,
    bookedAt: row.booked_at,
    verificationId: row.verification_id,
    metadata: row.metadata,
  }
}

// =============================================================================
// Source entity status update table
// =============================================================================

const SOURCE_TABLE_MAP: Record<string, { table: string; statusValue: string }> = {
  payslip: { table: 'payslips', statusValue: 'booked' },
  customer_invoice: { table: 'customerinvoices', statusValue: 'Bokförd' },
  supplier_invoice: { table: 'supplierinvoices', statusValue: 'Bokförd' },
  invoice_payment: { table: 'customerinvoices', statusValue: 'Betald' },
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
  async createPendingBooking(params: CreatePendingBookingParams): Promise<PendingBooking> {
    const supabase = db()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Ingen inloggad användare')

    // Get company_id from membership
    const { data: membership } = await supabase
      .from('companymembers')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    const { data, error } = await supabase
      .from('pending_bookings')
      .insert({
        source_type: params.sourceType,
        source_id: params.sourceId,
        description: params.description,
        proposed_entries: params.entries as unknown as Record<string, unknown>,
        proposed_series: params.series || 'A',
        proposed_date: params.date,
        user_id: user.id,
        company_id: membership?.company_id || null,
        metadata: params.metadata as unknown as Record<string, unknown> || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[PendingBookingService] create error:', error)
      throw error
    }

    return mapRowToPendingBooking(data as unknown as PendingBookingRow)
  },

  /**
   * Fetch pending bookings with optional filters.
   */
  async getPendingBookings(filters?: GetPendingBookingsFilters): Promise<PendingBooking[]> {
    const supabase = db()

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

    return (data || []).map((row: PendingBookingRow) => mapRowToPendingBooking(row))
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
    finalEntries?: VerificationEntry[]
  ): Promise<{ verificationId: string; verificationNumber: string }> {
    const supabase = db()

    // 1. Fetch the pending booking
    const { data: row, error: fetchError } = await supabase
      .from('pending_bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !row) {
      throw new Error('Pending booking hittades inte')
    }

    const pending = mapRowToPendingBooking(row as unknown as PendingBookingRow)

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
    })

    // 4. Atomically update pending_booking status + source entity status via RPC
    //    Both updates happen in one DB transaction — either both succeed or both roll back.
    //    The RPC also guards against double-booking (WHERE status = 'pending').
    const { error: rpcError } = await supabase.rpc('book_pending_item_status', {
      p_pending_id: id,
      p_verification_id: verification.id,
      p_entries: entries as unknown as Record<string, unknown>,
      p_source_type: pending.sourceType,
      p_source_id: pending.sourceId,
    })

    if (rpcError) {
      // Compensate: delete the orphaned verification so the user can retry
      console.error('[PendingBookingService] Atomic status update failed, compensating:', rpcError)
      try {
        const realSupabase = getSupabaseClient()
        await realSupabase.from('verification_lines').delete().eq('verification_id', verification.id)
        await realSupabase.from('verifications').delete().eq('id', verification.id)
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
    ids: string[]
  ): Promise<{ booked: number; errors: Array<{ id: string; error: string }> }> {
    const results = { booked: 0, errors: [] as Array<{ id: string; error: string }> }

    for (const id of ids) {
      try {
        await this.bookPendingItem(id)
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
  async dismissPendingBooking(id: string): Promise<void> {
    const supabase = db()

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
  async dismissPendingBookings(ids: string[]): Promise<void> {
    const supabase = db()

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
   * Get count of pending (unbooked) items for badge display.
   */
  async getPendingCount(): Promise<number> {
    const supabase = db()

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
  async updateSourceEntityStatus(sourceType: string, sourceId: string): Promise<void> {
    const mapping = SOURCE_TABLE_MAP[sourceType]
    if (!mapping) return // owner_withdrawal, ai_entry — no status update needed

    const supabase = db()

    const { error } = await supabase
      .from(mapping.table)
      .update({ status: mapping.statusValue })
      .eq('id', sourceId)

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
