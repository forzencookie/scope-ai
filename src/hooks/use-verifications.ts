
import { useState, useEffect, useCallback } from "react"

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

export function useVerifications() {
    const [verifications, setVerifications] = useState<Verification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchVerifications = useCallback(async () => {
        try {
            const response = await fetch('/api/verifications')
            if (!response.ok) throw new Error('Failed to fetch')
            const data = await response.json()

            if (!data.verifications) {
                setVerifications([])
            } else {
                setVerifications(data.verifications)
            }
        } catch (err) {
            console.error(err)
            setVerifications([])
            // setError('Failed to load verifications') // Don't show error if we fallback
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchVerifications()
    }, [fetchVerifications])

    const addVerification = useCallback(async (verification: Omit<Verification, "id">) => {
        try {
            const response = await fetch('/api/verifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(verification)
            })
            if (!response.ok) throw new Error('Failed to create verification')
            await fetchVerifications()
            return true
        } catch (err) {
            console.error(err)
            return false
        }
    }, [fetchVerifications])

    return { verifications, isLoading, error, refresh: fetchVerifications, addVerification }
}
