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
import { createBrowserClient } from "@/lib/database/client"
import type { Database, Tables } from "@/types/database"
import type { SupabaseClient } from "@supabase/supabase-js"
import { verificationService } from "./verification-service"
import { createSimpleEntry, type SwedishVatRate } from "@/services/accounting"
import type { VerificationEntry } from "@/types"
import { nullToUndefined } from "@/lib/utils"

type DbTransaction = Tables<"transactions">

// ============================================
// Type Mappings & Helpers
// ============================================

/**
 * Internal helper to get the correct Supabase client (passed in or default browser).
 * This makes the service "Universal" (safe for both Client and Server/AI).
 */
function getSupabase(client?: SupabaseClient<Database>) {
  return client || createBrowserClient()
}

function mapDbToTransaction(db: DbTransaction, category?: string): Transaction {
  const isNegative = db.amount_value < 0
  const formattedAmount = `${isNegative ? '-' : '+'}${Math.abs(db.amount_value).toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`

  return {
    id: db.id,
    name: db.name || db.description || 'Unknown Transaction',
    date: new Date(db.date).toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' }),
    timestamp: new Date(db.date),
    amount: formattedAmount,
    amountValue: db.amount_value,
    status: (db.status as TransactionStatus) || TRANSACTION_STATUS_LABELS.UNBOOKED,
    category: category || db.category || 'Uncategorized',
    iconName: getIconForCategory(category || db.category || 'Uncategorized'),
    iconColor: getIconColorForCategory(category || db.category || 'Uncategorized'),
    account: db.account || 'Main Account',
    description: nullToUndefined(db.description),
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

export async function getTransactions(userId: string, client?: SupabaseClient<Database>): Promise<ApiResponse<Transaction[]>> {
  const supabase = getSupabase(client)
  const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false })
  if (error) return errorResponse('Failed to fetch transactions', [])
  return successResponse(data.map(t => mapDbToTransaction(t)))
}

export async function getTransactionsWithAI(userId: string, client?: SupabaseClient<Database>): Promise<ApiResponse<TransactionWithAI[]>> {
  const supabase = getSupabase(client)
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
  sort?: SortConfig<Transaction>,
  client?: SupabaseClient<Database>
): Promise<PaginatedResponse<TransactionWithAI>> {
  const supabase = getSupabase(client)
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

export async function getTransaction(id: string, userId: string, client?: SupabaseClient<Database>): Promise<ApiResponse<TransactionWithAI | null>> {
  const supabase = getSupabase(client)
  const { data, error } = await supabase.from('transactions').select('*').eq('id', id).eq('user_id', userId).single()
  if (error) return errorResponseNull('Transaction not found')
  return successResponse({ ...mapDbToTransaction(data), aiSuggestion: undefined, isAIApproved: false })
}

export async function getTransactionsByStatus(userId: string, status: TransactionStatus, client?: SupabaseClient<Database>): Promise<ApiResponse<TransactionWithAI[]>> {
  const supabase = getSupabase(client)
  const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).eq('status', status).order('date', { ascending: false })
  if (error) return errorResponse('Failed to fetch transactions', [])
  return successResponse(data.map(t => ({ ...mapDbToTransaction(t), aiSuggestion: undefined, isAIApproved: false })))
}

export async function updateTransactionStatus(id: string, userId: string, status: TransactionStatus, client?: SupabaseClient<Database>): Promise<ApiResponse<TransactionWithAI | null>> {
  const supabase = getSupabase(client)
  const { data, error } = await supabase.from('transactions').update({ status }).eq('id', id).eq('user_id', userId).select('*').single()
  if (error) return errorResponseNull('Failed to update status')
  return successResponse({ ...mapDbToTransaction(data), aiSuggestion: undefined, isAIApproved: false })
}

export async function updateTransaction(id: string, userId: string, updates: Partial<Transaction>, client?: SupabaseClient<Database>): Promise<ApiResponse<TransactionWithAI | null>> {
  const supabase = getSupabase(client)
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

export async function deleteTransaction(id: string, userId: string, client?: SupabaseClient<Database>): Promise<ApiResponse<boolean>> {
  const supabase = getSupabase(client)
  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId)
  if (error) return errorResponse('Failed to delete transaction', false)
  return successResponse(true)
}

/**
 * Get the deterministic status of a transaction.
 * Essential for AI "State-Awareness".
 */
export async function getTransactionStatus(id: string, userId: string, client?: SupabaseClient<Database>): Promise<TransactionStatus> {
  const supabase = getSupabase(client)
  const { data } = await supabase
    .from('transactions')
    .select('status')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  
  return (data?.status as TransactionStatus) || TRANSACTION_STATUS_LABELS.UNBOOKED
}

