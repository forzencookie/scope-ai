/**
 * React Query hooks for transactions data fetching
 * 
 * This is a drop-in replacement for use-transactions.ts with React Query benefits:
 * - Automatic caching and deduplication
 * - Background refetching (stale-while-revalidate)
 * - Optimistic updates with automatic rollback
 * - Request deduplication across components
 * - Configurable cache times
 */

import { useState, useCallback, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { TransactionFilters, SortConfig, Transaction, TransactionWithAI } from "@/types"
import type { TransactionStatus } from "@/lib/status-types"
import * as transactionService from "@/services/transactions"
import { useAuth } from "./use-auth"
import { deleteStoredTransaction } from "@/lib/demo-storage"

// ============================================================================
// Query Keys - Centralized key management for cache invalidation
// ============================================================================

export const transactionQueryKeys = {
    all: ["transactions"] as const,
    list: (userId: string | null) => [...transactionQueryKeys.all, "list", userId] as const,
    paginated: (userId: string | null, page: number, pageSize: number, filters?: TransactionFilters, sort?: SortConfig<Transaction>) =>
        [...transactionQueryKeys.all, "paginated", userId, page, pageSize, JSON.stringify(filters), JSON.stringify(sort)] as const,
    byStatus: (userId: string | null, status: TransactionStatus) =>
        [...transactionQueryKeys.all, "byStatus", userId, status] as const,
    stats: (userId: string | null) => [...transactionQueryKeys.all, "stats", userId] as const,
    detail: (id: string) => [...transactionQueryKeys.all, "detail", id] as const,
} as const

// ============================================================================
// Cache Configuration
// ============================================================================

const CACHE_CONFIG = {
    // Keep data fresh for 30 seconds before refetching in background
    staleTime: 30 * 1000,
    // Keep unused data in cache for 5 minutes
    gcTime: 5 * 60 * 1000,
    // Paginated data stays fresh for 1 minute (less frequently accessed)
    paginatedStaleTime: 60 * 1000,
} as const

// ============================================================================
// useTransactions Hook - Main transactions data (React Query version)
// Drop-in replacement for the original useTransactions
// ============================================================================

export function useTransactions() {
    const { user } = useAuth()
    const userId = user?.id ?? null
    const isAuthenticated = !!user
    const queryClient = useQueryClient()

    // Main query for transactions list
    const {
        data: transactions = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: transactionQueryKeys.list(userId),
        queryFn: async () => {
            if (isAuthenticated && userId) {
                const response = await transactionService.getTransactionsWithAI(userId)
                if (!response.success) throw new Error(response.error || "Failed to fetch transactions")
                return response.data || []
            }
            return []
        },
        staleTime: CACHE_CONFIG.staleTime,
        gcTime: CACHE_CONFIG.gcTime,
        enabled: isAuthenticated,
    })

    // Update status mutation with optimistic updates
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: TransactionStatus }) => {
            if (isAuthenticated && userId) {
                const response = await transactionService.updateTransactionStatus(id, userId, status)
                if (!response.success) throw new Error(response.error || "Failed to update status")
            }
            return { id, status }
        },
        onMutate: async ({ id, status }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: transactionQueryKeys.list(userId) })

            // Snapshot previous value for rollback
            const previousTransactions = queryClient.getQueryData<TransactionWithAI[]>(
                transactionQueryKeys.list(userId)
            )

            // Optimistically update the cache
            if (previousTransactions) {
                queryClient.setQueryData<TransactionWithAI[]>(
                    transactionQueryKeys.list(userId),
                    previousTransactions.map(t => t.id === id ? { ...t, status } : t)
                )
            }

            return { previousTransactions }
        },
        onError: (_err, _variables, context) => {
            // Rollback on error
            if (context?.previousTransactions) {
                queryClient.setQueryData(
                    transactionQueryKeys.list(userId),
                    context.previousTransactions
                )
            }
        },
        onSettled: () => {
            // Refetch to ensure we have the latest data
            queryClient.invalidateQueries({ queryKey: transactionQueryKeys.all })
        },
    })

    // Delete mutation with optimistic updates
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            if (isAuthenticated && userId) {
                const response = await transactionService.deleteTransaction(id, userId)
                if (!response.success) throw new Error(response.error || "Failed to delete transaction")
            } else {
                deleteStoredTransaction(id)
            }
            return id
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: transactionQueryKeys.list(userId) })

            const previousTransactions = queryClient.getQueryData<TransactionWithAI[]>(
                transactionQueryKeys.list(userId)
            )

            if (previousTransactions) {
                queryClient.setQueryData<TransactionWithAI[]>(
                    transactionQueryKeys.list(userId),
                    previousTransactions.filter(t => t.id !== id)
                )
            }

            return { previousTransactions }
        },
        onError: (_err, _id, context) => {
            if (context?.previousTransactions) {
                queryClient.setQueryData(
                    transactionQueryKeys.list(userId),
                    context.previousTransactions
                )
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: transactionQueryKeys.all })
        },
    })

    // Wrapper functions to match original API
    const updateStatus = useCallback(async (id: string, status: TransactionStatus) => {
        await updateStatusMutation.mutateAsync({ id, status })
    }, [updateStatusMutation])

    const deleteTransaction = useCallback(async (id: string) => {
        await deleteMutation.mutateAsync(id)
    }, [deleteMutation])

    return {
        transactions,
        isLoading,
        error: error || updateStatusMutation.error || deleteMutation.error,
        refetch,
        updateStatus,
        deleteTransaction,
    }
}

