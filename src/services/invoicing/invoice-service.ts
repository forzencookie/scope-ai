import { createBrowserClient } from '@/lib/database/client'
import { nullToUndefined } from '@/lib/utils'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type CustomerInvoiceRow = Database['public']['Tables']['customer_invoices']['Row']
type SupplierInvoiceRow = Database['public']['Tables']['supplier_invoices']['Row']

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

export type CreateInvoiceParams = {
    customer: string
    email?: string
    address?: string
    orgNumber?: string
    issueDate?: string
    dueDate?: string
    subtotal?: number
    vatAmount?: number
    amount?: number
    items?: Array<{ quantity?: number; unitPrice?: number; vatRate?: number }>
    bankgiro?: string
    plusgiro?: string
    notes?: string
    reference?: string
    status?: string
    currency?: string
}

export type CreatedInvoice = {
    id: string
    ocrReference: string | null
    customer: string | null
    email: string | null
    address: string | null
    orgNumber: string | null
    amount: number | null
    vatAmount: number | null
    subtotal: number | null
    issueDate: string | null
    dueDate: string | null
    status: string | null
    currency: string
    reference: string | null
    bankgiro: string | null
    plusgiro: string | null
    notes: string | null
    items: unknown[]
    dbId: string
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
    status: 'Mottagen' | 'Godkänd' | 'Betald'
    currency?: string
}

export type InvoiceStats = {
    incomingTotal: number      // Unpaid customer invoices (money we'll receive)
    outgoingTotal: number      // Unpaid supplier invoices (money we owe)
    overdueCount: number       // Number of overdue invoices
    overdueAmount: number      // Sum of overdue amounts
    paidAmount: number         // Sum of paid invoices
}

/** Map a database row to the CustomerInvoice UI model. */
function mapRowToCustomerInvoice(row: CustomerInvoiceRow): CustomerInvoice {
    return {
        id: row.id,
        invoiceNumber: row.invoice_number ?? row.id,
        customer: row.customer_name ?? '',
        email: nullToUndefined(row.customer_email),
        amount: Number(row.subtotal ?? 0),
        vatAmount: row.vat_amount != null ? Number(row.vat_amount) : undefined,
        totalAmount: Number(row.total_amount ?? 0),
        issueDate: row.invoice_date ?? '',
        dueDate: row.due_date ?? '',
        status: row.status || 'draft',
    }
}

