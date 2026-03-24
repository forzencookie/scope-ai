import { createBrowserClient } from '@/lib/database/client'
import type { Json, Database } from '@/types/database'
import type { Verification, VerificationEntry, VerificationAttachment } from '@/types'
import { logAuditEntry } from '@/lib/audit'
import { nullToUndefined } from '@/lib/utils'
import { isValidAccount } from '@/lib/bookkeeping/utils'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Internal helper to get the correct Supabase client (passed in or default browser).
 * This makes the service "Universal" (safe for both Client and Server/AI).
 */
function getSupabase(client?: SupabaseClient<Database>) {
    return client || createBrowserClient()
}

/**
 * Verification Row - represents a single accounting verification (verifikat)
 */
export type VerificationRow = Database['public']['Tables']['verifications']['Row']

/** Map a database row to the Verification UI model. */
function mapRowToVerification(row: VerificationRow): Verification {
    const entries = (row.rows as VerificationEntry[] | null) || []
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0)
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0)

    return {
        id: row.id,
        number: row.number || 0,
        series: row.series || 'A',
        date: row.date || '',
        description: row.description || '',
        entries,
        totalDebit,
        totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
        createdAt: row.created_at || '',
    }
}

/**
 * Verification filter options
 */
export interface GetVerificationsOptions {
    limit?: number
    offset?: number
    search?: string
    series?: string
    startDate?: string
    endDate?: string
    year?: number
}

/**
 * Verification statistics
 */
export interface VerificationStats {
    totalCount: number
    currentYearCount: number
    lastVerificationNumber: number
    lastVerificationDate: string | null
}

