import { getSupabaseClient } from '../supabase'

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
        let query = supabase
            .from('vat_declarations')
            .select('*')
            .order('year', { ascending: false })
            .order('start_date', { ascending: false })

        if (year) query = query.eq('year', year)

        const { data, error } = await query

        if (error) {
            console.error('Failed to fetch VAT declarations:', error)
            return []
        }

        return (data || []).map((d: any) => ({
            id: d.id,
            period: d.period,
            periodType: d.period_type || 'quarterly',
            year: d.year,
            startDate: d.start_date,
            endDate: d.end_date,
            dueDate: d.due_date,
            outputVat: Number(d.output_vat) || 0,
            inputVat: Number(d.input_vat) || 0,
            netVat: Number(d.net_vat) || 0,
            status: d.status || 'upcoming',
            submittedAt: d.submitted_at,
        }))
    },

    /**
     * Get current/next VAT period stats.
     */
    async getCurrentStats(): Promise<VATStats> {
        const supabase = getSupabaseClient()

        // Get the next upcoming VAT declaration
        const { data, error } = await supabase
            .from('vat_declarations')
            .select('*')
            .eq('status', 'upcoming')
            .order('due_date', { ascending: true })
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

        return {
            currentPeriod: data.period,
            dueDate: data.due_date,
            outputVat: Number(data.output_vat) || 0,
            inputVat: Number(data.input_vat) || 0,
            netVat: Number(data.net_vat) || 0,
        }
    },

    /**
     * Calculate VAT from verifications for a date range (using RPC).
     */
    async calculateFromVerifications(startDate: string, endDate: string): Promise<{ outputVat: number; inputVat: number; netVat: number }> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase.rpc('get_vat_stats', {
            start_date: startDate,
            end_date: endDate,
        }) as { data: any; error: any }

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
