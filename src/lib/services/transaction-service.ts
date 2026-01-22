import { getSupabaseClient } from '../supabase'
import { Transaction, TransactionStatus, TRANSACTION_STATUSES } from '@/types'
import { mockTransactions, mockTransactionStats } from '@/data/mock-data'

export type TransactionStats = {
    income: number
    expenses: number
    pending: number
    totalCount: number
}

export const transactionService = {
    /**
     * Get paginated transactions with optional text search and status filter
     */
    async getTransactions({
        limit = 50,
        offset = 0,
        search = '',
        statuses = []
    }: {
        limit?: number
        offset?: number
        search?: string
        statuses?: TransactionStatus[]
    } = {}) {
        const supabase = getSupabaseClient()
        let query = supabase
            .from('transactions')
            .select('*', { count: 'exact' })
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (search) {
            query = query.or(`description.ilike.%${search}%,merchant.ilike.%${search}%`)
        }

        if (statuses.length > 0) {
            query = query.in('status', statuses)
        }

        const { data, error, count } = await query

        if (error) throw error

        // Return empty array if no real data exists
        if (!data || data.length === 0) {
            return {
                transactions: [],
                totalCount: 0
            }
        }

        return {
            transactions: (data || []).map(row => {
                // Safe date parsing
                const dateStr = row.occurred_at ? new Date(row.occurred_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]

                return {
                    id: row.id,
                    name: row.description || row.merchant || 'Unknown Transaction',
                    date: dateStr,
                    timestamp: row.occurred_at ? new Date(row.occurred_at) : new Date(),
                    amount: row.amount.toString(), // UI expects string
                    amountValue: row.amount, // UI expects number
                    status: (row.status as TransactionStatus) || 'pending',
                    account: (row.metadata as any)?.debit_account || 'Unknown',
                    category: 'Uncategorized', // category_id needs lookup, defaulting for now
                    type: row.amount > 0 ? 'income' : 'expense',
                    iconName: 'HelpCircle', // Default icon
                    iconColor: 'bg-gray-100 text-gray-600', // Default color
                    vatAmount: 0 // Default
                }
            }) as Transaction[],
            totalCount: count || 0
        }
    },

    /**
     * Get aggregate statistics performed by the database (The "Logic")
     * Returns minimal JSON with pre-calculated sums.
     */
    async getStats(): Promise<TransactionStats> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase.rpc('get_transaction_stats')

        if (error || !data || data.totalCount === 0) {
            return {
                income: 0,
                expenses: 0,
                pending: 0,
                totalCount: 0
            }
        }

        return {
            income: Number(data.income),
            expenses: Number(data.expenses),
            pending: Number(data.pending),
            totalCount: Number(data.totalCount)
        }
    },

    /**
     * Book a transaction (Update status & category)
     */
    async bookTransaction(id: string, updates: {
        category: string
        debitAccount: string
        creditAccount: string
        description?: string
    }) {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('transactions')
            .update({
                status: 'booked',
                category: updates.category,
                // We might store accounts in metadata or separate columns
                metadata: {
                    debit_account: updates.debitAccount,
                    credit_account: updates.creditAccount
                }
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }
}
