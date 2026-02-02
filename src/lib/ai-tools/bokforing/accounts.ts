/**
 * Bokföring AI Tools - Accounts (Kontoplan)
 *
 * Tools for querying the chart of accounts (BAS kontoplan) and account balances.
 */

import { defineTool } from '../registry'
import { accountService, Account, AccountBalanceSummary } from '@/services/account-service'

// =============================================================================
// Get Accounts Tool
// =============================================================================

export interface GetAccountsParams {
    search?: string
    accountClass?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
    year?: number
    limit?: number
}

export const getAccountsTool = defineTool<GetAccountsParams, Account[]>({
    name: 'get_accounts',
    description: 'Hämta konton från kontoplanen (BAS). Kan filtreras på kontoklass och sökterm.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            search: { type: 'string', description: 'Sök på kontonummer eller kontonamn' },
            accountClass: { 
                type: 'string', 
                enum: ['1', '2', '3', '4', '5', '6', '7', '8'],
                description: 'Kontoklass: 1=Tillgångar, 2=Skulder/EK, 3=Intäkter, 4-8=Kostnader'
            },
            year: { type: 'number', description: 'Räkenskapsår (standard: innevarande)' },
            limit: { type: 'number', description: 'Max antal (standard: 50)' },
        },
    },
    execute: async (params) => {
        try {
            const limit = params.limit || 50
            const { accounts, totalCount } = await accountService.getAccounts({
                limit,
                search: params.search,
                accountClass: params.accountClass,
                year: params.year
            })

            if (accounts.length === 0) {
                return {
                    success: true,
                    data: [] as Account[],
                    message: 'Inga konton hittades med dessa filter.',
                }
            }

            const classLabels: Record<string, string> = {
                '1': 'Tillgångar',
                '2': 'Skulder & Eget kapital',
                '3': 'Intäkter',
                '4': 'Inköpskostnader',
                '5': 'Personalkostnader',
                '6': 'Övriga externa kostnader',
                '7': 'Avskrivningar',
                '8': 'Finansiella poster'
            }

            return {
                success: true,
                data: accounts,
                message: params.accountClass 
                    ? `Hittade ${totalCount} konton i klass ${params.accountClass} (${classLabels[params.accountClass]}), visar ${accounts.length}.`
                    : `Hittade ${totalCount} konton, visar ${accounts.length}.`,
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error)
            return {
                success: false,
                error: 'Kunde inte hämta kontoplan från databasen.',
            }
        }
    },
})

// =============================================================================
// Get Account Balance Tool
// =============================================================================

export interface GetAccountBalanceParams {
    accountNumber: string
    year?: number
}

export const getAccountBalanceTool = defineTool<GetAccountBalanceParams, Account | null>({
    name: 'get_account_balance',
    description: 'Hämta saldo för ett specifikt konto.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            accountNumber: { type: 'string', description: 'Kontonummer (t.ex. 1930, 2440)' },
            year: { type: 'number', description: 'Räkenskapsår (standard: innevarande)' },
        },
        required: ['accountNumber'],
    },
    execute: async (params) => {
        try {
            const account = await accountService.getAccountBalance(params.accountNumber, params.year)

            if (!account) {
                return {
                    success: false,
                    error: `Konto ${params.accountNumber} hittades inte.`,
                }
            }

            return {
                success: true,
                data: account,
                message: `Konto ${account.accountNumber} (${account.accountName}): ${account.balance.toLocaleString('sv-SE')} kr`,
            }
        } catch (error) {
            console.error('Failed to fetch account balance:', error)
            return {
                success: false,
                error: 'Kunde inte hämta kontosaldo.',
            }
        }
    },
})

// =============================================================================
// Get Balance Sheet Summary Tool
// =============================================================================

export const getBalanceSheetSummaryTool = defineTool<{ year?: number }, AccountBalanceSummary>({
    name: 'get_balance_sheet_summary',
    description: 'Hämta en sammanfattning av balansräkningen: tillgångar, skulder, eget kapital.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'Räkenskapsår (standard: innevarande)' },
        },
    },
    execute: async (params) => {
        try {
            const summary = await accountService.getBalanceSheetSummary(params.year)

            return {
                success: true,
                data: summary,
                message: `Balansräkning: Tillgångar ${summary.totalAssets.toLocaleString('sv-SE')} kr, ` +
                    `Skulder ${summary.totalLiabilities.toLocaleString('sv-SE')} kr, ` +
                    `Eget kapital ${summary.totalEquity.toLocaleString('sv-SE')} kr. ` +
                    `Resultat: ${summary.netResult.toLocaleString('sv-SE')} kr.`,
            }
        } catch (error) {
            console.error('Failed to fetch balance sheet summary:', error)
            return {
                success: false,
                error: 'Kunde inte hämta balansräkning.',
            }
        }
    },
})

// =============================================================================
// Get Chart of Accounts Tool
// =============================================================================

export const getChartOfAccountsTool = defineTool<{ year?: number }, Record<string, Account[]>>({
    name: 'get_chart_of_accounts',
    description: 'Hämta hela kontoplanen grupperad efter kontoklass.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'Räkenskapsår (standard: innevarande)' },
        },
    },
    execute: async (params) => {
        try {
            const chart = await accountService.getChartOfAccounts(params.year)
            const totalAccounts = Object.values(chart).reduce((sum, arr) => sum + arr.length, 0)

            return {
                success: true,
                data: chart,
                message: `Kontoplanen innehåller ${totalAccounts} konton.`,
            }
        } catch (error) {
            console.error('Failed to fetch chart of accounts:', error)
            return {
                success: false,
                error: 'Kunde inte hämta kontoplan.',
            }
        }
    },
})

export const accountTools = [
    getAccountsTool,
    getAccountBalanceTool,
    getBalanceSheetSummaryTool,
    getChartOfAccountsTool,
]
