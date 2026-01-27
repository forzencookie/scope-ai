/**
 * Transactions Repository
 * 
 * Handles all transaction-related database operations.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { TransactionInput, TransactionMetadata, Json } from './types'

type DbClient = SupabaseClient<Database>

export function createTransactionsRepository(supabase: DbClient) {
    return {
        /**
         * Get transactions with optional filters
         */
        async list(filters: {
            limit?: number
            startDate?: string
            endDate?: string
            minAmount?: number
            maxAmount?: number
            status?: string
        } = {}) {
            let query = supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false })

            if (filters.startDate) query = query.gte('date', filters.startDate)
            if (filters.endDate) query = query.lte('date', filters.endDate)
            if (filters.minAmount !== undefined) query = query.gte('amount', filters.minAmount)
            if (filters.status) query = query.eq('status', filters.status)
            if (filters.limit) query = query.limit(filters.limit)

            const { data, error } = await query
            if (error) console.error('Supabase Error (getTransactions):', error)
            return data || []
        },

        /**
         * Get a single transaction by ID
         */
        async getById(id: string) {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', id)
                .single()

            if (error) return null
            return data
        },

        /**
         * Create a new transaction
         */
        async create(tx: TransactionInput) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await supabase
                .from('transactions')
                .insert({
                    id: tx.id,
                    date: tx.date,
                    description: tx.description,
                    name: tx.description || 'Transaction',
                    amount: String(tx.amount || 0),
                    amount_value: Number(tx.amount || 0),
                    status: tx.status,
                    category: tx.category,
                    source: tx.source || 'manual',
                    created_by: tx.createdBy || tx.created_by,
                    metadata: tx as unknown as Json
                } as any)
                .select()
                .single()

            if (error) console.error('Supabase Error:', error)
            return data || tx
        },

        /**
         * Update transaction metadata
         */
        async updateMetadata(id: string, metadata: TransactionMetadata) {
            // First get existing meta
            const { data: existing } = await supabase
                .from('transactions')
                .select('metadata')
                .eq('id', id)
                .single()

            const existingMeta = (existing?.metadata as Record<string, unknown>) || {}
            const newMeta = { ...existingMeta, ...metadata }

            await supabase
                .from('transactions')
                .update({
                    metadata: newMeta as unknown as Json,
                    status: metadata.status || undefined,
                    category: metadata.category || undefined
                })
                .eq('id', id)

            return newMeta
        },

        /**
         * Update a transaction
         */
        async update(id: string, updates: Record<string, unknown>) {
            await supabase.from('transactions').update(updates).eq('id', id)
            return { id, ...updates }
        },

        /**
         * Delete a transaction
         */
        async delete(id: string) {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)

            return !error
        },
    }
}

export type TransactionsRepository = ReturnType<typeof createTransactionsRepository>
