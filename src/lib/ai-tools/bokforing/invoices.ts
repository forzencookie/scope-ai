/**
 * Bokföring AI Tools - Invoices
 *
 * Tools for managing customer and supplier invoices.
 */

import { defineTool, AIConfirmationRequest } from '../registry'

// =============================================================================
// Customer Invoices
// =============================================================================

export interface CreateInvoiceParams {
    customerName: string
    amount: number
    description: string
    dueDate?: string
    vatRate?: number
}

export interface CreatedInvoice {
    id: string
    customerName: string
    amount: number
    vatAmount: number
    totalAmount: number
    description: string
    dueDate: string
    status: 'draft'
}

export const createInvoiceTool = defineTool<CreateInvoiceParams, CreatedInvoice>({
    name: 'create_invoice',
    description: 'Skapa en kundfaktura. Kräver bekräftelse innan skapande.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            customerName: {
                type: 'string',
                description: 'Kundens namn',
            },
            amount: {
                type: 'number',
                description: 'Belopp exklusive moms',
            },
            description: {
                type: 'string',
                description: 'Beskrivning av fakturan',
            },
            dueDate: {
                type: 'string',
                description: 'Förfallodatum (YYYY-MM-DD)',
            },
            vatRate: {
                type: 'number',
                description: 'Momssats (standard: 0.25 = 25%)',
            },
        },
        required: ['customerName', 'amount', 'description'],
    },
    execute: async (params) => {
        const vatRate = params.vatRate ?? 0.25
        const vatAmount = Math.round(params.amount * vatRate)
        const totalAmount = params.amount + vatAmount

        const invoice: CreatedInvoice = {
            id: `inv-${Date.now()}`,
            customerName: params.customerName,
            amount: params.amount,
            vatAmount,
            totalAmount,
            description: params.description,
            dueDate: params.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'draft',
        }

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Skapa faktura',
            description: `Faktura till ${params.customerName}`,
            summary: [
                { label: 'Kund', value: params.customerName },
                { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                { label: 'Moms', value: `${vatAmount.toLocaleString('sv-SE')} kr` },
                { label: 'Totalt', value: `${totalAmount.toLocaleString('sv-SE')} kr` },
            ],
            action: { toolName: 'create_invoice', params },
            requireCheckbox: false,
        }

        return {
            success: true,
            data: invoice,
            message: `Faktura förberedd för ${params.customerName}. Totalt: ${totalAmount} kr.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

export interface GetInvoicesParams {
    limit?: number
    status?: 'draft' | 'sent' | 'paid' | 'overdue'
    customer?: string
}

import { db } from '@/lib/server-db'

// ... (keep existing interfaces)

export const getCustomerInvoicesTool = defineTool<GetInvoicesParams, any[]>({
    name: 'get_customer_invoices',
    description: 'Hämta kundfakturor. Kan filtreras på status eller kund.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            limit: { type: 'number', description: 'Max antal fakturor (standard: 10)' },
            status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue'], description: 'Filtrera på status' },
            customer: { type: 'string', description: 'Filtrera på kundnamn' },
        },
    },
    execute: async (params) => {
        try {
            const invoices = await db.getCustomerInvoices({
                limit: params.limit,
                status: params.status,
                customer: params.customer
            })

            const totalAmount = invoices.reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0)

            return {
                success: true,
                data: invoices,
                message: `Hittade ${invoices.length} kundfakturor på totalt ${totalAmount.toLocaleString('sv-SE')} kr.`,
                display: {
                    component: 'InvoicesTable' as any,
                    props: { invoices: invoices },
                    title: 'Kundfakturor',
                    fullViewRoute: '/dashboard/bokforing?tab=kundfakturor',
                },
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error)
            return { success: false, error: 'Kunde inte hämta kundfakturor.' }
        }
    },
})

export interface GetSupplierInvoicesParams {
    limit?: number
    status?: 'pending' | 'approved' | 'paid' | 'overdue'
    supplier?: string
}

export const getSupplierInvoicesTool = defineTool<GetSupplierInvoicesParams, any[]>({
    name: 'get_supplier_invoices',
    description: 'Hämta leverantörsfakturor. Kan filtreras på status eller leverantör.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            limit: { type: 'number', description: 'Max antal fakturor (standard: 10)' },
            status: { type: 'string', enum: ['pending', 'approved', 'paid', 'overdue'], description: 'Filtrera på status' },
            supplier: { type: 'string', description: 'Filtrera på leverantörsnamn' },
        },
    },
    execute: async (params) => {
        try {
            const invoices = await db.getSupplierInvoices({
                limit: params.limit,
                status: params.status,
                supplier: params.supplier
            })

            const totalAmount = invoices.reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0)

            return {
                success: true,
                data: invoices,
                message: `Hittade ${invoices.length} leverantörsfakturor på totalt ${totalAmount.toLocaleString('sv-SE')} kr.`,
                display: {
                    component: 'SupplierInvoicesTable' as any,
                    props: { invoices: invoices },
                    title: 'Leverantörsfakturor',
                    fullViewRoute: '/dashboard/bokforing?tab=leverantorsfakturor',
                },
            }
        } catch (error) {
            console.error('Failed to fetch supplier invoices:', error)
            return { success: false, error: 'Kunde inte hämta leverantörsfakturor.' }
        }
    },
})

export const invoiceTools = [
    createInvoiceTool,
    getCustomerInvoicesTool,
    getSupplierInvoicesTool,
]
