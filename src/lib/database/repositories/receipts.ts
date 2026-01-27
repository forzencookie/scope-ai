/**
 * Receipts Repository
 * 
 * Handles all receipt-related database operations.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ReceiptInput } from './types'

type DbClient = SupabaseClient<Database>

export function createReceiptsRepository(supabase: DbClient) {
    return {
        /**
         * Get receipts with optional limit
         */
        async list(options?: { limit?: number }) {
            const query = supabase
                .from('receipts')
                .select('*')
                .order('captured_at', { ascending: false })

            if (options?.limit) {
                query.limit(options.limit)
            }

            const { data, error } = await query
            if (error) {
                console.error('[ReceiptsRepository] list error:', error)
                return []
            }
            return data?.map(r => ({ ...r, attachmentUrl: r.image_url })) || []
        },

        /**
         * Get a single receipt by ID
         */
        async getById(id: string) {
            const { data, error } = await supabase
                .from('receipts')
                .select('*')
                .eq('id', id)
                .single()

            if (error) return null
            return data ? { ...data, attachmentUrl: data.image_url } : null
        },

        /**
         * Create a new receipt
         */
        async create(receipt: ReceiptInput) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await supabase
                .from('receipts')
                .insert({
                    id: receipt.id,
                    date: receipt.date,
                    supplier: receipt.supplier,
                    amount: receipt.amount,
                    category: receipt.category,
                    status: receipt.status,
                    source: receipt.source || 'manual',
                    created_by: receipt.createdBy || receipt.created_by,
                    image_url: receipt.attachmentUrl
                } as any)
                .select()
                .single()

            if (error) {
                console.error('Supabase Error (addReceipt):', error)
                throw error
            }
            return data ? { ...data, attachmentUrl: data.image_url } : receipt
        },

        /**
         * Update a receipt
         */
        async update(id: string, updates: Partial<ReceiptInput>) {
            const { data, error } = await supabase
                .from('receipts')
                .update({
                    ...updates,
                    image_url: updates.attachmentUrl
                })
                .eq('id', id)
                .select()
                .single()

            if (error) {
                console.error('[ReceiptsRepository] update error:', error)
                return null
            }
            return data
        },
    }
}

export type ReceiptsRepository = ReturnType<typeof createReceiptsRepository>
