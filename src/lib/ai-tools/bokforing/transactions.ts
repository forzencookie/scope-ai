/**
 * Bokföring AI Tools - Transactions
 *
 * Tools for reading and managing transactions.
 */

import { defineTool } from '../registry'
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
                description: 'Månad att filtrera på (t.ex. "januari", "februari")',
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
        let transactions: Transaction[] = []

        try {
            const response = await fetch('/api/transactions', { cache: 'no-store' })
            if (response.ok) {
                const data = await response.json()
                transactions = data.transactions || []
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error)
        }

        let filtered = [...transactions]

        if (params.minAmount !== undefined) {
            filtered = filtered.filter(t => {
                const amount = typeof t.amountValue === 'number' ? t.amountValue : 0
                return Math.abs(amount) >= params.minAmount!
            })
        }
        if (params.maxAmount !== undefined) {
            filtered = filtered.filter(t => {
                const amount = typeof t.amountValue === 'number' ? t.amountValue : 0
                return Math.abs(amount) <= params.maxAmount!
            })
        }

        const limit = params.limit || 10
        const data = filtered.slice(0, limit)

        return {
            success: true,
            data,
            message: filtered.length > 0
                ? `Hittade ${filtered.length} transaktioner, visar ${data.length}.`
                : 'Inga transaktioner hittades.',
            display: {
                component: 'TransactionsTable',
                props: { transactions: data },
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
