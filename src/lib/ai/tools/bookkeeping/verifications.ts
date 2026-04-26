/**
 * Bokföring AI Tools - Verifications (Extended)
 *
 * Tools for managing verifications (verifikat) including queries, periodization, and reversals.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { verificationService } from '@/services/accounting/verification-service'
import { isValidAccount } from '@/lib/bookkeeping/utils'
import type { Verification } from '@/types'

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
    description: 'Hämta verifikationer (bokföringsposter) från huvudboken. Kan filtreras på serie, datum och sökterm. Använd för att hitta specifika bokföringsposter eller förstå vad en viss post gäller.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: [],
  domain: 'bokforing',
    keywords: ['verifikation', 'verifikat', 'bokföring', 'lista'],
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
    domain: 'bokforing',
    keywords: ['verifikation', 'statistik', 'antal'],
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
  allowedCompanyTypes: [],
  domain: 'bokforing',
    keywords: ['periodisera', 'kostnad', 'fördela'],
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
    execute: async (params, context) => {
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

        // If confirmed, create real verifications for each month
        if (context?.isConfirmed) {
            try {
                const createdVerifications: string[] = []

                for (const entry of entries) {
                    const verification = await verificationService.createVerification({
                        series: 'A',
                        date: entry.date,
                        description: `Periodisering: ${params.description} (${entry.period})`,
                        entries: [
                            { account: targetAccount, debit: entry.amount, credit: 0, description: params.description },
                            { account: sourceAccount, debit: 0, credit: entry.amount, description: 'Förutbetald kostnad' },
                        ],
                        sourceType: 'periodization',
                    })
                    createdVerifications.push(`${verification.series}${verification.number}`)
                }

                return {
                    success: true,
                    data: { entries, totalAmount: params.totalAmount, monthlyAmount },
                    message: `Periodisering klar: ${createdVerifications.length} verifikationer skapade (${createdVerifications.join(', ')}).`,
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Kunde inte skapa periodiseringar.'
                return { success: false, error: msg }
            }
        }

        // Preflight: return confirmation request
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
            data: { entries, totalAmount: params.totalAmount, monthlyAmount },
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
  allowedCompanyTypes: [],
  domain: 'bokforing',
    keywords: ['reversera', 'ångra', 'verifikation', 'korrigera'],
    parameters: {
        type: 'object',
        properties: {
            verificationId: { type: 'string', description: 'ID för verifikationen att återföra' },
            reason: { type: 'string', description: 'Anledning till återföringen' },
            reversalDate: { type: 'string', description: 'Datum för återföringen (standard: idag)' },
        },
        required: ['verificationId'],
    },
    execute: async (params, context) => {
        const reversalDate = params.reversalDate || new Date().toISOString().split('T')[0]

        // Fetch the original verification
        const original = await verificationService.getVerificationById(params.verificationId)
        if (!original) {
            return { success: false, error: `Verifikation ${params.verificationId} hittades inte.` }
        }

        const amount = original.totalDebit

        // If confirmed, create real reversal verification
        if (context?.isConfirmed) {
            try {
                // Swap debit/credit on all entries
                const reversedEntries = original.entries.map(entry => ({
                    account: entry.account,
                    debit: entry.credit,
                    credit: entry.debit,
                    description: entry.description,
                }))

                const reversal = await verificationService.createVerification({
                    series: original.series,
                    date: reversalDate,
                    description: `Återföring: ${original.description} (${params.reason || 'Rättelse'})`,
                    entries: reversedEntries,
                    sourceType: 'reversal',
                    sourceId: params.verificationId,
                })

                return {
                    success: true,
                    data: {
                        originalId: params.verificationId,
                        reversalId: reversal.id,
                        amount,
                    },
                    message: `Återföring skapad: ${reversal.series}${reversal.number} (${amount.toLocaleString('sv-SE')} kr).`,
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Kunde inte skapa återföring.'
                return { success: false, error: msg }
            }
        }

        // Preflight: return confirmation request
        const confirmationRequest: AIConfirmationRequest = {
            title: 'Återför verifikation',
            description: `Skapa motbokning för ${original.series}${original.number}: ${original.description}`,
            summary: [
                { label: 'Original', value: `${original.series}${original.number}` },
                { label: 'Belopp', value: `${amount.toLocaleString('sv-SE')} kr` },
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
                reversalId: 'pending',
                amount,
            },
            message: `Återföring av ${original.series}${original.number} förberedd (${amount.toLocaleString('sv-SE')} kr).`,
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
  allowedCompanyTypes: [],
  domain: 'bokforing',
    keywords: ['upplupen', 'periodisering', 'accrual'],
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
    execute: async (params, context) => {
        const accrualAccounts: Record<string, string> = {
            'upplupen_kostnad': '2990',
            'upplupen_intakt': '1790',
            'forutbetald_kostnad': '1790',
            'forutbetald_intakt': '2990',
        }

        // Cost/revenue contra accounts
        const contraAccounts: Record<string, string> = {
            'upplupen_kostnad': '6999',   // Diverse kostnader
            'upplupen_intakt': '3999',    // Övriga intäkter
            'forutbetald_kostnad': '6310', // Diverse kostnader
            'forutbetald_intakt': '3999',  // Övriga intäkter
        }

        const typeLabels: Record<string, string> = {
            'upplupen_kostnad': 'Upplupen kostnad',
            'upplupen_intakt': 'Upplupen intäkt',
            'forutbetald_kostnad': 'Förutbetald kostnad',
            'forutbetald_intakt': 'Förutbetald intäkt',
        }

        const balanceAccount = accrualAccounts[params.type] || '2990'
        const costRevenueAccount = params.account || contraAccounts[params.type] || '6999'
        const date = params.date || new Date().toISOString().split('T')[0]
        const label = typeLabels[params.type] || params.type

        // If confirmed, create accrual verification + next-month reversal
        if (context?.isConfirmed) {
            try {
                // Determine debit/credit based on type
                const isKostnad = params.type === 'upplupen_kostnad' || params.type === 'forutbetald_kostnad'
                const accrualEntries = isKostnad
                    ? [
                        { account: costRevenueAccount, debit: params.amount, credit: 0, description: label },
                        { account: balanceAccount, debit: 0, credit: params.amount, description: label },
                    ]
                    : [
                        { account: balanceAccount, debit: params.amount, credit: 0, description: label },
                        { account: costRevenueAccount, debit: 0, credit: params.amount, description: label },
                    ]

                const verification = await verificationService.createVerification({
                    series: 'A',
                    date,
                    description: `${label}: ${params.description}`,
                    entries: accrualEntries,
                    sourceType: 'accrual',
                })

                // Create reversal on the first day of the next month
                const nextMonth = new Date(date)
                nextMonth.setMonth(nextMonth.getMonth() + 1, 1)
                const reversalDate = nextMonth.toISOString().split('T')[0]

                const reversalEntries = accrualEntries.map(e => ({
                    account: e.account,
                    debit: e.credit,
                    credit: e.debit,
                    description: `Återföring: ${e.description}`,
                }))

                const reversal = await verificationService.createVerification({
                    series: 'A',
                    date: reversalDate,
                    description: `Återföring ${label}: ${params.description}`,
                    entries: reversalEntries,
                    sourceType: 'accrual_reversal',
                    sourceId: verification.id,
                })

                return {
                    success: true,
                    data: {
                        id: verification.id,
                        type: params.type,
                        amount: params.amount,
                        verificationId: verification.id,
                    },
                    message: `${label} bokförd (${verification.series}${verification.number}) med automatisk återföring (${reversal.series}${reversal.number}).`,
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Kunde inte skapa periodavgränsning.'
                return { success: false, error: msg }
            }
        }

        // Preflight: return confirmation request
        const confirmationRequest: AIConfirmationRequest = {
            title: label,
            description: params.description,
            summary: [
                { label: 'Typ', value: label },
                { label: 'Beskrivning', value: params.description },
                { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                { label: 'Balanskonto', value: balanceAccount },
                { label: 'Resultat-/intäktskonto', value: costRevenueAccount },
                { label: 'Datum', value: date },
            ],
            action: { toolName: 'create_accrual', params },
            requireCheckbox: false,
        }

        return {
            success: true,
            data: {
                id: 'pending',
                type: params.type,
                amount: params.amount,
                verificationId: 'pending',
            },
            message: `${label} på ${params.amount.toLocaleString('sv-SE')} kr förberedd.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

// =============================================================================
// Book Receipt with Verification Tool
// =============================================================================

export interface BookReceiptParams {
    receiptId: string
    supplier: string
    amount: number
    date: string
    expenseAccount: string
    paymentAccount?: string
    description?: string
    vatRate?: number
}

export interface BookReceiptResult {
    receiptId: string
    verificationId: string
    verificationNumber: string
    amount: number
}

export const bookReceiptTool = defineTool<BookReceiptParams, BookReceiptResult>({
    name: 'book_receipt_with_verification',
    description: 'Bokför ett kvitto genom att skapa en verifikation med kopplade konteringsrader. Kvittot sparas som underlag (bilaga) på verifikationen. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    allowedCompanyTypes: [],
    domain: 'bokforing',
    keywords: ['kvitto', 'bokför', 'verifikation', 'underlag', 'bilaga'],
    parameters: {
        type: 'object',
        properties: {
            receiptId: { type: 'string', description: 'ID för kvittot att bokföra' },
            supplier: { type: 'string', description: 'Leverantör' },
            amount: { type: 'number', description: 'Belopp exkl. moms' },
            date: { type: 'string', description: 'Bokföringsdatum (YYYY-MM-DD)' },
            expenseAccount: { type: 'string', description: 'Kostnadskonto (t.ex. 5410 Kontorsmaterial, 6110 Kontorsservice)' },
            paymentAccount: { type: 'string', description: 'Betalningskonto (standard: 1930 Företagskonto)' },
            description: { type: 'string', description: 'Beskrivning av köpet' },
            vatRate: { type: 'number', description: 'Momssats (t.ex. 0.25 = 25%)' },
        },
        required: ['receiptId', 'supplier', 'amount', 'date', 'expenseAccount'],
    },
    execute: async (params, context) => {
        const paymentAccount = params.paymentAccount || '1930'

        // Validate accounts against BAS kontoplan
        if (!isValidAccount(params.expenseAccount)) {
            return { success: false, error: `Ogiltigt kostnadskonto: ${params.expenseAccount}. Kontrollera mot BAS-kontoplanen.` }
        }
        if (!isValidAccount(paymentAccount)) {
            return { success: false, error: `Ogiltigt betalningskonto: ${paymentAccount}. Kontrollera mot BAS-kontoplanen.` }
        }

        const desc = params.description || `Kvitto: ${params.supplier}`
        const vatRate = params.vatRate || 0
        const vatAmount = Math.round(params.amount * vatRate)
        const totalAmount = params.amount + vatAmount

        // Build journal entries
        const entries = [
            { account: params.expenseAccount, debit: params.amount, credit: 0, description: desc },
        ]

        // Add VAT entry if applicable
        if (vatAmount > 0) {
            entries.push({ account: '2640', debit: vatAmount, credit: 0, description: 'Ingående moms' })
        }

        // Credit payment account for total
        entries.push({ account: paymentAccount, debit: 0, credit: totalAmount, description: `Betalning ${params.supplier}` })

        if (context?.isConfirmed) {
            try {
                const verification = await verificationService.createVerification({
                    series: 'A',
                    date: params.date,
                    description: desc,
                    entries,
                    sourceType: 'receipt',
                    sourceId: params.receiptId,
                })

                return {
                    success: true,
                    data: {
                        receiptId: params.receiptId,
                        verificationId: verification.id,
                        verificationNumber: `${verification.series}${verification.number}`,
                        amount: totalAmount,
                    },
                    message: `Kvitto bokfört som ${verification.series}${verification.number} (${totalAmount.toLocaleString('sv-SE')} kr). Verifikationen är sparad med kvittot som underlag.`,
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Kunde inte bokföra kvittot.'
                return { success: false, error: msg }
            }
        }

        // Preflight: return confirmation request
        const summaryLines = [
            { label: 'Leverantör', value: params.supplier },
            { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
        ]

        if (vatAmount > 0) {
            summaryLines.push({ label: 'Moms', value: `${vatAmount.toLocaleString('sv-SE')} kr (${Math.round(vatRate * 100)}%)` })
            summaryLines.push({ label: 'Totalt', value: `${totalAmount.toLocaleString('sv-SE')} kr` })
        }

        summaryLines.push(
            { label: 'Kostnadskonto', value: params.expenseAccount },
            { label: 'Betalningskonto', value: paymentAccount },
            { label: 'Datum', value: params.date },
        )

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Bokför kvitto',
            description: desc,
            summary: summaryLines,
            action: { toolName: 'book_receipt_with_verification', params },
            requireCheckbox: true,
        }

        return {
            success: true,
            data: {
                receiptId: params.receiptId,
                verificationId: 'pending',
                verificationNumber: 'pending',
                amount: totalAmount,
            },
            message: `Kvitto från ${params.supplier} förberett för bokföring (${totalAmount.toLocaleString('sv-SE')} kr). Bekräfta för att spara.`,
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
    bookReceiptTool,
]
