import { getSupabaseClient } from '@/lib/database/supabase'
import type { Json } from '@/types/database'
import { logAuditEntry } from '@/lib/audit'

/**
 * Verification Row - represents a single accounting verification (verifikat)
 */
export interface VerificationRow {
    id: string
    number: number | null
    series: string | null
    date: string | null
    description: string | null
    rows: VerificationEntry[] | null
    company_id: string | null
    user_id: string | null
    created_at: string | null
}

/**
 * A single entry within a verification (debit/credit line)
 */
export interface VerificationEntry {
    account: string
    accountName?: string
    debit: number
    credit: number
    description?: string
}

/**
 * Verification for display in UI
 */
export interface Verification {
    id: string
    number: number
    series: string
    date: string
    description: string
    entries: VerificationEntry[]
    totalDebit: number
    totalCredit: number
    isBalanced: boolean
    createdAt: string
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
     * Get paginated verifications with optional filters
     */
    async getVerifications({
        limit = 50,
        offset = 0,
        search = '',
        series,
        startDate,
        endDate,
        year
    }: GetVerificationsOptions = {}) {
        const supabase = getSupabaseClient()

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

        const verifications: Verification[] = data.map((row) => {
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
                createdAt: row.created_at || ''
            }
        })

        return {
            verifications,
            totalCount: count || 0
        }
    },

    /**
     * Get a single verification by ID
     */
    async getVerificationById(id: string): Promise<Verification | null> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('verifications')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) return null

        const entries = (data.rows as VerificationEntry[] | null) || []
        const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0)
        const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0)

        return {
            id: data.id,
            number: data.number || 0,
            series: data.series || 'A',
            date: data.date || '',
            description: data.description || '',
            entries,
            totalDebit,
            totalCredit,
            isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
            createdAt: data.created_at || ''
        }
    },

    /**
     * Get the next verification number for a given series and year.
     * Uses the database RPC for atomic numbering (BFL 5:7 compliance).
     */
    async getNextVerificationNumber(series: string = 'A', year?: number): Promise<number> {
        const supabase = getSupabaseClient()
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

        return (data as number) || 1
    },

    /**
     * Get verification statistics
     */
    async getStats(): Promise<VerificationStats> {
        const supabase = getSupabaseClient()
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
     * Check if a period (month) is locked.
     * A period is locked if any verification in that month has is_locked = true
     * (set by månadsavslut / period close).
     */
    async isPeriodLocked(date: string): Promise<boolean> {
        const supabase = getSupabaseClient()
        const d = new Date(date)
        const year = d.getFullYear()
        const month = d.getMonth() + 1
        const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`
        const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

        const { data } = await supabase
            .from('verifications')
            .select('id')
            .gte('date', startOfMonth)
            .lte('date', endOfMonth)
            .eq('is_locked', true)
            .limit(1)

        return (data?.length || 0) > 0
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
    }): Promise<Verification> {
        // Period lock check — prevent booking in locked months
        const locked = await this.isPeriodLocked(date)
        if (locked) {
            const d = new Date(date)
            const monthName = d.toLocaleString('sv-SE', { month: 'long', year: 'numeric' })
            throw new Error(`Perioden ${monthName} är låst. Kan inte skapa verifikationer i en stängd period.`)
        }

        const supabase = getSupabaseClient()

        // Get next number via atomic RPC (BFL 5:7)
        const year = new Date(date).getFullYear()
        let number = await this.getNextVerificationNumber(series, year)

        const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0)

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
            number = await this.getNextVerificationNumber(series, year)
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
                console.error('[VerificationService] Failed to insert verification_lines:', linesError)
            }
        }

        const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0)

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
        updates: { description?: string; date?: string; entries?: VerificationEntry[] }
    ): Promise<Verification> {
        const existing = await this.getVerificationById(id)
        if (!existing) throw new Error('Verifikation hittades inte')

        // Check lock on existing date
        const locked = await this.isPeriodLocked(existing.date)
        if (locked) {
            throw new Error('Kan inte ändra verifikation i en låst period (BFL 5:4)')
        }

        // If moving to a new date, check lock on the new date too
        if (updates.date && updates.date !== existing.date) {
            const newLocked = await this.isPeriodLocked(updates.date)
            if (newLocked) {
                throw new Error('Kan inte flytta verifikation till en låst period (BFL 5:4)')
            }
        }

        const supabase = getSupabaseClient()
        const updatePayload: Record<string, unknown> = {}
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

        return (await this.getVerificationById(id))!
    },

    /**
     * Delete a verification. Checks period lock before allowing deletion (BFL 5:4 & 7 kap).
     * Note: The database trigger also prevents deletion of locked verifications as a safety net.
     */
    async deleteVerification(id: string): Promise<void> {
        const existing = await this.getVerificationById(id)
        if (!existing) throw new Error('Verifikation hittades inte')

        const locked = await this.isPeriodLocked(existing.date)
        if (locked) {
            throw new Error('Kan inte radera verifikation i en låst period (BFL 5:4, 7 kap)')
        }

        const supabase = getSupabaseClient()
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
}
