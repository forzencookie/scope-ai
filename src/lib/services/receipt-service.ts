// @ts-nocheck - Supabase types are stale, tables exist in schema.sql but need regeneration
import { getSupabaseClient } from '../supabase'
import { RECEIPT_STATUSES, type ReceiptStatus } from '@/lib/status-types'

// Type matching schema.sql and existing Receipt type from @/types
export type Receipt = {
    id: string
    supplier: string
    date: string
    amount: string        // UI expects string for display
    category: string
    status: ReceiptStatus
    attachment: string    // Required by component Receipt type
    hasAttachment?: boolean
    attachmentUrl?: string
    linkedTransaction?: string
}

export type ReceiptStats = {
    total: number           // Total count of all receipts
    matchedCount: number    // Processed/Verified (linked to transactions)
    unmatchedCount: number  // Pending/Processing/NeedsReview
    totalAmount: number     // Sum of all receipt amounts
}

export const receiptService = {
    /**
     * Get receipts with optional search and status filters
     */
    async getReceipts({
        limit = 50,
        offset = 0,
        search = '',
        statuses = [],
        startDate
    }: {
        limit?: number
        offset?: number
        search?: string
        statuses?: string[]
        startDate?: string
    } = {}) {
        const supabase = getSupabaseClient()

        let query = supabase
            .from('receipts')
            .select('*', { count: 'exact' })
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (search) {
            query = query.or(`supplier.ilike.%${search}%,category.ilike.%${search}%`)
        }

        if (statuses.length > 0) {
            query = query.in('status', statuses)
        }

        if (startDate) {
            query = query.gte('date', startDate)
        }

        const { data, error, count } = await query

        if (error) throw error

        // Return empty if no real data exists
        if (!data || data.length === 0) {
            return {
                receipts: [],
                totalCount: 0
            }
        }

        // Map DB columns to UI Receipt type
        const receipts: Receipt[] = (data || []).map(row => ({
            id: row.id,
            supplier: row.supplier,
            date: row.date,
            amount: String(row.amount),  // UI expects string
            category: row.category || 'Övrigt',
            status: row.status || RECEIPT_STATUSES.PENDING,
            attachment: row.image_url || '', // Map image_url to attachment
            hasAttachment: !!row.image_url,
            attachmentUrl: row.image_url,
            linkedTransaction: row.linked_transaction_id
        }))

        return { receipts, totalCount: count || 0 }
    },

    /**
     * Get aggregate statistics performed by the database
     * Uses parallel queries for optimal performance
     */
    async getStats(): Promise<ReceiptStats> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase.rpc('get_receipt_stats')

        if (error || !data || data.total === 0) {
            return {
                total: 0,
                matchedCount: 0,
                unmatchedCount: 0,
                totalAmount: 0
            }
        }

        return {
            total: Number(data.total),
            matchedCount: Number(data.matchedCount),
            unmatchedCount: Number(data.unmatchedCount),
            totalAmount: Number(data.totalAmount)
        }
    },

    /**
     * Update receipt status
     */
    async updateReceiptStatus(id: string, status: string) {
        const supabase = getSupabaseClient()

        const { error } = await supabase
            .from('receipts')
            .update({ status })
            .eq('id', id)

        if (error) throw error
        return { success: true }
    },

    /**
     * Link receipt to a transaction
     */
    async linkToTransaction(receiptId: string, transactionId: string) {
        const supabase = getSupabaseClient()

        const { error } = await supabase
            .from('receipts')
            .update({
                linked_transaction_id: transactionId,
                status: RECEIPT_STATUSES.VERIFIED
            })
            .eq('id', receiptId)

        if (error) throw error
        return { success: true }
    }
}
