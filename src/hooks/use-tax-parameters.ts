import { useQuery } from '@tanstack/react-query'
import { taxService, type TaxRates } from '@/services/tax/tax-service'

export interface TaxParameters {
    ibb: number
    schablonRate: number
    rantebaseratRate: number
}

export const taxParameterQueryKeys = {
    all: ['tax-parameters'] as const,
    params: (year: number) => [...taxParameterQueryKeys.all, 'params', year] as const,
    rates: (year: number) => [...taxParameterQueryKeys.all, 'rates', year] as const,
}

/**
 * Hook to fetch IBB and K10 schablon rate for a given year.
 * Returns null params with an error message if the DB values are missing —
 * callers must show an explicit error rather than silently using stale values.
 */
export function useTaxParameters(year: number) {
    const { data, isLoading, error } = useQuery({
        queryKey: taxParameterQueryKeys.params(year),
        queryFn: async (): Promise<TaxParameters> => {
            const [ibb, rate, ranteRate] = await Promise.all([
                taxService.getSystemParameter<number>('ibb', year),
                taxService.getSystemParameter<number>('k10_schablon_rate', year),
                taxService.getSystemParameter<number>('rantebaserat_rate', year)
            ])

            if (ibb == null) {
                throw new Error(`IBB (inkomstbasbelopp) för ${year} saknas i databasen.`)
            }
            if (rate == null) {
                throw new Error(`K10 schablonränta för ${year} saknas i databasen.`)
            }

            return {
                ibb: Number(ibb),
                schablonRate: Number(rate),
                rantebaseratRate: Number(ranteRate ?? 0.0976),
            }
        },
        staleTime: 30 * 60 * 1000, // Tax params rarely change — 30 min
    })

    return {
        params: data ?? null,
        isLoading,
        error: error instanceof Error ? error.message : error ? String(error) : null,
    }
}

/**
 * Hook to fetch all tax rates for a given year.
 * Returns null rates if the database is unavailable — callers must
 * show an explicit error rather than silently using wrong values.
 */
export function useAllTaxRates(year: number) {
    const { data: rates = null, isLoading, error } = useQuery<TaxRates | null>({
        queryKey: taxParameterQueryKeys.rates(year),
        queryFn: async () => {
            const rates = await taxService.getAllTaxRates(year)
            if (!rates) {
                throw new Error(`Skattesatser för ${year} kunde inte laddas från databasen.`)
            }
            return rates
        },
        staleTime: 30 * 60 * 1000,
    })

    return {
        rates,
        isLoading,
        error: error instanceof Error ? error.message : error ? String(error) : null,
    }
}