export const verificationService = {
    /**
     * Check if a financial period is locked (closed)
     */
    async getPeriodStatus(date: string, client?: SupabaseClient<Database>): Promise<'open' | 'closed'> {
        const supabase = getSupabase(client)
        const d = new Date(date)
        const periodId = `${d.getFullYear()}-M${String(d.getMonth() + 1).padStart(2, '0')}`

        const { data: company } = await supabase.from('companies').select('id').single()
        if (!company) throw new Error('Företag saknas.')

        const { data: period } = await supabase
            .from('financial_periods')
            .select('status')
            .eq('id', periodId)
            .eq('company_id', company.id)
            .single()

        return (period?.status as 'open' | 'closed') || 'open'
    },
    async getVerifications({
        limit = 50,
        offset = 0,
        search = '',
        series,
        startDate,
        endDate,
        year
    }: GetVerificationsOptions = {}, client?: SupabaseClient<Database>) {
        const supabase = getSupabase(client)

        let query = supabase
            .from('verifications')
            .select('*', { count: 'exact' })
            .order('date', { ascending: false })
            .order('number', { ascending: false })
            .range(offset, offset + limit - 1)

        if (search) {
            query = query.ilike('description', `%${search}%`)
        }

        if (series) {
            query = query.eq('series', series)
        }

        if (startDate) {
            query = query.gte('date', startDate)
        }

        if (endDate) {
            query = query.lte('date', endDate)
        }

        if (year) {
            const yearStart = `${year}-01-01`
            const yearEnd = `${year}-12-31`
            query = query.gte('date', yearStart).lte('date', yearEnd)
        }

        const { data, error, count } = await query

        if (error) throw error

        if (!data || data.length === 0) {
            return {
                verifications: [],
                totalCount: 0
            }
        }

        const verifications: Verification[] = data.map(mapRowToVerification)

        return {
            verifications,
            totalCount: count || 0
        }
    },

    /**
     * Get a single verification by ID
     */
    async getVerificationById(id: string, client?: SupabaseClient<Database>): Promise<Verification | null> {
        const supabase = getSupabase(client)

        const { data, error } = await supabase
            .from('verifications')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) return null

        return mapRowToVerification(data)
    },

    /**
     * Get the next verification number for a given series and year.
     * Uses the database RPC for atomic numbering (BFL 5:7 compliance).
     */
    async getNextVerificationNumber(series: string = 'A', year?: number, client?: SupabaseClient<Database>): Promise<number> {
        const supabase = getSupabase(client)
        const targetYear = year || new Date().getFullYear()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Ingen inloggad användare')

        const { data, error } = await supabase.rpc('get_next_verification_number', {
            p_series: series,
            p_fiscal_year: targetYear,
            p_user_id: user.id,
        })

        if (error) {
            console.error('[VerificationService] RPC get_next_verification_number failed:', error)
            throw new Error('Kunde inte hämta nästa verifikationsnummer')
        }

        return (typeof data === 'number' ? data : 1) || 1
    },

    /**
     * Get verification statistics
     */
    async getStats(client?: SupabaseClient<Database>): Promise<VerificationStats> {
        const supabase = getSupabase(client)
        const currentYear = new Date().getFullYear()

        // Get total count
        const { count: totalCount } = await supabase
            .from('verifications')
            .select('*', { count: 'exact', head: true })

        // Get current year count
        const { count: currentYearCount } = await supabase
            .from('verifications')
            .select('*', { count: 'exact', head: true })
            .gte('date', `${currentYear}-01-01`)
            .lte('date', `${currentYear}-12-31`)

        // Get last verification
        const { data: lastVerification } = await supabase
            .from('verifications')
            .select('number, date')
            .order('date', { ascending: false })
            .order('number', { ascending: false })
            .limit(1)
            .single()

        return {
            totalCount: totalCount || 0,
            currentYearCount: currentYearCount || 0,
            lastVerificationNumber: lastVerification?.number || 0,
            lastVerificationDate: lastVerification?.date || null
        }
    },

    /**
     * Check if a period (month) is locked via the financialperiods table
     * (single source of truth, set by månadsavslut / period close).
     */
    async isPeriodLocked(date: string, client?: SupabaseClient<Database>): Promise<boolean> {
        const supabase = getSupabase(client)
        const d = new Date(date)
        const year = d.getFullYear()
        const month = d.getMonth() + 1
        const periodId = `${year}-M${String(month).padStart(2, '0')}`

        const { data } = await supabase
            .from('financial_periods')
            .select('status')
            .eq('id', periodId)
            .single()

        return data?.status === 'closed'
    },

    /**
     * Create a new verification with journal lines persisted to both
     * the JSONB rows column (backward compat) and the relational verification_lines table
     */
    async createVerification({
        series = 'A',
        date,
        description,
        entries,
        sourceType,
        sourceId,
    }: {
        series?: string
        date: string
        description: string
        entries: VerificationEntry[]
        sourceType?: string
        sourceId?: string
    }, client?: SupabaseClient<Database>): Promise<Verification> {
        // Validate entries are not empty
        if (!entries || entries.length === 0) {
            throw new Error('Verifikationen måste ha minst en rad.')
        }

        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error(`Ogiltigt datumformat: "${date}". Förväntat format: YYYY-MM-DD.`)
        }
        const parsedDate = new Date(date)
        if (isNaN(parsedDate.getTime())) {
            throw new Error(`Ogiltigt datum: "${date}".`)
        }

        // Validate account numbers against BAS kontoplan
        const invalidAccounts = entries
            .map(e => e.account)
            .filter(acc => !isValidAccount(acc))
        if (invalidAccounts.length > 0) {
            throw new Error(
                `Ogiltiga kontonummer: ${invalidAccounts.join(', ')}. ` +
                `Kontrollera att kontona finns i BAS-kontoplanen.`
            )
        }

        // Validate monetary amounts (no NaN, no negative on both sides)
        for (const entry of entries) {
            if (isNaN(entry.debit) || isNaN(entry.credit)) {
                throw new Error(`Ogiltigt belopp på konto ${entry.account}: debet/kredit får inte vara NaN.`)
            }
            if (entry.debit < 0 || entry.credit < 0) {
                throw new Error(`Negativt belopp på konto ${entry.account}: använd debet/kredit istället för negativa värden.`)
            }
        }

        // Validate balance: total debit must equal total credit (BFL 5 kap.)
        const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0)
        const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0)
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(
                `Verifikationen är inte balanserad. Debet: ${totalDebit.toFixed(2)}, Kredit: ${totalCredit.toFixed(2)}. ` +
                `Differens: ${Math.abs(totalDebit - totalCredit).toFixed(2)} kr.`
            )
        }

        // Period lock check — prevent booking in locked months
        const locked = await this.isPeriodLocked(date, client)
        if (locked) {
            const d = new Date(date)
            const monthName = d.toLocaleString('sv-SE', { month: 'long', year: 'numeric' })
            throw new Error(`Perioden ${monthName} är låst. Kan inte skapa verifikationer i en stängd period.`)
        }

        const supabase = getSupabase(client)

        // Get next number via atomic RPC (BFL 5:7)
        const year = new Date(date).getFullYear()
        let number = await this.getNextVerificationNumber(series, year, client)

        // 1. Insert the verification header (with retry on unique constraint violation)
        const insertPayload = {
            series,
            number,
            date,
            description,
            rows: entries as unknown as Json,
            source_type: sourceType || null,
            source_id: sourceId || null,
            total_amount: totalDebit,
            fiscal_year: year,
        }

        let result = await supabase
            .from('verifications')
            .insert(insertPayload)
            .select()
            .single()

        // Retry once if unique constraint violation (race condition between concurrent requests)
        if (result.error?.code === '23505') {
            number = await this.getNextVerificationNumber(series, year, client)
            result = await supabase
                .from('verifications')
                .insert({ ...insertPayload, number })
                .select()
                .single()
        }

        if (result.error) throw result.error
        const data = result.data

        // 2. Insert verification_lines for relational querying (reports)
        const { data: { user } } = await supabase.auth.getUser()
        if (user && entries.length > 0) {
            const lines = entries.map(entry => ({
                verification_id: data.id,
                account_number: parseInt(entry.account, 10),
                account_name: entry.accountName || entry.description || null,
                debit: entry.debit || 0,
                credit: entry.credit || 0,
                description: entry.description || null,
                user_id: user.id,
            }))

            const { error: linesError } = await supabase
                .from('verification_lines')
                .insert(lines)

            if (linesError) {
                // Compensate: delete the orphaned header so we don't leave a ghost verification
                await supabase.from('verifications').delete().eq('id', data.id)
                console.error('[VerificationService] Failed to insert verification_lines, rolled back header:', linesError)
                throw new Error(
                    `Verifikation ${series}${number} kunde inte sparas (konteringsrader misslyckades). ` +
                    `Försök igen. Fel: ${linesError.message}`
                )
            }
        }

        // Audit trail: log verification creation
        logAuditEntry({
            action: 'created',
            entityType: 'verifications',
            entityId: data.id,
            entityName: `${series}${data.number || number}`,
            metadata: { series, number: data.number || number, amount: totalDebit, source: sourceType || 'manual' },
        })

        return {
            id: data.id,
            number: data.number || number,
            series: data.series || series,
            date: data.date || date,
            description: data.description || description,
            entries,
            totalDebit,
            totalCredit,
            isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
            createdAt: data.created_at || new Date().toISOString()
        }
    },

    /**
     * Update a verification. Checks period lock before allowing mutation (BFL 5:4).
     */
    async updateVerification(
        id: string,
        updates: { description?: string; date?: string; entries?: VerificationEntry[] },
        client?: SupabaseClient<Database>
    ): Promise<Verification> {
        const existing = await this.getVerificationById(id, client)
        if (!existing) throw new Error('Verifikation hittades inte')

        // Check lock on existing date
        const locked = await this.isPeriodLocked(existing.date, client)
        if (locked) {
            throw new Error('Kan inte ändra verifikation i en låst period (BFL 5:4)')
        }

        // If moving to a new date, check lock on the new date too
        if (updates.date && updates.date !== existing.date) {
            const newLocked = await this.isPeriodLocked(updates.date, client)
            if (newLocked) {
                throw new Error('Kan inte flytta verifikation till en låst period (BFL 5:4)')
            }
        }

        const supabase = getSupabase(client)
        const updatePayload: Database['public']['Tables']['verifications']['Update'] = {}
        if (updates.description !== undefined) updatePayload.description = updates.description
        if (updates.date !== undefined) updatePayload.date = updates.date
        if (updates.entries !== undefined) {
            updatePayload.rows = updates.entries as unknown as Json
            updatePayload.total_amount = updates.entries.reduce((sum, e) => sum + (e.debit || 0), 0)
        }

        const { error } = await supabase
            .from('verifications')
            .update(updatePayload)
            .eq('id', id)

        if (error) throw error

        // Audit trail: log verification update
        logAuditEntry({
            action: 'updated',
            entityType: 'verifications',
            entityId: id,
            entityName: `${existing.series}${existing.number}`,
            metadata: { updatedFields: Object.keys(updates) },
        })

        return (await this.getVerificationById(id, client))!
    },

    /**
     * Delete a verification. Checks period lock before allowing deletion (BFL 5:4 & 7 kap).
     * Note: The database trigger also prevents deletion of locked verifications as a safety net.
     */
    async deleteVerification(id: string, client?: SupabaseClient<Database>): Promise<void> {
        const existing = await this.getVerificationById(id, client)
        if (!existing) throw new Error('Verifikation hittades inte')

        const locked = await this.isPeriodLocked(existing.date, client)
        if (locked) {
            throw new Error('Kan inte radera verifikation i en låst period (BFL 5:4, 7 kap)')
        }

        const supabase = getSupabase(client)
        const { error } = await supabase
            .from('verifications')
            .delete()
            .eq('id', id)

        if (error) throw error

        // Audit trail: log verification deletion
        logAuditEntry({
            action: 'deleted',
            entityType: 'verifications',
            entityId: id,
            entityName: `${existing.series}${existing.number}`,
            metadata: { date: existing.date, description: existing.description },
        })
    },

    // =========================================================================
    // Attachments (underlag) — BFL 5:6
    // =========================================================================

    /**
     * Get attachments for a verification
     */
    async getAttachmentsForVerification(
        verificationId: string,
        client?: SupabaseClient<Database>
    ): Promise<VerificationAttachment[]> {
        const supabase = getSupabase(client)

        const { data, error } = await supabase
            .from('verification_attachments')
            .select('*')
            .eq('verification_id', verificationId)
            .order('uploaded_at', { ascending: false })

        if (error) throw error
        if (!data) return []

        return data.map(mapRowToAttachment)
    },

    /**
     * Get a verification by ID with its attachments included
     */
    async getVerificationWithAttachments(
        id: string,
        client?: SupabaseClient<Database>
    ): Promise<(Verification & { attachments: VerificationAttachment[] }) | null> {
        const verification = await this.getVerificationById(id, client)
        if (!verification) return null

        const attachments = await this.getAttachmentsForVerification(id, client)

        return { ...verification, attachments }
    },

    /**
     * Upload a file and attach it to a verification as underlag.
     * Stores the file in Supabase Storage and creates a row in verification_attachments.
     */
    async addAttachment(
        verificationId: string,
        file: File,
        metadata?: { sourceType?: 'receipt' | 'invoice' | 'manual'; sourceId?: string },
        client?: SupabaseClient<Database>
    ): Promise<VerificationAttachment> {
        const supabase = getSupabase(client)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Ingen inloggad användare.')

        const { data: company } = await supabase.from('companies').select('id').single()
        if (!company) throw new Error('Företag saknas.')

        // Verify the verification exists
        const verification = await this.getVerificationById(verificationId, client)
        if (!verification) throw new Error('Verifikation hittades inte.')

        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop() || 'bin'
        const storagePath = `${company.id}/${verificationId}/${crypto.randomUUID()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('verification-underlag')
            .upload(storagePath, file, { contentType: file.type })

        if (uploadError) {
            throw new Error(`Kunde inte ladda upp fil: ${uploadError.message}`)
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
            .from('verification-underlag')
            .getPublicUrl(storagePath)

        // Insert attachment row
        const { data, error } = await supabase
            .from('verification_attachments')
            .insert({
                verification_id: verificationId,
                file_name: file.name,
                file_url: urlData.publicUrl,
                file_type: file.type,
                source_type: metadata?.sourceType || 'manual',
                source_id: metadata?.sourceId || null,
                user_id: user.id,
                company_id: company.id,
            })
            .select()
            .single()

        if (error) {
            // Clean up uploaded file on insert failure
            await supabase.storage.from('verification-underlag').remove([storagePath])
            throw new Error(`Kunde inte spara bilaga: ${error.message}`)
        }

        logAuditEntry({
            action: 'created',
            entityType: 'verification_attachments',
            entityId: data.id,
            entityName: file.name,
            metadata: { verificationId, sourceType: metadata?.sourceType || 'manual' },
        })

        return mapRowToAttachment(data)
    },

    /**
     * Delete an attachment from a verification
     */
    async deleteAttachment(
        attachmentId: string,
        client?: SupabaseClient<Database>
    ): Promise<void> {
        const supabase = getSupabase(client)

        // Get attachment to find storage path
        const { data: attachment, error: fetchError } = await supabase
            .from('verification_attachments')
            .select('*')
            .eq('id', attachmentId)
            .single()

        if (fetchError || !attachment) throw new Error('Bilaga hittades inte.')

        // Extract storage path from URL and remove file
        const url = new URL(attachment.file_url)
        const storagePath = url.pathname.split('/verification-underlag/').pop()
        if (storagePath) {
            await supabase.storage.from('verification-underlag').remove([storagePath])
        }

        // Delete the row
        const { error } = await supabase
            .from('verification_attachments')
            .delete()
            .eq('id', attachmentId)

        if (error) throw error

        logAuditEntry({
            action: 'deleted',
            entityType: 'verification_attachments',
            entityId: attachmentId,
            entityName: attachment.file_name,
            metadata: { verificationId: attachment.verification_id },
        })
    },

    /**
     * Create a verification and attach a file atomically.
     * Used by the receipt booking flow: transaction + verification + attachment in one go.
     */
    async createVerificationWithAttachment(
        params: {
            series?: string
            date: string
            description: string
            entries: VerificationEntry[]
            sourceType?: string
            sourceId?: string
            attachment: File
            attachmentSourceType?: 'receipt' | 'invoice' | 'manual'
            attachmentSourceId?: string
        },
        client?: SupabaseClient<Database>
    ): Promise<Verification & { attachments: VerificationAttachment[] }> {
        // Create the verification first (validates entries, numbering, period lock)
        const verification = await this.createVerification({
            series: params.series,
            date: params.date,
            description: params.description,
            entries: params.entries,
            sourceType: params.sourceType,
            sourceId: params.sourceId,
        }, client)

        // Attach the file
        const attachment = await this.addAttachment(
            verification.id,
            params.attachment,
            {
                sourceType: params.attachmentSourceType || (() => {
                    const valid = ['receipt', 'invoice', 'manual'] as const
                    return valid.find(t => t === params.sourceType)
                })(),
                sourceId: params.attachmentSourceId || params.sourceId,
            },
            client
        )

        return { ...verification, attachments: [attachment] }
    },
}

type AttachmentRow = Database['public']['Tables']['verification_attachments']['Row']

/** Map a verification_attachments row to the VerificationAttachment UI model */
function mapRowToAttachment(row: AttachmentRow): VerificationAttachment {
    const validSourceTypes = ['receipt', 'invoice', 'manual'] as const
    const sourceType = validSourceTypes.find(t => t === row.source_type)

    return {
        id: row.id,
        verificationId: row.verification_id,
        fileName: row.file_name,
        fileUrl: row.file_url,
        fileType: row.file_type,
        uploadedAt: row.uploaded_at,
        sourceType,
        sourceId: nullToUndefined(row.source_id),
    }
}
