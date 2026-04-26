/**
 * Bokföring AI Tools - Transactions
 *
 * Tools for reading and managing transactions.
 * These tools fetch from API endpoints which respect RLS.
 */

import { defineTool } from '../registry'
import type { Transaction } from '@/types'
import type { Block, DataRow } from '@/lib/ai/schema'

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
  allowedCompanyTypes: [],
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

        const booked = transactions.filter(t => t.status === 'Bokförd').length
        const unbooked = transactions.length - booked

        const block: Block = {
            title: "Transaktioner",
            description: transactions.length > 0 ? `${transactions.length} transaktioner${unbooked > 0 ? ` · ${unbooked} obokförda` : ''}` : undefined,
            rows: transactions.map((t): DataRow => ({
                icon: "transaction",
                title: (t as Transaction & { name?: string }).name || (t as Transaction & { description?: string }).description || "Transaktion",
                amount: Math.abs(Number(t.amount || 0)),
                timestamp: (t as Transaction & { date?: string; transaction_date?: string }).date || (t as Transaction & { transaction_date?: string }).transaction_date,
                status: t.status,
            })),
        }

        return {
            success: true,
            data: transactions,
            display: block,
            message: transactions.length > 0
                ? `Hittade ${transactions.length} transaktioner.`
                : 'Inga transaktioner hittades för den valda perioden.',
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
  allowedCompanyTypes: [],
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
// Audit Unbooked Tool
// =============================================================================

export interface AuditUnbookedParams {
    month?: string
    year?: number
    limit?: number
}

export interface AuditUnbookedResult {
    unbooked: Transaction[]
    receipts: Array<{ id: string; supplier: string; date: string; amount: string; status: string }>
    unbookedCount: number
}

export const auditUnbookedTool = defineTool<AuditUnbookedParams, AuditUnbookedResult>({
    name: 'audit_unbooked',
    description: 'Hämta obokförda transaktioner, kvitton och verifikationer för en period. Använd när användaren vill se vad som behöver bokföras, eller när du ska förbereda masskontering. Returnerar rådata — resonera om troliga konton och sammanhang baserat på beskrivningar och belopp.',
    category: 'read',
    requiresConfirmation: false,
    allowedCompanyTypes: [],
    domain: 'bokforing',
    keywords: ['obokförd', 'saknas', 'kontera', 'avstämning', 'granska', 'audit'],
    parameters: {
        type: 'object',
        properties: {
            month: { type: 'string', description: 'Månad (t.ex. "januari", "2024-03")' },
            year: { type: 'number', description: 'År (standard: innevarande år)' },
            limit: { type: 'number', description: 'Max antal transaktioner (standard: 50)' },
        },
    },
    execute: async (params) => {
        const baseUrl = getBaseUrl()
        const limit = params.limit ?? 50

        let startDate: string | undefined
        let endDate: string | undefined
        const year = params.year || new Date().getFullYear()

        if (params.month) {
            const monthMap: Record<string, number> = {
                'januari': 0, 'jan': 0, 'februari': 1, 'feb': 1, 'mars': 2, 'mar': 2,
                'april': 3, 'apr': 3, 'maj': 4, 'juni': 5, 'jun': 5, 'juli': 6, 'jul': 6,
                'augusti': 7, 'aug': 7, 'september': 8, 'sep': 8, 'oktober': 9, 'okt': 9,
                'november': 10, 'nov': 10, 'december': 11, 'dec': 11,
            }
            const monthIndex = monthMap[params.month.toLowerCase()] ?? (parseInt(params.month) - 1)
            if (!isNaN(monthIndex)) {
                startDate = new Date(year, monthIndex, 1).toISOString().split('T')[0]
                endDate = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0]
            }
        } else if (params.year) {
            startDate = `${year}-01-01`
            endDate = `${year}-12-31`
        }

        let unbooked: Transaction[] = []
        let receipts: AuditUnbookedResult['receipts'] = []

        try {
            const qp = new URLSearchParams({ status: 'pending', limit: String(limit) })
            if (startDate) qp.set('startDate', startDate)
            if (endDate) qp.set('endDate', endDate)

            const [txRes, rcRes] = await Promise.all([
                fetch(`${baseUrl}/api/transactions?${qp}`, { cache: 'no-store', headers: { 'Content-Type': 'application/json' } }),
                fetch(`${baseUrl}/api/receipts?status=pending&limit=50`, { cache: 'no-store', headers: { 'Content-Type': 'application/json' } }),
            ])

            if (txRes.ok) {
                const data = await txRes.json()
                unbooked = data.transactions || []
            }
            if (rcRes.ok) {
                const data = await rcRes.json()
                receipts = (data.receipts || []).map((r: { id: string; supplier: string; date: string; amount: string; status: string }) => ({
                    id: r.id,
                    supplier: r.supplier,
                    date: r.date,
                    amount: r.amount,
                    status: r.status,
                }))
            }
        } catch (error) {
            console.error('[AI Tool] audit_unbooked fetch error:', error)
        }

        const periodLabel = startDate ? `${startDate} – ${endDate}` : 'alla perioder'

        return {
            success: true,
            data: { unbooked, receipts, unbookedCount: unbooked.length },
            message: `${unbooked.length} obokförda transaktioner${receipts.length > 0 ? `, ${receipts.length} ohanterade kvitton` : ''} (${periodLabel}). Resonera om troliga konton baserat på beskrivning och belopp.`,
        }
    },
})

