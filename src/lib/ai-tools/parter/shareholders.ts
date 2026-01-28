/**
 * Parter AI Tools - Shareholders (Aktiebok)
 *
 * Tools for managing shareholders in AB companies.
 * Updated to use shareholderService for real database queries.
 */

import { defineTool } from '../registry'
import { shareholderService, Shareholder } from '@/services/shareholder-service'

// =============================================================================
// Shareholder Read Tools
// =============================================================================

export interface GetShareholdersParams {
    search?: string
    shareClass?: 'A' | 'B'
    boardMembersOnly?: boolean
    limit?: number
}

export const getShareholdersTool = defineTool<GetShareholdersParams, Shareholder[]>({
    name: 'get_shareholders',
    description: 'Hämta den aktuella aktieboken och lista över alla aktieägare.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            search: { type: 'string', description: 'Sök på namn eller e-post' },
            shareClass: { type: 'string', enum: ['A', 'B'], description: 'Filtrera på aktieslag' },
            boardMembersOnly: { type: 'boolean', description: 'Visa endast styrelsemedlemmar' },
            limit: { type: 'number', description: 'Max antal (standard: 100)' },
        },
    },
    execute: async (params) => {
        try {
            const { shareholders, totalCount } = await shareholderService.getShareholders({
                search: params?.search,
                shareClass: params?.shareClass,
                boardMembersOnly: params?.boardMembersOnly,
                limit: params?.limit || 100
            })

            if (shareholders.length === 0) {
                return {
                    success: true,
                    data: [] as Shareholder[],
                    message: 'Aktieboken är tom eller inga aktieägare matchar filtret.',
                }
            }

            // Get summary
            const summary = await shareholderService.getShareRegisterSummary()
            const totalShares = summary.totalShares

            return {
                success: true,
                data: shareholders,
                message: `Aktieboken innehåller ${totalCount} aktieägare med totalt ${totalShares.toLocaleString('sv-SE')} aktier.`,
                display: {
                    component: 'ShareRegisterPreview',
                    title: 'Utdrag ur Aktiebok',
                    props: {
                        data: {
                            companyName: "Ditt Företag AB",
                            orgNumber: "556XXX-XXXX",
                            date: new Date().toISOString().split('T')[0],
                            totalShares: summary.totalShares,
                            totalCapital: summary.totalCapital,
                            shareholders: shareholders.map(s => ({
                                ...s,
                                personalOrOrgNumber: s.personalOrOrgNumber,
                                shareCount: s.sharesCount,
                                shareClass: s.shareClass,
                                votingRights: s.shareClass === 'A' ? 10 : 1,
                                acquisitionDate: s.acquisitionDate || "N/A"
                            }))
                        }
                    },
                    fullViewRoute: '/dashboard/agare?tab=aktiebok',
                },
            }
        } catch (error) {
            console.error('Failed to fetch shareholders:', error)
            return { success: false, error: 'Kunde inte hämta aktieboken.' }
        }
    },
})

// =============================================================================
// Get Share Register Summary Tool
// =============================================================================

export const getShareRegisterSummaryTool = defineTool<Record<string, never>, {
    totalShares: number
    totalShareholderCount: number
    sharesByClass: { classA: number; classB: number }
    totalCapital: number
}>({
    name: 'get_share_register_summary',
    description: 'Hämta sammanfattning av aktieboken: antal aktier, aktieägare, aktiekapital.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            const summary = await shareholderService.getShareRegisterSummary()

            return {
                success: true,
                data: summary,
                message: `Aktiebok: ${summary.totalShareholderCount} aktieägare, ` +
                    `${summary.totalShares.toLocaleString('sv-SE')} aktier ` +
                    `(A: ${summary.sharesByClass.classA}, B: ${summary.sharesByClass.classB}), ` +
                    `aktiekapital ${summary.totalCapital.toLocaleString('sv-SE')} kr.`,
            }
        } catch (error) {
            console.error('Failed to fetch share register summary:', error)
            return { success: false, error: 'Kunde inte hämta aktiebok-sammanfattning.' }
        }
    },
})

// =============================================================================
// Shareholder Write Tools
// =============================================================================

export interface AddShareholderParams {
    name: string
    ssnOrgNr: string
    sharesCount: number
    shareClass: 'A' | 'B'
    email?: string
    phone?: string
    isBoardMember?: boolean
    boardRole?: string
}

