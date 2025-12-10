/**
 * React Query hooks for data fetching with caching
 * 
 * Benefits:
 * - Automatic caching and deduplication
 * - Background refetching
 * - Stale-while-revalidate pattern
 * - Optimistic updates support
 * - Request deduplication
 * - Retry logic
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query"
import type { TransactionWithAI, TransactionFilters, SortConfig, Transaction } from "@/types"
import type { TransactionStatus } from "@/lib/status-types"
import * as transactionService from "@/services/transactions"
import { useAuth } from "./use-auth"
import {
    getStoredTransactions,
    setStoredTransactions,
    updateStoredTransaction,
    deleteStoredTransaction,
} from "@/lib/demo-storage"
import { mockTransactionsWithAI } from "@/data/transactions"

// ============================================================================
// Query Keys - Centralized key management for cache invalidation
// ============================================================================

export const queryKeys = {
    transactions: {
        all: ["transactions"] as const,
        list: (userId: string | null) => [...queryKeys.transactions.all, "list", userId] as const,
        paginated: (userId: string | null, page: number, pageSize: number, filters?: TransactionFilters, sort?: SortConfig<Transaction>) =>
            [...queryKeys.transactions.all, "paginated", userId, page, pageSize, filters, sort] as const,
        detail: (id: string) => [...queryKeys.transactions.all, "detail", id] as const,
    },
    invoices: {
        all: ["invoices"] as const,
        list: (userId: string | null) => [...queryKeys.invoices.all, "list", userId] as const,
        detail: (id: string) => [...queryKeys.invoices.all, "detail", id] as const,
    },
    receipts: {
        all: ["receipts"] as const,
        list: (userId: string | null) => [...queryKeys.receipts.all, "list", userId] as const,
        detail: (id: string) => [...queryKeys.receipts.all, "detail", id] as const,
    },
    dashboard: {
        all: ["dashboard"] as const,
        stats: (userId: string | null) => [...queryKeys.dashboard.all, "stats", userId] as const,
    },
} as const

// ============================================================================
// Transactions Hooks
// ============================================================================

/**
 * Fetch transactions with React Query caching
 */
export function useTransactionsQuery(
    options?: Omit<UseQueryOptions<TransactionWithAI[], Error>, "queryKey" | "queryFn">
) {
    const { user } = useAuth()
    const userId = user?.id ?? null
    const isAuthenticated = !!user

    return useQuery({
        queryKey: queryKeys.transactions.list(userId),
        queryFn: async () => {
            if (isAuthenticated && userId) {
                const response = await transactionService.getTransactionsWithAI(userId)
                if (!response.success) throw new Error(response.error || "Failed to fetch transactions")
                return response.data
            } else {
                // Try to get from localStorage first for persistence
                const stored = getStoredTransactions()
                if (stored && stored.length > 0) {
                    return stored
                }
                
                // Initialize with mock data for demo
                setStoredTransactions(mockTransactionsWithAI)
                return mockTransactionsWithAI
            }
        },
        // Keep data fresh for 30 seconds
        staleTime: 30 * 1000,
        // Cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        ...options,
    })
}

/**
 * Fetch paginated transactions with React Query
 */
export function useTransactionsPaginatedQuery(
    page: number = 1,
    pageSize: number = 20,
    filters?: TransactionFilters,
    sort?: SortConfig<Transaction>
) {
    const { user } = useAuth()
    const userId = user?.id ?? null
    const isAuthenticated = !!user

    return useQuery({
        queryKey: queryKeys.transactions.paginated(userId, page, pageSize, filters, sort),
        queryFn: async () => {
            if (isAuthenticated && userId) {
                const response = await transactionService.getTransactionsPaginated(
                    userId, page, pageSize, filters, sort
                )
                return response
            } else {
                // Use demo storage for unauthenticated users
                const stored = getStoredTransactions() ?? mockTransactionsWithAI
                const start = (page - 1) * pageSize
                const end = start + pageSize
                return {
                    data: stored.slice(start, end),
                    total: stored.length,
                    page,
                    pageSize,
                    hasMore: end < stored.length,
                }
            }
        },
        // Keep paginated data fresh for 1 minute
        staleTime: 60 * 1000,
        // Prefetch next page
        placeholderData: (previousData) => previousData,
    })
}

/**
 * Update transaction status with optimistic updates
 */
export function useUpdateTransactionStatus() {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const userId = user?.id ?? null
    const isAuthenticated = !!user

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: TransactionStatus }) => {
            if (isAuthenticated && userId) {
                const response = await transactionService.updateTransactionStatus(id, userId, status)
                if (!response.success) throw new Error(response.error || "Failed to update status")
                return { id, status }
            } else {
                // Update localStorage directly
                updateStoredTransaction(id, { status })
                return { id, status }
            }
        },
        // Optimistic update
        onMutate: async ({ id, status }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.transactions.list(userId) })

            // Snapshot the previous value
            const previousTransactions = queryClient.getQueryData<TransactionWithAI[]>(
                queryKeys.transactions.list(userId)
            )

            // Optimistically update
            if (previousTransactions) {
                queryClient.setQueryData<TransactionWithAI[]>(
                    queryKeys.transactions.list(userId),
                    previousTransactions.map(t => t.id === id ? { ...t, status } : t)
                )
            }

            return { previousTransactions }
        },
        // Rollback on error
        onError: (_err, _variables, context) => {
            if (context?.previousTransactions) {
                queryClient.setQueryData(
                    queryKeys.transactions.list(userId),
                    context.previousTransactions
                )
            }
        },
        // Refetch after success
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
        },
    })
}

/**
 * Delete transaction with optimistic updates
 */
export function useDeleteTransaction() {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const userId = user?.id ?? null
    const isAuthenticated = !!user

    return useMutation({
        mutationFn: async (id: string) => {
            if (isAuthenticated && userId) {
                const response = await transactionService.deleteTransaction(id, userId)
                if (!response.success) throw new Error(response.error || "Failed to delete transaction")
            } else {
                // Delete from localStorage directly
                deleteStoredTransaction(id)
            }
            return id
        },
        // Optimistic update
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.transactions.list(userId) })

            const previousTransactions = queryClient.getQueryData<TransactionWithAI[]>(
                queryKeys.transactions.list(userId)
            )

            if (previousTransactions) {
                queryClient.setQueryData<TransactionWithAI[]>(
                    queryKeys.transactions.list(userId),
                    previousTransactions.filter(t => t.id !== id)
                )
            }

            return { previousTransactions }
        },
        onError: (_err, _id, context) => {
            if (context?.previousTransactions) {
                queryClient.setQueryData(
                    queryKeys.transactions.list(userId),
                    context.previousTransactions
                )
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
        },
    })
}

// ============================================================================
// Cache Utilities
// ============================================================================

/**
 * Prefetch transactions for a user
 */
export async function prefetchTransactions(queryClient: ReturnType<typeof useQueryClient>, userId: string | null) {
    await queryClient.prefetchQuery({
        queryKey: queryKeys.transactions.list(userId),
        queryFn: async () => {
            if (userId) {
                const response = await transactionService.getTransactionsWithAI(userId)
                if (!response.success) throw new Error(response.error || "Failed to fetch transactions")
                return response.data
            } else {
                const stored = getStoredTransactions()
                if (stored && stored.length > 0) return stored
                return mockTransactionsWithAI
            }
        },
        staleTime: 30 * 1000,
    })
}

/**
 * Invalidate all transaction queries (useful after bulk operations)
 */
export function invalidateTransactions(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
}
