// @ts-nocheck
import { getSupabaseClient } from '../supabase'

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
    async getVatStats(startDate: string, endDate: string): Promise<VatStats> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.rpc('get_vat_stats', {
            start_date: startDate,
            end_date: endDate
        }) as { data: any, error: any }

        if (error) {
            console.error('Failed to fetch VAT stats:', error)
            return { salesVat: 0, inputVat: 0, netVat: 0 }
        }

        return {
            salesVat: Number(data.salesVat) || 0,
            inputVat: Number(data.inputVat) || 0,
            netVat: Number(data.netVat) || 0
        }
    },

    /**
     * Get aggregated AGI stats for a specific month
     */
    async getAgiStats(year: number, month: number): Promise<AgiStats> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.rpc('get_agi_stats', {
            period_year: year,
            period_month: month
        }) as { data: any, error: any }

        if (error) {
            console.error('Failed to fetch AGI stats:', error)
            return { totalSalary: 0, tax: 0, contributions: 0 }
        }

        return {
            totalSalary: Number(data.totalSalary) || 0,
            tax: Number(data.tax) || 0,
            contributions: Number(data.contributions) || 0
        }
    }
}
