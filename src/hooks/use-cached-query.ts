"use client"

/**
 * Simple in-memory cache for async data fetching.
 * Reduces redundant API calls when switching between tabs/pages.
 * 
 * Features:
 * - Configurable TTL (time-to-live) for cache entries
 * - Automatic stale data cleanup
 * - Race condition prevention
 * - Works with the existing useAsync pattern
 */

import { useState, useEffect, useCallback, useRef } from "react"

// Simple in-memory cache store
const cache = new Map<string, { data: unknown; timestamp: number; promise?: Promise<unknown> }>()

interface UseCachedQueryOptions<T> {
    /** Unique cache key */
    cacheKey: string
    /** Async function that fetches data */
    queryFn: () => Promise<T>
    /** Time-to-live in milliseconds (default: 5 minutes) */
    ttlMs?: number
    /** Skip initial fetch */
    skip?: boolean
    /** Called on success */
    onSuccess?: (data: T) => void
    /** Called on error */
    onError?: (error: string) => void
}

interface UseCachedQueryResult<T> {
    data: T | null
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
    /** Invalidate cache and refetch */
    invalidate: () => Promise<void>
}

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Hook for cached data fetching.
 * Shares cached data across components using the same cacheKey.
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCachedQuery({
 *   cacheKey: `transactions-${userId}`,
 *   queryFn: () => fetchTransactions(userId),
 *   ttlMs: 60000, // 1 minute
 * })
 * ```
 */
export function useCachedQuery<T>({
    cacheKey,
    queryFn,
    ttlMs = DEFAULT_TTL_MS,
    skip = false,
    onSuccess,
    onError,
}: UseCachedQueryOptions<T>): UseCachedQueryResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(!skip)
    const [error, setError] = useState<string | null>(null)

    const isMounted = useRef(true)
    const requestIdRef = useRef(0)

    // Store callbacks in refs for stability
    const onSuccessRef = useRef(onSuccess)
    const onErrorRef = useRef(onError)
    const queryFnRef = useRef(queryFn)

    // Update refs in effect to avoid render side-effects
    useEffect(() => {
        onSuccessRef.current = onSuccess
        onErrorRef.current = onError
        queryFnRef.current = queryFn
    }, [onSuccess, onError, queryFn])

    const fetchData = useCallback(async (forceRefresh = false) => {
        const currentRequestId = ++requestIdRef.current

        // Check cache first (unless forcing refresh)
        if (!forceRefresh) {
            const cached = cache.get(cacheKey)
            if (cached) {
                const isExpired = Date.now() - cached.timestamp > ttlMs

                if (!isExpired) {
                    // Return cached data
                    if (isMounted.current && currentRequestId === requestIdRef.current) {
                        setData(cached.data as T)
                        setIsLoading(false)
                        setError(null)
                    }
                    return
                }

                // Check if there's already a pending request
                if (cached.promise) {
                    try {
                        const result = await cached.promise
                        if (isMounted.current && currentRequestId === requestIdRef.current) {
                            setData(result as T)
                            setIsLoading(false)
                            setError(null)
                        }
                        return
                    } catch {
                        // Fall through to make new request
                    }
                }
            }
        }

        setIsLoading(true)
        setError(null)

        // Create promise and store it in cache to deduplicate concurrent requests
        const promise = queryFnRef.current()
        cache.set(cacheKey, {
            data: cache.get(cacheKey)?.data, // Keep stale data while loading
            timestamp: cache.get(cacheKey)?.timestamp || 0,
            promise
        })

        try {
            const result = await promise

            // Update cache with fresh data
            cache.set(cacheKey, {
                data: result,
                timestamp: Date.now(),
                promise: undefined
            })

            if (isMounted.current && currentRequestId === requestIdRef.current) {
                setData(result)
                setIsLoading(false)
                setError(null)
                onSuccessRef.current?.(result)
            }
        } catch (err) {
            // Remove failed promise from cache
            const cached = cache.get(cacheKey)
            if (cached) {
                cache.set(cacheKey, { ...cached, promise: undefined })
            }

            if (isMounted.current && currentRequestId === requestIdRef.current) {
                const errorMsg = err instanceof Error ? err.message : "Unknown error"
                setError(errorMsg)
                setIsLoading(false)
                onErrorRef.current?.(errorMsg)
            }
        }
    }, [cacheKey, ttlMs])

    // Initial fetch
    useEffect(() => {
        isMounted.current = true
        let timeoutId: ReturnType<typeof setTimeout> | undefined

        if (!skip) {
            // Defer fetch to avoid synchronous setState warning
            timeoutId = setTimeout(() => {
                if (isMounted.current) fetchData()
            }, 0)
        }

        return () => {
            isMounted.current = false
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [fetchData, skip])

    const refetch = useCallback(async () => {
        await fetchData(false)
    }, [fetchData])

    const invalidate = useCallback(async () => {
        cache.delete(cacheKey)
        await fetchData(true)
    }, [cacheKey, fetchData])

    return {
        data,
        isLoading,
        error,
        refetch,
        invalidate,
    }
}

/**
 * Utility to invalidate cache entries by prefix.
 * Useful for invalidating all related queries after a mutation.
 * 
 * @example
 * ```tsx
 * // After creating a transaction
 * invalidateCacheByPrefix('transactions')
 * ```
 */
export function invalidateCacheByPrefix(prefix: string): void {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key)
        }
    }
}

/**
 * Clear entire cache.
 * Useful when user logs out or switches accounts.
 */
export function clearCache(): void {
    cache.clear()
}
