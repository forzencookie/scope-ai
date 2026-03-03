/**
 * Bokföring AI Tools - Transactions
 *
 * Tools for reading and managing transactions.
 * These tools fetch from API endpoints which respect RLS.
 */

import { defineTool } from '../registry'
import type { Transaction } from '@/types'

// Helper to get base URL for API calls
function getBaseUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

// =============================================================================
// Transaction Tools
// =============================================================================

export interface GetTransactionsParams {
    limit?: number
    month?: string
    year?: number
    minAmount?: number
    maxAmount?: number
    status?: 'pending' | 'review' | 'booked'
}

export const getTransactionsTool = defineTool<GetTransactionsParams, Transaction[]>({
    name: 'get_transactions',
    description: 'Hämta banktransaktioner för ett datumintervall. Använd för att visa kontoutdrag, hitta specifika betalningar, analysera utgifter, eller förbereda avstämning mot bokföring. Vanliga frågor: "visa mina transaktioner", "vad har jag köpt", "kontoutdrag januari".',
    category: 'read',
    requiresConfirmation: false,
    domain: 'bokforing',
    keywords: ['transaktion', 'kontoutdrag', 'betalning', 'bank'],
    parameters: {
        type: 'object',
        properties: {
            limit: {
                type: 'number',
                description: 'Max antal transaktioner att hämta (standard: 10)',
            },
            month: {
                type: 'string',
                description: 'Månad att filtrera på (t.ex. "januari", "februari", "2024-01")',
            },
            year: {
                type: 'number',
                description: 'År att filtrera på (t.ex. 2024)',
            },
            minAmount: {
                type: 'number',
                description: 'Minsta belopp (absolut värde)',
            },
            maxAmount: {
                type: 'number',
                description: 'Högsta belopp (absolut värde)',
            },
            status: {
                type: 'string',
                enum: ['pending', 'review', 'booked'],
                description: 'Filtrera på status',
            },
        },
    },
    execute: async (params) => {
        // Convert month/year/dates
        let startDate: string | undefined
        let endDate: string | undefined

        // Handle year-only or month+year
        const year = params.year || new Date().getFullYear()

        if (params.month) {
            const monthMap: Record<string, number> = {
                'januari': 0, 'jan': 0, '01': 0,
                'februari': 1, 'feb': 1, '02': 1,
                'mars': 2, 'mar': 2, '03': 2,
                'april': 3, 'apr': 3, '04': 3,
                'maj': 4, '05': 4,
                'juni': 5, 'jun': 5, '06': 5,
                'juli': 6, 'jul': 6, '07': 6,
                'augusti': 7, 'aug': 7, '08': 7,
                'september': 8, 'sep': 8, '09': 8,
                'oktober': 9, 'okt': 9, '10': 9,
                'november': 10, 'nov': 10, '11': 10,
                'december': 11, 'dec': 11, '12': 11
            }

            let monthIndex = monthMap[params.month.toLowerCase()]
            // If month not found but it looks like a number
            if (monthIndex === undefined && !isNaN(parseInt(params.month))) {
                monthIndex = parseInt(params.month) - 1
            }

            if (monthIndex !== undefined) {
                const start = new Date(year, monthIndex, 1)
                const end = new Date(year, monthIndex + 1, 0)
                // Format as YYYY-MM-DD
                startDate = start.toISOString().split('T')[0]
                endDate = end.toISOString().split('T')[0]
            }
        } else if (params.year) {
            startDate = `${year}-01-01`
            endDate = `${year}-12-31`
        }

        // Fetch transactions from API (RLS-protected)
        let transactions: Transaction[] = []
        try {
            const baseUrl = getBaseUrl()
            const queryParams = new URLSearchParams()
            if (params.limit) queryParams.set('limit', params.limit.toString())
            if (startDate) queryParams.set('startDate', startDate)
            if (endDate) queryParams.set('endDate', endDate)
            if (params.status) queryParams.set('status', params.status)

            const res = await fetch(`${baseUrl}/api/transactions?${queryParams}`, {
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                const data = await res.json()
                transactions = (data.transactions || []).slice(0, params.limit || 10)

                // Apply amount filters client-side if provided
                if (params.minAmount !== undefined) {
                    transactions = transactions.filter(t => Math.abs(Number(t.amount || 0)) >= params.minAmount!)
                }
                if (params.maxAmount !== undefined) {
                    transactions = transactions.filter(t => Math.abs(Number(t.amount || 0)) <= params.maxAmount!)
                }
            }
        } catch (error) {
            console.error('[AI Tool] Failed to fetch transactions:', error)
        }

        return {
            success: true,
            data: transactions,
            message: transactions.length > 0
                ? `Hittade ${transactions.length} transaktioner.`
                : 'Inga transaktioner hittades för den valda perioden.',
        }
    },
})

export interface CategorizeTransactionParams {
    transactionId: string
    category: string
    account?: string
}

export const categorizeTransactionTool = defineTool<CategorizeTransactionParams, { success: boolean }>({
    name: 'categorize_transaction',
    description: 'Kategorisera en enskild banktransaktion till ett BAS-konto. Använd efter att ha identifierat vilken typ av kostnad/intäkt transaktionen representerar. T.ex. "Spotify 169 kr" → konto 6993 (IT-tjänster).',
    category: 'write',
    requiresConfirmation: false,
    domain: 'bokforing',
    keywords: ['kategorisera', 'bokföra', 'konto', 'transaktion'],
    parameters: {
        type: 'object',
        properties: {
            transactionId: {
                type: 'string',
                description: 'ID för transaktionen',
            },
            category: {
                type: 'string',
                description: 'Kategori (t.ex. "kontorsmaterial", "resor")',
            },
            account: {
                type: 'string',
                description: 'Kontonummer i BAS-kontoplanen',
            },
        },
        required: ['transactionId', 'category'],
    },
    execute: async (params) => {
        try {
            const baseUrl = getBaseUrl()
            const res = await fetch(`${baseUrl}/api/transactions/${params.transactionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: params.category,
                    account: params.account,
                }),
            })

            if (!res.ok) {
                // Fallback: try PUT if PATCH is not supported
                const res2 = await fetch(`${baseUrl}/api/transactions/${params.transactionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        category: params.category,
                        account: params.account,
                    }),
                })
                if (!res2.ok) {
                    return { success: false, error: 'Kunde inte kategorisera transaktion.' }
                }
            }

            return {
                success: true,
                data: { success: true },
                message: `Transaktion kategoriserad som "${params.category}"${params.account ? ` (konto ${params.account})` : ''}.`,
            }
        } catch {
            return { success: false, error: 'Kunde inte kategorisera transaktion.' }
        }
    },
})

