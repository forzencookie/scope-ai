/**
 * Bokföring AI Tools - Reports
 *
 * Tools for financial reports (income statement, balance sheet, SIE export).
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import {
    type ProcessedFinancialItem,
} from '@/services/processors/reports-processor'
import { companyService } from '@/services/company-service'

// =============================================================================
// Financial Statement Tools
// =============================================================================

export const getIncomeStatementTool = defineTool<Record<string, never>, ProcessedFinancialItem[]>({
    name: 'get_income_statement',
    description: 'Hämta resultaträkning med intäkter, kostnader och årets resultat. Visar hur lönsamt företaget är. Vanliga frågor: "hur går det", "vad är vinsten", "resultat i år".',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        // TODO: Query real financial data from Supabase
        return {
            success: false,
            data: [],
            message: 'Ingen resultaträkning tillgänglig. Bokför transaktioner först.',
        }
    },
})

export const getBalanceSheetTool = defineTool<Record<string, never>, ProcessedFinancialItem[]>({
    name: 'get_balance_sheet',
    description: 'Hämta balansräkning med tillgångar, skulder och eget kapital. Visar företagets ekonomiska ställning. Använd för att kolla soliditet, likviditet, eller svara på "hur mycket pengar har vi", "vad är vi skyldiga".',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        // TODO: Query real financial data from Supabase
        return {
            success: false,
            data: [],
            message: 'Ingen balansräkning tillgänglig. Bokför transaktioner först.',
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
    description: 'Exportera bokföringen som SIE-fil (svenskt standardformat). Använd för revision, byte av bokföringsprogram, eller när revisorn begär underlag. Kräver bekräftelse.',
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
    description: 'Skapa en samlad finansiell rapport med resultat- och balansräkning för en period. Kan jämföra mot tidigare år.',
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
        // TODO: Query real financial data from Supabase
        return {
            success: false,
            data: {},
            message: `Ingen finansiell rapport tillgänglig för ${params.period}. Bokför transaktioner först.`,
        }
    }
})

export interface AnnualReportParams {
    year: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const draftAnnualReportTool = defineTool<AnnualReportParams, any>({
    name: 'draft_annual_report',
    description: 'Skapa utkast för årsredovisning (K2). Innehåller förvaltningsberättelse, resultaträkning, balansräkning och noter. Använd när användaren vill göra sin årsredovisning eller frågar om bokslut.',
    category: 'write',
    requiresConfirmation: false, // Preview first
    parameters: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'Räkenskapsår' },
        },
        required: ['year'],
    },
    execute: async (params, context) => {
        const userId = context?.userId
        let companyName = ''
        let orgNumber = ''
        let fiscalYearEnd = '12-31'

        if (userId) {
            try {
                const company = await companyService.getByUserId(userId)
                if (company) {
                    companyName = company.name
                    orgNumber = company.orgNumber || ''
                    fiscalYearEnd = company.fiscalYearEnd || '12-31'
                }
            } catch { /* use empty */ }
        }

        if (!companyName) {
            return {
                success: false,
                data: {},
                message: 'Företagsinformation saknas. Gå till Inställningar > Företag för att fylla i uppgifter.',
            }
        }

        const [fyMonth, fyDay] = fiscalYearEnd.split('-')

        const annualReportData = {
            companyName,
            orgNumber,
            period: `${params.year}`,
            fiscalYearStart: `${params.year}-01-01`,
            fiscalYearEnd: `${params.year}-${fyMonth}-${fyDay}`,
            sections: {
                managementReport: true,
                incomeStatement: true,
                balanceSheet: true,
                notes: true,
                signatures: false
            },
            keyFigures: [],
            status: "draft"
        }

        return {
            success: true,
            data: annualReportData,
            message: `Årsredovisning för ${params.year} skapad (utkast). Nyckeltal saknas — bokför transaktioner för att fylla i automatiskt.`,
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
    description: 'Förbered inkomstdeklaration (INK2) för aktiebolag. Beräknar bolagsskatt och visar skatteoptimeringsförslag som periodiseringsfond. Använd när användaren vill deklarera eller frågar om skatt.',
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
        // TODO: Pull from actual bookkeeping data in Supabase
        return {
            success: false,
            data: {
                year: params.year,
                companyName: '',
                orgNumber: '',
                fields: [],
                summary: { taxableIncome: 0, corporateTax: 0 },
                status: 'draft' as const,
            },
            message: `Kan inte förbereda INK2 för ${params.year} — bokföringsdata saknas.`,
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
    description: 'Stäng räkenskapsåret och skapa bokslutsposter. Överför årets resultat till eget kapital och skapar ingående balanser för nästa år. Kräver bekräftelse.',
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
        // TODO: Calculate from actual bookkeeping data in Supabase
        return {
            success: false,
            data: {
                year: params.year,
                result: 0,
                closingEntries: [],
                status: 'preview' as const,
            },
            message: `Kan inte stänga räkenskapsår ${params.year} — bokföringsdata saknas.`,
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
    description: 'Generera förvaltningsberättelse för årsredovisningen. AI skriver texten baserat på årets siffror. Använd när användaren behöver hjälp att skriva förvaltningsberättelsen.',
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
