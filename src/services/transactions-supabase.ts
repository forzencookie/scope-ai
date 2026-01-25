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
} from "@/types"
import type { TransactionStatus } from "@/lib/status-types"
import { TRANSACTION_STATUS_LABELS } from "@/lib/localization"
import { supabase } from "@/lib/database/supabase"
import type { Tables } from "@/types/database"

// ============================================
// Type Mappings
// ============================================

type DbTransaction = Tables<"transactions">

/**
 * Map database transaction to application Transaction type
 */
function mapDbToTransaction(db: DbTransaction, category?: string): Transaction {
  const isNegative = db.amount_value < 0
  const formattedAmount = `${isNegative ? '-' : '+'}$${Math.abs(db.amount_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return {
    id: db.id,
    name: db.name || db.description || 'Unknown Transaction',
    date: new Date(db.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    timestamp: new Date(db.date),
    amount: formattedAmount,
    amountValue: db.amount_value, // Use calculated numeric value
    status: (db.status as TransactionStatus) || TRANSACTION_STATUS_LABELS.TO_RECORD,
    category: category || db.category || 'Uncategorized',
    iconName: getIconForCategory(category || db.category || 'Uncategorized'),
    iconColor: getIconColorForCategory(category || db.category || 'Uncategorized'),
    account: db.account || 'Main Account',
    description: db.description || undefined,
  }
}

/**
 * Map application Transaction to database insert format
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mapTransactionToDb(transaction: Partial<Transaction>, userId: string): Partial<DbTransaction> {
  return {
    user_id: userId,
    name: transaction.name,
    amount: transaction.amount, // Note: DB likely stores text amount, amount_value stores number
    amount_value: transaction.amountValue,
    date: transaction.timestamp?.toISOString() || new Date().toISOString(),
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
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Failed to fetch transactions:', error)
    return errorResponse('Failed to fetch transactions', [])
  }

  const transactions = data.map(t =>
    mapDbToTransaction(t)
  )

  return successResponse(transactions)
}

export async function getTransactionsWithAI(userId: string): Promise<ApiResponse<TransactionWithAI[]>> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Failed to fetch transactions:', error)
    return errorResponse('Failed to fetch transactions', [])
  }

  // For now, AI suggestions would come from a separate AI service
  // This could be enhanced to fetch from an ai_suggestions table
  const transactions: TransactionWithAI[] = data.map(t => ({
    ...mapDbToTransaction(t),
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
    .select('*', { count: 'exact' })
    .eq('user_id', userId)

  // Apply filters
  if (filters) {
    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }
    if (filters.searchQuery) {
      query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`)
    }
    if (filters.dateRange) {
      query = query
        .gte('date', filters.dateRange.start.toISOString())
        .lte('date', filters.dateRange.end.toISOString())
    }
    if (filters.amountRange) {
      query = query
        .gte('amount_value', filters.amountRange.min)
        .lte('amount_value', filters.amountRange.max)
    }
  }

  // Apply sorting
  if (sort) {
    const dbField = sort.field === 'timestamp' ? 'date' :
      sort.field === 'amountValue' ? 'amount_value' :
        sort.field === 'name' ? 'name' : sort.field
    query = query.order(dbField as string, { ascending: sort.direction === 'asc' })
  } else {
    query = query.order('date', { ascending: false })
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
    ...mapDbToTransaction(t),
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
    .select('*')
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
    ...mapDbToTransaction(data),
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
    .select('*')
    .eq('user_id', userId)
    .eq('status', status)
    .order('date', { ascending: false })

  if (error) {
    console.error('Failed to fetch transactions by status:', error)
    return errorResponse('Failed to fetch transactions', [])
  }

  const transactions: TransactionWithAI[] = data.map(t => ({
    ...mapDbToTransaction(t),
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
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponseNull('Transaction not found')
    }
    console.error('Failed to update transaction status:', error)
    return errorResponseNull('Failed to update transaction status')
  }

  const transaction: TransactionWithAI = {
    ...mapDbToTransaction(data),
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

  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.amountValue !== undefined) dbUpdates.amount_value = updates.amountValue
  if (updates.timestamp !== undefined) dbUpdates.date = updates.timestamp.toISOString()
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.description !== undefined) dbUpdates.description = updates.description

  const { data, error } = await supabase
    .from('transactions')
    .update(dbUpdates)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponseNull('Transaction not found')
    }
    console.error('Failed to update transaction:', error)
    return errorResponseNull('Failed to update transaction')
  }

  const transaction: TransactionWithAI = {
    ...mapDbToTransaction(data),
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
      name: transaction.name,
      amount: transaction.amount,
      amount_value: transaction.amountValue,
      date: transaction.timestamp.toISOString(),
      status: transaction.status,
      description: transaction.description,
      currency: 'USD',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any) // Cast to any to bypass strict Insert type check for optional ID
    .select('*')
    .single()

  if (error) {
    console.error('Failed to create transaction:', error)
    return errorResponseNull('Failed to create transaction')
  }

  const newTransaction: TransactionWithAI = {
    ...mapDbToTransaction(data),
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
    .select('*')

  if (error) {
    console.error('Failed to bulk update status:', error)
    return errorResponse('Failed to bulk update status', [])
  }

  const transactions: TransactionWithAI[] = data.map(t => ({
    ...mapDbToTransaction(t),
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
