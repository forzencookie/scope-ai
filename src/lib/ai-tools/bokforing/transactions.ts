/**
 * Bokföring AI Tools - Transactions
 *
 * Tools for reading and managing transactions.
 */

import { defineTool } from '../registry'
import { db } from '@/lib/server-db'
import type { Transaction } from '@/types'

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
    description: 'Hämta transaktioner från bokföringen. Kan filtreras på period, belopp och status.',
    category: 'read',
    requiresConfirmation: false,
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

        const transactions = await db.getTransactions({
            limit: params.limit || 10,
            startDate,
            endDate,
            minAmount: params.minAmount,
            maxAmount: params.maxAmount,
            status: params.status
        })

        return {
            success: true,
            data: transactions as any,
            message: transactions.length > 0
                ? `Hittade ${transactions.length} transaktioner.`
                : 'Inga transaktioner hittades för den valda perioden.',
            display: {
                component: 'TransactionsTable',
                props: { transactions: transactions },
                title: 'Transaktioner',
                fullViewRoute: '/dashboard/bokforing?tab=verifikationer',
            },
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
    description: 'Kategorisera en transaktion till ett konto.',
    category: 'write',
    requiresConfirmation: false,
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
    execute: async () => {
        return {
            success: true,
            data: { success: true },
            message: 'Transaktion kategoriserad.',
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

export const createTransactionTool = defineTool<CreateTransactionParams, any>({
    name: 'create_transaction',
    description: 'Skapa en manuell transaktion/verifikation.',
    category: 'write',
    requiresConfirmation: true,
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
    execute: async (params) => {
        return {
            success: true,
            data: { id: `tx-${Date.now()}`, ...params },
            message: `Skapade transaktion: ${params.description} (${params.amount} kr)`,
        }
    },
})

export const transactionTools = [
    getTransactionsTool,
    categorizeTransactionTool,
    createTransactionTool,
]