/**
 * Books a transaction by generating journal entries and creating a verification.
 */
export async function bookTransaction(
  id: string,
  userId: string,
  params: {
    category: string
    debitAccount: string
    creditAccount: string
    description?: string
    vatRate?: number
  },
  client?: SupabaseClient<Database>
): Promise<ApiResponse<{ verificationId: string; verificationNumber: string } | null>> {
  const supabase = getSupabase(client)

  try {
    // 1. Fetch the transaction to get details
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !transaction) {
      return errorResponseNull('Transaction not found')
    }

    // 1b. Check period lock
    const txDate = transaction.date || new Date().toISOString().split('T')[0]
    const locked = await verificationService.isPeriodLocked(txDate, client)
    if (locked) {
      return errorResponse('Perioden är låst. Kan inte bokföra i en stängd period.', null)
    }

    const amount = Math.abs(Number(transaction.amount_value))
    const isIncome = Number(transaction.amount_value) > 0

    // 2. Use the bookkeeping engine to generate proper journal entries
    const journalEntry = createSimpleEntry({
      date: transaction.date || new Date().toISOString().split('T')[0],
      description: params.description || transaction.description || '',
      amount,
      debitAccount: params.debitAccount,
      creditAccount: params.creditAccount,
      vatRate: (params.vatRate || 0) as SwedishVatRate,
      isIncome,
      series: 'A',
    })

    // 3. Map engine output to verification entries
    const entries: VerificationEntry[] = journalEntry.rows.map(row => ({
      account: row.account,
      debit: row.debit,
      credit: row.credit,
      description: row.description,
    }))

    // 4. Create verification directly
    const verification = await verificationService.createVerification({
      series: 'A',
      date: journalEntry.date,
      description: journalEntry.description,
      entries,
      sourceType: 'transaction',
      sourceId: id,
    }, client)

    // 5. Update Transaction status + category
    await supabase
      .from('transactions')
      .update({ category: params.category, status: 'Bokförd' })
      .eq('id', id);

    return successResponse({
      verificationId: verification.id,
      verificationNumber: `${verification.series}${verification.number}`,
    })

  } catch (error) {
    console.error(`Failed to book transaction ${id}:`, error)
    return errorResponse(error instanceof Error ? error.message : 'Failed to book transaction', null)
  }
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

export async function bulkUpdateStatus(userId: string, ids: string[], status: TransactionStatus, client?: SupabaseClient<Database>): Promise<ApiResponse<TransactionWithAI[]>> {
  const supabase = getSupabase(client)
  const { data, error } = await supabase.from('transactions').update({ status }).in('id', ids).eq('user_id', userId).select('*')
  if (error) return errorResponse('Failed to bulk update status', [])
  return successResponse(data.map(t => ({ ...mapDbToTransaction(t), aiSuggestion: undefined, isAIApproved: false })))
}

export async function bulkDeleteTransactions(userId: string, ids: string[], client?: SupabaseClient<Database>): Promise<ApiResponse<boolean>> {
  const supabase = getSupabase(client)
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

export async function getTransactionStats(userId: string, client?: SupabaseClient<Database>): Promise<ApiResponse<TransactionStats>> {
  const supabase = getSupabase(client)
  const { data, error } = await supabase.from('transactions').select('status, amount_value').eq('user_id', userId)

  if (error) return errorResponse('Failed to fetch stats', { total: 0, totalCount: 0, income: 0, expenses: 0, pending: 0, booked: 0, missingDocs: 0, ignored: 0 })

  const income = data.filter(t => t.amount_value > 0).reduce((sum, t) => sum + t.amount_value, 0)
  const expenses = data.filter(t => t.amount_value < 0).reduce((sum, t) => sum + Math.abs(t.amount_value), 0)

  const stats: TransactionStats = {
    total: data.length,
    totalCount: data.length,
    income,
    expenses,
    pending: data.filter(t => t.status === TRANSACTION_STATUS_LABELS.UNBOOKED).length,
    booked: data.filter(t => t.status === TRANSACTION_STATUS_LABELS.RECORDED).length,
    missingDocs: 0,
    ignored: data.filter(t => t.status === TRANSACTION_STATUS_LABELS.IGNORED).length,
  }

  return successResponse(stats)
}

export async function getUnbookedTransactions(userId: string, client?: SupabaseClient<Database>): Promise<Transaction[]> {
  const supabase = getSupabase(client)
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', TRANSACTION_STATUS_LABELS.UNBOOKED)
    .order('date', { ascending: false })
  
  if (error) throw error
  return (data || []).map(t => mapDbToTransaction(t))
}
