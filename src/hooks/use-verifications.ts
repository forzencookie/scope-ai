
import { useCallback, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export interface VerificationRow {
    account: string
    description: string
    debit: number
    credit: number
}

/**
 * API-layer Verification type (simplified for hook consumers).
 * Uses `rows` instead of `entries` to match API response shape.
 * Canonical type: `Verification` in `@/types`
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

const verificationQueryKeys = {
    all: ['verifications'] as const,
}

export function useVerifications() {
    const queryClient = useQueryClient()

    const {
        data: verifications,
        isLoading,
        error,
        refetch,
    } = useQuery<Verification[]>({
        queryKey: verificationQueryKeys.all,
        queryFn: fetchVerificationsFromAPI,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    })

    const [lockError, setLockError] = useState<string | null>(null)

    const addVerification = useCallback(async (verification: Omit<Verification, "id">) => {
        setLockError(null)
        try {
            const { verificationService } = await import('@/services/accounting/verification-service')
            const status = await verificationService.getPeriodStatus(verification.date)

            if (status === 'closed') {
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
            await queryClient.invalidateQueries({ queryKey: verificationQueryKeys.all })
            return true
        } catch (err) {
            console.error(err)
            return false
        }
    }, [queryClient])

    return {
        verifications: verifications || [],
        isLoading,
        error: error instanceof Error ? error.message : error ? String(error) : null,
        lockError,
        refresh: refetch,
        addVerification,
    }
}
