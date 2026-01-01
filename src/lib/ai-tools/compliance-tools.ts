/**
 * AI Compliance Tools
 * 
 * Tools for reading and managing corporate compliance data.
 */

import { defineTool } from './registry'

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
            type: {
                type: 'string',
                enum: ['board_meeting_minutes', 'general_meeting_minutes', 'shareholder_register'],
                description: 'Typ av dokument',
            },
            limit: {
                type: 'number',
                description: 'Max antal dokument (standard: 5)',
            },
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

        return {
            success: false,
            error: 'Kunde inte hämta bolagsdokument.',
            message: 'Ett fel uppstod vid hämtning av dokument.',
        }
    },
})

// =============================================================================
// Shareholder Tools
// =============================================================================

export const getShareholdersTool = defineTool<Record<string, never>, any[]>({
    name: 'get_shareholders',
    description: 'Hämta den aktuella aktieboken och lista över alla aktieägare.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {},
    },
    execute: async () => {
        try {
            const response = await fetch('/api/compliance?type=shareholders', { cache: 'no-store' })
            if (response.ok) {
                const data = await response.json()
                const shareholders = data.shareholders || []

                return {
                    success: true,
                    data: shareholders,
                    message: `Aktieboken innehåller ${shareholders.length} aktieägare.`,
                    display: {
                        component: 'ShareholderList' as any,
                        props: { shareholders },
                        title: 'Aktiebok',
                        fullViewRoute: '/dashboard/parter?tab=aktiebok',
                    },
                }
            }
        } catch (error) {
            console.error('Failed to fetch shareholders:', error)
        }

        return {
            success: false,
            error: 'Kunde inte hämta aktieboken.',
            message: 'Ett fel uppstod vid hämtning av aktieboken.',
        }
    },
})

// =============================================================================
// Export
// =============================================================================

export const complianceTools = [
    getComplianceDocsTool,
    getShareholdersTool,
]
