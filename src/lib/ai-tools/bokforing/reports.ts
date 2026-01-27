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
} from '@/services/processors/reports-processor'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })) as any[]

        const balanceSheet = generateMockBalanceSheet().map((item, i) => ({
            id: `bs-${i}`,
            label: item.label,
            amount: item.value,
            type: item.label.includes("Summa") ? "sum" : "row",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// =============================================================================
// Prepare INK2 (Income Tax Declaration) Tool
// =============================================================================

export interface PrepareINK2Params {
    year: number
    includeOptimizations?: boolean
}

export interface INK2Data {
    year: number
    companyName: string
    orgNumber: string
    fields: Array<{ field: string; label: string; value: number; editable: boolean }>
    summary: {
        taxableIncome: number
        corporateTax: number
        periodiseringsfond?: number
    }
    status: 'draft' | 'ready' | 'submitted'
}

export const prepareINK2Tool = defineTool<PrepareINK2Params, INK2Data>({
    name: 'prepare_ink2',
    description: 'Förbered inkomstdeklaration (INK2) för aktiebolag. Beräknar skatt och visar skatteoptimering.',
    category: 'write',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'Inkomstår' },
            includeOptimizations: { type: 'boolean', description: 'Visa förslag på skatteoptimering' },
        },
        required: ['year'],
    },
    execute: async (params) => {
        // In production, pull from actual bookkeeping data
        const incomeStatement = generateMockIncomeStatement()
        const resultItem = incomeStatement.find(i => i.label === 'Årets resultat')
        const result = resultItem?.value || 150000

        // Calculate corporate tax (20.6% for 2024+)
        const taxRate = 0.206
        const maxPeriodisering = Math.round(result * 0.25) // 25% to periodiseringsfond
        const taxableAfterPeriodisering = result - maxPeriodisering
        const corporateTax = Math.round(taxableAfterPeriodisering * taxRate)

        const ink2Data: INK2Data = {
            year: params.year,
            companyName: "Din Företag AB",
            orgNumber: "556123-4567",
            fields: [
                { field: '1.1', label: 'Nettoomsättning', value: 2450000, editable: false },
                { field: '1.3', label: 'Övriga rörelseintäkter', value: 15000, editable: true },
                { field: '2.1', label: 'Råvaror och förnödenheter', value: -850000, editable: false },
                { field: '2.4', label: 'Personalkostnader', value: -980000, editable: false },
                { field: '2.5', label: 'Avskrivningar', value: -85000, editable: false },
                { field: '2.6', label: 'Övriga rörelsekostnader', value: -350000, editable: false },
                { field: '3.1', label: 'Ränteintäkter', value: 2500, editable: false },
                { field: '3.2', label: 'Räntekostnader', value: -12500, editable: false },
                { field: '4.1', label: 'Resultat före skatt', value: result, editable: false },
                { field: '4.2', label: 'Avsättning periodiseringsfond', value: -maxPeriodisering, editable: true },
                { field: '4.3', label: 'Skattemässigt resultat', value: taxableAfterPeriodisering, editable: false },
            ],
            summary: {
                taxableIncome: taxableAfterPeriodisering,
                corporateTax,
                periodiseringsfond: maxPeriodisering,
            },
            status: 'draft',
        }

        const message = params.includeOptimizations
            ? `INK2 förberedd. Tips: Avsätt ${maxPeriodisering.toLocaleString('sv-SE')} kr till periodiseringsfond för att sänka skatten till ${corporateTax.toLocaleString('sv-SE')} kr.`
            : `INK2 förberedd för ${params.year}. Bolagsskatt: ${corporateTax.toLocaleString('sv-SE')} kr.`

        return {
            success: true,
            data: ink2Data,
            message,
            display: {
                component: 'INK2FormPreview',
                title: `Inkomstdeklaration ${params.year}`,
                props: { data: ink2Data },
                fullViewRoute: '/dashboard/rapporter?tab=inkomstdeklaration',
            },
        }
    },
})

// =============================================================================
// Close Fiscal Year Tool
// =============================================================================

export interface CloseFiscalYearParams {
    year: number
    createOpeningBalances?: boolean
}

export interface YearEndResult {
    year: number
    result: number
    closingEntries: Array<{ description: string; debit: string; credit: string; amount: number }>
    status: 'preview' | 'closed'
}

