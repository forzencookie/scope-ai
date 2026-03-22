import { createBrowserClient } from '@/lib/database/client'
import type { Database } from '@/types/database'
import type { PostgrestError } from '@supabase/supabase-js'

type VatDeclarationsTable = Database['public']['Tables']['vat_declarations']
type VatDeclarationRow = VatDeclarationsTable['Row']

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
        const supabase = createBrowserClient()
        const query = supabase
            .from('vat_declarations')
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
            .filter((d) => !year || d.period?.includes(year.toString()))
            .map((d) => ({
                id: d.id,
                period: d.period || '',
                periodType: (d.period_type || 'monthly') as 'monthly' | 'quarterly' | 'yearly',
                year: d.year || year || new Date().getFullYear(),
                startDate: d.start_date || '',
                endDate: d.end_date || '',
                dueDate: d.due_date || '',
                outputVat: d.output_vat ?? 0,
                inputVat: d.input_vat ?? 0,
                netVat: d.net_vat ?? 0,
                status: (d.status || 'upcoming') as 'upcoming' | 'pending' | 'submitted',
                submittedAt: d.submitted_at ?? undefined,
            }))
    },

    /**
     * Get current/next VAT period stats.
     */
    async getCurrentStats(): Promise<VATStats> {
        const supabase = createBrowserClient()

        // Get the next upcoming VAT declaration
        const { data, error } = await supabase
            .from('vat_declarations')
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
        return {
            currentPeriod: row.period || '',
            dueDate: row.due_date || '',
            outputVat: row.output_vat ?? 0,
            inputVat: row.input_vat ?? 0,
            netVat: row.net_vat ?? 0,
        }
    },

    /**
     * Calculate VAT from verifications for a date range (using RPC).
     */
    async calculateFromVerifications(startDate: string, _endDate: string): Promise<{ outputVat: number; inputVat: number; netVat: number }> {
        const supabase = createBrowserClient()

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
