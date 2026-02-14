import { useState, useEffect } from 'react'
import { taxService, type TaxRates } from '@/services/tax-service'

export interface TaxParameters {
    ibb: number
    schablonRate: number
}

const DEFAULT_PARAMS: TaxParameters = {
    ibb: 57300, // Fallback 2024
    schablonRate: 2.75
}

export function useTaxParameters(year: number) {
    const [params, setParams] = useState<TaxParameters>(DEFAULT_PARAMS)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        async function fetchParams() {
            try {
                // Ensure async — prevents state update before mount
                await Promise.resolve()
                const [ibb, rate] = await Promise.all([
                    taxService.getSystemParameter<number>('ibb', year),
                    taxService.getSystemParameter<number>('k10_schablon_rate', year)
                ])

                if (mounted) {
                    setParams({
                        ibb: Number(ibb) || DEFAULT_PARAMS.ibb,
                        schablonRate: Number(rate) || DEFAULT_PARAMS.schablonRate
                    })
                }
            } catch (error) {
                console.error('Failed to load tax parameters', error)
            } finally {
                if (mounted) setIsLoading(false)
            }
        }

        fetchParams()

        return () => { mounted = false }
    }, [year])

    return { params, isLoading }
}

/**
 * Hook to fetch all tax rates for a given year.
 * Returns null rates if the database is unavailable — callers must
 * show an explicit error rather than silently using wrong values.
 */
export function useAllTaxRates(year: number) {
    const [rates, setRates] = useState<TaxRates | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true

        async function fetchRates() {
            setError(null)
            try {
                await Promise.resolve()
                const fetched = await taxService.getAllTaxRates(year)
                if (mounted) {
                    if (fetched) {
                        setRates(fetched)
                    } else {
                        setError(`Skattesatser för ${year} kunde inte laddas från databasen.`)
                    }
                }
            } catch (err) {
                console.error('Failed to load tax rates', err)
                if (mounted) {
                    setError('Ett fel uppstod vid hämtning av skattesatser.')
                }
            } finally {
                if (mounted) setIsLoading(false)
            }
        }

        fetchRates()

        return () => { mounted = false }
    }, [year])

    return { rates, isLoading, error }
}
