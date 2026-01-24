// @ts-nocheck
/**
 * Bokföring AI Tools - Invoices
 *
 * Tools for managing customer and supplier invoices.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import type { AIDisplayInstruction } from '../types'
import { headers } from 'next/headers'

// Helper to get base URL for API calls
function getBaseUrl(): string {
    const headersList = headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    return `${protocol}://${host}`
}

// =============================================================================
// Invoice Types
// =============================================================================

export interface Invoice {
    id: string
    customerName?: string
    supplierName?: string
    amount: number
    vatAmount?: number
    totalAmount: number
    description?: string
    dueDate?: string
    status: string
}

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

export const getCustomerInvoicesTool = defineTool<GetInvoicesParams, Invoice[]>({
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
            const baseUrl = getBaseUrl()
            const queryParams = new URLSearchParams()
            if (params.limit) queryParams.set('limit', params.limit.toString())
            if (params.status) queryParams.set('status', params.status)
            if (params.customer) queryParams.set('customer', params.customer)

            const res = await fetch(`${baseUrl}/api/invoices/customer?${queryParams}`, {
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' }
            })

            let invoices: Invoice[] = []
            if (res.ok) {
                const data = await res.json()
                invoices = data.invoices || []
            }

            const totalAmount = invoices.reduce((sum: number, i: Invoice) => sum + (i.totalAmount || 0), 0)

            const display: AIDisplayInstruction = {
                component: 'InvoicesTable',
                props: { invoices: invoices },
                title: 'Kundfakturor',
                fullViewRoute: '/dashboard/bokforing?tab=kundfakturor',
            }

            return {
                success: true,
                data: invoices,
                message: `Hittade ${invoices.length} kundfakturor på totalt ${totalAmount.toLocaleString('sv-SE')} kr.`,
                display,
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

export const getSupplierInvoicesTool = defineTool<GetSupplierInvoicesParams, Invoice[]>({
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
            const baseUrl = getBaseUrl()
            const queryParams = new URLSearchParams()
            if (params.limit) queryParams.set('limit', params.limit.toString())
            if (params.status) queryParams.set('status', params.status)
            if (params.supplier) queryParams.set('supplier', params.supplier)

            const res = await fetch(`${baseUrl}/api/invoices/supplier?${queryParams}`, {
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' }
            })

            let invoices: Invoice[] = []
            if (res.ok) {
                const data = await res.json()
                invoices = data.invoices || []
            }

            const totalAmount = invoices.reduce((sum: number, i: Invoice) => sum + (i.totalAmount || 0), 0)

            const display: AIDisplayInstruction = {
                component: 'SupplierInvoicesTable',
                props: { invoices: invoices },
                title: 'Leverantörsfakturor',
                fullViewRoute: '/dashboard/bokforing?tab=leverantorsfakturor',
            }

            return {
                success: true,
                data: invoices,
                message: `Hittade ${invoices.length} leverantörsfakturor på totalt ${totalAmount.toLocaleString('sv-SE')} kr.`,
                display,
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
