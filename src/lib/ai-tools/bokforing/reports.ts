/**
 * Bokföring AI Tools - Reports
 *
 * Tools for financial reports (income statement, balance sheet, SIE export).
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import {
    generateMockIncomeStatement,
    generateMockBalanceSheet,
    type ProcessedFinancialItem,
} from '@/services/reports-processor'

// =============================================================================
// Financial Statement Tools
// =============================================================================

export const getIncomeStatementTool = defineTool<Record<string, never>, ProcessedFinancialItem[]>({
    name: 'get_income_statement',
    description: 'Hämta resultaträkning med intäkter, kostnader och årets resultat.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        const items = generateMockIncomeStatement()
        const result = items.find(i => i.label === 'Årets resultat')

        return {
            success: true,
            data: items,
            message: result
                ? `Årets resultat: ${result.value.toLocaleString('sv-SE')} kr`
                : 'Resultaträkning hämtad.',
            display: {
                component: 'IncomeStatement',
                props: { items },
                title: 'Resultaträkning',
                fullViewRoute: '/dashboard/rapporter/resultat',
            },
        }
    },
})

export const getBalanceSheetTool = defineTool<Record<string, never>, ProcessedFinancialItem[]>({
    name: 'get_balance_sheet',
    description: 'Hämta balansräkning med tillgångar, skulder och eget kapital.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        const items = generateMockBalanceSheet()
        const total = items.find(i => i.label === 'Summa tillgångar')

        return {
            success: true,
            data: items,
            message: total
                ? `Summa tillgångar: ${total.value.toLocaleString('sv-SE')} kr`
                : 'Balansräkning hämtad.',
            display: {
                component: 'BalanceSheet',
                props: { items },
                title: 'Balansräkning',
                fullViewRoute: '/dashboard/rapporter/balans',
            },
        }
    },
})

// =============================================================================
// SIE Export Tool
// =============================================================================

export interface ExportSIEParams {
    year: number
    includeOpeningBalances?: boolean
}

export const exportSIETool = defineTool<ExportSIEParams, { filename: string; url: string }>({
    name: 'export_sie',
    description: 'Exportera bokföringen som SIE-fil. Kan användas för revision eller byte av bokföringsprogram.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'År att exportera' },
            includeOpeningBalances: { type: 'boolean', description: 'Inkludera ingående balanser (standard: true)' },
        },
        required: ['year'],
    },
    execute: async (params) => {
        const filename = `bokforing_${params.year}.se`

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Exportera SIE-fil',
            description: `Exportera all bokföring för ${params.year} som SIE-fil`,
            summary: [
                { label: 'År', value: String(params.year) },
                { label: 'Format', value: 'SIE4' },
                { label: 'Filnamn', value: filename },
            ],
            action: { toolName: 'export_sie', params },
            requireCheckbox: false,
        }

        return {
            success: true,
            data: { filename, url: `/api/sie/export?year=${params.year}` },
            message: `SIE-fil för ${params.year} förberedd för export.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

export const reportTools = [
    getIncomeStatementTool,
    getBalanceSheetTool,
    exportSIETool,
]