export interface CreateTransactionParams {
    amount: number
    description: string
    date?: string
    account?: string
    category?: string
}

export interface CreatedTransaction {
    id: string
    amount: number
    description: string
    date?: string
    account?: string
    category?: string
}

export const createTransactionTool = defineTool<CreateTransactionParams, CreatedTransaction>({
    name: 'create_transaction',
    description: 'Skapa en manuell verifikation för poster som inte kommer via bank, t.ex. kontant betalning, ägarinsättning, periodisering, eller justering. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    domain: 'bokforing',
    keywords: ['skapa', 'transaktion', 'betalning', 'ny'],
    parameters: {
        type: 'object',
        properties: {
            amount: {
                type: 'number',
                description: 'Belopp i kronor',
            },
            description: {
                type: 'string',
                description: 'Beskrivning av transaktionen',
            },
            date: {
                type: 'string',
                description: 'Datum (YYYY-MM-DD)',
            },
            account: {
                type: 'string',
                description: 'Kontonummer',
            },
            category: {
                type: 'string',
                description: 'Kategori',
            },
        },
        required: ['amount', 'description'],
    },
    execute: async (params, context) => {
        const date = params.date || new Date().toISOString().split('T')[0]

        // If confirmed, persist to database
        if (context?.isConfirmed) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                const res = await fetch(`${baseUrl}/api/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        description: params.description,
                        amount: params.amount,
                        date,
                        counterparty: params.category || null,
                        status: 'pending',
                    }),
                })

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    return { success: false, error: err.error || 'Kunde inte skapa transaktion.' }
                }

                const data = await res.json()
                return {
                    success: true,
                    data: {
                        id: data.transaction?.id || data.id,
                        amount: params.amount,
                        description: params.description,
                        date,
                        account: params.account,
                        category: params.category,
                    },
                    message: `Transaktion skapad: ${params.description} (${params.amount.toLocaleString('sv-SE')} kr). Sparad i databasen.`,
                }
            } catch (error) {
                return { success: false, error: 'Kunde inte spara transaktion.' }
            }
        }

        // Preflight: return confirmation request
        return {
            success: true,
            data: {
                id: 'pending',
                amount: params.amount,
                description: params.description,
                date,
                account: params.account,
                category: params.category,
            },
            message: `Transaktion förberedd: ${params.description} (${params.amount.toLocaleString('sv-SE')} kr). Bekräfta för att spara.`,
            confirmationRequired: {
                title: 'Skapa transaktion',
                description: params.description,
                summary: [
                    { label: 'Beskrivning', value: params.description },
                    { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                    { label: 'Datum', value: date },
                    ...(params.account ? [{ label: 'Konto', value: params.account }] : []),
                ],
                action: { toolName: 'create_transaction', params },
                requireCheckbox: false,
            },
        }
    },
})

// =============================================================================
// Bulk Categorize Transactions Tool
// =============================================================================

export interface BulkCategorizeParams {
    /** Either provide transaction IDs, or use filters to select */
    transactionIds?: string[]
    /** Auto-categorize all uncategorized transactions */
    uncategorizedOnly?: boolean
    /** Apply a specific category/account to matching transactions */
    pattern?: string
    account?: string
}

export interface BulkCategorizeResult {
    categorized: number
    skipped: number
    errors: number
}

export const bulkCategorizeTransactionsTool = defineTool<BulkCategorizeParams, BulkCategorizeResult>({
    name: 'bulk_categorize_transactions',
    description: 'Kategorisera flera transaktioner på en gång. Använd när användaren säger "kontera januari", "bokför allt", eller vill snabbt hantera återkommande transaktioner som hyra, löner, eller prenumerationer. Föreslår konton baserat på leverantörsnamn. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    domain: 'bokforing',
    keywords: ['bulk', 'kategorisera', 'flera', 'transaktioner'],
    parameters: {
        type: 'object',
        properties: {
            transactionIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Lista med transaktions-ID att kategorisera',
            },
            uncategorizedOnly: {
                type: 'boolean',
                description: 'Kategorisera endast okonerade transaktioner (standard: true)',
            },
            pattern: {
                type: 'string',
                description: 'Textmönster att matcha (t.ex. "Spotify" → alla Spotify-transaktioner)',
            },
            account: {
                type: 'string',
                description: 'Kontonummer att använda för matchade transaktioner',
            },
        },
    },
    execute: async (params) => {
        // Fetch uncategorized transactions if no IDs provided
        let transactions: Transaction[] = []

        try {
            const baseUrl = getBaseUrl()
            const queryParams = new URLSearchParams()
            queryParams.set('status', 'pending')
            queryParams.set('limit', '100')

            const res = await fetch(`${baseUrl}/api/transactions?${queryParams}`, {
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                const data = await res.json()
                transactions = data.transactions || []

                // Filter by pattern if provided
                if (params.pattern) {
                    const pattern = params.pattern.toLowerCase()
                    transactions = transactions.filter(t =>
                        t.name?.toLowerCase().includes(pattern) ||
                        (t as Transaction & { description?: string }).description?.toLowerCase().includes(pattern)
                    )
                }

                // Filter by specific IDs if provided
                if (params.transactionIds && params.transactionIds.length > 0) {
                    transactions = transactions.filter(t => params.transactionIds!.includes(t.id))
                }
            }
        } catch (error) {
            console.error('[AI Tool] Failed to fetch transactions for bulk categorize:', error)
        }

        const count = transactions.length
        const confirmationSummary = [
            { label: 'Antal transaktioner', value: String(count) },
        ]

        if (params.pattern) {
            confirmationSummary.push({ label: 'Mönster', value: params.pattern })
        }
        if (params.account) {
            confirmationSummary.push({ label: 'Konto', value: params.account })
        }

        return {
            success: true,
            data: { categorized: count, skipped: 0, errors: 0 },
            message: `${count} transaktioner förberedda för kontering.`,
            confirmationRequired: {
                title: 'Masskontering av transaktioner',
                description: `Kontera ${count} transaktioner${params.pattern ? ` som matchar "${params.pattern}"` : ''}`,
                summary: confirmationSummary,
                action: { toolName: 'bulk_categorize_transactions', params },
                requireCheckbox: true,
            },
        }
    },
})

// =============================================================================
// Get Transactions Missing Receipts Tool
// =============================================================================

export interface GetTransactionsMissingReceiptsParams {
    minAmount?: number
    limit?: number
}

export const getTransactionsMissingReceiptsTool = defineTool<GetTransactionsMissingReceiptsParams, Transaction[]>({
    name: 'get_transactions_missing_receipts',
    description: 'Lista transaktioner över 500 kr som saknar bifogat kvitto. Använd för att följa upp dokumentation inför bokslut eller revision. Vanliga frågor: "vilka kvitton saknas", "vad måste jag ladda upp".',
    category: 'read',
    requiresConfirmation: false,
    domain: 'bokforing',
    keywords: ['saknas', 'kvitto', 'transaktion', 'underlag'],
    parameters: {
        type: 'object',
        properties: {
            minAmount: {
                type: 'number',
                description: 'Minsta belopp för att inkluderas (standard: 500 kr)',
            },
            limit: {
                type: 'number',
                description: 'Max antal att visa (standard: 20)',
            },
        },
    },
    execute: async (params) => {
        const minAmount = params.minAmount ?? 500
        const limit = params.limit ?? 20

        let transactions: Transaction[] = []

        try {
            const baseUrl = getBaseUrl()
            const res = await fetch(`${baseUrl}/api/transactions?limit=100&missingReceipt=true`, {
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                const data = await res.json()
                transactions = (data.transactions || [])
                    .filter((t: Transaction) => Math.abs(Number(t.amount || 0)) >= minAmount)
                    .slice(0, limit)
            }
        } catch (error) {
            console.error('[AI Tool] Failed to fetch transactions missing receipts:', error)
        }

        const totalMissing = transactions.length

        return {
            success: true,
            data: transactions,
            message: totalMissing > 0
                ? `Hittade ${totalMissing} transaktioner över ${minAmount} kr som saknar kvitto.`
                : `Inga transaktioner över ${minAmount} kr saknar kvitto. 🎉`,
        }
    },
})

// =============================================================================
// Match Payment to Invoice Tool
// =============================================================================

export interface MatchPaymentToInvoiceParams {
    transactionId: string
    invoiceId: string
}

export interface PaymentMatchResult {
    matched: boolean
    transactionId: string
    invoiceId: string
    amount: number
}

export const matchPaymentToInvoiceTool = defineTool<MatchPaymentToInvoiceParams, PaymentMatchResult>({
    name: 'match_payment_to_invoice',
    description: 'Koppla en inbetalning till en kundfaktura för att markera fakturan som betald och bokföra betalningen korrekt. Använd när du ser en betalning på kontot och vill stänga motsvarande faktura. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    domain: 'bokforing',
    keywords: ['matcha', 'betalning', 'faktura', 'koppling'],
    parameters: {
        type: 'object',
        properties: {
            transactionId: {
                type: 'string',
                description: 'ID för betalningen/transaktionen',
            },
            invoiceId: {
                type: 'string',
                description: 'ID för fakturan att matcha mot',
            },
        },
        required: ['transactionId', 'invoiceId'],
    },
    execute: async (params, context) => {
        // If confirmed, call the payment API and update transaction status
        if (context?.isConfirmed) {
            try {
                const baseUrl = getBaseUrl()

                // 1. Call invoice payment endpoint (creates pending booking + marks invoice as Betald)
                const payRes = await fetch(`${baseUrl}/api/invoices/${params.invoiceId}/pay`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transactionId: params.transactionId }),
                })

                if (!payRes.ok) {
                    const err = await payRes.json().catch(() => ({}))
                    return { success: false, error: err.error || 'Kunde inte registrera betalning.' }
                }

                // 2. Update transaction status to booked
                await fetch(`${baseUrl}/api/transactions/${params.transactionId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Bokförd' }),
                })

                return {
                    success: true,
                    data: {
                        matched: true,
                        transactionId: params.transactionId,
                        invoiceId: params.invoiceId,
                        amount: 0,
                    },
                    message: `Betalning matchad mot faktura och markerad som betald.`,
                }
            } catch {
                return { success: false, error: 'Kunde inte matcha betalning mot faktura.' }
            }
        }

        // Preflight: return confirmation request
        return {
            success: true,
            data: {
                matched: false,
                transactionId: params.transactionId,
                invoiceId: params.invoiceId,
                amount: 0,
            },
            message: `Betalning förberedd för matchning mot faktura.`,
            confirmationRequired: {
                title: 'Matcha betalning',
                description: 'Koppla betalningen till fakturan och markera som betald',
                summary: [
                    { label: 'Transaktion', value: params.transactionId },
                    { label: 'Faktura', value: params.invoiceId },
                ],
                action: { toolName: 'match_payment_to_invoice', params },
                requireCheckbox: false,
            },
        }
    },
})

export const transactionTools = [
    getTransactionsTool,
    categorizeTransactionTool,
    createTransactionTool,
    bulkCategorizeTransactionsTool,
    getTransactionsMissingReceiptsTool,
    matchPaymentToInvoiceTool,
]
