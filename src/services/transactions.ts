// ============================================
// Transactions Service (API-backed)
// ============================================

import type {
  TransactionFilters,
  ApiResponse,
  PaginatedResponse,
  SortConfig,
} from "@/types"
import type { TransactionStatus } from "@/lib/status-types"
import { TRANSACTION_STATUS_LABELS } from "@/lib/localization"
import {
  type Transaction,
  type TransactionWithAI,
  type AISuggestion,
} from "@/data/transactions"
import { compareValuesWithDirection } from "@/lib/compare"

/**
 * Create a successful API response
 */
function successResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    success: true,
    timestamp: new Date(),
  }
}

/**
 * Create an error API response with null data
 */
function errorResponseNull(error: string): ApiResponse<null> {
  return {
    data: null,
    success: false,
    error,
    timestamp: new Date(),
  }
}

/**
 * Create an error API response with specific data
 */
function errorResponse<T>(error: string, data: T): ApiResponse<T> {
  return {
    data,
    success: false,
    error,
    timestamp: new Date(),
  }
}

// ============================================
// Transaction Fetching Service (API-backed)
// ============================================

export async function getTransactions(_userId?: string): Promise<ApiResponse<Transaction[]>> {
  const response = await getTransactionsWithAI(_userId);
  if (response.success) {
    return { ...response, data: response.data };
  }
  return { ...response, data: [] };
}

export async function getTransactionsWithAI(_userId?: string): Promise<ApiResponse<TransactionWithAI[]>> {
  try {
    const res = await fetch('/api/transactions/processed', { cache: 'no-store' });
    const json = await res.json();

    if (!res.ok) throw new Error(json.error || 'Failed to fetch');

    return successResponse(json.transactions || []);
  } catch (err) {
    console.error('Fetch transactions failed:', err);
    return errorResponse('Failed to load transactions', []);
  }
}

export async function getTransactionsPaginated(
  _userId?: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: TransactionFilters,
  sort?: SortConfig<Transaction>
): Promise<PaginatedResponse<TransactionWithAI>> {
  const response = await getTransactionsWithAI(_userId);
  let filtered = response.data || [];

  // Apply filters
  if (filters) {
    if (filters.status?.length) {
      filtered = filtered.filter(t => filters.status!.includes(t.status))
    }
    if (filters.category?.length) {
      filtered = filtered.filter(t => filters.category!.includes(t.category))
    }
    if (filters.account?.length) {
      filtered = filtered.filter(t => filters.account!.includes(t.account))
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        (t.category && t.category.toLowerCase().includes(query))
      )
    }
    if (filters.dateRange) {
      filtered = filtered.filter(t =>
        t.timestamp >= filters.dateRange!.start &&
        t.timestamp <= filters.dateRange!.end
      )
    }
    if (filters.amountRange) {
      filtered = filtered.filter(t =>
        t.amountValue >= filters.amountRange!.min &&
        t.amountValue <= filters.amountRange!.max
      )
    }
  }

  // Apply sorting
  if (sort) {
    const direction = sort.direction === "asc" ? 1 : -1
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sort.field]
      const bVal = b[sort.field]
      return compareValuesWithDirection(aVal, bVal, direction)
    })
  }

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedItems = filtered.slice(start, end)

  return {
    data: paginatedItems,
    total: filtered.length,
    page,
    pageSize,
    hasMore: end < filtered.length,
  }
}

export async function getTransaction(id: string, _userId?: string): Promise<ApiResponse<TransactionWithAI | null>> {
  const response = await getTransactionsWithAI(_userId);
  const found = response.data?.find(t => t.id === id) || null;

  if (!found) return errorResponse("Transaction not found", null);
  return successResponse(found);
}

// ============================================
// Transaction Status Service
// ============================================

export async function getTransactionsByStatus(
  _userId: string,
  status: TransactionStatus
): Promise<ApiResponse<TransactionWithAI[]>> {
  const response = await getTransactionsWithAI(_userId);
  const filtered = (response.data || []).filter(t => t.status === status);
  return successResponse(filtered);
}

export async function updateTransactionStatus(
  id: string,
  _userId: string,
  status: TransactionStatus
): Promise<ApiResponse<TransactionWithAI | null>> {
  try {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.error);

    return getTransaction(id, _userId);

  } catch (err) {
    console.error('Update status failed:', err);
    return errorResponseNull('Failed to update status');
  }
}

// ============================================
// AI Suggestion Service
// ============================================

