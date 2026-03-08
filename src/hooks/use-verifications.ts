
import { useCallback, useState } from "react"
import { useCachedQuery } from "./use-cached-query"
import { getSupabaseClient } from '@/lib/database/supabase'

export interface VerificationRow {
    account: string
    description: string
    debit: number
    credit: number
}

/**
 * API-layer Verification type (simplified for hook consumers).
 * Uses `rows` instead of `entries` to match API response shape.
 * Canonical type: `CanonicalVerification` in `@/types`
 */
export interface Verification {
    id: string
    /** BFL series letter, e.g. "A", "B", "Y" */
    series?: string
    /** Sequential number within series, e.g. 1, 2, 3 */
    number?: number
    date: string
    description: string
    rows: VerificationRow[]
    sourceType?: string
    sourceId?: string
}

async function fetchVerificationsFromAPI(): Promise<Verification[]> {
    const response = await fetch('/api/verifications')
    if (!response.ok) throw new Error('Failed to fetch')
    const data = await response.json()
    return data.verifications || []
}

export function useVerifications() {
    const {
        data: verifications,
        isLoading,
        error,
        refetch,
        invalidate,
    } = useCachedQuery<Verification[]>({
        cacheKey: 'verifications',
        queryFn: fetchVerificationsFromAPI,
        ttlMs: 5 * 60 * 1000, // 5 minutes cache
    })

    const [lockError, setLockError] = useState<string | null>(null)

    const addVerification = useCallback(async (verification: Omit<Verification, "id">) => {
        setLockError(null)
        try {
            // Check if the verification's date falls in a locked period
            const verDate = new Date(verification.date)
            const year = verDate.getFullYear()
            const month = verDate.getMonth() + 1
            const periodId = `${year}-M${String(month).padStart(2, '0')}`

            const supabase = getSupabaseClient()
            const { data: period } = await supabase
                .from('financialperiods')
                .select('status')
                .eq('id', periodId)
                .single()

            if (period?.status === 'closed') {
                const msg = 'Perioden är låst. Lås upp månaden först.'
                setLockError(msg)
                console.warn(msg)
                return false
            }

            const response = await fetch('/api/verifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(verification)
            })
            if (!response.ok) throw new Error('Failed to create verification')
            await invalidate() // Invalidate cache and refetch
            return true
        } catch (err) {
            console.error(err)
            return false
        }
    }, [invalidate])

    return {
        verifications: verifications || [],
        isLoading,
        error,
        lockError,
        refresh: refetch,
        addVerification,
    }
}
