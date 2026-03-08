import { getSupabaseClient } from '@/lib/database/supabase'
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
            .order('captured_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (search) {
            query = query.or(`supplier.ilike.%${search}%,vendor.ilike.%${search}%`)
        }

        if (statuses.length > 0) {
            query = query.in('status', statuses)
        }

        if (startDate) {
            query = query.gte('captured_at', startDate)
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const receipts: Receipt[] = (data || []).map((row: any) => ({
            id: row.id,
            supplier: row.supplier || row.vendor || 'Okänd',
            date: row.date || row.captured_at,
            amount: String(row.amount || row.total_amount || '0'),
            category: row.category || 'Övrigt',
            status: (row.status as ReceiptStatus) || RECEIPT_STATUSES.PENDING,
            attachment: row.image_url || row.file_url || '',
            hasAttachment: !!(row.image_url || row.file_url),
            attachmentUrl: row.image_url || row.file_url,
            linkedTransaction: row.transaction_count ? 'linked' : undefined,
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

        if (error) {
            console.error('get_receipt_stats error:', error)
            return { total: 0, matchedCount: 0, unmatchedCount: 0, totalAmount: 0 }
        }

        // RPC returns array because of RETURNS TABLE
        const stats = Array.isArray(data) ? data[0] : data

        if (!stats) {
            return { total: 0, matchedCount: 0, unmatchedCount: 0, totalAmount: 0 }
        }

        // Note: The RPC function doesn't currently return totalAmount
        // So we default it to 0 for now to avoid NaN
        return {
            total: Number(stats.total_receipts || 0),
            matchedCount: Number(stats.processed_receipts || 0),
            unmatchedCount: Number(stats.pending_receipts || 0),
            totalAmount: 0 // Will need to update RPC if we want this value
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

}
