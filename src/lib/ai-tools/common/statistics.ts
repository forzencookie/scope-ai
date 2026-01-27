/**
 * Common AI Tools - Company Statistics
 *
 * Tools for getting comprehensive company statistics and KPIs.
 */

import { defineTool } from '../registry'
import { 
    companyStatisticsService, 
    CompanyStatistics,
    MonthlyFinancialSummary 
} from '@/services/company-statistics-service'

// =============================================================================
// Get Company Statistics Tool
// =============================================================================

export interface GetCompanyStatisticsParams {
    year?: number
}

export const getCompanyStatisticsTool = defineTool<GetCompanyStatisticsParams, CompanyStatistics>({
    name: 'get_company_statistics',
    description: 'Hämta omfattande företagsstatistik: intäkter, kostnader, transaktioner, fakturor, anställda, etc.',
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
            const stats = await companyStatisticsService.getStatistics(params.year)

            const summaryLines = [
                `💰 Intäkter: ${stats.revenue.toLocaleString('sv-SE')} kr`,
                `📉 Kostnader: ${stats.expenses.toLocaleString('sv-SE')} kr`,
                `📊 Resultat: ${stats.netResult.toLocaleString('sv-SE')} kr`,
                `🏦 Kassa: ${stats.cashBalance.toLocaleString('sv-SE')} kr`,
                `📝 Transaktioner: ${stats.transactionCount} (${stats.pendingTransactionCount} väntande)`,
                `📄 Fakturor: ${stats.invoicesOutstandingAmount.toLocaleString('sv-SE')} kr utestående`,
                `👥 Anställda: ${stats.employeeCount}`,
            ]

            return {
                success: true,
                data: stats,
                message: summaryLines.join('\n'),
                display: {
                    component: 'CompanyStatistics',
                    props: { statistics: stats },
                    title: 'Företagsstatistik',
                    fullViewRoute: '/dashboard/foretagsstatistik',
                },
            }
        } catch (error) {
            console.error('Failed to fetch company statistics:', error)
            return {
                success: false,
                error: 'Kunde inte hämta företagsstatistik.',
            }
        }
    },
})

// =============================================================================
// Get Monthly Breakdown Tool
// =============================================================================

export const getMonthlyBreakdownTool = defineTool<{ year?: number }, MonthlyFinancialSummary[]>({
    name: 'get_monthly_breakdown',
    description: 'Hämta månadsvis uppdelning av intäkter och kostnader.',
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
            const monthly = await companyStatisticsService.getMonthlyBreakdown(params.year)
            
            // Find best and worst months
            const sorted = [...monthly].sort((a, b) => b.netResult - a.netResult)
            const best = sorted[0]
            const worst = sorted[sorted.length - 1]

            return {
                success: true,
                data: monthly,
                message: `Månadsuppdelning för ${params.year || new Date().getFullYear()}. ` +
                    `Bästa månad: ${best?.month} (${best?.netResult.toLocaleString('sv-SE')} kr). ` +
                    `Sämsta månad: ${worst?.month} (${worst?.netResult.toLocaleString('sv-SE')} kr).`,
                display: {
                    component: 'MonthlyBreakdown',
                    props: { data: monthly },
                    title: 'Månadsvis översikt',
                    fullViewRoute: '/dashboard/foretagsstatistik',
                },
            }
        } catch (error) {
            console.error('Failed to fetch monthly breakdown:', error)
            return {
                success: false,
                error: 'Kunde inte hämta månadsuppdelning.',
            }
        }
    },
})

// =============================================================================
// Get KPIs Tool
// =============================================================================

export interface KPIs {
    grossMargin: number
    operatingMargin: number
    currentRatio: number
    quickRatio: number
    debtToEquity: number
    returnOnEquity: number
}

export const getKPIsTool = defineTool<{ year?: number }, KPIs>({
    name: 'get_kpis',
    description: 'Hämta nyckeltal (KPIs): bruttomarginal, rörelsemarginal, likviditet, skuldsättning.',
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
            const kpis = await companyStatisticsService.getKPIs(params.year)

            const formatPercent = (n: number) => `${n.toFixed(1)}%`

            return {
                success: true,
                data: kpis,
                message: [
                    `📈 Bruttomarginal: ${formatPercent(kpis.grossMargin)}`,
                    `📊 Rörelsemarginal: ${formatPercent(kpis.operatingMargin)}`,
                    `💧 Likviditet (current ratio): ${kpis.currentRatio.toFixed(2)}`,
                    `⚡ Snabb likviditet (quick ratio): ${kpis.quickRatio.toFixed(2)}`,
                    `📉 Skuldsättningsgrad: ${kpis.debtToEquity.toFixed(2)}`,
                    `💰 Avkastning på EK: ${formatPercent(kpis.returnOnEquity)}`,
                ].join('\n'),
                display: {
                    component: 'KPIDisplay',
                    props: { kpis },
                    title: 'Nyckeltal (KPIs)',
                    fullViewRoute: '/dashboard/foretagsstatistik',
                },
            }
        } catch (error) {
            console.error('Failed to fetch KPIs:', error)
            return {
                success: false,
                error: 'Kunde inte hämta nyckeltal.',
            }
        }
    },
})

// =============================================================================
// Get Dashboard Counts Tool
// =============================================================================

export const getDashboardCountsTool = defineTool<Record<string, never>, {
    transactions: { total: number; pending: number }
    invoices: { total: number; overdue: number }
    receipts: { total: number; unmatched: number }
    employees: { total: number }
}>({
    name: 'get_dashboard_counts',
    description: 'Hämta snabb översikt: antal transaktioner, fakturor, kvitton, anställda.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            const counts = await companyStatisticsService.getDashboardCounts()

            return {
                success: true,
                data: counts,
                message: `📊 ${counts.transactions.total} transaktioner (${counts.transactions.pending} väntande), ` +
                    `📄 ${counts.invoices.total} fakturor (${counts.invoices.overdue} förfallna), ` +
                    `🧾 ${counts.receipts.total} kvitton (${counts.receipts.unmatched} omatchade), ` +
                    `👥 ${counts.employees.total} anställda.`,
            }
        } catch (error) {
            console.error('Failed to fetch dashboard counts:', error)
            return {
                success: false,
                error: 'Kunde inte hämta översiktsdata.',
            }
        }
    },
})

export const companyStatisticsTools = [
    getCompanyStatisticsTool,
    getMonthlyBreakdownTool,
    getKPIsTool,
    getDashboardCountsTool,
]
