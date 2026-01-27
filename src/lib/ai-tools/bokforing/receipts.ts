/**
 * Bokföring AI Tools - Receipts
 *
 * Tools for managing receipts.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { receiptService } from '@/services/receipt-service'

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
        const { receipts } = await receiptService.getReceipts({
            limit: params.limit,
            statuses: params.status ? [params.status] : undefined,
            search: params.supplier
        })

        let filtered = receipts

        // Filter by amount locally since service doesn't support it yet
        if (params.minAmount) {
            filtered = filtered.filter(r => parseFloat(r.amount) >= params.minAmount!)
        }
        if (params.maxAmount) {
            filtered = filtered.filter(r => parseFloat(r.amount) <= params.maxAmount!)
        }

        const data: Receipt[] = filtered.map(r => ({
            id: r.id,
            supplier: r.supplier,
            date: r.date,
            amount: r.amount,
            category: r.category,
            status: r.status,
            attachment: r.attachment,
            attachmentUrl: r.attachmentUrl
        }))

        return {
            success: true,
            data,
            message: data.length > 0
                ? `Hittade ${data.length} kvitton.`
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

export interface CreatedReceipt {
    id: string
    supplier: string
    amount: number
    date?: string
    category?: string
    description?: string
    vatRate?: number
}

export const createReceiptTool = defineTool<CreateReceiptParams, CreatedReceipt>({
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

// =============================================================================
// Match Receipt to Transaction Tool
// =============================================================================

export interface MatchReceiptToTransactionParams {
    receiptId: string
    transactionId: string
}

export interface ReceiptMatchResult {
    matched: boolean
    receiptId: string
    transactionId: string
}

export const matchReceiptToTransactionTool = defineTool<MatchReceiptToTransactionParams, ReceiptMatchResult>({
    name: 'match_receipt_to_transaction',
    description: 'Koppla ett kvitto till en banktransaktion som underlag.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            receiptId: { type: 'string', description: 'ID för kvittot' },
            transactionId: { type: 'string', description: 'ID för transaktionen' },
        },
        required: ['receiptId', 'transactionId'],
    },
    execute: async (params) => {
        return {
            success: true,
            data: {
                matched: false,
                receiptId: params.receiptId,
                transactionId: params.transactionId,
            },
            message: `Kvitto förberett för koppling till transaktion.`,
            confirmationRequired: {
                title: 'Koppla kvitto',
                description: 'Koppla kvittot som underlag till transaktionen',
                summary: [
                    { label: 'Kvitto', value: params.receiptId },
                    { label: 'Transaktion', value: params.transactionId },
                ],
                action: { toolName: 'match_receipt_to_transaction', params },
                requireCheckbox: false,
            },
        }
    },
})

// =============================================================================
// Get Unmatched Receipts Tool
// =============================================================================

export interface GetUnmatchedReceiptsParams {
    limit?: number
}

export const getUnmatchedReceiptsTool = defineTool<GetUnmatchedReceiptsParams, Receipt[]>({
    name: 'get_unmatched_receipts',
    description: 'Visa kvitton som inte är kopplade till någon transaktion.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            limit: { type: 'number', description: 'Max antal att visa (standard: 20)' },
        },
    },
    execute: async (params) => {
        const limit = params.limit ?? 20
        
        const { receipts } = await receiptService.getReceipts({
            limit,
            statuses: ['pending', 'verified']
        })

        // Filter to those without linked transaction
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unmatched = receipts.filter((r: any) => !r.linkedTransaction).slice(0, limit)

        const data: Receipt[] = unmatched.map(r => ({
            id: r.id,
            supplier: r.supplier,
            date: r.date,
            amount: r.amount,
            category: r.category,
            status: r.status,
            attachment: r.attachment,
            attachmentUrl: r.attachmentUrl
        }))

        return {
            success: true,
            data,
            message: data.length > 0
                ? `${data.length} kvitton saknar kopplad transaktion.`
                : 'Alla kvitton är kopplade till transaktioner. 🎉',
            display: {
                component: 'ReceiptsTable',
                props: { receipts: data, highlight: 'unmatched' },
                title: 'Okopplade kvitton',
                fullViewRoute: '/dashboard/bokforing?tab=kvitton',
            },
        }
    },
})

export const receiptTools = [
    getReceiptsTool,
    createReceiptTool,
    matchReceiptToTransactionTool,
    getUnmatchedReceiptsTool,
]
