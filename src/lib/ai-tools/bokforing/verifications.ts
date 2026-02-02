/**
 * Bokföring AI Tools - Verifications (Extended)
 *
 * Tools for managing verifications (verifikat) including queries, periodization, and reversals.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { verificationService, Verification } from '@/services/verification-service'

// =============================================================================
// Get Verifications Tool (NEW - queries real database)
// =============================================================================

export interface GetVerificationsParams {
    search?: string
    series?: string
    startDate?: string
    endDate?: string
    year?: number
    limit?: number
}

export const getVerificationsTool = defineTool<GetVerificationsParams, Verification[]>({
    name: 'get_verifications',
    description: 'Hämta verifikationer från bokföringen. Kan filtreras på serie, datum och sökterm.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            search: { type: 'string', description: 'Sök i beskrivning' },
            series: { type: 'string', description: 'Verifikationsserie (t.ex. A, B, K)' },
            startDate: { type: 'string', description: 'Från datum (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'Till datum (YYYY-MM-DD)' },
            year: { type: 'number', description: 'Räkenskapsår' },
            limit: { type: 'number', description: 'Max antal (standard: 20)' },
        },
    },
    execute: async (params) => {
        try {
            const limit = params.limit || 20
            const { verifications, totalCount } = await verificationService.getVerifications({
                limit,
                search: params.search,
                series: params.series,
                startDate: params.startDate,
                endDate: params.endDate,
                year: params.year
            })

            if (verifications.length === 0) {
                return {
                    success: true,
                    data: [] as Verification[],
                    message: 'Inga verifikationer hittades med dessa filter.',
                }
            }

            return {
                success: true,
                data: verifications,
                message: `Hittade ${totalCount} verifikationer, visar ${verifications.length}.`,
            }
        } catch (error) {
            console.error('Failed to fetch verifications:', error)
            return {
                success: false,
                error: 'Kunde inte hämta verifikationer från databasen.',
            }
        }
    },
})

// =============================================================================
// Get Verification Stats Tool
// =============================================================================

export const getVerificationStatsTool = defineTool<Record<string, never>, {
    totalCount: number
    currentYearCount: number
    lastVerificationNumber: number
    lastVerificationDate: string | null
}>({
    name: 'get_verification_stats',
    description: 'Hämta statistik om verifikationer - antal, senaste nummer, etc.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            const stats = await verificationService.getStats()
            
            return {
                success: true,
                data: stats,
                message: `Det finns ${stats.currentYearCount} verifikationer i år. Senaste: ${stats.lastVerificationNumber}.`,
            }
        } catch (error) {
            console.error('Failed to fetch verification stats:', error)
            return {
                success: false,
                error: 'Kunde inte hämta verifikationsstatistik.',
            }
        }
    },
})

// =============================================================================
// Periodize Expense Tool
// =============================================================================

export interface PeriodizeExpenseParams {
    description: string
    totalAmount: number
    startDate: string
    months: number
    sourceAccount?: string
    targetAccount?: string
}

export interface PeriodizationEntry {
    period: string
    amount: number
    date: string
}

export interface PeriodizeExpenseResult {
    entries: PeriodizationEntry[]
    totalAmount: number
    monthlyAmount: number
}

export const periodizeExpenseTool = defineTool<PeriodizeExpenseParams, PeriodizeExpenseResult>({
    name: 'periodize_expense',
    description: 'Periodisera en kostnad över flera månader. Skapar automatiska bokföringsposter.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            description: { type: 'string', description: 'Beskrivning (t.ex. "Försäkringspremie 2025")' },
            totalAmount: { type: 'number', description: 'Totalt belopp att periodisera' },
            startDate: { type: 'string', description: 'Startdatum för periodiseringen (YYYY-MM-DD)' },
            months: { type: 'number', description: 'Antal månader att fördela över' },
            sourceAccount: { type: 'string', description: 'Källkonto (standard: 1790 Förutbetalda kostnader)' },
            targetAccount: { type: 'string', description: 'Målkonto för månatlig kostnad' },
        },
        required: ['description', 'totalAmount', 'startDate', 'months'],
    },
    execute: async (params) => {
        const monthlyAmount = Math.round(params.totalAmount / params.months)
        const sourceAccount = params.sourceAccount || '1790'
        const targetAccount = params.targetAccount || '6310'
        
        // Generate entries for each month
        const startDate = new Date(params.startDate)
        const entries: PeriodizationEntry[] = []
        
        for (let i = 0; i < params.months; i++) {
            const entryDate = new Date(startDate)
            entryDate.setMonth(entryDate.getMonth() + i)
            
            entries.push({
                period: entryDate.toLocaleString('sv-SE', { month: 'long', year: 'numeric' }),
                amount: monthlyAmount,
                date: entryDate.toISOString().split('T')[0],
            })
        }

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Periodisera kostnad',
            description: params.description,
            summary: [
                { label: 'Beskrivning', value: params.description },
                { label: 'Totalt belopp', value: `${params.totalAmount.toLocaleString('sv-SE')} kr` },
                { label: 'Antal månader', value: String(params.months) },
                { label: 'Månadsbelopp', value: `${monthlyAmount.toLocaleString('sv-SE')} kr` },
                { label: 'Från konto', value: `${sourceAccount} (Förutbetalda kostnader)` },
                { label: 'Till konto', value: targetAccount },
            ],
            action: { toolName: 'periodize_expense', params },
            requireCheckbox: true,
        }

        return {
            success: true,
            data: {
                entries,
                totalAmount: params.totalAmount,
                monthlyAmount,
            },
            message: `Periodisering förberedd: ${monthlyAmount.toLocaleString('sv-SE')} kr/månad i ${params.months} månader.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

// =============================================================================
// Reverse Verification Tool
// =============================================================================

export interface ReverseVerificationParams {
    verificationId: string
    reason?: string
    reversalDate?: string
}

export interface ReverseVerificationResult {
    originalId: string
    reversalId: string
    amount: number
}

export const reverseVerificationTool = defineTool<ReverseVerificationParams, ReverseVerificationResult>({
    name: 'reverse_verification',
    description: 'Återför/ångra en verifikation genom att skapa en motbokning.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            verificationId: { type: 'string', description: 'ID för verifikationen att återföra' },
            reason: { type: 'string', description: 'Anledning till återföringen' },
            reversalDate: { type: 'string', description: 'Datum för återföringen (standard: idag)' },
        },
        required: ['verificationId'],
    },
    execute: async (params) => {
        const reversalDate = params.reversalDate || new Date().toISOString().split('T')[0]
        const reversalId = `ver-${Date.now()}-rev`
        
        // In production, fetch the original verification and swap debit/credit
        const mockAmount = 5000 // Would be fetched

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Återför verifikation',
            description: `Skapa motbokning för verifikation ${params.verificationId}`,
            summary: [
                { label: 'Original', value: params.verificationId },
                { label: 'Återföringsverifikation', value: reversalId },
                { label: 'Datum', value: reversalDate },
                { label: 'Anledning', value: params.reason || 'Rättelse' },
            ],
            action: { toolName: 'reverse_verification', params },
            requireCheckbox: true,
        }

        return {
            success: true,
            data: {
                originalId: params.verificationId,
                reversalId,
                amount: mockAmount,
            },
            message: `Återföring av verifikation ${params.verificationId} förberedd.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

// =============================================================================
// Create Accrual Tool
// =============================================================================

export interface CreateAccrualParams {
    type: 'upplupen_kostnad' | 'upplupen_intakt' | 'forutbetald_kostnad' | 'forutbetald_intakt'
    description: string
    amount: number
    date?: string
    account?: string
}

export interface AccrualResult {
    id: string
    type: string
    amount: number
    verificationId: string
}

export const createAccrualTool = defineTool<CreateAccrualParams, AccrualResult>({
    name: 'create_accrual',
    description: 'Skapa periodavgränsningspost (upplupen kostnad/intäkt, förutbetald kostnad/intäkt).',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            type: { 
                type: 'string', 
                enum: ['upplupen_kostnad', 'upplupen_intakt', 'forutbetald_kostnad', 'forutbetald_intakt'],
                description: 'Typ av periodavgränsning'
            },
            description: { type: 'string', description: 'Beskrivning' },
            amount: { type: 'number', description: 'Belopp' },
            date: { type: 'string', description: 'Bokföringsdatum (standard: månadens sista dag)' },
            account: { type: 'string', description: 'Motkonto' },
        },
        required: ['type', 'description', 'amount'],
    },
    execute: async (params) => {
        const accrualAccounts = {
            'upplupen_kostnad': '2990',
            'upplupen_intakt': '1790',
            'forutbetald_kostnad': '1790',
            'forutbetald_intakt': '2990',
        }

        const typeLabels = {
            'upplupen_kostnad': 'Upplupen kostnad',
            'upplupen_intakt': 'Upplupen intäkt',
            'forutbetald_kostnad': 'Förutbetald kostnad',
            'forutbetald_intakt': 'Förutbetald intäkt',
        }

        const account = params.account || accrualAccounts[params.type]
        const date = params.date || new Date().toISOString().split('T')[0]

        const confirmationRequest: AIConfirmationRequest = {
            title: typeLabels[params.type],
            description: params.description,
            summary: [
                { label: 'Typ', value: typeLabels[params.type] },
                { label: 'Beskrivning', value: params.description },
                { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                { label: 'Konto', value: account },
                { label: 'Datum', value: date },
            ],
            action: { toolName: 'create_accrual', params },
            requireCheckbox: false,
        }

        return {
            success: true,
            data: {
                id: `acc-${Date.now()}`,
                type: params.type,
                amount: params.amount,
                verificationId: `ver-${Date.now()}`,
            },
            message: `${typeLabels[params.type]} på ${params.amount.toLocaleString('sv-SE')} kr förberedd.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

export const verificationExtendedTools = [
    getVerificationsTool,
    getVerificationStatsTool,
    periodizeExpenseTool,
    reverseVerificationTool,
    createAccrualTool,
]
