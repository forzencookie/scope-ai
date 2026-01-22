/**
 * Bokföring AI Tools - Receipts
 *
 * Tools for managing receipts.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { mockReceipts } from '@/data/mock-data'

// =============================================================================
// Receipt Tools
// =============================================================================

export interface GetReceiptsParams {
    limit?: number
    supplier?: string
    status?: string
    minAmount?: number
    maxAmount?: number
}

interface Receipt {
    id: string
    supplier: string
    date: string
    amount: string
    category: string
    status: string
    attachment?: string | null
    attachmentUrl?: string
}

export const getReceiptsTool = defineTool<GetReceiptsParams, Receipt[]>({
    name: 'get_receipts',
    description: 'Hämta kvitton från bokföringen. Kan filtreras på leverantör, status eller belopp.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            limit: { type: 'number', description: 'Max antal kvitton att hämta (standard: 10)' },
            supplier: { type: 'string', description: 'Filtrera på leverantör/butik' },
            status: { type: 'string', description: 'Filtrera på status (pending, verified, recorded)' },
            minAmount: { type: 'number', description: 'Minsta belopp' },
            maxAmount: { type: 'number', description: 'Högsta belopp' },
        },
    },
    execute: async (params) => {
        // Use mock data
        let receipts: Receipt[] = mockReceipts.map(r => ({
            id: r.id,
            supplier: r.supplier,
            date: r.date,
            amount: r.amount,
            category: r.category,
            status: r.status,
            attachment: r.attachment,
        }))

        if (params.supplier) {
            const query = params.supplier.toLowerCase()
            receipts = receipts.filter(r => r.supplier?.toLowerCase().includes(query))
        }

        if (params.status) {
            receipts = receipts.filter(r => r.status?.toLowerCase() === params.status!.toLowerCase())
        }

        const limit = params.limit || 10
        const data = receipts.slice(0, limit)

        return {
            success: true,
            data,
            message: receipts.length > 0
                ? `Hittade ${receipts.length} kvitton, visar ${data.length}.`
                : 'Inga kvitton hittades.',
            display: {
                component: 'ReceiptsTable',
                props: { receipts: data },
                title: 'Kvitton',
                fullViewRoute: '/dashboard/bokforing?tab=kvitton',
            },
        }
    },
})

export interface CreateReceiptParams {
    supplier: string
    amount: number
    date?: string
    category?: string
    description?: string
    vatRate?: number
}

export const createReceiptTool = defineTool<CreateReceiptParams, any>({
    name: 'create_receipt',
    description: 'Registrera ett nytt kvitto. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            supplier: { type: 'string', description: 'Leverantör/butik' },
            amount: { type: 'number', description: 'Belopp i kronor' },
            date: { type: 'string', description: 'Datum (YYYY-MM-DD)' },
            category: { type: 'string', description: 'Kategori' },
            description: { type: 'string', description: 'Beskrivning' },
            vatRate: { type: 'number', description: 'Momssats (0.25 = 25%)' },
        },
        required: ['supplier', 'amount'],
    },
    execute: async (params) => {
        const confirmationRequest: AIConfirmationRequest = {
            title: 'Registrera kvitto',
            description: `Kvitto från ${params.supplier}`,
            summary: [
                { label: 'Leverantör', value: params.supplier },
                { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                { label: 'Kategori', value: params.category || 'Övrigt' },
            ],
            action: { toolName: 'create_receipt', params },
            requireCheckbox: false,
        }

        return {
            success: true,
            data: { id: `rcpt-${Date.now()}`, ...params },
            message: `Kvitto från ${params.supplier} förberett (${params.amount} kr).`,
            confirmationRequired: confirmationRequest,
        }
    },
})

export const receiptTools = [
    getReceiptsTool,
    createReceiptTool,
]
