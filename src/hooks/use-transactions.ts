// ============================================
// Transactions Hooks
// ============================================

import { useState, useCallback, useMemo, useEffect } from "react"
import type { TransactionFilters, SortConfig, Transaction, TransactionWithAI } from "@/types"
import type { TransactionStatus } from "@/lib/status-types"
import * as transactionService from "@/services/transactions"
import { useAsync, useAsyncMutation } from "./use-async"
import { useAuth } from "./use-auth"
import {
  deleteStoredTransaction,
} from "@/lib/demo-storage"

// ============================================
// Service Selection Helper
// ============================================

/**
 * Returns the appropriate transaction service based on authentication state.
 * - Authenticated users: Supabase (persistent, production-ready)
 * - Unauthenticated: localStorage via demo-storage
 */
function useTransactionService() {
  const { user } = useAuth()
  return {
    userId: user?.id ?? null,
    isAuthenticated: !!user,
  }
}

// ============================================
// useTransactions Hook - Main transactions data
// ============================================



export function useTransactions() {
  const { userId, isAuthenticated } = useTransactionService()

  const {
    data: transactions,
    isLoading,
    error,
    refetch,
    setData: setTransactions
  } = useAsync(
    async () => {
      if (isAuthenticated && userId) {
        const response = await transactionService.getTransactionsWithAI(userId)
        if (!response.success) throw new Error(response.error || "Failed to fetch transactions")

        // Return empty if no real data exists
        if (!response.data || response.data.length === 0) {
          return []
        }

        return response.data
      } else {
        // Return empty for unauthenticated state
        return []
      }

    },
    [] as TransactionWithAI[],
    [userId, isAuthenticated]
  )

  const updateStatusMutation = useAsyncMutation(
    async ({ id, status }: { id: string; status: TransactionStatus }) => {
      if (isAuthenticated && userId) {
        const response = await transactionService.updateTransactionStatus(id, userId, status)
        if (!response.success) throw new Error(response.error || "Failed to update status")
      } else {
        // updateStoredTransaction(id, { status })
      }
      return { id, status }
    }
  )

  const deleteMutation = useAsyncMutation(
    async (id: string) => {
      if (isAuthenticated && userId) {
        const response = await transactionService.deleteTransaction(id, userId)
        if (!response.success) throw new Error(response.error || "Failed to delete transaction")
      } else {
        deleteStoredTransaction(id)
      }
      return id
    }
  )

  const updateStatus = useCallback(async (id: string, status: TransactionStatus) => {
    // Store previous state for potential rollback
    const previousTransactions = transactions

    // Optimistic update
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t))

    try {
      await updateStatusMutation.execute({ id, status })
    } catch {
      // Rollback to previous state without network request
      setTransactions(previousTransactions)
    }
  }, [transactions, setTransactions, updateStatusMutation])

  const deleteTransaction = useCallback(async (id: string) => {
    // Store previous state for potential rollback
    const previousTransactions = transactions

    // Optimistic update
    setTransactions(prev => prev.filter(t => t.id !== id))

    try {
      await deleteMutation.execute(id)
    } catch {
      // Rollback to previous state without network request
      setTransactions(previousTransactions)
    }
  }, [transactions, setTransactions, deleteMutation])

  return {
    transactions,
    isLoading,
    error: error || updateStatusMutation.error || deleteMutation.error,
    refetch,
    updateStatus,
    deleteTransaction,
  }
}

// ============================================
// useTransactionsPaginated Hook
// ============================================

