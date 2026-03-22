import { createBrowserClient } from '@/lib/database/client'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Internal helper to get the correct Supabase client.
 */
function getSupabase(client?: SupabaseClient<Database>) {
    return client || createBrowserClient()
}

/**
 * Type extension for RPCs that exist in Supabase but are not yet
 * reflected in the auto-generated Database types.
 * When `supabase gen types` is re-run, remove entries here.
 */
interface PendingRpcFunctions {
    get_tax_deduction: {
        Args: { p_amount: number; p_table: string }
        Returns: number
    }
}

/**
 * Call an RPC that exists in Supabase but isn't in the generated types yet.
 */
function callUntypedRpc(
    supabase: SupabaseClient<Database>,
    fnName: keyof PendingRpcFunctions,
    args: PendingRpcFunctions[typeof fnName]['Args']
) {
    // Use a scoped cast to call the RPC without polluting the rest of the codebase.
    return (supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>)(fnName, args)
}

export interface TaxRates {
    employerContributionRate: number
    employerContributionRateSenior: number
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
    dividendTaxKapital: number
    rantebaseratRate: number
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
        const { data, error } = await callUntypedRpc(supabase, 'get_tax_deduction', {
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
    async getAllTaxRates(year: number, client?: SupabaseClient<Database>): Promise<TaxRates | null> {
        try {
            const supabase = getSupabase(client)
            const { data, error } = await supabase
                .from('system_parameters')
                .select('key, value')
                .eq('year', year)

            if (error || !data || data.length === 0) {
                console.error(`[tax-service] No tax rates found for year ${year}`, error)
                return null
            }

            const rateMap: Record<string, number> = {}
            for (const row of data) {
                rateMap[row.key] = Number(row.value)
            }

            return {
                employerContributionRate: rateMap['employer_contribution_rate'] ?? 0.3142,
                employerContributionRateSenior: rateMap['employer_contribution_rate_senior'] ?? 0.1021,
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
                dividendTaxKapital: rateMap['dividend_tax_kapital'] ?? 0.20,
                rantebaseratRate: rateMap['rantebaserat_rate'] ?? 0.0976,
            }
        } catch (error) {
            console.error(`[tax-service] Failed to fetch tax rates for year ${year}:`, error)
            return null
        }
    },

    /**
     * Get a single system parameter value for a given year.
     */
    async getSystemParameter<T = number>(key: string, year: number, client?: SupabaseClient<Database>): Promise<T | null> {
        const supabase = getSupabase(client)
        const { data, error } = await supabase
            .from('system_parameters')
            .select('value')
            .eq('key', key)
            .eq('year', year)
            .single()

        if (error || !data) {
            return null
        }

        return data.value as T
    },

    /**
     * Look up tax deduction from Skatteverket tax tables.
     * Column 1 = monthly salary, column 2 = yearly (not used for payroll).
     */
    async lookupTaxDeduction(year: number, table: string, column: number, amount: number, client?: SupabaseClient<Database>): Promise<number | null> {
        const supabase = getSupabase(client)
        const { data, error } = await callUntypedRpc(supabase, 'get_tax_deduction', {
            p_amount: amount,
            p_table: table
        })

        if (error) {
            console.error(`[tax-service] Tax table lookup failed (table=${table}, amount=${amount}):`, error)
            return null
        }

        return data as number
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
