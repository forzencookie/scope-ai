// @ts-nocheck - Supabase types are stale, tables exist in schema.sql but need regeneration
import { getSupabaseClient } from '../supabase'
import { INVOICE_STATUS_LABELS } from '@/lib/localization'
import { mockInvoices, mockInvoiceStats } from '@/data/mock-data'

// Types matching schema.sql
export type CustomerInvoice = {
    id: string
    invoiceNumber: string
    customer: string
    email?: string
    amount: number
    vatAmount?: number
    totalAmount: number
    issueDate: string
    dueDate: string
    status: string
}

export type SupplierInvoice = {
    id: string
    invoiceNumber: string
    supplierName: string
    amount: number
    vatAmount?: number
    totalAmount: number
    invoiceDate: string
    dueDate: string
    status: 'mottagen' | 'attesterad' | 'betald' | 'förfallen'
    currency?: string
}

export type InvoiceStats = {
    incomingTotal: number      // Unpaid customer invoices (money we'll receive)
    outgoingTotal: number      // Unpaid supplier invoices (money we owe)
    overdueCount: number       // Number of overdue invoices
    overdueAmount: number      // Sum of overdue amounts
    paidAmount: number         // Sum of paid invoices
}

export const invoiceService = {
    /**
     * Get customer invoices (kundfakturor) with optional filters
     */
    async getCustomerInvoices({
        limit = 50,
        offset = 0,
        status,
        startDate
    }: {
        limit?: number
        offset?: number
        status?: string
        startDate?: string
    } = {}) {
        const supabase = getSupabaseClient()

        let query = supabase
            .from('customer_invoices')
            .select('*', { count: 'exact' })
            .order('due_date', { ascending: true })
            .range(offset, offset + limit - 1)

        if (status) {
            query = query.eq('status', status)
        }

        if (startDate) {
            query = query.gte('issue_date', startDate)
        }

        const { data, error, count } = await query

        if (error) throw error

        // Return empty if no real data exists
        if (!data || data.length === 0) {
            return { invoices: [], totalCount: 0 }
        }

        // Map snake_case DB columns to camelCase for UI
        const invoices: CustomerInvoice[] = (data || []).map(row => ({
            id: row.id,
            invoiceNumber: row.invoice_number || row.id,
            customer: row.customer_name,
            email: row.customer_email,
            amount: Number(row.amount),
            vatAmount: row.vat_amount ? Number(row.vat_amount) : undefined,
            totalAmount: Number(row.total_amount),
            issueDate: row.issue_date,
            dueDate: row.due_date,
            status: row.status
        }))

        return { invoices, totalCount: count || 0 }
    },

    /**
     * Get supplier invoices (leverantörsfakturor) with optional filters
     */
    async getSupplierInvoices({
        limit = 50,
        offset = 0,
        status,
        startDate
    }: {
        limit?: number
        offset?: number
        status?: string
        startDate?: string
    } = {}) {
        const supabase = getSupabaseClient()

        let query = supabase
            .from('supplier_invoices')
            .select('*', { count: 'exact' })
            .order('due_date', { ascending: true })
            .range(offset, offset + limit - 1)

        if (status) {
            query = query.eq('status', status)
        }

        if (startDate) {
            query = query.gte('invoice_date', startDate)
        }

        const { data, error, count } = await query

        if (error) throw error

        // Return empty if no real data exists
        if (!data || data.length === 0) {
            return { invoices: [], totalCount: 0 }
        }

        // Map snake_case DB columns to camelCase for UI
        const invoices: SupplierInvoice[] = (data || []).map(row => ({
            id: row.id,
            invoiceNumber: row.invoice_number || row.id,
            supplierName: row.supplier_name,
            amount: Number(row.amount),
            vatAmount: row.vat_amount ? Number(row.vat_amount) : undefined,
            totalAmount: Number(row.total_amount),
            invoiceDate: row.issue_date,
            dueDate: row.due_date,
            status: row.status,
            currency: 'SEK'
        }))

        return { invoices, totalCount: count || 0 }
    },

    /**
     * Get aggregate statistics performed by the database
     * Uses parallel queries for optimal performance
     */
    async getStats(): Promise<InvoiceStats> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase.rpc('get_invoice_stats')

        if (error || !data || (data.incomingTotal === 0 && data.outgoingTotal === 0)) {
            return {
                incomingTotal: 0,
                outgoingTotal: 0,
                overdueCount: 0,
                overdueAmount: 0,
                paidAmount: 0
            }
        }

        return {
            incomingTotal: Number(data.incomingTotal),
            outgoingTotal: Number(data.outgoingTotal),
            overdueCount: Number(data.overdueCount),
            overdueAmount: Number(data.overdueAmount),
            paidAmount: Number(data.paidAmount)
        }
    },

    /**
     * Update customer invoice status
     */
    async updateCustomerInvoiceStatus(id: string, status: string) {
        const supabase = getSupabaseClient()

        const { error } = await supabase
            .from('customer_invoices')
            .update({ status })
            .eq('id', id)

        if (error) throw error
        return { success: true }
    },

    /**
     * Update supplier invoice status
     */
    async updateSupplierInvoiceStatus(id: string, status: string) {
        const supabase = getSupabaseClient()

        const { error } = await supabase
            .from('supplier_invoices')
            .update({ status })
            .eq('id', id)

        if (error) throw error
        return { success: true }
    }
}