// ============================================================================
// useTransactionsPaginated Hook - Paginated data with filters
// ============================================================================

export function useTransactionsPaginated(initialPageSize: number = 20) {
    const { user } = useAuth()
    const userId = user?.id ?? null
    const isAuthenticated = !!user

    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState<TransactionFilters>({})
    const [sort, setSort] = useState<SortConfig<Transaction> | undefined>()

    // Reset page when filters change
    useEffect(() => { setPage(1) }, [filters])

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: transactionQueryKeys.paginated(userId, page, initialPageSize, filters, sort),
        queryFn: async () => {
            if (isAuthenticated && userId) {
                const response = await transactionService.getTransactionsPaginated(
                    userId, page, initialPageSize, filters, sort
                )
                return response
            }
            return { data: [], total: 0, page: 1, pageSize: initialPageSize, hasMore: false }
        },
        staleTime: CACHE_CONFIG.paginatedStaleTime,
        gcTime: CACHE_CONFIG.gcTime,
        enabled: isAuthenticated,
        // Keep previous data while fetching next page
        placeholderData: (previousData) => previousData,
    })

    const transactions = data?.data ?? []
    const total = data?.total ?? 0
    const hasMore = data?.hasMore ?? false

    const nextPage = useCallback(() => { if (hasMore) setPage(p => p + 1) }, [hasMore])
    const prevPage = useCallback(() => { if (page > 1) setPage(p => p - 1) }, [page])

    return {
        transactions,
        isLoading,
        error,
        page,
        pageSize: initialPageSize,
        total,
        hasMore,
        filters,
        sort,
        setFilters,
        setSort,
        setPage,
        nextPage,
        prevPage,
        refetch,
    }
}

// ============================================================================
// useTransactionsByStatus Hook
// ============================================================================

export function useTransactionsByStatus(status: TransactionStatus) {
    const { user } = useAuth()
    const userId = user?.id ?? null
    const isAuthenticated = !!user

    const {
        data: transactions = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: transactionQueryKeys.byStatus(userId, status),
        queryFn: async () => {
            if (isAuthenticated && userId) {
                const response = await transactionService.getTransactionsByStatus(userId, status)
                if (!response.success) throw new Error(response.error || "Failed to fetch transactions")
                return response.data || []
            }
            return []
        },
        staleTime: CACHE_CONFIG.staleTime,
        gcTime: CACHE_CONFIG.gcTime,
        enabled: isAuthenticated,
    })

    return { transactions, isLoading, error, refetch }
}

// ============================================================================
// useTransactionStats Hook
// ============================================================================

export function useTransactionStats() {
    const { user } = useAuth()
    const userId = user?.id ?? null
    const isAuthenticated = !!user

    const {
        data: stats = null,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: transactionQueryKeys.stats(userId),
        queryFn: async () => {
            if (isAuthenticated && userId) {
                const response = await transactionService.getTransactionStats(userId)
                if (!response.success) throw new Error(response.error || "Failed to fetch stats")
                return response.data
            }
            return { total: 0, pending: 0, booked: 0, missingDocs: 0, ignored: 0 }
        },
        staleTime: CACHE_CONFIG.staleTime,
        gcTime: CACHE_CONFIG.gcTime,
        enabled: isAuthenticated,
    })

    return { stats, isLoading, error, refetch }
}

