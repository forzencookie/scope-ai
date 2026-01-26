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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    docs = docs.filter((d: any) => d.type === params.type)
                }

                const limit = params.limit || 5
                const displayDocs = docs.slice(0, limit)

                return {
                    success: true,
                    data: displayDocs,
                    message: `Hittade ${docs.length} dokument, visar de senaste ${displayDocs.length}.`,
                    display: {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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



export interface DraftBoardMinutesParams {
    type: 'board_meeting' | 'annual_general_meeting'
    date?: string
    decisions?: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const draftBoardMinutesTool = defineTool<DraftBoardMinutesParams, any>({
    name: 'draft_board_minutes',
    description: 'Skapa ett utkast till styrelseprotokoll eller stämmoprotokoll.',
    category: 'write',
    requiresConfirmation: false, // We use the preview as "drafting" step
    parameters: {
        type: 'object',
        properties: {
            type: { type: 'string', enum: ['board_meeting', 'annual_general_meeting'], description: 'Typ av möte' },
            date: { type: 'string', description: 'Datum för mötet (YYYY-MM-DD)' },
            decisions: { type: 'array', items: { type: 'string' }, description: 'Lista på beslut som fattades' },
        },
        required: ['type'],
    },
    execute: async (params) => {
        // Mock data for preview
        const boardMinutesData = {
            companyName: "Din Företag AB",
            meetingType: params.type === 'annual_general_meeting' ? "Årsstämma" : "Styrelsemöte",
            meetingNumber: "1/2026",
            date: params.date || new Date().toISOString().split('T')[0],
            time: "10:00 - 11:30",
            location: "Huvudkontoret",
            attendees: [
                { name: "Anna Andersson", role: "Chairman", present: true },
                { name: "Erik Eriksson", role: "Member", present: true },
                { name: "Lars Larsson", role: "Secretary", present: true },
            ],
            agenda: [
                "Mötets öppnande",
                "Val av ordförande och sekreterare",
                "Fastställande av dagordning",
                "Genomgång av föregående protokoll",
                "Beslutsärenden",
                "Mötets avslutande"
            ],
            decisions: params.decisions?.map((d, i) => ({
                id: `d-${i}`,
                paragraph: `§${i + 5}`,
                title: "Beslut",
                description: d,
                decision: d,
                type: "decision"
            })) || [
                    {
                        id: "d-1",
                        paragraph: "§5",
                        title: "Beslut om firmateckning",
                        description: "Styrelsen diskuterade bolagets firmateckning.",
                        decision: "Styrelsen beslutar att firman tecknas av styrelsen gemensamt.",
                        type: "decision"
                    }
                ],
            signatures: [
                { role: "Ordförande", name: "Anna Andersson" },
                { role: "Sekreterare", name: "Lars Larsson" }
            ]
        }

        return {
            success: true,
            data: boardMinutesData,
            message: `Utkast till ${boardMinutesData.meetingType} skapat.`,
            display: {
                component: "BoardMinutesPreview",
                title: "Protokollutkast",
                props: { data: boardMinutesData }
            }
        }
    }
})

export const complianceTools = [
    getComplianceDocsTool,
    registerDividendTool,
    draftBoardMinutesTool,
]
