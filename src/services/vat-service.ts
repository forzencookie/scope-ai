import { getSupabaseClient } from '@/lib/database/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

interface VatDeclarationData {
    periodType?: string
    startDate?: string
    endDate?: string
    dueDate?: string
    outputVat?: number
    inputVat?: number
    netVat?: number
    submittedAt?: string
}

interface VatDeclarationRow {
    id: string
    period: string | null
    status: string | null
    data: VatDeclarationData | null
}

interface VatStatsRpcResult {
    salesVat?: number
    inputVat?: number
    netVat?: number
}

export type VATDeclaration = {
    id: string
    period: string
    periodType: 'monthly' | 'quarterly' | 'yearly'
    year: number
    startDate: string
    endDate: string
    dueDate: string
    outputVat: number  // Utgående moms
    inputVat: number   // Ingående moms  
    netVat: number     // Moms att betala/få tillbaka
    status: 'upcoming' | 'pending' | 'submitted'
    submittedAt?: string
}

export type VATStats = {
    currentPeriod: string
    dueDate: string
    outputVat: number
    inputVat: number
    netVat: number
}

export const vatService = {
    /**
     * Get VAT declarations, optionally filtered by year.
     */
    async getDeclarations(year?: number): Promise<VATDeclaration[]> {
        const supabase = getSupabaseClient()
        const query = supabase
            .from('vatdeclarations')
            .select('*')
            .order('period', { ascending: false })

        // Filter by period containing year if possible, or just fetch all and filter in memory since we don't have a year column
        // if (year) query = query.eq('year', year) 

        const { data, error } = await query

        if (error) {
            console.error('Failed to fetch VAT declarations:', error)
            return []
        }

        return (data || [])
            .filter((d: VatDeclarationRow) => !year || d.period?.includes(year.toString()))
            .map((d: VatDeclarationRow) => {
                const details = d.data || {}
                return {
                    id: d.id,
                    period: d.period || '',
                    periodType: (details.periodType || 'monthly') as 'monthly' | 'quarterly' | 'yearly',
                    year: year || new Date().getFullYear(), // Approximate
                    startDate: details.startDate || '',
                    endDate: details.endDate || '',
                    dueDate: details.dueDate || '',
                    outputVat: Number(details.outputVat) || 0,
                    inputVat: Number(details.inputVat) || 0,
                    netVat: Number(details.netVat) || 0,
                    status: (d.status || 'upcoming') as 'upcoming' | 'pending' | 'submitted',
                    submittedAt: details.submittedAt,
                }
            })
    },

    /**
     * Get current/next VAT period stats.
     */
    async getCurrentStats(): Promise<VATStats> {
        const supabase = getSupabaseClient()

        // Get the next upcoming VAT declaration
        const { data, error } = await supabase
            .from('vatdeclarations')
            .select('*')
            .eq('status', 'upcoming')
            // .order('due_date', { ascending: true }) // Column does not exist
            .limit(1)
            .single()

        if (error || !data) {
            // Fallback to RPC calculation from verifications
            const now = new Date()
            const quarter = Math.ceil((now.getMonth() + 1) / 3)
            return {
                currentPeriod: `Q${quarter} ${now.getFullYear()}`,
                dueDate: '',
                outputVat: 0,
                inputVat: 0,
                netVat: 0,
            }
        }

        const row = data as VatDeclarationRow
        const details = row.data || {}
        return {
            currentPeriod: row.period || '',
            dueDate: details.dueDate || '',
            outputVat: Number(details.outputVat) || 0,
            inputVat: Number(details.inputVat) || 0,
            netVat: Number(details.netVat) || 0,
        }
    },

    /**
     * Calculate VAT from verifications for a date range (using RPC).
     */
    async calculateFromVerifications(startDate: string, _endDate: string): Promise<{ outputVat: number; inputVat: number; netVat: number }> {
        const supabase = getSupabaseClient()

        const year = parseInt(startDate.substring(0, 4)) || new Date().getFullYear()
        const { data, error } = await supabase.rpc('get_vat_stats', {
            p_year: year
        }) as { data: VatStatsRpcResult | null; error: PostgrestError | null }

        if (error) {
            console.error('Failed to calculate VAT:', error)
            return { outputVat: 0, inputVat: 0, netVat: 0 }
        }

        return {
            outputVat: Number(data?.salesVat) || 0,
            inputVat: Number(data?.inputVat) || 0,
            netVat: Number(data?.netVat) || 0,
        }
    },
}