// ============================================================================
// useTransactionAI Hook - AI suggestion management
// ============================================================================

export function useTransactionAI(onUpdate?: (transaction: TransactionWithAI) => void) {
    const { user } = useAuth()
    const userId = user?.id ?? null
    const isAuthenticated = !!user
    const queryClient = useQueryClient()

    const approveMutation = useMutation({
        mutationFn: async (transactionId: string) => {
            if (!isAuthenticated || !userId) throw new Error("Unauthorized")
            const response = await transactionService.approveAISuggestion(transactionId)
            if (!response.success || !response.data) throw new Error(response.error || "Failed to approve")
            return response.data
        },
        onSuccess: (data) => {
            onUpdate?.(data)
            queryClient.invalidateQueries({ queryKey: transactionQueryKeys.all })
        },
    })

    const rejectMutation = useMutation({
        mutationFn: async (transactionId: string) => {
            if (!isAuthenticated || !userId) throw new Error("Unauthorized")
            const response = await transactionService.rejectAISuggestion(transactionId)
            if (!response.success || !response.data) throw new Error(response.error || "Failed to reject")
            return response.data
        },
        onSuccess: (data) => {
            onUpdate?.(data)
            queryClient.invalidateQueries({ queryKey: transactionQueryKeys.all })
        },
    })

    const bulkApproveMutation = useMutation({
        mutationFn: async (transactionIds: string[]) => {
            if (!isAuthenticated || !userId) throw new Error("Unauthorized")
            const response = await transactionService.bulkApproveAISuggestions(transactionIds)
            if (!response.success || !response.data) throw new Error(response.error || "Failed to bulk approve")
            return response.data
        },
        onSuccess: (results) => {
            results.forEach(txn => onUpdate?.(txn))
            queryClient.invalidateQueries({ queryKey: transactionQueryKeys.all })
        },
    })

    const approveAISuggestion = useCallback(async (transactionId: string) => {
        await approveMutation.mutateAsync(transactionId)
    }, [approveMutation])

    const rejectAISuggestion = useCallback(async (transactionId: string) => {
        await rejectMutation.mutateAsync(transactionId)
    }, [rejectMutation])

    const bulkApprove = useCallback(async (transactionIds: string[]) => {
        await bulkApproveMutation.mutateAsync(transactionIds)
    }, [bulkApproveMutation])

    return {
        approveAISuggestion,
        rejectAISuggestion,
        bulkApprove,
        isProcessing: approveMutation.isPending || rejectMutation.isPending || bulkApproveMutation.isPending,
        error: approveMutation.error || rejectMutation.error || bulkApproveMutation.error,
    }
}

// ============================================================================
// useTransactionSelection Hook - For bulk operations (unchanged, pure UI state)
// ============================================================================

export function useTransactionSelection() {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [allIds, setAllIds] = useState<string[]>([])

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }, [])

    const selectAll = useCallback((ids: string[]) => {
        setAllIds(ids)
        setSelectedIds(prev => prev.size === ids.length ? new Set() : new Set(ids))
    }, [])

    const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

    const isAllSelected = useMemo(() =>
        allIds.length > 0 && selectedIds.size === allIds.length, [selectedIds, allIds])

    const isSomeSelected = useMemo(() =>
        selectedIds.size > 0 && selectedIds.size < allIds.length, [selectedIds, allIds])

    return {
        selectedIds,
        isAllSelected,
        isSomeSelected,
        toggleSelection,
        selectAll,
        clearSelection,
        selectedCount: selectedIds.size,
    }
}

// ============================================================================
// Cache Utilities
// ============================================================================

/**
 * Prefetch transactions for a user (useful for route prefetching)
 */
export async function prefetchTransactions(
    queryClient: ReturnType<typeof useQueryClient>,
    userId: string
) {
    await queryClient.prefetchQuery({
        queryKey: transactionQueryKeys.list(userId),
        queryFn: async () => {
            const response = await transactionService.getTransactionsWithAI(userId)
            if (!response.success) throw new Error(response.error || "Failed to fetch transactions")
            return response.data || []
        },
        staleTime: CACHE_CONFIG.staleTime,
    })
}

/**
 * Invalidate all transaction queries (useful after bulk operations)
 */
export function useInvalidateTransactions() {
    const queryClient = useQueryClient()
    return useCallback(() => {
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.all })
    }, [queryClient])
}
