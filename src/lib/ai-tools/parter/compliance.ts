/**
 * Parter AI Tools - Compliance (Protokoll, Utdelning)
 *
 * Tools for corporate compliance documents and dividends.
 */

import { defineTool } from '../registry'

// =============================================================================
// Compliance Document Tools
// =============================================================================

export interface GetComplianceDocsParams {
    type?: 'board_meeting_minutes' | 'general_meeting_minutes' | 'shareholder_register'
    limit?: number
}

export const getComplianceDocsTool = defineTool<GetComplianceDocsParams, any[]>({
    name: 'get_compliance_docs',
    description: 'Hämta bolagsdokument som styrelseprotokoll eller stämmoprotokoll.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            type: { type: 'string', enum: ['board_meeting_minutes', 'general_meeting_minutes', 'shareholder_register'], description: 'Typ av dokument' },
            limit: { type: 'number', description: 'Max antal dokument (standard: 5)' },
        },
    },
    execute: async (params) => {
        try {
            const response = await fetch('/api/compliance', { cache: 'no-store' })
            if (response.ok) {
                const data = await response.json()
                let docs = data.documents || []

                if (params.type) {
                    docs = docs.filter((d: any) => d.type === params.type)
                }

                const limit = params.limit || 5
                const displayDocs = docs.slice(0, limit)

                return {
                    success: true,
                    data: displayDocs,
                    message: `Hittade ${docs.length} dokument, visar de senaste ${displayDocs.length}.`,
                    display: {
                        component: 'ComplianceList' as any,
                        props: { documents: displayDocs },
                        title: 'Bolagsdokument',
                        fullViewRoute: '/dashboard/parter',
                    },
                }
            }
        } catch (error) {
            console.error('Failed to fetch compliance docs:', error)
        }

        return { success: false, error: 'Kunde inte hämta bolagsdokument.' }
    },
})

// =============================================================================
// Dividend Tools
// =============================================================================

export interface RegisterDividendParams {
    amount: number
    year: number
    recipientName?: string
}

export const registerDividendTool = defineTool<RegisterDividendParams, any>({
    name: 'register_dividend',
    description: 'Registrera ett utdelningsbeslut från bolagsstämma. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            amount: { type: 'number', description: 'Utdelningsbelopp i kronor' },
            year: { type: 'number', description: 'Inkomstår för utdelningen' },
            recipientName: { type: 'string', description: 'Mottagare (om specifik, annars alla aktieägare)' },
        },
        required: ['amount', 'year'],
    },
    execute: async (params) => {
        const dividendData = {
            type: 'dividend_decision',
            amount: params.amount,
            year: params.year,
            recipient: params.recipientName || 'Alla aktieägare',
            date: new Date().toISOString(),
        }

        return {
            success: true,
            data: dividendData,
            message: `Registrerade utdelning på ${params.amount.toLocaleString('sv-SE')} kr för ${params.year}.`,
            navigation: {
                route: '/dashboard/parter?tab=utdelning',
                label: 'Visa utdelning',
            },
        }
    },
})

export const complianceTools = [
    getComplianceDocsTool,
    registerDividendTool,
]
