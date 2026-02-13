/**
 * Bokföring AI Tools - Invoices
 *
 * Tools for managing customer and supplier invoices.
 * Uses invoice-service.ts to query real data from Supabase.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { invoiceService, type CustomerInvoice, type SupplierInvoice } from '@/services/invoice-service'

// Helper to get base URL for API calls
function getBaseUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

// =============================================================================
// Invoice Types
// =============================================================================

export interface Invoice {
    id: string
    invoiceNumber?: string
    customerName?: string
    supplierName?: string
    amount: number
    vatAmount?: number
    totalAmount: number
    description?: string
    issueDate?: string
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
    description: 'Skapa en ny kundfaktura. Beräknar moms automatiskt (25% standard). Använd när användaren vill fakturera en kund för utfört arbete eller sålda varor. Vanliga frågor: "skapa faktura", "fakturera Acme", "jag behöver skicka en faktura". Kräver bekräftelse.',
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
    execute: async (params, context) => {
        const vatRate = params.vatRate ?? 0.25
        const vatAmount = Math.round(params.amount * vatRate)
        const totalAmount = params.amount + vatAmount
        const dueDate = params.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const vatPercent = Math.round(vatRate * 100)

        // If confirmed, persist to database via API
        if (context?.isConfirmed) {
            try {
                const baseUrl = getBaseUrl()
                const res = await fetch(`${baseUrl}/api/invoices`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer: params.customerName,
                        amount: totalAmount,
                        vatAmount,
                        issueDate: new Date().toISOString().split('T')[0],
                        dueDate,
                        status: 'Utkast',
                        items: [{
                            id: '1',
                            description: params.description,
                            quantity: 1,
                            unitPrice: params.amount,
                            vatRate: vatPercent,
                        }],
                    }),
                })

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    return { success: false, error: err.error || 'Kunde inte skapa faktura.' }
                }

                const data = await res.json()
                return {
                    success: true,
                    data: {
                        id: data.invoice?.dbId || data.invoice?.id,
                        customerName: params.customerName,
                        amount: params.amount,
                        vatAmount,
                        totalAmount,
                        description: params.description,
                        dueDate,
                        status: 'draft' as const,
                    },
                    message: `Faktura skapad för ${params.customerName}. Totalt: ${totalAmount.toLocaleString('sv-SE')} kr. Sparad som utkast.`,
                }
            } catch (error) {
                return { success: false, error: 'Kunde inte spara faktura till databasen.' }
            }
        }

        // Preflight: return confirmation request
        const invoice: CreatedInvoice = {
            id: `pending`,
            customerName: params.customerName,
            amount: params.amount,
            vatAmount,
            totalAmount,
            description: params.description,
            dueDate,
            status: 'draft',
        }

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Skapa faktura',
            description: `Faktura till ${params.customerName}`,
            summary: [
                { label: 'Kund', value: params.customerName },
                { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                { label: 'Moms', value: `${vatAmount.toLocaleString('sv-SE')} kr (${vatPercent}%)` },
                { label: 'Totalt', value: `${totalAmount.toLocaleString('sv-SE')} kr` },
            ],
            action: { toolName: 'create_invoice', params },
            requireCheckbox: false,
        }

        return {
            success: true,
            data: invoice,
            message: `Faktura förberedd för ${params.customerName}. Totalt: ${totalAmount} kr. Bekräfta för att spara.`,
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
    description: 'Hämta skickade kundfakturor. Kan filtrera på status (utkast/skickad/betald/förfallen) eller kundnamn. Använd för att se fakturastatus, hitta specifika fakturor, eller följa upp betalningar. Vanliga frågor: "visa mina fakturor", "fakturor till Acme".',
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
            // Fetch real data from invoice-service
            const { invoices: customerInvoices, totalCount } = await invoiceService.getCustomerInvoices({
                limit: params.limit || 10,
                status: params.status,
            })

            // Filter by customer name if provided
            let filtered = customerInvoices
            if (params.customer) {
                const customerLower = params.customer.toLowerCase()
                filtered = customerInvoices.filter(i =>
                    i.customer.toLowerCase().includes(customerLower)
                )
            }

            // Map to common Invoice type
            const invoices: Invoice[] = filtered.map(i => ({
                id: i.id,
                invoiceNumber: i.invoiceNumber,
                customerName: i.customer,
                amount: i.amount,
                vatAmount: i.vatAmount,
                totalAmount: i.totalAmount,
                issueDate: i.issueDate,
                dueDate: i.dueDate,
                status: i.status,
            }))

            const totalAmount = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0)

            return {
                success: true,
                data: invoices,
                message: invoices.length > 0
                    ? `Hittade ${invoices.length} kundfakturor${totalCount > invoices.length ? ` (av ${totalCount})` : ''} på totalt ${totalAmount.toLocaleString('sv-SE')} kr.`
                    : 'Inga kundfakturor hittades.',
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error)
            return { success: false, error: 'Kunde inte hämta kundfakturor.' }
        }
    },
})

export interface GetSupplierInvoicesParams {
    limit?: number
    status?: 'mottagen' | 'attesterad' | 'betald' | 'förfallen'
    supplier?: string
}

export const getSupplierInvoicesTool = defineTool<GetSupplierInvoicesParams, Invoice[]>({
    name: 'get_supplier_invoices',
    description: 'Hämta mottagna leverantörsfakturor (inkommande fakturor att betala). Kan filtrera på status eller leverantör. Använd för att se obetalda räkningar, förbereda betalningar, eller attestera fakturor.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            limit: { type: 'number', description: 'Max antal fakturor (standard: 10)' },
            status: { type: 'string', enum: ['mottagen', 'attesterad', 'betald', 'förfallen'], description: 'Filtrera på status' },
            supplier: { type: 'string', description: 'Filtrera på leverantörsnamn' },
        },
    },
    execute: async (params) => {
        try {
            // Fetch real data from invoice-service
            const { invoices: supplierInvoices, totalCount } = await invoiceService.getSupplierInvoices({
                limit: params.limit || 10,
                status: params.status,
            })

            // Filter by supplier name if provided
            let filtered = supplierInvoices
            if (params.supplier) {
                const supplierLower = params.supplier.toLowerCase()
                filtered = supplierInvoices.filter(i =>
                    i.supplierName.toLowerCase().includes(supplierLower)
                )
            }

            // Map to common Invoice type
            const invoices: Invoice[] = filtered.map(i => ({
                id: i.id,
                invoiceNumber: i.invoiceNumber,
                supplierName: i.supplierName,
                amount: i.amount,
                vatAmount: i.vatAmount,
                totalAmount: i.totalAmount,
                issueDate: i.invoiceDate,
                dueDate: i.dueDate,
                status: i.status,
            }))

            const totalAmount = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0)

            return {
                success: true,
                data: invoices,
                message: invoices.length > 0
                    ? `Hittade ${invoices.length} leverantörsfakturor${totalCount > invoices.length ? ` (av ${totalCount})` : ''} på totalt ${totalAmount.toLocaleString('sv-SE')} kr.`
                    : 'Inga leverantörsfakturor hittades.',
            }
        } catch (error) {
            console.error('Failed to fetch supplier invoices:', error)
            return { success: false, error: 'Kunde inte hämta leverantörsfakturor.' }
        }
    },
})

// =============================================================================
// Send Invoice Reminder Tool
// =============================================================================

export interface SendInvoiceReminderParams {
    invoiceId: string
    reminderLevel?: 1 | 2 | 3
    addLateFee?: boolean
}

export interface InvoiceReminderResult {
    sent: boolean
    invoiceId: string
    reminderNumber: number
    newDueDate: string
    lateFee?: number
}

export const sendInvoiceReminderTool = defineTool<SendInvoiceReminderParams, InvoiceReminderResult>({
    name: 'send_invoice_reminder',
    description: 'Skicka betalningspåminnelse på förfallen kundfaktura. Stödjer tre nivåer: första påminnelse, andra påminnelse, och inkassokrav. Kan lägga till dröjsmålsavgift (60 kr). Använd när kunden inte betalat i tid.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            invoiceId: { type: 'string', description: 'ID för fakturan' },
            reminderLevel: { type: 'number', description: 'Påminnelsenivå (1=första, 2=andra, 3=inkassokrav)' },
            addLateFee: { type: 'boolean', description: 'Lägg till dröjsmålsavgift (60 kr standard)' },
        },
        required: ['invoiceId'],
    },
    execute: async (params) => {
        const reminderLevel = params.reminderLevel ?? 1
        const lateFee = params.addLateFee ? 60 : 0
        const newDueDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const reminderLabels = {
            1: 'Betalningspåminnelse',
            2: 'Andra påminnelse',
            3: 'Inkassokrav'
        }

        return {
            success: true,
            data: {
                sent: false,
                invoiceId: params.invoiceId,
                reminderNumber: reminderLevel,
                newDueDate,
                lateFee: lateFee > 0 ? lateFee : undefined,
            },
            message: `${reminderLabels[reminderLevel]} förberedd${lateFee > 0 ? ` med ${lateFee} kr i avgift` : ''}.`,
            confirmationRequired: {
                title: reminderLabels[reminderLevel],
                description: `Skicka påminnelse på faktura ${params.invoiceId}`,
                summary: [
                    { label: 'Faktura', value: params.invoiceId },
                    { label: 'Nivå', value: reminderLabels[reminderLevel] },
                    { label: 'Ny förfallodag', value: newDueDate },
                    ...(lateFee > 0 ? [{ label: 'Avgift', value: `${lateFee} kr` }] : []),
                ],
                action: { toolName: 'send_invoice_reminder', params },
                requireCheckbox: true,
            },
        }
    },
})

// =============================================================================
// Void Invoice Tool
// =============================================================================

export interface VoidInvoiceParams {
    invoiceId: string
    reason: string
}

export interface VoidInvoiceResult {
    voided: boolean
    invoiceId: string
    creditNoteId?: string
}

export const voidInvoiceTool = defineTool<VoidInvoiceParams, VoidInvoiceResult>({
    name: 'void_invoice',
    description: 'Makulera en felaktig faktura genom att skapa kreditfaktura. Använd när faktura har fel belopp, fel kund, eller inte ska skickas. Kan inte ångras. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            invoiceId: { type: 'string', description: 'ID för fakturan att makulera' },
            reason: { type: 'string', description: 'Anledning till makulering' },
        },
        required: ['invoiceId', 'reason'],
    },
    execute: async (params) => {
        return {
            success: true,
            data: {
                voided: false,
                invoiceId: params.invoiceId,
            },
            message: `Faktura ${params.invoiceId} förberedd för makulering.`,
            confirmationRequired: {
                title: 'Makulera faktura',
                description: `Makulera faktura ${params.invoiceId}. Detta kan inte ångras.`,
                summary: [
                    { label: 'Faktura', value: params.invoiceId },
                    { label: 'Anledning', value: params.reason },
                    { label: 'Åtgärd', value: 'Skapar kreditfaktura' },
                ],
                action: { toolName: 'void_invoice', params },
                requireCheckbox: true,
            },
        }
    },
})

// =============================================================================
// Book Invoice Payment Tool
// =============================================================================

export interface BookInvoicePaymentParams {
    invoiceId: string
    amount: number
    paymentDate?: string
    paymentMethod?: 'bank' | 'swish' | 'card' | 'cash'
}

export interface BookInvoicePaymentResult {
    booked: boolean
    invoiceId: string
    verificationId: string
    remainingAmount: number
}

export const bookInvoicePaymentTool = defineTool<BookInvoicePaymentParams, BookInvoicePaymentResult>({
    name: 'book_invoice_payment',
    description: 'Registrera att en kundfaktura är betald. Skapar verifikation, uppdaterar kundreskontran, och markerar fakturan som betald. Använd när betalning kommit in på bankkontot. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            invoiceId: { type: 'string', description: 'ID för fakturan' },
            amount: { type: 'number', description: 'Betalt belopp i kronor' },
            paymentDate: { type: 'string', description: 'Betalningsdatum (YYYY-MM-DD), standard idag' },
            paymentMethod: { type: 'string', enum: ['bank', 'swish', 'card', 'cash'], description: 'Betalningsmetod' },
        },
        required: ['invoiceId', 'amount'],
    },
    execute: async (params, context) => {
        const paymentDate = params.paymentDate || new Date().toISOString().split('T')[0]

        // If confirmed, persist the booking
        if (context?.isConfirmed) {
            try {
                const baseUrl = getBaseUrl()
                // Book the invoice via the booking API
                const res = await fetch(`${baseUrl}/api/invoices/${params.invoiceId}/book`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                })

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    return { success: false, error: err.error || 'Kunde inte bokföra betalning.' }
                }

                const data = await res.json()
                return {
                    success: true,
                    data: {
                        booked: true,
                        invoiceId: params.invoiceId,
                        verificationId: data.verification?.id || '',
                        remainingAmount: 0,
                    },
                    message: `Betalning på ${params.amount.toLocaleString('sv-SE')} kr bokförd. Verifikation skapad.`,
                }
            } catch (error) {
                return { success: false, error: 'Kunde inte bokföra betalning.' }
            }
        }

        return {
            success: true,
            data: {
                booked: false,
                invoiceId: params.invoiceId,
                verificationId: '',
                remainingAmount: 0,
            },
            message: `Betalning på ${params.amount.toLocaleString('sv-SE')} kr förberedd för bokföring.`,
            confirmationRequired: {
                title: 'Bokför betalning',
                description: `Registrera betalning på faktura ${params.invoiceId}`,
                summary: [
                    { label: 'Faktura', value: params.invoiceId },
                    { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                    { label: 'Datum', value: paymentDate },
                    { label: 'Metod', value: params.paymentMethod || 'Bank' },
                ],
                action: { toolName: 'book_invoice_payment', params },
                requireCheckbox: false,
            },
        }
    },
})

// =============================================================================
// Get Overdue Invoices Tool
// =============================================================================

export interface GetOverdueInvoicesParams {
    daysOverdue?: number
    limit?: number
}

export const getOverdueInvoicesTool = defineTool<GetOverdueInvoicesParams, Invoice[]>({
    name: 'get_overdue_invoices',
    description: 'Lista kundfakturor som passerat förfallodatum och inte betalats. Använd för uppföljning och beslut om påminnelser. Vanliga frågor: "har nån kund inte betalat", "vilka fakturor är förfallna", "obetalda fakturor".',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            daysOverdue: { type: 'number', description: 'Minst antal dagar förfallen (standard: 1)' },
            limit: { type: 'number', description: 'Max antal att visa (standard: 20)' },
        },
    },
    execute: async (params) => {
        const limit = params.limit ?? 20

        let invoices: Invoice[] = []

        try {
            const baseUrl = getBaseUrl()
            const res = await fetch(`${baseUrl}/api/invoices?status=overdue&limit=${limit}`, {
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                const data = await res.json()
                invoices = data.invoices || []
            }
        } catch (error) {
            console.error('Failed to fetch overdue invoices:', error)
        }

        const totalOverdue = invoices.reduce((sum: number, i: Invoice) => sum + (i.totalAmount || 0), 0)

        return {
            success: true,
            data: invoices,
            message: invoices.length > 0
                ? `${invoices.length} förfallna fakturor på totalt ${totalOverdue.toLocaleString('sv-SE')} kr.`
                : 'Inga förfallna fakturor. 🎉',
        }
    },
})

export const invoiceTools = [
    createInvoiceTool,
    getCustomerInvoicesTool,
    getSupplierInvoicesTool,
    sendInvoiceReminderTool,
    voidInvoiceTool,
    bookInvoicePaymentTool,
    getOverdueInvoicesTool,
]