export function useTransactionsPaginated(initialPageSize: number = 20) {
  const { userId, isAuthenticated } = useTransactionService()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [sort, setSort] = useState<SortConfig<Transaction> | undefined>()
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const { data: transactions, isLoading, error, refetch } = useAsync(
    async () => {
      if (isAuthenticated && userId) {
        const response = await transactionService.getTransactionsPaginated(
          userId, page, initialPageSize, filters, sort
        )
        setTotal(response.total)
        setHasMore(response.hasMore)
        return response.data
      } else {
        // Return empty for unauthenticated
        setTotal(0)
        setHasMore(false)
        return []
      }
    },
    [] as TransactionWithAI[],
    [page, filters, sort, initialPageSize, userId, isAuthenticated]
  )

  // Reset page when filters change
  // eslint-disable-next-line
  useEffect(() => { setPage(1) }, [filters])

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

// ============================================
// useTransactionsByStatus Hook
// ============================================

export function useTransactionsByStatus(status: TransactionStatus) {
  const { userId, isAuthenticated } = useTransactionService()

  const { data: transactions, isLoading, error, refetch } = useAsync(
    async () => {
      if (isAuthenticated && userId) {
        const response = await transactionService.getTransactionsByStatus(userId, status)
        if (!response.success) throw new Error(response.error || "Failed to fetch transactions")
        return response.data
      } else {
        return []
      }
    },
    [] as TransactionWithAI[],
    [status, userId, isAuthenticated]
  )

  return { transactions, isLoading, error, refetch }
}

// ============================================
// useTransactionAI Hook - AI suggestion management
// Uses demo storage for AI suggestion operations
// ============================================

export function useTransactionAI(onUpdate?: (transaction: TransactionWithAI) => void) {
  const { userId, isAuthenticated } = useTransactionService()
  const approveMutation = useAsyncMutation(
    async (transactionId: string) => {
      if (!isAuthenticated || !userId) throw new Error("Unauthorized")
      const response = await transactionService.approveAISuggestion(transactionId)
      if (!response.success || !response.data) throw new Error(response.error || "Failed to approve")
      return response.data
    }
  )

  const rejectMutation = useAsyncMutation(
    async (transactionId: string) => {
      if (!isAuthenticated || !userId) throw new Error("Unauthorized")
      const response = await transactionService.rejectAISuggestion(transactionId)
      if (!response.success || !response.data) throw new Error(response.error || "Failed to reject")
      return response.data
    }
  )

  const bulkApproveMutation = useAsyncMutation(
    async (transactionIds: string[]) => {
      if (!isAuthenticated || !userId) throw new Error("Unauthorized")
      const response = await transactionService.bulkApproveAISuggestions(transactionIds)
      if (!response.success || !response.data) throw new Error(response.error || "Failed to bulk approve")
      return response.data
    }
  )

  const approveAISuggestion = useCallback(async (transactionId: string) => {
    const result = await approveMutation.execute(transactionId)
    if (result) onUpdate?.(result)
  }, [approveMutation, onUpdate])

  const rejectAISuggestion = useCallback(async (transactionId: string) => {
    const result = await rejectMutation.execute(transactionId)
    if (result) onUpdate?.(result)
  }, [rejectMutation, onUpdate])

  const bulkApprove = useCallback(async (transactionIds: string[]) => {
    const results = await bulkApproveMutation.execute(transactionIds)
    if (results) results.forEach(txn => onUpdate?.(txn))
  }, [bulkApproveMutation, onUpdate])

  return {
    approveAISuggestion,
    rejectAISuggestion,
    bulkApprove,
    isProcessing: approveMutation.isLoading || rejectMutation.isLoading || bulkApproveMutation.isLoading,
    error: approveMutation.error || rejectMutation.error || bulkApproveMutation.error,
  }
}

// ============================================
// useTransactionStats Hook
// ============================================

export function useTransactionStats() {
  const { userId, isAuthenticated } = useTransactionService()

  const { data: stats, isLoading, error, refetch } = useAsync(
    async () => {
      if (isAuthenticated && userId) {
        const response = await transactionService.getTransactionStats(userId)
        if (!response.success) throw new Error(response.error || "Failed to fetch stats")
        return response.data
      } else {
        return { total: 0, pending: 0, booked: 0, missingDocs: 0, ignored: 0 }
      }
    },
    null as { total: number; pending: number; booked: number; missingDocs: number; ignored: number } | null,
    [userId, isAuthenticated]
  )

  return { stats, isLoading, error, refetch }
}

// ============================================
// useTransactionSelection Hook - For bulk operations
// ============================================

export function useTransactionSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [allIds, setAllIds] = useState<string[]>([])

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
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
