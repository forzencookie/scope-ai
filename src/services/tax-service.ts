import { createBrowserClient } from '@/lib/database/client'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Internal helper to get the correct Supabase client.
 */
function getSupabase(client?: SupabaseClient<Database>) {
    return client || createBrowserClient()
}

export interface TaxRates {
    employerContributionRate: number
    corporateTaxRate: number
    vatRates: {
        normal: number
        reduced: number
        low: number
    }
    egenavgifterFull: number
    egenavgifterReduced: number
    egenavgifterKarensReduction: number
    egenavgiftComponents: Record<string, number>
    pensionContributionRate: number
    ibb: number
    pbb: number
    periodiseringsfondMaxAB: number
    periodiseringsfondMaxEF: number
    marginalTaxRateApprox: number
    topMarginalTaxRate: number
    drivmedelFormansvardeMultiplier: number
}

/**
 * Tax Service — The "Deterministic Oracle" for Swedish tax law.
 * Handles tax rates, deductions, and calendar deadlines.
 */
export const taxService = {
    /**
     * Get tax deduction for a specific amount based on the user's tax table
     */
    async getTaxDeduction(amount: number, table: string = '30', client?: SupabaseClient<Database>): Promise<number> {
        const supabase = getSupabase(client)
        const { data, error } = await supabase.rpc('get_tax_deduction', {
            p_amount: amount,
            p_table: table
        })

        if (error) {
            console.error('Failed to calculate tax deduction:', error)
            // Fallback to simple calculation (approx 30%)
            return Math.round(amount * 0.30)
        }

        return data as number
    },

    /**
     * Get all tax rates for a specific year in one query.
     */
    async getAllTaxRates(year: number, client?: SupabaseClient<Database>): Promise<{ rates: TaxRates | null }> {
        try {
            const supabase = getSupabase(client)
            const { data, error } = await supabase
                .from('system_parameters')
                .select('key, value')
                .eq('year', year)

            if (error || !data || data.length === 0) {
                console.error(`[tax-service] No tax rates found for year ${year}`, error)
                return { rates: null }
            }

            const rateMap: Record<string, number> = {}
            for (const row of data) {
                rateMap[row.key] = Number(row.value)
            }

            const rates: TaxRates = {
                employerContributionRate: rateMap['employer_contribution_rate'] ?? 0.3142,
                corporateTaxRate: rateMap['corporate_tax_rate'] ?? 0.206,
                vatRates: {
                    normal: 0.25,
                    reduced: 0.12,
                    low: 0.06
                },
                egenavgifterFull: rateMap['egenavgifter_full'] ?? 0.2897,
                egenavgifterReduced: rateMap['egenavgifter_reduced'] ?? 0.1021,
                egenavgifterKarensReduction: rateMap['egenavgifter_karens_reduction'] ?? 0.0076,
                egenavgiftComponents: {
                    sjukforsakring: rateMap['ea_sjuk'] ?? 0.0388,
                    foraldraforsakring: rateMap['ea_foraldra'] ?? 0.0260,
                    alderspension: rateMap['ea_alder'] ?? 0.1021,
                    efterlevandepension: rateMap['ea_efterlev'] ?? 0.0070,
                    arbetsmarknadsavgift: rateMap['ea_arbmark'] ?? 0.0264,
                    arbetsskadeavgift: rateMap['ea_arbskada'] ?? 0.0020,
                    allmänLöneAvgift: rateMap['ea_allman'] ?? 0.1150,
                },
                pensionContributionRate: rateMap['pension_contribution_rate'] ?? 0.045,
                ibb: rateMap['ibb'] ?? 76200,
                pbb: rateMap['pbb'] ?? 57300,
                periodiseringsfondMaxAB: rateMap['periodiseringsfond_max_ab'] ?? 0.25,
                periodiseringsfondMaxEF: rateMap['periodiseringsfond_max_ef'] ?? 0.30,
                marginalTaxRateApprox: rateMap['marginal_tax_rate_approx'] ?? 0.32,
                topMarginalTaxRate: rateMap['top_marginal_tax_rate'] ?? 0.52,
                drivmedelFormansvardeMultiplier: rateMap['drivmedel_formansvarde_multiplier'] ?? 1.2,
            }

            return { rates }
        } catch (error) {
            console.error(`[tax-service] Failed to fetch tax rates for year ${year}:`, error)
            return { rates: null }
        }
    },

    /**
     * Get upcoming deadlines from the tax calendar
     */
    async getUpcomingDeadlines(days: number = 60, client?: SupabaseClient<Database>): Promise<any[]> {
        const supabase = getSupabase(client)
        const today = new Date().toISOString()
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + days)
        const futureDateIso = futureDate.toISOString()

        const { data, error } = await supabase
            .from('tax_calendar')
            .select('*')
            .gte('due_date', today)
            .lte('due_date', futureDateIso)
            .order('due_date', { ascending: true })

        if (error) {
            console.error('Failed to fetch tax calendar:', error)
            return []
        }

        return data || []
    }
}