export async function getAISuggestion(transactionId: string): Promise<ApiResponse<AISuggestion | null>> {
  // In a real app, this would be an API call
  // For now, we fetch the transaction and return its aiSuggestion if it exists
  const response = await getTransaction(transactionId);
  if (response.success && response.data?.aiSuggestion) {
    return successResponse(response.data.aiSuggestion);
  }
  return successResponse(null);
}

export async function approveAISuggestion(transactionId: string): Promise<ApiResponse<TransactionWithAI | null>> {
  try {
    // To approve, we update the status to RECORDED and set the category
    const txResponse = await getTransaction(transactionId);
    if (!txResponse.success || !txResponse.data?.aiSuggestion) {
      return errorResponseNull("Transaction or AI suggestion not found");
    }

    const { aiSuggestion } = txResponse.data;

    const res = await fetch(`/api/transactions/${transactionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: TRANSACTION_STATUS_LABELS.RECORDED,
        category: aiSuggestion.category,
        isAIApproved: true
      })
    });

    if (!res.ok) throw new Error('Failed to approve AI suggestion');

    return getTransaction(transactionId);
  } catch (err) {
    console.error('Approve AI suggestion failed:', err);
    return errorResponseNull('Failed to approve AI suggestion');
  }
}

export async function rejectAISuggestion(transactionId: string): Promise<ApiResponse<TransactionWithAI | null>> {
  try {
    const res = await fetch(`/api/transactions/${transactionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aiSuggestion: null,
        isAIApproved: false
      })
    });

    if (!res.ok) throw new Error('Failed to reject AI suggestion');

    return getTransaction(transactionId);
  } catch (err) {
    console.error('Reject AI suggestion failed:', err);
    return errorResponseNull('Failed to reject AI suggestion');
  }
}

// ============================================
// Transaction Mutation Service
// ============================================

export async function updateTransaction(
  id: string,
  _userId: string,
  updates: Partial<Transaction>
): Promise<ApiResponse<TransactionWithAI | null>> {
  try {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!res.ok) throw new Error('Failed to update');

    return getTransaction(id, _userId);
  } catch (err) {
    console.error('Update transaction failed:', err);
    return errorResponseNull('Failed to update transaction');
  }
}

export async function deleteTransaction(id: string, _userId?: string): Promise<ApiResponse<boolean>> {
  try {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error('Failed to delete');

    return successResponse(true);
  } catch (err) {
    console.error('Delete transaction failed:', err);
    return errorResponse('Failed to delete transaction', false);
  }
}

// ============================================
// Bulk Operations Service
// ============================================

export async function bulkUpdateStatus(
  _userId: string,
  ids: string[],
  status: TransactionStatus
): Promise<ApiResponse<TransactionWithAI[]>> {
  const results: TransactionWithAI[] = [];

  // Sequential for simplicity in MVP, could be parallelized
  for (const id of ids) {
    const res = await updateTransactionStatus(id, _userId, status);
    if (res.success && res.data) {
      results.push(res.data);
    }
  }

  return successResponse(results);
}

export async function bulkApproveAISuggestions(ids: string[]): Promise<ApiResponse<TransactionWithAI[]>> {
  const results: TransactionWithAI[] = [];

  for (const id of ids) {
    const res = await approveAISuggestion(id);
    if (res.success && res.data) {
      results.push(res.data);
    }
  }

  return successResponse(results);
}

// ============================================
// Transaction Stats Service
// ============================================

export interface TransactionStats {
  total: number
  pending: number
  booked: number
  missingDocs: number
  ignored: number
}

export async function getTransactionStats(_userId?: string): Promise<ApiResponse<TransactionStats>> {
  try {
    const response = await getTransactionsWithAI(_userId);
    const transactions = response.data || [];

    const stats: TransactionStats = {
      total: transactions.length,
      pending: transactions.filter(t => t.status === TRANSACTION_STATUS_LABELS.TO_RECORD).length,
      booked: transactions.filter(t => t.status === TRANSACTION_STATUS_LABELS.RECORDED).length,
      missingDocs: transactions.filter(t => t.status === TRANSACTION_STATUS_LABELS.MISSING_DOCUMENTATION).length,
      ignored: transactions.filter(t => t.status === TRANSACTION_STATUS_LABELS.IGNORED).length,
    }

    return successResponse(stats);
  } catch (err) {
    return errorResponse('Failed to calculate stats', {
      total: 0, pending: 0, booked: 0, missingDocs: 0, ignored: 0
    });
  }
}

// ============================================
// Testing Utilities (Stubbed)
// ============================================

export function resetTransactionState(): void {
  // No-op in API-backed mode
}

export function getTransactionState(): TransactionWithAI[] {
  return []; // No-op in API-backed mode
}