export const closeFiscalYearTool = defineTool<CloseFiscalYearParams, YearEndResult>({
    name: 'close_fiscal_year',
    description: 'Stäng räkenskapsåret. Skapar bokslutsposter och överför resultat till eget kapital.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'Räkenskapsår att stänga' },
            createOpeningBalances: { type: 'boolean', description: 'Skapa ingående balanser för nästa år (standard: true)' },
        },
        required: ['year'],
    },
    execute: async (params) => {
        // In production, calculate from actual bookkeeping
        const incomeStatement = generateMockIncomeStatement()
        const resultItem = incomeStatement.find(i => i.label === 'Årets resultat')
        const result = resultItem?.value || 150000

        const closingEntries = [
            { description: 'Nollställ intäkter', debit: '3XXX', credit: '8999', amount: 2450000 },
            { description: 'Nollställ kostnader', debit: '8999', credit: '4-7XXX', amount: 2300000 },
            { description: 'Överför årets resultat', debit: '8999', credit: '2099', amount: result },
        ]

        const yearEndData: YearEndResult = {
            year: params.year,
            result,
            closingEntries,
            status: 'preview',
        }

        const confirmationRequest: AIConfirmationRequest = {
            title: `Stäng räkenskapsår ${params.year}`,
            description: 'Skapar bokslutsposter och låser perioden',
            summary: [
                { label: 'År', value: String(params.year) },
                { label: 'Årets resultat', value: `${result.toLocaleString('sv-SE')} kr` },
                { label: 'Antal bokslutsposter', value: String(closingEntries.length) },
                { label: 'Ingående balanser', value: params.createOpeningBalances !== false ? 'Ja' : 'Nej' },
            ],
            action: { toolName: 'close_fiscal_year', params },
            requireCheckbox: true,
        }

        return {
            success: true,
            data: yearEndData,
            message: `Årsbokslut förberett. Resultat: ${result.toLocaleString('sv-SE')} kr.`,
            confirmationRequired: confirmationRequest,
            display: {
                component: 'YearEndPreview',
                title: `Årsbokslut ${params.year}`,
                props: { data: yearEndData },
                fullViewRoute: '/dashboard/rapporter?tab=arsbokslut',
            },
        }
    },
})

// =============================================================================
// Generate Management Report Tool
// =============================================================================

export interface GenerateManagementReportParams {
    year: number
    language?: 'sv' | 'en'
}

export const generateManagementReportTool = defineTool<GenerateManagementReportParams, string>({
    name: 'generate_management_report',
    description: 'Generera förvaltningsberättelse för årsredovisningen baserat på årets siffror.',
    category: 'write',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'Räkenskapsår' },
            language: { type: 'string', enum: ['sv', 'en'], description: 'Språk (standard: svenska)' },
        },
        required: ['year'],
    },
    execute: async (params) => {
        // In production, this would use AI to generate text based on financial data
        const managementReport = `
## Förvaltningsberättelse

### Allmänt om verksamheten
Bolaget bedriver konsultverksamhet inom IT och systemutveckling. Verksamheten bedrivs från bolagets lokaler i Stockholm.

### Väsentliga händelser under räkenskapsåret
Under ${params.year} har bolaget fortsatt att växa och nettoomsättningen ökade med 17% jämfört med föregående år. Bolaget har under året investerat i ny IT-utrustning och utökat personalstyrkan.

### Framtida utveckling
Bolaget ser positivt på den fortsatta utvecklingen och förväntar sig en fortsatt tillväxt under kommande år.

### Resultatdisposition
Styrelsen föreslår att årets resultat, 150 000 kr, balanseras i ny räkning.
        `.trim()

        return {
            success: true,
            data: managementReport,
            message: `Förvaltningsberättelse för ${params.year} genererad.`,
            display: {
                component: 'DocumentPreview',
                title: 'Förvaltningsberättelse',
                props: {
                    title: `Förvaltningsberättelse ${params.year}`,
                    type: 'management_report',
                    content: managementReport,
                    format: 'markdown',
                },
            },
        }
    },
})

export const reportTools = [
    getIncomeStatementTool,
    getBalanceSheetTool,
    exportSIETool,
    generateFinancialReportTool,
    draftAnnualReportTool,
    prepareINK2Tool,
    closeFiscalYearTool,
    generateManagementReportTool,
]
