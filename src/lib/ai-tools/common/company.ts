/**
 * Common AI Tools - Company
 *
 * Tools for company information and settings.
 * These tools fetch data from the database via company-service.
 */

import { defineTool } from '../registry'
import { companyService, CompanyInfo } from '@/services/company-service'

// Helper to get base URL for API calls
function getBaseUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

// =============================================================================
// Company Info Tool
// =============================================================================

export const getCompanyInfoTool = defineTool<{ userId?: string }, CompanyInfo | null>({
    name: 'get_company_info',
    description: 'Hämta information om företaget: namn, organisationsnummer, företagsform, räkenskapsår, momsinställningar.',
    parameters: {
        type: 'object' as const,
        properties: {
            userId: { type: 'string', description: 'User ID (optional, uses context if not provided)' }
        }
    },
    requiresConfirmation: false,
    category: 'read',
    execute: async (params, context) => {
        // Get user ID from params or context
        const userId = params?.userId || context?.userId

        if (!userId) {
            return {
                success: false,
                error: 'Kunde inte identifiera användaren. Logga in och försök igen.',
                data: null,
            }
        }

        // Fetch from database
        const company = await companyService.getByUserId(userId)

        if (!company) {
            return {
                success: false,
                error: 'Ingen företagsinformation hittades. Gå till Inställningar för att konfigurera ditt företag.',
                data: null,
                navigation: {
                    route: '/dashboard/installningar',
                    label: 'Gå till inställningar',
                },
            }
        }

        // Format company type for display
        const companyTypeLabels: Record<string, string> = {
            ab: 'Aktiebolag',
            enskild_firma: 'Enskild firma',
            hb: 'Handelsbolag',
            kb: 'Kommanditbolag',
            ekonomisk_forening: 'Ekonomisk förening',
        }

        const vatFrequencyLabels: Record<string, string> = {
            monthly: 'Månadsvis',
            quarterly: 'Kvartalsvis',
            annually: 'Årsvis',
        }

        return {
            success: true,
            data: company,
            message: `${company.name} (${company.orgNumber || 'Org.nr ej angivet'}) - ${companyTypeLabels[company.companyType] || company.companyType}. Räkenskapsår slutar ${company.fiscalYearEnd}. Moms: ${vatFrequencyLabels[company.vatFrequency] || company.vatFrequency}.`,
        }
    },
})

// =============================================================================
// Company Stats Tool
// =============================================================================

export interface CompanyStats {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    employeeCount: number
    pendingVat: number
    upcomingDeadlines: number
}

export const getCompanyStatsTool = defineTool<Record<string, never>, CompanyStats>({
    name: 'get_company_stats',
    description: 'Hämta en sammanfattning av företagets ekonomiska status.',
    category: 'read',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        const baseUrl = getBaseUrl()

        // Fetch real data from API endpoints (these respect RLS)
        let employeeCount = 0
        const pendingVat = 0
        let upcomingDeadlines = 0
        let revenue = 0
        let expenses = 0
        let profit = 0

        try {
            // Fetch employees
            const empRes = await fetch(`${baseUrl}/api/employees`, {
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' }
            })
            if (empRes.ok) {
                const empData = await empRes.json()
                employeeCount = empData.employees?.length || 0
            }

            // Fetch transactions to calculate revenue/expenses
            const txRes = await fetch(`${baseUrl}/api/transactions`, {
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' }
            })
            if (txRes.ok) {
                const txData = await txRes.json()
                const transactions = txData.transactions || []
                revenue = transactions
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .filter((t: any) => (t.amount || 0) > 0)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
                expenses = transactions
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .filter((t: any) => (t.amount || 0) < 0)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0)
                profit = revenue - expenses
            }

            // Fetch compliance deadlines
            const compRes = await fetch(`${baseUrl}/api/compliance`, {
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' }
            })
            if (compRes.ok) {
                const compData = await compRes.json()
                upcomingDeadlines = compData.upcoming?.length || 0
            }
        } catch (error) {
            console.error('[AI Tool] Failed to fetch company stats:', error)
        }

        const stats: CompanyStats = {
            totalRevenue: revenue,
            totalExpenses: expenses,
            netProfit: profit,
            employeeCount,
            pendingVat,
            upcomingDeadlines,
        }

        return {
            success: true,
            data: stats,
            message: `Omsättning: ${revenue.toLocaleString('sv-SE')} kr. Resultat: ${profit.toLocaleString('sv-SE')} kr. ${stats.upcomingDeadlines} kommande deadlines.`,
        }
    },
})

export const companyTools = [
    getCompanyInfoTool,
    getCompanyStatsTool,
]
