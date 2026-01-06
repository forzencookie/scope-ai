/**
 * Common AI Tools - Company
 *
 * Tools for company information and settings.
 */

import { defineTool } from '../registry'
import {
    generateMockEmployees,
    generateMockAGIReports,
} from '@/services/payroll-processor'
import {
    generateMockIncomeStatement,
    generateMockVATPeriods,
} from '@/services/reports-processor'

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
        const income = generateMockIncomeStatement()
        const employees = generateMockEmployees()
        const vat = generateMockVATPeriods()
        const agi = generateMockAGIReports()

        const revenue = income.find(i => i.label === 'Rörelseintäkter')?.value || 0
        const expenses = income.find(i => i.label === 'Rörelsekostnader')?.value || 0
        const profit = income.find(i => i.label === 'Årets resultat')?.value || 0

        const upcomingVat = vat.find(p => p.status === 'Kommande')
        const pendingAgi = agi.filter(r => r.status !== 'Inskickad').length

        const stats: CompanyStats = {
            totalRevenue: revenue,
            totalExpenses: Math.abs(expenses),
            netProfit: profit,
            employeeCount: employees.length,
            pendingVat: upcomingVat?.netVat || 0,
            upcomingDeadlines: pendingAgi + (upcomingVat ? 1 : 0),
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
