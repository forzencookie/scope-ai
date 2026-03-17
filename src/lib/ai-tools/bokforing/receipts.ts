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
    description: 'Hämta uppladdade kvitton. Kan filtrera på leverantör, status eller belopp. Använd för att hitta specifika kvitton eller se vilka som behöver hanteras.',
    category: 'read',
    requiresConfirmation: false,
    domain: 'bokforing',
    keywords: ['kvitto', 'kvitton', 'utlägg', 'underlag'],
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
    description: 'Registrera ett kvitto manuellt (om det inte laddades upp som bild). Använd för kvitton från kontantköp, lunch med kund, eller andra utgifter. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    domain: 'bokforing',
    keywords: ['skapa', 'kvitto', 'utlägg', 'ny'],
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
    execute: async (params, context) => {
        const date = params.date || new Date().toISOString().split('T')[0]

        // If confirmed, persist to database
        if (context?.isConfirmed) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                const res = await fetch(`${baseUrl}/api/receipts/processed`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        supplier: params.supplier,
                        amount: params.amount,
                        date,
                        category: params.category || 'Övrigt',
                        description: params.description,
                        moms: params.vatRate ? params.amount * params.vatRate : undefined,
                    }),
                })

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    return { success: false, error: err.error || 'Kunde inte spara kvitto.' }
                }

                const data = await res.json()
                return {
                    success: true,
                    data: {
                        id: data.receipt?.id || data.id,
                        supplier: params.supplier,
                        amount: params.amount,
                        date,
                        category: params.category,
                        description: params.description,
                        vatRate: params.vatRate,
                    },
                    message: `Kvitto från ${params.supplier} sparat (${params.amount.toLocaleString('sv-SE')} kr).`,
                }
            } catch {
                return { success: false, error: 'Kunde inte spara kvitto.' }
            }
        }

        // Preflight: return confirmation request
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
            data: { id: 'pending', ...params },
            message: `Kvitto från ${params.supplier} förberett (${params.amount.toLocaleString('sv-SE')} kr). Bekräfta för att spara.`,
            confirmationRequired: confirmationRequest,
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
    description: 'Lista kvitton som inte är kopplade till någon banktransaktion. Använd för att hitta kvitton som behöver matchas eller för att identifiera dubbletter.',
    category: 'read',
    requiresConfirmation: false,
    domain: 'bokforing',
    keywords: ['omatchat', 'kvitto', 'saknas', 'ej kopplat'],
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
        const unmatched = receipts.filter((r) => !r.linkedTransaction).slice(0, limit)

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
        }
    },
})

export const receiptTools = [
    getReceiptsTool,
    createReceiptTool,
    getUnmatchedReceiptsTool,
]
