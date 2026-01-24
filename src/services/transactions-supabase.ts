// @ts-nocheck - TODO: Fix after regenerating Supabase types with proper PostgrestVersion
// ============================================
// Supabase-backed Transactions Service
// ============================================

import type {
  TransactionFilters,
  ApiResponse,
  PaginatedResponse,
  SortConfig,
  Transaction,
  TransactionWithAI,
  AISuggestion,
} from "@/types"
import type { TransactionStatus } from "@/lib/status-types"
import { TRANSACTION_STATUS_LABELS } from "@/lib/localization"
import { supabase } from "@/lib/database/supabase"
import type { Tables } from "@/types/supabase"

// ============================================
// Type Mappings
// ============================================

type DbTransaction = Tables<"transactions">

/**
 * Map database transaction to application Transaction type
 */
function mapDbToTransaction(db: DbTransaction, category?: string): Transaction {
  const isNegative = db.amount < 0
  const formattedAmount = `${isNegative ? '-' : '+'}$${Math.abs(db.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return {
    id: db.id,
    name: db.merchant || db.description || 'Unknown Transaction',
    date: new Date(db.occurred_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    timestamp: new Date(db.occurred_at),
    amount: formattedAmount,
    amountValue: db.amount,
    status: (db.status as TransactionStatus) || TRANSACTION_STATUS_LABELS.TO_RECORD,
    category: category || 'Uncategorized',
    iconName: getIconForCategory(category || 'Uncategorized'),
    iconColor: getIconColorForCategory(category || 'Uncategorized'),
    account: 'Main Account', // Could be enhanced with account lookup
    description: db.description || undefined,
  }
}

/**
 * Map application Transaction to database insert format
 */
function mapTransactionToDb(transaction: Partial<Transaction>, userId: string): Partial<DbTransaction> {
  return {
    user_id: userId,
    merchant: transaction.name,
    amount: transaction.amountValue,
    occurred_at: transaction.timestamp?.toISOString(),
    status: transaction.status,
    description: transaction.description,
    currency: 'USD',
  }
}

function getIconForCategory(category: string): string {
  const iconMap: Record<string, string> = {
    // English
    'Software': 'Smartphone',
    'Supplies': 'Tag',
    'Travel': 'Plane',
    'Income': 'Briefcase',
    'Meals': 'Coffee',
    'Rent': 'Building2',
    'Utilities': 'Zap',
    'Marketing': 'Megaphone',
    'Equipment': 'Monitor',
    // Swedish
    'Programvara': 'Smartphone',
    'IT & Programvara': 'Smartphone',
    'Material': 'Tag',
    'Kontorsmaterial': 'Tag',
    'Resor': 'Plane',
    'Intäkter': 'Briefcase',
    'Representation': 'Coffee',
    'Lokalhyra': 'Building2',
    'Hyra': 'Building2',
    'El & Värme': 'Zap',
    'Marknadsföring': 'Megaphone',
    'Utrustning': 'Monitor',
    'Telefoni': 'Smartphone',
    'Försäkring': 'Shield',
    'Bank & Finans': 'Landmark',
    'Löner': 'User',
    'Skatter & Avgifter': 'Receipt',
    'Övrigt': 'Tag',
  }
  return iconMap[category] || 'Tag'
}

function getIconColorForCategory(category: string): string {
  const colorMap: Record<string, string> = {
    // English
    'Software': 'text-blue-500',
    'Supplies': 'text-orange-500',
    'Travel': 'text-purple-500',
    'Income': 'text-green-500',
    'Meals': 'text-amber-600',
    'Rent': 'text-indigo-500',
    'Utilities': 'text-yellow-500',
    'Marketing': 'text-pink-500',
    'Equipment': 'text-gray-500',
    // Swedish
    'Programvara': 'text-blue-500',
    'IT & Programvara': 'text-blue-500',
    'Material': 'text-orange-500',
    'Kontorsmaterial': 'text-orange-500',
    'Resor': 'text-purple-500',
    'Intäkter': 'text-green-500',
    'Representation': 'text-amber-600',
    'Lokalhyra': 'text-indigo-500',
    'Hyra': 'text-indigo-500',
    'El & Värme': 'text-yellow-500',
    'Marknadsföring': 'text-pink-500',
    'Utrustning': 'text-gray-500',
    'Telefoni': 'text-cyan-500',
    'Försäkring': 'text-emerald-500',
    'Bank & Finans': 'text-slate-500',
    'Löner': 'text-violet-500',
    'Skatter & Avgifter': 'text-red-500',
    'Övrigt': 'text-gray-400',
  }
  return colorMap[category] || 'text-gray-500'
}

// ============================================
// Response Helpers
// ============================================

function successResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    success: true,
    timestamp: new Date(),
  }
}

function errorResponseNull(error: string): ApiResponse<null> {
  return {
    data: null,
    success: false,
    error,
    timestamp: new Date(),
  }
}

function errorResponse<T>(error: string, data: T): ApiResponse<T> {
  return {
    data,
    success: false,
    error,
    timestamp: new Date(),
  }
}

// ============================================
// Transaction Fetching Service
// ============================================

export async function getTransactions(userId: string): Promise<ApiResponse<Transaction[]>> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories (name)
    `)
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch transactions:', error)
    return errorResponse('Failed to fetch transactions', [])
  }

  const transactions = data.map(t =>
    mapDbToTransaction(t, (t.categories as { name: string } | null)?.name)
  )

  return successResponse(transactions)
}

