/**
 * Bokföring AI Tools - Receipts
 *
 * Tools for managing receipts.
 */

import { defineTool } from '../registry'
import { receiptService } from '@/services/accounting'

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
  allowedCompanyTypes: [],
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

export const receiptTools = [
    getReceiptsTool,
]