/** Map a database row to the SupplierInvoice UI model. */
function mapRowToSupplierInvoice(row: SupplierInvoiceRow): SupplierInvoice {
    const amount = Number(row.amount) || 0
    const vatAmount = row.vat_amount != null ? Number(row.vat_amount) : undefined
    return {
        id: row.id,
        invoiceNumber: row.ocr || row.id,
        supplierName: row.supplier_name || 'Okänd',
        amount,
        vatAmount,
        totalAmount: Number(row.total_amount) || amount,
        invoiceDate: row.issue_date || row.created_at || new Date().toISOString(),
        dueDate: row.due_date || '',
        status: (row.status as SupplierInvoice['status']) || 'Mottagen',
        currency: 'SEK',
    }
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
        const supabase = createBrowserClient()

        let query = supabase
            .from('customer_invoices')
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

        const invoices: CustomerInvoice[] = (data || []).map(mapRowToCustomerInvoice)

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
        const supabase = createBrowserClient()

        let query = supabase
            .from('supplier_invoices')
            .select('*', { count: 'exact' })
            .order('due_date', { ascending: true })
            .range(offset, offset + limit - 1)

        if (status) {
            query = query.eq('status', status)
        }

        if (startDate) {
            query = query.gte('created_at', startDate)
        }

        const { data, error, count } = await query

        if (error) throw error

        // Return empty if no real data exists
        if (!data || data.length === 0) {
            return { invoices: [], totalCount: 0 }
        }

        const invoices: SupplierInvoice[] = (data || []).map(mapRowToSupplierInvoice)

        return { invoices, totalCount: count || 0 }
    },

    /**
     * Get aggregate statistics performed by the database
     * Uses parallel queries for optimal performance
     */
    async getStats(): Promise<InvoiceStats> {
        const supabase = createBrowserClient()

        const { data, error } = await supabase.rpc('get_invoice_stats')

        if (error) {
            console.error('get_invoice_stats error:', error)
            return {
                incomingTotal: 0,
                outgoingTotal: 0,
                overdueCount: 0,
                overdueAmount: 0,
                paidAmount: 0
            }
        }

        // Handle array return — RPC returns Json
        const raw = Array.isArray(data) ? data[0] : data
        const stats = (raw ?? {}) as { total_amount?: number; overdue_count?: number; overdue_amount?: number; paid_amount?: number }

        if (!raw) {
            return {
                incomingTotal: 0,
                outgoingTotal: 0,
                overdueCount: 0,
                overdueAmount: 0,
                paidAmount: 0
            }
        }

        return {
            incomingTotal: 0,
            outgoingTotal: Number(stats.total_amount || 0),
            overdueCount: Number(stats.overdue_count || 0),
            overdueAmount: 0,
            paidAmount: Number(stats.paid_amount || 0)
        }
    },

    /**
     * Update customer invoice status
     */
    async updateCustomerInvoiceStatus(id: string, status: string) {
        const supabase = createBrowserClient()

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
        const supabase = createBrowserClient()

        const { error } = await supabase
            .from('supplier_invoices')
            .update({ status })
            .eq('id', id)

        if (error) throw error
        return { success: true }
    },

    /**
     * Get customer invoices that are sent and overdue
     */
    async getOverdueCustomerInvoices() {
        const supabase = createBrowserClient()
        const today = new Date().toISOString().split('T')[0]
        
        const { data, error } = await supabase
            .from('customer_invoices')
            .select('*')
            .eq('status', 'sent')
            .lt('due_date', today)
            .order('due_date', { ascending: true })
        
        if (error) throw error
        return (data || []).map(mapRowToCustomerInvoice)
    },

    /**
     * Get supplier invoices that are unpaid and overdue
     */
    /**
     * Get IDs of customer invoices with DRAFT status
     */
    async getDraftIds(): Promise<string[]> {
        const supabase = createBrowserClient()

        const { data, error } = await supabase
            .from('customer_invoices')
            .select('id')
            .eq('status', 'DRAFT')

        if (error) throw error
        return (data || []).map(r => r.id as string)
    },

    /**
     * Get IDs of customer invoices that are overdue (due_date < today, not PAID or CANCELLED)
     */
    async getOverdueIds(): Promise<string[]> {
        const supabase = createBrowserClient()
        const today = new Date().toISOString().split('T')[0]

        const { data, error } = await supabase
            .from('customer_invoices')
            .select('id')
            .lt('due_date', today)
            .not('status', 'in', '("PAID","CANCELLED")')

        if (error) throw error
        return (data || []).map(r => r.id as string)
    },

    /**
     * Create a new customer invoice with sequential numbering, VAT calculation, and OCR reference.
     */
    async createInvoice(
        params: CreateInvoiceParams,
        userId: string,
        companyId: string,
        client?: SupabaseClient<Database>
    ): Promise<CreatedInvoice> {
        const supabase = client ?? createBrowserClient()

        // Generate next sequential invoice number (FAK-YYYY-NNNN)
        const year = new Date().getFullYear()
        const { data: lastInvoices } = await supabase
            .from('customer_invoices')
            .select('invoice_number')
            .like('invoice_number', `FAK-${year}-%`)
            .order('invoice_number', { ascending: false })
            .limit(1)

        let nextNum = 1
        if (lastInvoices && lastInvoices.length > 0) {
            const lastNum = parseInt(lastInvoices[0]?.invoice_number?.split('-')[2] ?? '0') || 0
            nextNum = lastNum + 1
        }
        const invoiceNumber = `FAK-${year}-${String(nextNum).padStart(4, '0')}`

        // Calculate totals from line items
        let subtotal = 0
        let vatAmount = 0
        if (params.items && params.items.length > 0) {
            subtotal = params.items.reduce((sum, item) => {
                return sum + ((item.quantity || 0) * (item.unitPrice || 0))
            }, 0)
            vatAmount = params.items.reduce((sum, item) => {
                const lineTotal = (item.quantity || 0) * (item.unitPrice || 0)
                return sum + (lineTotal * (item.vatRate || 0) / 100)
            }, 0)
        }

        // Use provided amounts or calculated ones
        const finalSubtotal = params.subtotal ?? subtotal
        const finalVatAmount = params.vatAmount ?? vatAmount
        const finalTotal = params.amount ?? (finalSubtotal + finalVatAmount)

        const invoiceData = {
            invoice_number: invoiceNumber,
            ocr_reference: null,
            customer_name: params.customer,
            customer_email: params.email || null,
            customer_address: params.address || null,
            customer_org_number: params.orgNumber || null,
            invoice_date: params.issueDate || new Date().toISOString().split('T')[0],
            due_date: params.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            subtotal: finalSubtotal,
            vat_amount: finalVatAmount,
            total_amount: finalTotal,
            items: {
                lines: params.items || [],
                bankgiro: params.bankgiro || null,
                plusgiro: params.plusgiro || null,
                notes: params.notes || null,
            },
            status: params.status || 'Utkast',
            payment_reference: params.reference || null,
            user_id: userId,
            company_id: companyId || '',
        }

        const { data: created, error } = await supabase
            .from('customer_invoices')
            .insert(invoiceData)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create invoice: ${error.message}`)
        }

        if (!created) {
            throw new Error('Failed to create invoice: no data returned')
        }

        const storedItems = created.items as { lines?: unknown[]; bankgiro?: string; plusgiro?: string; notes?: string } | null

        return {
            id: created.invoice_number ?? invoiceNumber,
            ocrReference: null,
            customer: created.customer_name,
            email: created.customer_email,
            address: created.customer_address,
            orgNumber: created.customer_org_number,
            amount: created.total_amount,
            vatAmount: created.vat_amount,
            subtotal: created.subtotal,
            issueDate: created.invoice_date,
            dueDate: created.due_date,
            status: created.status,
            currency: params.currency || 'SEK',
            reference: created.payment_reference,
            bankgiro: storedItems?.bankgiro || null,
            plusgiro: storedItems?.plusgiro || null,
            notes: storedItems?.notes || null,
            items: storedItems?.lines || [],
            dbId: created.id,
        }
    },

    async getOverdueSupplierInvoices() {
        const supabase = createBrowserClient()
        const today = new Date().toISOString().split('T')[0]
        
        const { data, error } = await supabase
            .from('supplier_invoices')
            .select('*')
            .not('status', 'eq', 'Betald')
            .lt('due_date', today)
            .order('due_date', { ascending: true })
        
        if (error) throw error
        return (data || []).map(mapRowToSupplierInvoice)
    }
}
