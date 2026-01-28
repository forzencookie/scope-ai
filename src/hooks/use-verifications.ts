
import { useCallback } from "react"
import { useCachedQuery } from "./use-cached-query"

export interface VerificationRow {
    account: string
    description: string
    debit: number
    credit: number
}

export interface Verification {
    id: string
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

    const addVerification = useCallback(async (verification: Omit<Verification, "id">) => {
        try {
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
        refresh: refetch,
        addVerification,
    }
}
