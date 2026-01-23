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


export interface FinancialReportParams {
    period: string
    comparisonPeriod?: string
}

export const generateFinancialReportTool = defineTool<FinancialReportParams, any>({
    name: 'generate_financial_report',
    description: 'Skapa en finansiell rapport (Resultat- och Balansräkning).',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period (t.ex. "2024")' },
            comparisonPeriod: { type: 'string', description: 'Jämförelseperiod (t.ex. "2023")' },
        },
        required: ['period'],
    },
    execute: async (params) => {
        // Mock data
        const incomeStatement = generateMockIncomeStatement().map((item, i) => ({
            id: `is-${i}`,
            label: item.label,
            amount: item.value,
            type: (item.label === "Rörelsens intäkter" || item.label === "Summa rörelsens kostnader") ? "header" :
                (item.label.includes("Summa") || item.label.includes("Resultat")) ? "sum" : "row",
            level: item.label.startsWith("  ") ? 1 : 0
        })) as any[]

        const balanceSheet = generateMockBalanceSheet().map((item, i) => ({
            id: `bs-${i}`,
            label: item.label,
            amount: item.value,
            type: item.label.includes("Summa") ? "sum" : "row",
        })) as any[]

        const reportData = {
            companyName: "Din Företag AB",
            reportType: "Resultat & Balans",
            period: params.period,
            comparisonPeriod: params.comparisonPeriod,
            currency: "SEK",
            incomeStatement: incomeStatement,
            balanceSheetAssets: balanceSheet.slice(0, 5), // Mock split
            balanceSheetEquityLiability: balanceSheet.slice(5),
            resultBeforeTax: 150000,
            netResult: 119400
        }

        return {
            success: true,
            data: reportData,
            message: `Finansiell rapport för ${params.period} sammanställd.`,
            display: {
                component: 'FinancialReportPreview',
                title: 'Finansiell Rapport',
                props: { data: reportData }
            }
        }
    }
})

export interface AnnualReportParams {
    year: number
}

export const draftAnnualReportTool = defineTool<AnnualReportParams, any>({
    name: 'draft_annual_report',
    description: 'Skapa utkast för årsredovisning (K2).',
    category: 'write',
    requiresConfirmation: false, // Preview first
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'Räkenskapsår' },
        },
        required: ['year'],
    },
    execute: async (params) => {
        const annualReportData = {
            companyName: "Din Företag AB",
            orgNumber: "556123-4567",
            period: `${params.year}`,
            fiscalYearStart: `${params.year}-01-01`,
            fiscalYearEnd: `${params.year}-12-31`,
            sections: {
                managementReport: true,
                incomeStatement: true,
                balanceSheet: true,
                notes: true,
                signatures: false
            },
            keyFigures: [
                { label: "Nettoomsättning (tkr)", currentYear: 2450, previousYear: 2100 },
                { label: "Resultat efter finansnetto (tkr)", currentYear: 350, previousYear: 280 },
                { label: "Soliditet (%)", currentYear: 45, previousYear: 42 },
            ],
            status: "draft"
        }

        return {
            success: true,
            data: annualReportData,
            message: `Årsredovisning för ${params.year} skapad (utkast).`,
            display: {
                component: 'AnnualReportPreview',
                title: 'Årsredovisning',
                props: { data: annualReportData }
            }
        }
    }
})

export const reportTools = [
    getIncomeStatementTool,
    getBalanceSheetTool,
    exportSIETool,
    generateFinancialReportTool,
    draftAnnualReportTool,
]
