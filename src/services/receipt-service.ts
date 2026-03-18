import { createBrowserClient } from '@/lib/database/client'
import { RECEIPT_STATUSES, type ReceiptStatus } from '@/lib/status-types'
import type { Database } from '@/types/database'

type ReceiptRow = Database['public']['Tables']['receipts']['Row']

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
        const supabase = createBrowserClient()

        let query = supabase
            .from('receipts')
            .select('*', { count: 'exact' })
            .order('captured_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (search) {
            query = query.or(`supplier.ilike.%${search}%`)
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
        const receipts: Receipt[] = (data || []).map((row: ReceiptRow) => ({
            id: row.id,
            supplier: row.supplier || 'Okänd',
            date: row.date || row.captured_at || '',
            amount: String(row.amount || row.total_amount || '0'),
            category: row.category || 'Övrigt',
            status: (row.status as ReceiptStatus) || RECEIPT_STATUSES.PENDING,
            attachment: row.image_url || row.file_url || '',
            hasAttachment: !!(row.image_url || row.file_url),
            attachmentUrl: row.image_url || row.file_url || undefined,
            linkedTransaction: undefined,
        }))

        return { receipts, totalCount: count || 0 }
    },

    /**
     * Get aggregate statistics performed by the database
     * Uses parallel queries for optimal performance
     */
    async getStats(): Promise<ReceiptStats> {
        const supabase = createBrowserClient()

        const { data, error } = await supabase.rpc('get_receipt_stats')

        if (error) {
            console.error('get_receipt_stats error:', error)
            return { total: 0, matchedCount: 0, unmatchedCount: 0, totalAmount: 0 }
        }

        // RPC returns Json — cast to record for property access
        const raw = Array.isArray(data) ? data[0] : data
        const stats = (raw ?? {}) as Record<string, unknown>

        if (!raw) {
            return { total: 0, matchedCount: 0, unmatchedCount: 0, totalAmount: 0 }
        }

        return {
            total: Number(stats.total_receipts || 0),
            matchedCount: Number(stats.processed_receipts || 0),
            unmatchedCount: Number(stats.pending_receipts || 0),
            totalAmount: 0
        }
    },

    /**
     * Update receipt status
     */
    async updateReceiptStatus(id: string, status: string) {
        const supabase = createBrowserClient()

        const { error } = await supabase
            .from('receipts')
            .update({ status })
            .eq('id', id)

        if (error) throw error
        return { success: true }
        },

        /**
        * Get receipts that are pending or need review
        */
        async getUnbookedReceipts() {
        const result = await this.getReceipts({ 
            statuses: [RECEIPT_STATUSES.PENDING, RECEIPT_STATUSES.PROCESSING, 'needs_review'] 
        })
        return result.receipts
        }
        }