// =============================================================================
// Bulk Book Transactions Tool
// =============================================================================

export interface BulkBookEntry {
    account: string
    debit: number
    credit: number
    description?: string
}

export interface BulkBookTransaction {
    transactionId: string
    description: string
    amount: number
    date: string
    entries: BulkBookEntry[]
}

export interface BulkBookParams {
    transactions: BulkBookTransaction[]
}

export interface BulkBookResult {
    booked: number
    skipped: number
    errors: number
}

export const bulkBookTransactionsTool = defineTool<BulkBookParams, BulkBookResult>({
    name: 'bulk_book_transactions',
    description: 'Masskontera obokförda transaktioner. Anropa audit_unbooked + read_skill(accounting/bas-accounts) först för att bestämma rätt konton. Skicka sedan en lista med transaktioner och deras verifikationsrader. Kräver bekräftelse — visar BatchBookingCard innan något sparas.',
    category: 'write',
    requiresConfirmation: true,
    allowedCompanyTypes: [],
    domain: 'bokforing',
    keywords: ['masskontera', 'bulk', 'bokföra', 'transaktioner', 'kontera'],
    parameters: {
        type: 'object',
        properties: {
            transactions: {
                type: 'array',
                description: 'Lista med transaktioner att bokföra',
                items: {
                    type: 'object',
                    properties: {
                        transactionId: { type: 'string', description: 'ID för transaktionen' },
                        description: { type: 'string', description: 'Beskrivning (visas i verifikationen)' },
                        amount: { type: 'number', description: 'Belopp i kronor (absolut värde)' },
                        date: { type: 'string', description: 'Bokföringsdatum (YYYY-MM-DD)' },
                        entries: {
                            type: 'array',
                            description: 'Konteringsrader (debet/kredit måste balansera)',
                            items: {
                                type: 'object',
                                properties: {
                                    account: { type: 'string', description: 'BAS-kontonummer' },
                                    debit: { type: 'number' },
                                    credit: { type: 'number' },
                                    description: { type: 'string' },
                                },
                                required: ['account', 'debit', 'credit'],
                            },
                        },
                    },
                    required: ['transactionId', 'description', 'amount', 'date', 'entries'],
                },
            },
        },
        required: ['transactions'],
    },
    execute: async (params, context) => {
        const { verificationService } = await import('@/services/accounting/verification-service')
        const baseUrl = getBaseUrl()

        if (context?.isConfirmed) {
            let booked = 0
            let errors = 0

            for (const tx of params.transactions) {
                try {
                    await verificationService.createVerification({
                        date: tx.date,
                        description: tx.description,
                        entries: tx.entries,
                        sourceType: 'bulk_book',
                        sourceId: tx.transactionId,
                    })

                    await fetch(`${baseUrl}/api/transactions/${tx.transactionId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Bokförd' }),
                    })

                    booked++
                } catch {
                    errors++
                }
            }

            return {
                success: true,
                data: { booked, skipped: 0, errors },
                message: `${booked} transaktioner bokförda${errors > 0 ? `, ${errors} misslyckades` : ''}.`,
            }
        }

        // Preflight — return BatchBookingCard display
        const totalAmount = params.transactions.reduce((sum, tx) => sum + tx.amount, 0)

        const items = params.transactions.map(tx => ({
            id: tx.transactionId,
            title: tx.description,
            subtitle: tx.entries.map(e => e.account).join(' / '),
            rightValue: `${tx.amount.toLocaleString('sv-SE')} kr`,
        }))

        return {
            success: true,
            data: { booked: 0, skipped: 0, errors: 0 },
            display: {
                type: 'BatchBookingCard' as const,
                data: {
                    title: 'Masskontering',
                    description: `${params.transactions.length} transaktioner`,
                    items,
                    totalAmount: `${totalAmount.toLocaleString('sv-SE')} kr`,
                },
            },
            message: `${params.transactions.length} transaktioner förberedda för bokföring (totalt ${totalAmount.toLocaleString('sv-SE')} kr). Bekräfta för att bokföra alla.`,
        }
    },
})

export const transactionTools = [
    getTransactionsTool,
    createTransactionTool,
    auditUnbookedTool,
    bulkBookTransactionsTool,
]
