// ============================================
// Consolidated Transactions Service (Pattern A - Direct Supabase)
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
import { getSupabaseClient } from "@/lib/database/supabase"
import type { Tables } from "@/types/database"

type DbTransaction = Tables<"transactions">

// ============================================
// Type Mappings & Helpers
// ============================================

function mapDbToTransaction(db: DbTransaction, category?: string): Transaction {
  const isNegative = db.amount_value < 0
  const formattedAmount = `${isNegative ? '-' : '+'}$${Math.abs(db.amount_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return {
    id: db.id,
    name: db.name || db.description || 'Unknown Transaction',
    date: new Date(db.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    timestamp: new Date(db.date),
    amount: formattedAmount,
    amountValue: db.amount_value,
    status: (db.status as TransactionStatus) || TRANSACTION_STATUS_LABELS.TO_RECORD,
    category: category || db.category || 'Uncategorized',
    iconName: getIconForCategory(category || db.category || 'Uncategorized'),
    iconColor: getIconColorForCategory(category || db.category || 'Uncategorized'),
    account: db.account || 'Main Account',
    description: db.description || undefined,
  }
}

function getIconForCategory(category: string): string {
  const iconMap: Record<string, string> = {
    'Software': 'Smartphone', 'Supplies': 'Tag', 'Travel': 'Plane', 'Income': 'Briefcase',
    'Meals': 'Coffee', 'Rent': 'Building2', 'Utilities': 'Zap', 'Marketing': 'Megaphone',
    'Equipment': 'Monitor', 'Programvara': 'Smartphone', 'IT & Programvara': 'Smartphone',
    'Material': 'Tag', 'Kontorsmaterial': 'Tag', 'Resor': 'Plane', 'Intäkter': 'Briefcase',
    'Representation': 'Coffee', 'Lokalhyra': 'Building2', 'Hyra': 'Building2', 'El & Värme': 'Zap',
    'Marknadsföring': 'Megaphone', 'Utrustning': 'Monitor', 'Telefoni': 'Smartphone',
    'Försäkring': 'Shield', 'Bank & Finans': 'Landmark', 'Löner': 'User', 'Skatter & Avgifter': 'Receipt',
    'Övrigt': 'Tag',
  }
  return iconMap[category] || 'Tag'
}

function getIconColorForCategory(category: string): string {
  const colorMap: Record<string, string> = {
    'Software': 'text-blue-500', 'Supplies': 'text-orange-500', 'Travel': 'text-purple-500',
    'Income': 'text-green-500', 'Meals': 'text-amber-600', 'Rent': 'text-indigo-500',
    'Utilities': 'text-yellow-500', 'Marketing': 'text-pink-500', 'Equipment': 'text-gray-500',
    'Programvara': 'text-blue-500', 'IT & Programvara': 'text-blue-500', 'Material': 'text-orange-500',
    'Kontorsmaterial': 'text-orange-500', 'Resor': 'text-purple-500', 'Intäkter': 'text-green-500',
    'Representation': 'text-amber-600', 'Lokalhyra': 'text-indigo-500', 'Hyra': 'text-indigo-500',
    'El & Värme': 'text-yellow-500', 'Marknadsföring': 'text-pink-500', 'Utrustning': 'text-gray-500',
    'Telefoni': 'text-cyan-500', 'Försäkring': 'text-emerald-500', 'Bank & Finans': 'text-slate-500',
    'Löner': 'text-violet-500', 'Skatter & Avgifter': 'text-red-500', 'Övrigt': 'text-gray-400',
  }
  return colorMap[category] || 'text-gray-500'
}

function successResponse<T>(data: T): ApiResponse<T> {
  return { data, success: true, timestamp: new Date() }
}

function errorResponseNull(error: string): ApiResponse<null> {
  return { data: null, success: false, error, timestamp: new Date() }
}

function errorResponse<T>(error: string, data: T): ApiResponse<T> {
  return { data, success: false, error, timestamp: new Date() }
}

// ============================================
// Service Methods
// ============================================

export async function getTransactions(userId: string): Promise<ApiResponse<Transaction[]>> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false })
  if (error) return errorResponse('Failed to fetch transactions', [])
  return successResponse(data.map(t => mapDbToTransaction(t)))
}

export async function getTransactionsWithAI(userId: string): Promise<ApiResponse<TransactionWithAI[]>> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false })
  if (error) return errorResponse('Failed to fetch transactions', [])

  const transactions: TransactionWithAI[] = data.map(t => ({
    ...mapDbToTransaction(t),
    aiSuggestion: undefined,
    isAIApproved: t.status === TRANSACTION_STATUS_LABELS.RECORDED,
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
  const supabase = getSupabaseClient()
  let query = supabase.from('transactions').select('*', { count: 'exact' }).eq('user_id', userId)

  if (filters) {
    if (filters.status?.length) query = query.in('status', filters.status)
    if (filters.searchQuery) query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`)
    if (filters.dateRange) {
      query = query.gte('date', filters.dateRange.start.toISOString()).lte('date', filters.dateRange.end.toISOString())
    }
    if (filters.amountRange) {
      query = query.gte('amount_value', filters.amountRange.min).lte('amount_value', filters.amountRange.max)
    }
  }

  if (sort) {
    const dbField = sort.field === 'timestamp' ? 'date' : sort.field === 'amountValue' ? 'amount_value' : sort.field === 'name' ? 'name' : sort.field
    query = query.order(dbField as string, { ascending: sort.direction === 'asc' })
  } else {
    query = query.order('date', { ascending: false })
  }

  const start = (page - 1) * pageSize
  query = query.range(start, start + pageSize - 1)

  const { data, error, count } = await query
  if (error) return { data: [], total: 0, page, pageSize, hasMore: false }

  const transactions: TransactionWithAI[] = data.map(t => ({
    ...mapDbToTransaction(t),
    aiSuggestion: undefined,
    isAIApproved: false,
  }))

  const total = count ?? 0
  return { data: transactions, total, page, pageSize, hasMore: start + pageSize < total }
}

