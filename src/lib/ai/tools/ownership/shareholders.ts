/**
 * Parter AI Tools - Shareholders (Aktiebok)
 *
 * Tools for managing shareholders in AB companies.
 * Updated to use shareholderService for real database queries.
 */

import { defineTool } from '../registry'
import { shareholderService, Shareholder } from '@/services/corporate'

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
  allowedCompanyTypes: ["ab"],
  domain: 'parter',
    keywords: ['aktieägare', 'delägare', 'ägare'],
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
    domain: 'parter',
    keywords: ['aktiebok', 'aktieregister', 'sammanfattning'],
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
  allowedCompanyTypes: ["ab"],
  domain: 'parter',
    keywords: ['lägg till', 'aktieägare', 'ny delägare'],
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
    execute: async (params, context) => {
        if (context?.isConfirmed) {
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
                }
            } catch (error) {
                console.error('Failed to add shareholder:', error)
                return { success: false, error: 'Kunde inte lägga till aktieägare.' }
            }
        }

        return {
            success: true,
            data: {
                id: '',
                name: params.name,
                personalOrOrgNumber: params.ssnOrgNr,
                sharesCount: params.sharesCount,
                shareClass: params.shareClass,
                ownershipPercentage: 0,
                votingPercentage: 0,
                isBoardMember: params.isBoardMember ?? false,
                boardRole: params.boardRole ?? null,
                email: params.email ?? null,
                phone: params.phone ?? null,
                acquisitionDate: null,
                acquisitionPrice: null,
            } as Shareholder,
            message: `Förbereder att lägga till ${params.name} i aktieboken.`,
            confirmationRequired: {
                title: 'Lägg till aktieägare',
                description: `Lägg till ${params.name} i aktieboken med ${params.sharesCount} ${params.shareClass}-aktier.`,
                summary: [
                    { label: 'Namn', value: params.name },
                    { label: 'Person-/Orgnr', value: params.ssnOrgNr },
                    { label: 'Antal aktier', value: `${params.sharesCount} st` },
                    { label: 'Aktieslag', value: params.shareClass },
                ],
                action: { toolName: 'add_shareholder', params },
            },
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
  allowedCompanyTypes: ["ab"],
  domain: 'parter',
    keywords: ['överlåta', 'aktier', 'överlåtelse'],
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
    execute: async (params, context) => {
        const transferDate = params.transferDate || new Date().toISOString().split('T')[0]
        const totalValue = params.pricePerShare ? params.pricePerShare * params.sharesCount : undefined

        // If confirmed, execute the transfer
        if (context?.isConfirmed) {
            try {
                const result = await shareholderService.transferShares({
                    fromShareholderId: params.fromShareholderId,
                    toShareholderId: params.toShareholderId,
                    toShareholderName: params.toShareholderName,
                    toShareholderSsnOrgNr: params.toShareholderSsnOrgNr,
                    sharesCount: params.sharesCount,
                    shareClass: params.shareClass,
                    transferDate: params.transferDate,
                    pricePerShare: params.pricePerShare,
                })

                // === CASCADE: Create GL entry when shares have a price ===
                let glMessage = ''
                if (totalValue && totalValue > 0) {
                    try {
                        const { verificationService } = await import('@/services/accounting/verification-service')
                        await verificationService.createVerification({
                            date: transferDate,
                            description: `Aktieöverlåtelse: ${params.sharesCount} ${params.shareClass}-aktier, ${result.from.name} → ${result.to.name}`,
                            entries: [
                                { account: '1310', debit: totalValue, credit: 0, description: 'Andelar i koncernföretag' },
                                { account: '1930', debit: 0, credit: totalValue, description: 'Företagskonto / bank' },
                            ],
                            sourceType: 'share_transfer',
                        })
                        glMessage = ` Verifikation skapad: ${totalValue.toLocaleString('sv-SE')} kr (1310 ↔ 1930).`
                    } catch (glError) {
                        console.error('[ShareTransfer] GL cascade failed:', glError)
                        glMessage = ' ⚠️ Verifikation kunde inte skapas automatiskt — bokför manuellt.'
                    }
                }

                return {
                    success: true,
                    data: result,
                    message: `Aktieöverlåtelse genomförd. ${result.sharesTransferred} ${result.shareClass}-aktier överlåtna från ${result.from.name} till ${result.to.name}.${glMessage}`,
                    navigation: {
                        route: '/dashboard/agare?tab=aktiebok',
                        label: 'Visa aktiebok',
                    },
                }
            } catch (error) {
                return { success: false, error: error instanceof Error ? error.message : 'Kunde inte genomföra överlåtelsen.' }
            }
        }

        // Preflight: fetch seller info for confirmation summary
        let sellerName = 'Aktieägare'
        try {
            const { shareholders } = await shareholderService.getShareholders()
            const seller = shareholders.find((s: Shareholder) => s.id === params.fromShareholderId)
            if (seller) sellerName = seller.name
        } catch { /* use fallback name */ }

        const summaryItems: Array<{ label: string; value: string }> = [
            { label: 'Från', value: sellerName },
            { label: 'Till', value: params.toShareholderName || 'Befintlig aktieägare' },
            { label: 'Antal', value: `${params.sharesCount} ${params.shareClass}-aktier` },
            { label: 'Datum', value: transferDate },
        ]
        if (totalValue) {
            summaryItems.push({ label: 'Totalt värde', value: `${totalValue.toLocaleString('sv-SE')} kr` })
        }

        return {
            success: true,
            data: {
                transferId: '',
                from: { name: sellerName, remainingShares: 0 },
                to: { name: params.toShareholderName || 'Köpande aktieägare', totalShares: params.sharesCount },
                sharesTransferred: params.sharesCount,
                shareClass: params.shareClass,
                transferDate,
                totalValue,
            },
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

// =============================================================================
// Record Dividend Decision Tool
// =============================================================================

export interface RecordDividendDecisionParams {
    totalDividend: number
    dividendPerShare: number
    fiscalYear: number
    availableEquity: number
    decidedDate?: string
}

export const recordDividendDecisionTool = defineTool<RecordDividendDecisionParams, { id: string }>({
    name: 'record_dividend_decision',
    description: 'Dokumentera ett utdelningsbeslut — fritt eget kapital kontrolleras mot utdelningsbeloppet (försiktighetsregeln). Skapar ett utdelningsunderlag med status "beslutad". Kräver bekräftelse. Använd register_dividend för att sedan bokföra utbetalningen. Endast AB.',
    category: 'write',
    requiresConfirmation: true,
    allowedCompanyTypes: ['ab'],
    domain: 'parter',
    keywords: ['utdelning', 'beslut', 'utdelningsbeslut', 'bolagsstämma', 'fritt eget kapital'],
    parameters: {
        type: 'object',
        properties: {
            totalDividend: { type: 'number', description: 'Total utdelning i kronor' },
            dividendPerShare: { type: 'number', description: 'Utdelning per aktie i kronor' },
            fiscalYear: { type: 'number', description: 'Räkenskapsår utdelningen avser' },
            availableEquity: { type: 'number', description: 'Fritt eget kapital (för försiktighetsregeln)' },
            decidedDate: { type: 'string', description: 'Beslutsdatum (YYYY-MM-DD, standard: idag)' },
        },
        required: ['totalDividend', 'dividendPerShare', 'fiscalYear', 'availableEquity'],
    },
    execute: async (params, context) => {
        const date = params.decidedDate ?? new Date().toISOString().split('T')[0]
        const remainingEquity = params.availableEquity - params.totalDividend
        const forsiktighetsOk = remainingEquity >= 0

        if (!forsiktighetsOk) {
            return {
                success: false,
                error: `Försiktighetsregeln ej uppfylld — utdelning (${params.totalDividend.toLocaleString('sv-SE')} kr) överstiger fritt eget kapital (${params.availableEquity.toLocaleString('sv-SE')} kr).`,
            }
        }

        if (context?.isConfirmed) {
            try {
                const result = await shareholderService.recordDividendDecision({
                    totalDividend: params.totalDividend,
                    dividendPerShare: params.dividendPerShare,
                    fiscalYear: params.fiscalYear,
                    decidedDate: date,
                    availableEquity: params.availableEquity,
                })
                return {
                    success: true,
                    data: result,
                    message: `Utdelningsbeslut fattat: ${params.totalDividend.toLocaleString('sv-SE')} kr (${params.dividendPerShare} kr/aktie) för räkenskapsår ${params.fiscalYear}. Kvarvarande fritt eget kapital: ${remainingEquity.toLocaleString('sv-SE')} kr.`,
                }
            } catch {
                return { success: false, error: 'Kunde inte spara utdelningsbeslut.' }
            }
        }

        return {
            success: true,
            data: { id: '' },
            message: `Utdelningsbeslut förberett. Försiktighetsregeln uppfylld — ${remainingEquity.toLocaleString('sv-SE')} kr kvarblir. Bekräfta för att dokumentera beslutet.`,
            confirmationRequired: {
                title: 'Utdelningsbeslut',
                description: `Räkenskapsår ${params.fiscalYear}`,
                summary: [
                    { label: 'Total utdelning', value: `${params.totalDividend.toLocaleString('sv-SE')} kr` },
                    { label: 'Per aktie', value: `${params.dividendPerShare} kr` },
                    { label: 'Fritt eget kapital', value: `${params.availableEquity.toLocaleString('sv-SE')} kr` },
                    { label: 'Kvarblir', value: `${remainingEquity.toLocaleString('sv-SE')} kr` },
                    { label: 'Beslutsdatum', value: date },
                ],
                action: { toolName: 'record_dividend_decision', params },
            },
        }
    },
})

export const shareholderTools = [
    getShareholdersTool,
    getShareRegisterSummaryTool,
    addShareholderTool,
    transferSharesTool,
    recordDividendDecisionTool,
]
