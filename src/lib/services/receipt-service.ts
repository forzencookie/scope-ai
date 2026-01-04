// @ts-nocheck - Supabase types are stale, tables exist in schema.sql but need regeneration
import { getSupabaseClient } from '../supabase'
import { RECEIPT_STATUSES } from '@/lib/status-types'

// Type matching schema.sql and existing Receipt type from @/types
export type Receipt = {
    id: string
    supplier: string
    date: string
    amount: string        // UI expects string for display
    category: string
    status: string
    attachment: string    // Required by component Receipt type
    hasAttachment: boolean
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
        statuses = []
    }: {
        limit?: number
        offset?: number
        search?: string
        statuses?: string[]
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

        const { data, error, count } = await query

        if (error) throw error

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

        // Matched statuses (fully processed)
        const matchedStatuses = [RECEIPT_STATUSES.VERIFIED, RECEIPT_STATUSES.PROCESSED]

        // Unmatched statuses (need attention)
        const unmatchedStatuses = [
            RECEIPT_STATUSES.PENDING,
            RECEIPT_STATUSES.PROCESSING,
            RECEIPT_STATUSES.REVIEW_NEEDED
        ]

        // Parallel queries for all stats
        const [
            totalResult,
            matchedResult,
            unmatchedResult,
            amountResult
        ] = await Promise.all([
            // Total count
            supabase.from('receipts')
                .select('id', { count: 'exact', head: true }),

            // Matched (processed/verified) count
            supabase.from('receipts')
                .select('id', { count: 'exact', head: true })
                .in('status', matchedStatuses),

            // Unmatched (pending/processing) count
            supabase.from('receipts')
                .select('id', { count: 'exact', head: true })
                .in('status', unmatchedStatuses),

            // Sum of all amounts
            supabase.from('receipts')
                .select('amount.sum()')
        ])

        return {
            total: totalResult.count || 0,
            matchedCount: matchedResult.count || 0,
            unmatchedCount: unmatchedResult.count || 0,
            totalAmount: Number(amountResult.data?.[0]?.sum || 0)
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
