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
    },

    /**
     * Get system parameter for a specific year (e.g. IBB)
     */
    async getSystemParameter<T>(key: string, year: number): Promise<T | null> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('system_parameters')
            .select('value')
            .eq('key', key)
            .eq('year', year)
            .single()

        if (error || !data) {
            console.warn(`Missing system parameter: ${key} for year ${year}`)
            return null
        }

        return data.value as T
    },

    /**
     * Look up SKV tax deduction for a given monthly income (SFL 11 kap).
     * Returns the exact krona amount to withhold, or null if no matching bracket found.
     */
    async lookupTaxDeduction(
        year: number,
        tableNumber: number,
        columnNumber: number,
        monthlyIncome: number
    ): Promise<number | null> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('skv_tax_tables')
            .select('tax_deduction')
            .eq('year', year)
            .eq('table_number', tableNumber)
            .eq('column_number', columnNumber)
            .lte('income_from', Math.round(monthlyIncome))
            .gte('income_to', Math.round(monthlyIncome))
            .limit(1)
            .single()

        if (error || !data) {
            console.warn(`[tax-service] No SKV bracket found: table ${tableNumber}, col ${columnNumber}, income ${monthlyIncome}, year ${year}`)
            return null
        }

        return data.tax_deduction
    },

    /**
     * Get all tax rates for a specific year in one query.
     * Returns null if rates cannot be loaded — callers must handle this
     * explicitly rather than silently using potentially wrong values.
     */
    async getAllTaxRates(year: number): Promise<TaxRates | null> {
        try {
            const supabase = getSupabaseClient()
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

            // Verify that critical rates exist — refuse to return partial data
            const required = ['employer_contribution_rate', 'corporate_tax_rate', 'egenavgifter_full', 'ibb']
            const missing = required.filter(k => !(k in rateMap))
            if (missing.length > 0) {
                console.error(`[tax-service] Missing critical tax rates for ${year}: ${missing.join(', ')}`)
                return null
            }

            return {
                employerContributionRate: rateMap['employer_contribution_rate'],
                employerContributionRateSenior: rateMap['employer_contribution_rate_senior'] ?? rateMap['employer_contribution_rate'],
                corporateTaxRate: rateMap['corporate_tax_rate'],
                egenavgifterFull: rateMap['egenavgifter_full'],
                egenavgifterReduced: rateMap['egenavgifter_reduced'] ?? rateMap['egenavgifter_full'],
                egenavgifterKarensReduction: rateMap['egenavgifter_karens_reduction'] ?? 0,
                egenavgiftComponents: {
                    sjukforsakring: rateMap['egenavgift_sjukforsakring'] ?? 0,
                    foraldraforsakring: rateMap['egenavgift_foraldraforsakring'] ?? 0,
                    alderspension: rateMap['egenavgift_alderspension'] ?? 0,
                    efterlevandepension: rateMap['egenavgift_efterlevandepension'] ?? 0,
                    arbetsmarknadsavgift: rateMap['egenavgift_arbetsmarknadsavgift'] ?? 0,
                    arbetsskadeavgift: rateMap['egenavgift_arbetsskadeavgift'] ?? 0,
                    allmanLoneavgift: rateMap['egenavgift_allman_loneavgift'] ?? 0,
                },
                dividendTaxKapital: rateMap['dividend_tax_kapital'] ?? 0.20,
                mileageRate: rateMap['mileage_rate'] ?? 0,
                vacationPayRate: rateMap['vacation_pay_rate'] ?? 0,
                formansvardeKost: rateMap['formansvarde_kost'] ?? 0,
                formansvardeLunch: rateMap['formansvarde_lunch'] ?? 0,
                ibb: rateMap['ibb'],
            }
        } catch (error) {
            console.error(`[tax-service] Failed to fetch tax rates for year ${year}:`, error)
            return null
        }
    },
}

// =============================================================================
// Tax Rate Types
// =============================================================================

export interface TaxRates {
    employerContributionRate: number
    employerContributionRateSenior: number
    corporateTaxRate: number
    egenavgifterFull: number
    egenavgifterReduced: number
    egenavgifterKarensReduction: number
    egenavgiftComponents: {
        sjukforsakring: number
        foraldraforsakring: number
        alderspension: number
        efterlevandepension: number
        arbetsmarknadsavgift: number
        arbetsskadeavgift: number
        allmanLoneavgift: number
    }
    dividendTaxKapital: number
    mileageRate: number
    vacationPayRate: number
    formansvardeKost: number
    formansvardeLunch: number
    ibb: number
}
