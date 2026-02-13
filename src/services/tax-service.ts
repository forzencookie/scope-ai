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
     * Get all tax rates for a specific year in one query.
     * Returns a map of key -> numeric value with sensible defaults.
     */
    async getAllTaxRates(year: number): Promise<TaxRates> {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('system_parameters')
            .select('key, value')
            .eq('year', year)

        const rateMap: Record<string, number> = {}
        if (!error && data) {
            for (const row of data) {
                rateMap[row.key] = Number(row.value)
            }
        }

        return {
            employerContributionRate: rateMap['employer_contribution_rate'] ?? FALLBACK_TAX_RATES.employerContributionRate,
            employerContributionRateSenior: rateMap['employer_contribution_rate_senior'] ?? FALLBACK_TAX_RATES.employerContributionRateSenior,
            corporateTaxRate: rateMap['corporate_tax_rate'] ?? FALLBACK_TAX_RATES.corporateTaxRate,
            egenavgifterFull: rateMap['egenavgifter_full'] ?? FALLBACK_TAX_RATES.egenavgifterFull,
            egenavgifterReduced: rateMap['egenavgifter_reduced'] ?? FALLBACK_TAX_RATES.egenavgifterReduced,
            egenavgifterKarensReduction: rateMap['egenavgifter_karens_reduction'] ?? FALLBACK_TAX_RATES.egenavgifterKarensReduction,
            egenavgiftComponents: {
                sjukforsakring: rateMap['egenavgift_sjukforsakring'] ?? 0.0388,
                foraldraforsakring: rateMap['egenavgift_foraldraforsakring'] ?? 0.0260,
                alderspension: rateMap['egenavgift_alderspension'] ?? 0.1021,
                efterlevandepension: rateMap['egenavgift_efterlevandepension'] ?? 0.0070,
                arbetsmarknadsavgift: rateMap['egenavgift_arbetsmarknadsavgift'] ?? 0.0264,
                arbetsskadeavgift: rateMap['egenavgift_arbetsskadeavgift'] ?? 0.0020,
                allmanLoneavgift: rateMap['egenavgift_allman_loneavgift'] ?? 0.1150,
            },
            dividendTaxKapital: rateMap['dividend_tax_kapital'] ?? FALLBACK_TAX_RATES.dividendTaxKapital,
            mileageRate: rateMap['mileage_rate'] ?? FALLBACK_TAX_RATES.mileageRate,
            vacationPayRate: rateMap['vacation_pay_rate'] ?? FALLBACK_TAX_RATES.vacationPayRate,
            formansvardeKost: rateMap['formansvarde_kost'] ?? 260,
            formansvardeLunch: rateMap['formansvarde_lunch'] ?? 130,
            ibb: rateMap['ibb'] ?? 57300,
        }
    },
}

// =============================================================================
// Tax Rate Types & Fallbacks
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

/**
 * Hardcoded fallback rates used when DB is unavailable.
 * These are the only place hardcoded rates should live.
 */
export const FALLBACK_TAX_RATES: TaxRates = {
    employerContributionRate: 0.3142,
    employerContributionRateSenior: 0.1021,
    corporateTaxRate: 0.206,
    egenavgifterFull: 0.2897,
    egenavgifterReduced: 0.1021,
    egenavgifterKarensReduction: 0.0076,
    egenavgiftComponents: {
        sjukforsakring: 0.0388,
        foraldraforsakring: 0.0260,
        alderspension: 0.1021,
        efterlevandepension: 0.0070,
        arbetsmarknadsavgift: 0.0264,
        arbetsskadeavgift: 0.0020,
        allmanLoneavgift: 0.1150,
    },
    dividendTaxKapital: 0.20,
    mileageRate: 2.50,
    vacationPayRate: 0.12,
    formansvardeKost: 260,
    formansvardeLunch: 130,
    ibb: 57300,
}