export async function getTransactionsWithAI(userId: string): Promise<ApiResponse<TransactionWithAI[]>> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories (name)
    `)
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch transactions:', error)
    return errorResponse('Failed to fetch transactions', [])
  }

  // For now, AI suggestions would come from a separate AI service
  // This could be enhanced to fetch from an ai_suggestions table
  const transactions: TransactionWithAI[] = data.map(t => ({
    ...mapDbToTransaction(t, (t.categories as { name: string } | null)?.name),
    aiSuggestion: undefined, // Would be populated from AI service
    isAIApproved: false,
  }))

  return successResponse(transactions)
}

export async function getTransactionsPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: TransactionFilters,
  sort?: SortConfig<Transaction>
): Promise<PaginatedResponse<TransactionWithAI>> {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      categories (name)
    `, { count: 'exact' })
    .eq('user_id', userId)

  // Apply filters
  if (filters) {
    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }
    if (filters.searchQuery) {
      query = query.or(`merchant.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`)
    }
    if (filters.dateRange) {
      query = query
        .gte('occurred_at', filters.dateRange.start.toISOString())
        .lte('occurred_at', filters.dateRange.end.toISOString())
    }
    if (filters.amountRange) {
      query = query
        .gte('amount', filters.amountRange.min)
        .lte('amount', filters.amountRange.max)
    }
  }

  // Apply sorting
  if (sort) {
    const dbField = sort.field === 'timestamp' ? 'occurred_at' :
      sort.field === 'amountValue' ? 'amount' :
        sort.field === 'name' ? 'merchant' : sort.field
    query = query.order(dbField as string, { ascending: sort.direction === 'asc' })
  } else {
    query = query.order('occurred_at', { ascending: false })
  }

  // Apply pagination
  const start = (page - 1) * pageSize
  query = query.range(start, start + pageSize - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Failed to fetch paginated transactions:', error)
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
    }
  }

  const transactions: TransactionWithAI[] = data.map(t => ({
    ...mapDbToTransaction(t, (t.categories as { name: string } | null)?.name),
    aiSuggestion: undefined,
    isAIApproved: false,
  }))

  const total = count ?? 0

  return {
    data: transactions,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total,
  }
}

export async function getTransaction(id: string, userId: string): Promise<ApiResponse<TransactionWithAI | null>> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories (name)
    `)
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse('Transaction not found', null)
    }
    console.error('Failed to fetch transaction:', error)
    return errorResponse('Failed to fetch transaction', null)
  }

  const transaction: TransactionWithAI = {
    ...mapDbToTransaction(data, (data.categories as { name: string } | null)?.name),
    aiSuggestion: undefined,
    isAIApproved: false,
  }

  return successResponse(transaction)
}

// ============================================
// Transaction Status Service
// ============================================

export async function getTransactionsByStatus(
  userId: string,
  status: TransactionStatus
): Promise<ApiResponse<TransactionWithAI[]>> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories (name)
    `)
    .eq('user_id', userId)
    .eq('status', status)
    .order('occurred_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch transactions by status:', error)
    return errorResponse('Failed to fetch transactions', [])
  }

  const transactions: TransactionWithAI[] = data.map(t => ({
    ...mapDbToTransaction(t, (t.categories as { name: string } | null)?.name),
    aiSuggestion: undefined,
    isAIApproved: false,
  }))

  return successResponse(transactions)
}

