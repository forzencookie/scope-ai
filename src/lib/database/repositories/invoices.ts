/**
 * Customer Invoices Repository
 * 
 * Handles all customer invoice-related database operations.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { InvoiceInput } from './types'

type DbClient = SupabaseClient<Database>

export function createInvoicesRepository(supabase: DbClient) {
    return {
        /**
         * Get customer invoices with optional filters
         */
        async list(filters: {
            limit?: number
            status?: string
            customer?: string
        } = {}) {
            let query = supabase
                .from('customerinvoices')
                .select('*')
                .order('due_date', { ascending: true })

            if (filters.status) query = query.eq('status', filters.status)
            if (filters.customer) query = query.ilike('customer_name', `%${filters.customer}%`)
            if (filters.limit) query = query.limit(filters.limit)

            const { data, error } = await query
            if (error) console.error('Supabase Error (getCustomerInvoices):', error)

            // Map snake_case to CamelCase for frontend compatibility
            return (data || []).map((i: { 
                id: string
                customer_name?: string
                invoice_number?: string
                total_amount?: number
                due_date?: string 
            }) => ({
                ...i,
                customerName: i.customer_name,
                invoiceNumber: i.invoice_number,
                totalAmount: i.total_amount,
                dueDate: i.due_date
            }))
        },

        /**
         * Get a single invoice by ID
         */
        async getById(id: string) {
            const { data, error } = await supabase
                .from('customerinvoices')
                .select('*')
                .eq('id', id)
                .single()

            if (error) return null
            return data
        },

        /**
         * Create a new customer invoice
         */
        async create(invoice: InvoiceInput) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await supabase
                .from('customerinvoices')
                .insert({
                    id: invoice.id,
                    invoice_number: invoice.invoiceNumber,
                    customer_name: invoice.customerName,
                    subtotal: invoice.amount || 0,
                    vat_amount: invoice.vatAmount || 0,
                    total_amount: invoice.totalAmount || 0,
                    invoice_date: invoice.issueDate || invoice.date,
                    due_date: invoice.dueDate,
                    status: invoice.status || 'draft',
                    user_id: invoice.createdBy || invoice.created_by,
                    company_id: invoice.companyId || '00000000-0000-0000-0000-000000000000',
                } as any)
                .select()
                .single()

            if (error) console.error('Supabase Error (addInvoice):', error)
            return data || invoice
        },

        /**
         * Update invoice status
         */
        async updateStatus(id: string, status: string) {
            const { error } = await supabase
                .from('customerinvoices')
                .update({ status })
                .eq('id', id)

            if (error) {
                console.error('Error updating invoice:', error)
                throw error
            }
            return { id, status }
        },
    }
}

export type InvoicesRepository = ReturnType<typeof createInvoicesRepository>
