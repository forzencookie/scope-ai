// @ts-nocheck
import { getSupabaseClient } from '../supabase'
import { Transaction, TransactionStatus } from '@/types'

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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        if (error) {
            console.error('get_transaction_stats error:', error)
            return { income: 0, expenses: 0, pending: 0, totalCount: 0 }
        }

        // RPC returns an array because it's defined as RETURNS TABLE
        const stats = Array.isArray(data) ? data[0] : data

        if (!stats) {
            return { income: 0, expenses: 0, pending: 0, totalCount: 0 }
        }

        return {
            income: Number(stats.total_income || 0),
            expenses: Number(stats.total_expenses || 0),
            pending: Number(stats.pending_count || 0),
            totalCount: Number(stats.total_transactions || 0)
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