export async function getTransaction(id: string, userId: string): Promise<ApiResponse<TransactionWithAI | null>> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('transactions').select('*').eq('id', id).eq('user_id', userId).single()
  if (error) return errorResponseNull('Transaction not found')
  return successResponse({ ...mapDbToTransaction(data), aiSuggestion: undefined, isAIApproved: false })
}

export async function getTransactionsByStatus(userId: string, status: TransactionStatus): Promise<ApiResponse<TransactionWithAI[]>> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).eq('status', status).order('date', { ascending: false })
  if (error) return errorResponse('Failed to fetch transactions', [])
  return successResponse(data.map(t => ({ ...mapDbToTransaction(t), aiSuggestion: undefined, isAIApproved: false })))
}

export async function updateTransactionStatus(id: string, userId: string, status: TransactionStatus): Promise<ApiResponse<TransactionWithAI | null>> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('transactions').update({ status }).eq('id', id).eq('user_id', userId).select('*').single()
  if (error) return errorResponseNull('Failed to update status')
  return successResponse({ ...mapDbToTransaction(data), aiSuggestion: undefined, isAIApproved: false })
}

export async function updateTransaction(id: string, userId: string, updates: Partial<Transaction>): Promise<ApiResponse<TransactionWithAI | null>> {
  const supabase = getSupabaseClient()
  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.amountValue !== undefined) dbUpdates.amount_value = updates.amountValue
  if (updates.timestamp !== undefined) dbUpdates.date = updates.timestamp.toISOString()
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.description !== undefined) dbUpdates.description = updates.description

  const { data, error } = await supabase.from('transactions').update(dbUpdates).eq('id', id).eq('user_id', userId).select('*').single()
  if (error) return errorResponseNull('Failed to update transaction')
  return successResponse({ ...mapDbToTransaction(data), aiSuggestion: undefined, isAIApproved: false })
}

export async function deleteTransaction(id: string, userId: string): Promise<ApiResponse<boolean>> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId)
  if (error) return errorResponse('Failed to delete transaction', false)
  return successResponse(true)
}

// ============================================
// AI Methods
// ============================================

export async function approveAISuggestion(transactionId: string, userId: string): Promise<ApiResponse<TransactionWithAI | null>> {
  const txRes = await getTransaction(transactionId, userId)
  if (!txRes.success || !txRes.data) return errorResponseNull('Transaction not found')
  // In a real app we'd use the AI suggestion's category. Defaulting for now.
  const newRef = await updateTransactionStatus(transactionId, userId, TRANSACTION_STATUS_LABELS.RECORDED)
  return newRef
}

export async function rejectAISuggestion(transactionId: string, userId: string): Promise<ApiResponse<TransactionWithAI | null>> {
  const txRes = await getTransaction(transactionId, userId)
  if (!txRes.success || !txRes.data) return errorResponseNull('Transaction not found')
  return txRes
}

export async function bulkApproveAISuggestions(userId: string, ids: string[]): Promise<ApiResponse<TransactionWithAI[]>> {
  const promises = ids.map(id => approveAISuggestion(id, userId))
  const responses = await Promise.all(promises)
  const results = responses.filter(r => r.success && r.data).map(r => r.data!)
  return successResponse(results)
}

export async function bulkUpdateStatus(userId: string, ids: string[], status: TransactionStatus): Promise<ApiResponse<TransactionWithAI[]>> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('transactions').update({ status }).in('id', ids).eq('user_id', userId).select('*')
  if (error) return errorResponse('Failed to bulk update status', [])
  return successResponse(data.map(t => ({ ...mapDbToTransaction(t), aiSuggestion: undefined, isAIApproved: false })))
}

export async function bulkDeleteTransactions(userId: string, ids: string[]): Promise<ApiResponse<boolean>> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('transactions').delete().in('id', ids).eq('user_id', userId)
  if (error) return errorResponse('Failed to bulk delete transactions', false)
  return successResponse(true)
}

// ============================================
// Stats Service
// ============================================

export interface TransactionStats {
  total: number
  totalCount: number
  income: number
  expenses: number
  pending: number
  booked: number
  missingDocs: number
  ignored: number
}

export async function getTransactionStats(userId: string): Promise<ApiResponse<TransactionStats>> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('transactions').select('status, amount_value').eq('user_id', userId)

  if (error) return errorResponse('Failed to fetch stats', { total: 0, totalCount: 0, income: 0, expenses: 0, pending: 0, booked: 0, missingDocs: 0, ignored: 0 })

  const income = data.filter(t => t.amount_value > 0).reduce((sum, t) => sum + t.amount_value, 0)
  const expenses = data.filter(t => t.amount_value < 0).reduce((sum, t) => sum + Math.abs(t.amount_value), 0)

  const stats: TransactionStats = {
    total: data.length,
    totalCount: data.length,
    income,
    expenses,
    pending: data.filter(t => t.status === TRANSACTION_STATUS_LABELS.TO_RECORD).length,
    booked: data.filter(t => t.status === TRANSACTION_STATUS_LABELS.RECORDED).length,
    missingDocs: data.filter(t => t.status === TRANSACTION_STATUS_LABELS.MISSING_DOCUMENTATION).length,
    ignored: data.filter(t => t.status === TRANSACTION_STATUS_LABELS.IGNORED).length,
  }

  return successResponse(stats)
}
