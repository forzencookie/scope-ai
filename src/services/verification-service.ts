import { getSupabaseClient } from '@/lib/database/supabase'
import type { Json } from '@/types/database'

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
     * Get the next verification number for a given series and year
     */
    async getNextVerificationNumber(series: string = 'A', year?: number): Promise<number> {
        const supabase = getSupabaseClient()
        const targetYear = year || new Date().getFullYear()

        const { data } = await supabase
            .from('verifications')
            .select('number')
            .eq('series', series)
            .gte('date', `${targetYear}-01-01`)
            .lte('date', `${targetYear}-12-31`)
            .order('number', { ascending: false })
            .limit(1)
            .single()

        return (data?.number || 0) + 1
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
     * Create a new verification
     */
    async createVerification({
        series = 'A',
        date,
        description,
        entries
    }: {
        series?: string
        date: string
        description: string
        entries: VerificationEntry[]
    }): Promise<Verification> {
        const supabase = getSupabaseClient()
        
        // Get next number
        const year = new Date(date).getFullYear()
        const number = await this.getNextVerificationNumber(series, year)

        const { data, error } = await supabase
            .from('verifications')
            .insert({
                series,
                number,
                date,
                description,
                rows: entries as unknown as Json
            })
            .select()
            .single()

        if (error) throw error

        const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0)
        const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0)

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
    }
}
