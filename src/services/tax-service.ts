import { getSupabaseClient } from '@/lib/database/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

interface VatStatsRpcResult {
    outputVat?: number
    salesVat?: number
    inputVat?: number
    netVat?: number
}

interface AgiStatsRpcResult {
    totalSalary?: number
    tax?: number
    contributions?: number
}

export type VatStats = {
    salesVat: number
    inputVat: number
    netVat: number
}

export type AgiStats = {
    totalSalary: number
    tax: number
    contributions: number
}

export const taxService = {
    /**
     * Get aggregated VAT stats for a specific date range (e.g. Quarter)
     */
    async getVatStats(startDate: string, _endDate: string): Promise<VatStats> {
        const supabase = getSupabaseClient()
        const year = parseInt(startDate.substring(0, 4)) || new Date().getFullYear()
        const { data, error } = await supabase.rpc('get_vat_stats', {
            p_year: year
        }) as { data: VatStatsRpcResult | null, error: PostgrestError | null }

        if (error) {
            console.error('Failed to fetch VAT stats:', error)
            return { salesVat: 0, inputVat: 0, netVat: 0 }
        }

        // RPC returns JSON object, but keys might differ
        return {
            salesVat: Number(data?.outputVat || data?.salesVat || 0),
            inputVat: Number(data?.inputVat || 0),
            netVat: Number(data?.netVat || 0)
        }
    },

    /**
     * Get aggregated AGI stats for a specific month
     */
    async getAgiStats(year: number, _month: number): Promise<AgiStats> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.rpc('get_agi_stats', {
            p_year: year
        }) as { data: AgiStatsRpcResult | null, error: PostgrestError | null }

        if (error) {
            console.error('Failed to fetch AGI stats:', error)
            return { totalSalary: 0, tax: 0, contributions: 0 }
        }

        return {
            totalSalary: Number(data?.totalSalary) || 0,
            tax: Number(data?.tax) || 0,
            contributions: Number(data?.contributions) || 0
        }
    }
}