export const addShareholderTool = defineTool<AddShareholderParams, Shareholder>({
    name: 'add_shareholder',
    description: 'Lägg till en ny aktieägare i aktieboken. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Namn på aktieägaren' },
            ssnOrgNr: { type: 'string', description: 'Personnummer eller organisationsnummer' },
            sharesCount: { type: 'number', description: 'Antal aktier' },
            shareClass: { type: 'string', enum: ['A', 'B'], description: 'Aktieslag (A eller B)' },
            email: { type: 'string', description: 'E-postadress' },
            phone: { type: 'string', description: 'Telefonnummer' },
            isBoardMember: { type: 'boolean', description: 'Om aktieägaren är styrelsemedlem' },
            boardRole: { type: 'string', description: 'Styrelseroll (t.ex. Ordförande, Ledamot)' },
        },
        required: ['name', 'ssnOrgNr', 'sharesCount', 'shareClass'],
    },
    execute: async (params) => {
        try {
            const shareholder = await shareholderService.addShareholder({
                name: params.name,
                personalOrOrgNumber: params.ssnOrgNr,
                sharesCount: params.sharesCount,
                shareClass: params.shareClass,
                email: params.email,
                phone: params.phone,
                isBoardMember: params.isBoardMember,
                boardRole: params.boardRole
            })

            return {
                success: true,
                data: shareholder,
                message: `Lade till ${params.name} med ${params.sharesCount} ${params.shareClass}-aktier i aktieboken.`,
                confirmationRequired: {
                    title: 'Lägg till aktieägare',
                    description: `Lägg till ${params.name} i aktieboken.`,
                    summary: [
                        { label: 'Namn', value: params.name },
                        { label: 'Person-/Orgnr', value: params.ssnOrgNr },
                        { label: 'Antal aktier', value: `${params.sharesCount} st` },
                        { label: 'Aktieslag', value: params.shareClass },
                    ],
                    action: { toolName: 'add_shareholder', params },
                },
            }
        } catch (error) {
            console.error('Failed to add shareholder:', error)
            return { success: false, error: 'Kunde inte lägga till aktieägare.' }
        }
    },
})

// =============================================================================
// Share Transfer Tools
// =============================================================================

export interface TransferSharesParams {
    fromShareholderId: string
    toShareholderId?: string // If not provided, new shareholder
    toShareholderName?: string // Required if new shareholder
    toShareholderSsnOrgNr?: string // Required if new shareholder
    sharesCount: number
    shareClass: 'A' | 'B'
    transferDate?: string
    pricePerShare?: number
}

export interface ShareTransferResult {
    transferId: string
    from: { name: string; remainingShares: number }
    to: { name: string; totalShares: number }
    sharesTransferred: number
    shareClass: string
    transferDate: string
    totalValue?: number
}

export const transferSharesTool = defineTool<TransferSharesParams, ShareTransferResult>({
    name: 'transfer_shares',
    description: 'Registrera en aktieöverlåtelse mellan parter. Uppdaterar aktieboken automatiskt.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            fromShareholderId: { type: 'string', description: 'ID för säljande aktieägare' },
            toShareholderId: { type: 'string', description: 'ID för köpande aktieägare (om befintlig)' },
            toShareholderName: { type: 'string', description: 'Namn på ny köpare (om ny aktieägare)' },
            toShareholderSsnOrgNr: { type: 'string', description: 'Personnummer/Orgnr för ny köpare' },
            sharesCount: { type: 'number', description: 'Antal aktier som överlåts' },
            shareClass: { type: 'string', enum: ['A', 'B'], description: 'Aktieslag' },
            transferDate: { type: 'string', description: 'Överlåtelsedatum (YYYY-MM-DD)' },
            pricePerShare: { type: 'number', description: 'Pris per aktie i kronor' },
        },
        required: ['fromShareholderId', 'sharesCount', 'shareClass'],
    },
    execute: async (params) => {
        // Mock implementation - in production this would update Supabase
        const transferDate = params.transferDate || new Date().toISOString().split('T')[0]
        const totalValue = params.pricePerShare ? params.pricePerShare * params.sharesCount : undefined

        const result: ShareTransferResult = {
            transferId: `transfer-${Date.now()}`,
            from: {
                name: 'Säljande aktieägare', // Would fetch from DB
                remainingShares: 500, // Would calculate
            },
            to: {
                name: params.toShareholderName || 'Köpande aktieägare',
                totalShares: params.sharesCount,
            },
            sharesTransferred: params.sharesCount,
            shareClass: params.shareClass,
            transferDate,
            totalValue,
        }

        const summaryItems: Array<{ label: string; value: string }> = [
            { label: 'Från', value: result.from.name },
            { label: 'Till', value: result.to.name },
            { label: 'Antal', value: `${params.sharesCount} ${params.shareClass}-aktier` },
            { label: 'Datum', value: transferDate },
        ]
        if (totalValue) {
            summaryItems.push({ label: 'Totalt värde', value: `${totalValue.toLocaleString('sv-SE')} kr` })
        }

        return {
            success: true,
            data: result,
            message: `Förbereder aktieöverlåtelse av ${params.sharesCount} ${params.shareClass}-aktier.`,
            confirmationRequired: {
                title: 'Bekräfta aktieöverlåtelse',
                description: 'Aktieboken kommer att uppdateras med denna överlåtelse.',
                summary: summaryItems,
                action: { toolName: 'transfer_shares', params },
            },
            navigation: {
                route: '/dashboard/agare?tab=aktiebok',
                label: 'Visa aktiebok',
            },
        }
    },
})

export const shareholderTools = [
    getShareholdersTool,
    getShareRegisterSummaryTool,
    addShareholderTool,
    transferSharesTool,
]
