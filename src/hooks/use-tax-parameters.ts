import { useState, useEffect } from 'react'
import { taxService } from '@/services/tax-service'

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
