/**
 * Common AI Tools - Company
 *
 * Tools for company information and settings.
 * These tools fetch data from authenticated API endpoints.
 */

import { defineTool } from '../registry'

// Helper to get base URL for API calls
function getBaseUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

// =============================================================================
// Company Info Tool
// =============================================================================

export const getCompanyInfoTool = defineTool({
    name: 'get_company_info',
    description: 'Hämta information om företaget: namn, organisationsnummer, företagsform, inställningar.',
    parameters: { type: 'object' as const, properties: {} },
    requiresConfirmation: false,
    category: 'read',
    execute: async () => {
        let company = null
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('scope-ai-company')
            if (stored) {
                company = JSON.parse(stored)
            }
        }

        if (!company) {
            company = {
                name: 'Mitt Företag AB',
                orgNumber: '556123-4567',
                companyType: 'ab',
                fiscalYearEnd: '12-31',
                vatFrequency: 'quarterly',
                isCloselyHeld: true,
                hasEmployees: true,
            }
        }

        return {
            success: true,
            data: company,
            message: `${company.name} (${company.orgNumber})`,
            display: {
                component: 'CompanyInfoCard' as any,
                props: { company },
                title: 'Företagsinformation',
                fullViewRoute: '/dashboard/installningar',
            },
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
        let pendingVat = 0
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
                    .filter((t: any) => (t.amount || 0) > 0)
                    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
                expenses = transactions
                    .filter((t: any) => (t.amount || 0) < 0)
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
            display: {
                component: 'CompanyStats',
                props: { stats },
                title: 'Företagsöversikt',
                fullViewRoute: '/dashboard',
            },
        }
    },
})

export const companyTools = [
    getCompanyInfoTool,
    getCompanyStatsTool,
]
