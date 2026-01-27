/**
 * Supplier Invoices Repository
 * 
 * Handles all supplier invoice-related database operations.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { SupplierInvoiceInput } from './types'

type DbClient = SupabaseClient<Database>

export function createSupplierInvoicesRepository(supabase: DbClient) {
    return {
        /**
         * Get supplier invoices with optional filters
         */
        async list(filters: {
            limit?: number
            status?: string
            supplier?: string
        } = {}) {
            let query = supabase
                .from('supplierinvoices')
                .select('*')
                .order('due_date', { ascending: true })

            if (filters.status) query = query.eq('status', filters.status)
            if (filters.supplier) query = query.ilike('supplier_name', `%${filters.supplier}%`)
            if (filters.limit) query = query.limit(filters.limit)

            const { data, error } = await query
            if (error) console.error('Supabase Error (getSupplierInvoices):', error)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return ((data || []) as any[]).map((i: {
                id: string
                supplier_name?: string
                invoice_number?: string
                total_amount?: number
                due_date?: string
                issue_date?: string
            }) => ({
                ...i,
                supplierName: i.supplier_name,
                invoiceNumber: i.invoice_number,
                totalAmount: i.total_amount,
                dueDate: i.due_date,
                invoiceDate: i.issue_date
            }))
        },

        /**
         * Get a single supplier invoice by ID
         */
        async getById(id: string) {
            const { data, error } = await supabase
                .from('supplierinvoices')
                .select('*')
                .eq('id', id)
                .single()

            if (error) return null
            return data
        },

        /**
         * Create a new supplier invoice
         */
        async create(invoice: SupplierInvoiceInput) {
            const { data, error } = await supabase
                .from('supplierinvoices')
                .insert({
                    id: invoice.id,
                    invoice_number: invoice.invoiceNumber,
                    supplier_name: invoice.supplierName,
                    amount: invoice.amount,
                    vat_amount: invoice.vatAmount,
                    total_amount: invoice.totalAmount,
                    due_date: invoice.dueDate,
                    issue_date: invoice.invoiceDate,
                    status: invoice.status,
                    ocr: invoice.ocr || invoice.ocrNumber
                })
                .select()
                .single()

            if (error) {
                console.error('Error adding supplier invoice:', error)
                throw error
            }

            return data || invoice
        },

        /**
         * Update supplier invoice status
         */
        async updateStatus(id: string, status: string) {
            const { error } = await supabase
                .from('supplierinvoices')
                .update({ status })
                .eq('id', id)

            if (error) {
                console.error('Error updating supplier invoice:', error)
                throw error
            }
            return { id, status }
        },

        /**
         * Update a supplier invoice
         */
        async update(id: string, updates: Partial<SupplierInvoiceInput>) {
            const { data, error } = await supabase
                .from('supplierinvoices')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) {
                console.error('[SupplierInvoicesRepository] update error:', error)
                return null
            }
            return data
        },
    }
}

export type SupplierInvoicesRepository = ReturnType<typeof createSupplierInvoicesRepository>