export async function updateTransactionStatus(
  id: string,
  userId: string,
  status: TransactionStatus
): Promise<ApiResponse<TransactionWithAI | null>> {
  const { data, error } = await supabase
    .from('transactions')
    .update({ status })
    .eq('id', id)
    .eq('user_id', userId)
    .select(`
      *,
      categories (name)
    `)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponseNull('Transaction not found')
    }
    console.error('Failed to update transaction status:', error)
    return errorResponseNull('Failed to update transaction status')
  }

  const transaction: TransactionWithAI = {
    ...mapDbToTransaction(data, (data.categories as { name: string } | null)?.name),
    aiSuggestion: undefined,
    isAIApproved: false,
  }

  return successResponse(transaction)
}

// ============================================
// Transaction Mutation Service
// ============================================

export async function updateTransaction(
  id: string,
  userId: string,
  updates: Partial<Transaction>
): Promise<ApiResponse<TransactionWithAI | null>> {
  const dbUpdates: Record<string, unknown> = {}

  if (updates.name !== undefined) dbUpdates.merchant = updates.name
  if (updates.amountValue !== undefined) dbUpdates.amount = updates.amountValue
  if (updates.timestamp !== undefined) dbUpdates.occurred_at = updates.timestamp.toISOString()
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.description !== undefined) dbUpdates.description = updates.description

  const { data, error } = await supabase
    .from('transactions')
    .update(dbUpdates)
    .eq('id', id)
    .eq('user_id', userId)
    .select(`
      *,
      categories (name)
    `)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponseNull('Transaction not found')
    }
    console.error('Failed to update transaction:', error)
    return errorResponseNull('Failed to update transaction')
  }

  const transaction: TransactionWithAI = {
    ...mapDbToTransaction(data, (data.categories as { name: string } | null)?.name),
    aiSuggestion: undefined,
    isAIApproved: false,
  }

  return successResponse(transaction)
}

export async function deleteTransaction(id: string, userId: string): Promise<ApiResponse<boolean>> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to delete transaction:', error)
    return errorResponse('Failed to delete transaction', false)
  }

  return successResponse(true)
}

export async function createTransaction(
  userId: string,
  transaction: Omit<Transaction, 'id'>
): Promise<ApiResponse<TransactionWithAI | null>> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      merchant: transaction.name,
      amount: transaction.amountValue,
      occurred_at: transaction.timestamp.toISOString(),
      status: transaction.status,
      description: transaction.description,
      currency: 'USD',
    })
    .select(`
      *,
      categories (name)
    `)
    .single()

  if (error) {
    console.error('Failed to create transaction:', error)
    return errorResponseNull('Failed to create transaction')
  }

  const newTransaction: TransactionWithAI = {
    ...mapDbToTransaction(data, (data.categories as { name: string } | null)?.name),
    aiSuggestion: undefined,
    isAIApproved: false,
  }

  return successResponse(newTransaction)
}

// ============================================
// Bulk Operations Service
// ============================================

export async function bulkUpdateStatus(
  userId: string,
  ids: string[],
  status: TransactionStatus
): Promise<ApiResponse<TransactionWithAI[]>> {
  const { data, error } = await supabase
    .from('transactions')
    .update({ status })
    .in('id', ids)
    .eq('user_id', userId)
    .select(`
      *,
      categories (name)
    `)

  if (error) {
    console.error('Failed to bulk update status:', error)
    return errorResponse('Failed to bulk update status', [])
  }

  const transactions: TransactionWithAI[] = data.map(t => ({
    ...mapDbToTransaction(t, (t.categories as { name: string } | null)?.name),
    aiSuggestion: undefined,
    isAIApproved: false,
  }))

  return successResponse(transactions)
}

export async function bulkDeleteTransactions(
  userId: string,
  ids: string[]
): Promise<ApiResponse<boolean>> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .in('id', ids)
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to bulk delete transactions:', error)
    return errorResponse('Failed to bulk delete transactions', false)
  }

  return successResponse(true)
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

export async function getTransactionStats(userId: string): Promise<ApiResponse<TransactionStats>> {
  const { data, error } = await supabase
    .from('transactions')
    .select('status')
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to fetch transaction stats:', error)
    return errorResponse('Failed to fetch stats', {
      total: 0,
      pending: 0,
      booked: 0,
      missingDocs: 0,
      ignored: 0,
    })
  }

  const stats: TransactionStats = {
    total: data.length,
    pending: data.filter(t => t.status === TRANSACTION_STATUS_LABELS.TO_RECORD).length,
    booked: data.filter(t => t.status === TRANSACTION_STATUS_LABELS.RECORDED).length,
    missingDocs: data.filter(t => t.status === TRANSACTION_STATUS_LABELS.MISSING_DOCUMENTATION).length,
    ignored: data.filter(t => t.status === TRANSACTION_STATUS_LABELS.IGNORED).length,
  }

  return successResponse(stats)
}
