/**
 * Generic async data fetching hook
 * 
 * Eliminates repetitive loading/error state management across hooks.
 * All domain-specific hooks (useTransactions, useDashboard, etc.) 
 * should use this as their foundation.
 */

import { useState, useEffect, useCallback, useRef, type DependencyList, type SetStateAction } from "react"

export interface UseAsyncResult<T> {
  data: T
  isLoading: boolean
  error: string | null
  /** Re-fetch the data */
  refetch: () => Promise<void>
  /** Manually set the data (for optimistic updates) */
  setData: (value: SetStateAction<T>) => void
  /** Clear any errors */
  clearError: () => void
}

export interface UseAsyncOptions {
  /** Skip initial fetch on mount */
  skip?: boolean
  /** Called when data is successfully fetched */
  onSuccess?: () => void
  /** Called when an error occurs */
  onError?: (error: string) => void
}

/**
 * Generic hook for async data fetching with race condition prevention
 * The async function should throw an error on failure (which will be caught)
 * or return the data directly.
 * 
 * IMPORTANT: The `deps` array controls when the async function is re-executed.
 * - Include all values that the asyncFn depends on
 * - If asyncFn captures values via closure, they MUST be in deps
 * - The asyncFn is stored in a ref and updated when deps change
 * 
 * @param asyncFn - Async function that fetches data. Must be stable or deps must include its dependencies.
 * @param initialData - Initial data value before first fetch completes
 * @param deps - Dependency array that triggers re-fetch when changed. Include ALL closure dependencies.
 * @param options - Optional configuration (skip, onSuccess, onError)
 * 
 * @example
 * ```tsx
 * // Good: userId in deps because asyncFn uses it
 * const { data } = useAsync(
 *   async () => fetchUser(userId),
 *   null,
 *   [userId]  // ✅ userId is in deps
 * )
 * 
 * // Bad: missing dependency
 * const { data } = useAsync(
 *   async () => fetchUser(userId),
 *   null,
 *   []  // ❌ userId missing - will use stale value!
 * )
 * ```
 */
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  initialData: T,
  deps: DependencyList = [],
  options: UseAsyncOptions = {}
): UseAsyncResult<T> {
  const [data, setData] = useState<T>(initialData)
  const [isLoading, setIsLoading] = useState(!options.skip)
  const [error, setError] = useState<string | null>(null)

  // Track if component is mounted to avoid state updates on unmounted component
  const isMounted = useRef(true)
  
  // Track request ID to prevent race conditions
  const requestIdRef = useRef(0)
  
  // Store options in ref to avoid dependency issues
  const optionsRef = useRef(options)
  optionsRef.current = options

  // Store asyncFn in ref to create a stable reference while respecting deps
  const asyncFnRef = useRef(asyncFn)
  
  // Update asyncFnRef when deps change
  // This ensures the async function has access to current closure values
  useEffect(() => {
    asyncFnRef.current = asyncFn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asyncFn, ...deps]) // Include asyncFn and spread deps for proper tracking

  const execute = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await asyncFnRef.current()
      
      // Only update if this is still the latest request and component is mounted
      if (isMounted.current && currentRequestId === requestIdRef.current) {
        setData(result)
        setIsLoading(false)
        optionsRef.current.onSuccess?.()
      }
    } catch (err) {
      // Only update if this is still the latest request and component is mounted
      if (isMounted.current && currentRequestId === requestIdRef.current) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error"
        setError(errorMsg)
        setIsLoading(false)
        optionsRef.current.onError?.(errorMsg)
      }
    }
  }, []) // Stable callback since we use refs

  // Track mounted state and trigger initial fetch
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Execute on mount (if not skipped) and when deps change
  useEffect(() => {
    if (!optionsRef.current.skip) {
      execute()
    }
    // We intentionally depend on `deps` array items, not `deps` itself
    // This is a deliberate pattern to allow dynamic dependency arrays
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, ...deps])

  const clearError = useCallback(() => setError(null), [])

  return {
    data,
    isLoading,
    error,
    refetch: execute,
    setData,
    clearError,
  }
}

export interface UseAsyncMutationOptions<TResult> {
  /** Called when mutation succeeds */
  onSuccess?: (data: TResult) => void
  /** Called when mutation fails */
  onError?: (error: string) => void
  /** Called when mutation completes (success or failure) */
  onSettled?: () => void
}

/**
 * Hook for handling async mutations (POST, PUT, DELETE)
 * Unlike useAsync, this doesn't auto-execute on mount
 * 
 * @example
 * ```tsx
 * const { execute, isLoading } = useAsyncMutation(
 *   async (id: string) => {
 *     const response = await transactionService.deleteTransaction(id)
 *     if (!response.success) throw new Error(response.error)
 *     return response.data
 *   }
 * )
 * 
 * await execute("txn-123")
 * ```
 */
export function useAsyncMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  options: UseAsyncMutationOptions<TResult> = {}
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TResult | undefined>(undefined)
  
  // Track if component is mounted
  const isMounted = useRef(true)
  
  // Store options in ref to keep execute stable
  const optionsRef = useRef(options)
  
  // Store mutationFn in ref to keep execute stable
  const mutationFnRef = useRef(mutationFn)

  useEffect(() => {
    optionsRef.current = options
    mutationFnRef.current = mutationFn
  }, [options, mutationFn])

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const execute = useCallback(async (input: TInput): Promise<TResult | undefined> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await mutationFnRef.current(input)
      
      if (isMounted.current) {
        setData(result)
        setIsLoading(false)
        optionsRef.current.onSuccess?.(result)
        optionsRef.current.onSettled?.()
      }
      
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error"
      
      if (isMounted.current) {
        setError(errorMsg)
        setIsLoading(false)
        optionsRef.current.onError?.(errorMsg)
        optionsRef.current.onSettled?.()
      }
      
      return undefined
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setData(undefined)
    setIsLoading(false)
  }, [])

  return {
    execute,
    isLoading,
    error,
    data,
    reset,
    clearError: useCallback(() => setError(null), []),
  }
}
