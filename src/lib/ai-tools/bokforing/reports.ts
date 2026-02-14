/**
 * Bokföring AI Tools - Reports
 *
 * Tools for financial reports (income statement, balance sheet, SIE export).
 * All tools query real data from verification_lines via get_account_balances RPC.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import {
    type ProcessedFinancialItem,
    type AccountBalance,
} from '@/services/processors/reports-processor'
import { FinancialReportCalculator } from '@/services/processors/reports/calculator'
import { companyService } from '@/services/company-service'
import { getSupabaseAdmin } from '../../database/supabase'
import { taxService } from '@/services/tax-service'

// =============================================================================
// Shared helpers
// =============================================================================

async function fetchAccountBalances(startDate: string, endDate: string): Promise<AccountBalance[]> {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.rpc('get_account_balances', {
        p_start_date: startDate,
        p_end_date: endDate,
    })
    if (error) throw error
    return (data || []).map((row: { account_number: number; balance: number }) => ({
        account: String(row.account_number),
        balance: row.balance,
    }))
}

function formatSEK(amount: number): string {
    return Math.abs(amount).toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + ' kr'
}

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
        const year = new Date().getFullYear()
        const balances = await fetchAccountBalances(`${year}-01-01`, `${year}-12-31`)

        if (!balances.length) {
            return {
                success: false,
                data: [],
                message: 'Ingen resultaträkning tillgänglig. Bokför transaktioner först.',
            }
        }

        const items = FinancialReportCalculator.calculateIncomeStatement(balances)
        const netIncome = items.find(i => i.label === 'ÅRETS RESULTAT')?.value ?? 0
        const revenue = items.find(i => i.label === 'Rörelsens intäkter')?.value ?? 0

        const lines = items
            .filter(i => !i.isHeader)
            .map(i => `${i.label}: ${formatSEK(i.value)}`)
            .join('\n')

        return {
            success: true,
            data: items,
            message: `Resultaträkning ${year}:\n\n${lines}\n\nOmsättning: ${formatSEK(revenue)}, Årets resultat: ${formatSEK(netIncome)}.`,
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
        const year = new Date().getFullYear()
        const balances = await fetchAccountBalances('2000-01-01', `${year}-12-31`)

        if (!balances.length) {
            return {
                success: false,
                data: [],
                message: 'Ingen balansräkning tillgänglig. Bokför transaktioner först.',
            }
        }

        const items = FinancialReportCalculator.calculateBalanceSheet(balances)
        const totalAssets = items.find(i => i.label === 'SUMMA TILLGÅNGAR')?.value ?? 0
        const totalEqLiab = items.find(i => i.label === 'SUMMA EGET KAPITAL OCH SKULDER')?.value ?? 0

        const lines = items
            .filter(i => !i.isHeader)
            .map(i => `${i.highlight ? '**' : ''}${i.label}: ${formatSEK(i.value)}${i.highlight ? '**' : ''}`)
            .join('\n')

        return {
            success: true,
            data: items,
            message: `Balansräkning per ${year}-12-31:\n\n${lines}\n\nSumma tillgångar: ${formatSEK(totalAssets)}. Summa eget kapital och skulder: ${formatSEK(totalEqLiab)}.`,
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
        const year = parseInt(params.period) || new Date().getFullYear()

        const [plBalances, bsBalances] = await Promise.all([
            fetchAccountBalances(`${year}-01-01`, `${year}-12-31`),
            fetchAccountBalances('2000-01-01', `${year}-12-31`),
        ])

        if (!plBalances.length && !bsBalances.length) {
            return {
                success: false,
                data: {},
                message: `Ingen finansiell rapport tillgänglig för ${year}. Bokför transaktioner först.`,
            }
        }

        const incomeStatement = FinancialReportCalculator.calculateIncomeStatement(plBalances)
        const balanceSheet = FinancialReportCalculator.calculateBalanceSheet(bsBalances)

        // Comparison period
        let comparison = null
        if (params.comparisonPeriod) {
            const compYear = parseInt(params.comparisonPeriod)
            if (compYear) {
                const [compPl, compBs] = await Promise.all([
                    fetchAccountBalances(`${compYear}-01-01`, `${compYear}-12-31`),
                    fetchAccountBalances('2000-01-01', `${compYear}-12-31`),
                ])
                comparison = {
                    year: compYear,
                    incomeStatement: FinancialReportCalculator.calculateIncomeStatement(compPl),
                    balanceSheet: FinancialReportCalculator.calculateBalanceSheet(compBs),
                }
            }
        }

        const netIncome = incomeStatement.find(i => i.label === 'ÅRETS RESULTAT')?.value ?? 0
        const totalAssets = balanceSheet.find(i => i.label === 'SUMMA TILLGÅNGAR')?.value ?? 0

        return {
            success: true,
            data: { year, incomeStatement, balanceSheet, comparison },
            message: `Finansiell rapport ${year}: Årets resultat ${formatSEK(netIncome)}, Totala tillgångar ${formatSEK(totalAssets)}.` +
                (comparison ? ` Jämförelse med ${params.comparisonPeriod} inkluderad.` : ''),
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

        // Fetch real financial data
        const [plBalances, bsBalances] = await Promise.all([
            fetchAccountBalances(`${params.year}-01-01`, `${params.year}-${fyMonth}-${fyDay}`),
            fetchAccountBalances('2000-01-01', `${params.year}-${fyMonth}-${fyDay}`),
        ])

        const incomeStatement = FinancialReportCalculator.calculateIncomeStatementSections(plBalances)
        const balanceSheet = FinancialReportCalculator.calculateBalanceSheetSections(bsBalances)

        const netIncome = incomeStatement.find(s => s.isHighlight)?.total ?? 0
        const totalAssets = balanceSheet.reduce((sum, s) => {
            if (s.title === 'Anläggningstillgångar' || s.title === 'Omsättningstillgångar') return sum + s.total
            return sum
        }, 0)

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
            keyFigures: [
                { label: 'Nettoomsättning', value: incomeStatement[0]?.total ?? 0 },
                { label: 'Årets resultat', value: netIncome },
                { label: 'Balansomslutning', value: totalAssets },
            ],
            incomeStatement,
            balanceSheet,
            status: "draft"
        }

        const hasData = plBalances.length > 0 || bsBalances.length > 0

        return {
            success: true,
            data: annualReportData,
            message: hasData
                ? `Årsredovisning för ${params.year} skapad med riktiga siffror. Nettoomsättning: ${formatSEK(incomeStatement[0]?.total ?? 0)}, Årets resultat: ${formatSEK(netIncome)}, Balansomslutning: ${formatSEK(totalAssets)}.`
                : `Årsredovisning för ${params.year} skapad (utkast). Nyckeltal saknas — bokför transaktioner för att fylla i automatiskt.`,
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
    execute: async (params, context) => {
        const userId = context?.userId
        let companyName = ''
        let orgNumber = ''

        if (userId) {
            try {
                const company = await companyService.getByUserId(userId)
                if (company) {
                    companyName = company.name
                    orgNumber = company.orgNumber || ''
                }
            } catch { /* use empty */ }
        }

        // Fetch P&L data for the tax year
        const plBalances = await fetchAccountBalances(`${params.year}-01-01`, `${params.year}-12-31`)

        if (!plBalances.length) {
            return {
                success: false,
                data: {
                    year: params.year,
                    companyName,
                    orgNumber,
                    fields: [],
                    summary: { taxableIncome: 0, corporateTax: 0 },
                    status: 'draft' as const,
                },
                message: `Kan inte förbereda INK2 för ${params.year} — bokföringsdata saknas.`,
            }
        }

        // Calculate from real P&L
        const items = FinancialReportCalculator.calculateIncomeStatement(plBalances)
        const netIncome = items.find(i => i.label === 'ÅRETS RESULTAT')?.value ?? 0
        const revenue = items.find(i => i.label === 'Rörelsens intäkter')?.value ?? 0
        const ebit = items.find(i => i.label === 'Rörelseresultat (EBIT)')?.value ?? 0
        const financialItems = items.find(i => i.label === 'Finansiella poster')?.value ?? 0

        const rates = await taxService.getAllTaxRates(params.year)
        if (!rates) {
            return { success: false, error: `Skattesatser för ${params.year} saknas — kan inte beräkna bolagsskatt.` }
        }
        const taxableIncome = Math.max(0, netIncome)
        const corporateTax = Math.round(taxableIncome * rates.corporateTaxRate)

        // Periodiseringsfond: max 25% of taxable income
        const maxPeriodiseringsfond = params.includeOptimizations ? Math.round(taxableIncome * 0.25) : 0

        const fields = [
            { field: 'INK2R_3_1', label: 'Nettoomsättning', value: Math.abs(revenue), editable: true },
            { field: 'INK2R_3_9', label: 'Övriga rörelseintäkter', value: 0, editable: true },
            { field: 'INK2R_4_1', label: 'Rörelseresultat', value: ebit, editable: false },
            { field: 'INK2R_5_1', label: 'Finansiella intäkter/kostnader', value: financialItems, editable: true },
            { field: 'INK2R_6_1', label: 'Bokfört resultat', value: netIncome, editable: false },
            { field: 'INK2R_7_1', label: 'Skattemässigt resultat', value: taxableIncome, editable: true },
            { field: 'INK2R_8_1', label: `Bolagsskatt (${(rates.corporateTaxRate * 100).toFixed(1)}%)`, value: corporateTax, editable: false },
        ]

        if (params.includeOptimizations && maxPeriodiseringsfond > 0) {
            fields.push({
                field: 'INK2R_9_1',
                label: 'Periodiseringsfond (max 25%)',
                value: maxPeriodiseringsfond,
                editable: true,
            })
        }

        return {
            success: true,
            data: {
                year: params.year,
                companyName,
                orgNumber,
                fields,
                summary: {
                    taxableIncome,
                    corporateTax,
                    periodiseringsfond: maxPeriodiseringsfond || undefined,
                },
                status: 'draft' as const,
            },
            message: `INK2 för ${params.year} förberedd. Bokfört resultat: ${formatSEK(netIncome)}, Skattepliktigt resultat: ${formatSEK(taxableIncome)}, Bolagsskatt: ${formatSEK(corporateTax)}.` +
                (maxPeriodiseringsfond > 0 ? ` Möjlig periodiseringsfond: ${formatSEK(maxPeriodiseringsfond)}.` : ''),
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
        // Fetch P&L for the year
        const plBalances = await fetchAccountBalances(`${params.year}-01-01`, `${params.year}-12-31`)

        if (!plBalances.length) {
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
        }

        const items = FinancialReportCalculator.calculateIncomeStatement(plBalances)
        const netIncome = items.find(i => i.label === 'ÅRETS RESULTAT')?.value ?? 0

        // Preview closing entries
        const closingEntries: YearEndResult['closingEntries'] = []

        if (netIncome > 0) {
            // Profit: Debit 8999 (Årets resultat) → Credit 2099 (Årets resultat)
            closingEntries.push({
                description: 'Överföring av årets vinst till eget kapital',
                debit: '8999',
                credit: '2099',
                amount: netIncome,
            })
        } else if (netIncome < 0) {
            // Loss: Debit 2099 → Credit 8999
            closingEntries.push({
                description: 'Överföring av årets förlust till eget kapital',
                debit: '2099',
                credit: '8999',
                amount: Math.abs(netIncome),
            })
        }

        const confirmationRequest: AIConfirmationRequest = {
            title: `Stäng räkenskapsår ${params.year}`,
            description: `Överför årets resultat (${formatSEK(netIncome)}) till eget kapital och lås alla verifikationer för ${params.year}.`,
            summary: [
                { label: 'Räkenskapsår', value: String(params.year) },
                { label: 'Årets resultat', value: formatSEK(netIncome) },
                { label: 'Antal bokslutsposter', value: String(closingEntries.length) },
            ],
            action: { toolName: 'close_fiscal_year', params },
            requireCheckbox: true,
            checkboxLabel: 'Jag bekräftar att jag vill stänga räkenskapsåret och låsa verifikationerna.',
        }

        return {
            success: true,
            data: {
                year: params.year,
                result: netIncome,
                closingEntries,
                status: 'preview' as const,
            },
            message: `Förhandsvisning av bokslut ${params.year}: Årets resultat ${formatSEK(netIncome)}. ${closingEntries.length} bokslutspost(er) kommer att skapas.`,
            confirmationRequired: confirmationRequest,
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
    execute: async (params, context) => {
        const userId = context?.userId
        let companyName = 'Bolaget'

        if (userId) {
            try {
                const company = await companyService.getByUserId(userId)
                if (company) companyName = company.name
            } catch { /* use default */ }
        }

        // Fetch real financial data for the report
        const [plBalances, prevPlBalances] = await Promise.all([
            fetchAccountBalances(`${params.year}-01-01`, `${params.year}-12-31`),
            fetchAccountBalances(`${params.year - 1}-01-01`, `${params.year - 1}-12-31`),
        ])

        const items = FinancialReportCalculator.calculateIncomeStatement(plBalances)
        const prevItems = FinancialReportCalculator.calculateIncomeStatement(prevPlBalances)

        const netIncome = items.find(i => i.label === 'ÅRETS RESULTAT')?.value ?? 0
        const revenue = Math.abs(items.find(i => i.label === 'Rörelsens intäkter')?.value ?? 0)
        const prevRevenue = Math.abs(prevItems.find(i => i.label === 'Rörelsens intäkter')?.value ?? 0)

        const revenueChange = prevRevenue > 0
            ? ((revenue - prevRevenue) / prevRevenue * 100).toFixed(0)
            : null

        const revenueComment = revenueChange
            ? `Nettoomsättningen ${parseInt(revenueChange) >= 0 ? 'ökade' : 'minskade'} med ${Math.abs(parseInt(revenueChange))}% jämfört med föregående år.`
            : `Nettoomsättningen uppgick till ${formatSEK(revenue)}.`

        const resultDisposition = netIncome >= 0
            ? `Styrelsen föreslår att årets resultat, ${formatSEK(netIncome)}, balanseras i ny räkning.`
            : `Styrelsen föreslår att årets förlust, ${formatSEK(Math.abs(netIncome))}, balanseras i ny räkning.`

        const managementReport = `## Förvaltningsberättelse

### Allmänt om verksamheten
${companyName} har under räkenskapsåret ${params.year} bedrivit sin verksamhet i enlighet med bolagsordningen.

### Väsentliga händelser under räkenskapsåret
${revenueComment} Årets resultat uppgick till ${formatSEK(netIncome)}.

### Resultatdisposition
${resultDisposition}`

        return {
            success: true,
            data: managementReport,
            message: `Förvaltningsberättelse för ${params.year} genererad baserat på verkliga siffror. Omsättning: ${formatSEK(revenue)}, Resultat: ${formatSEK(netIncome)}.`,
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
