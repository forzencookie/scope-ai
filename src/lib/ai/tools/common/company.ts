/**
 * Common AI Tools - Company
 *
 * Tools for company information and settings.
 * These tools fetch data from the database via company-service.
 */

import { defineTool } from '../registry'
import { companyService } from '@/services/company'
import { CompanyInfo } from '@/services/company'

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
    allowedCompanyTypes: [],
    category: 'read',
    domain: 'common',
    keywords: ['företag', 'bolag', 'organisationsnummer', 'info'],
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
                error: 'Ingen företagsinformation hittades. Fråga användaren efter företagsnamn, organisationsnummer och företagsform, och spara med update_company_info.',
                data: null,
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
  allowedCompanyTypes: [],
  domain: 'common',
    keywords: ['statistik', 'ekonomi', 'omsättning', 'resultat'],
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
                interface TransactionEntry { amount?: number }
                const transactions: TransactionEntry[] = txData.transactions || []
                revenue = transactions
                    .filter((t) => (t.amount || 0) > 0)
                    .reduce((sum: number, t) => sum + (t.amount || 0), 0)
                expenses = transactions
                    .filter((t) => (t.amount || 0) < 0)
                    .reduce((sum: number, t) => sum + Math.abs(t.amount || 0), 0)
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

// =============================================================================
// Update Company Info Tool
// =============================================================================

export const updateCompanyInfoTool = defineTool<{
    name?: string
    orgNumber?: string
    companyType?: 'ab' | 'ef' | 'hb' | 'kb' | 'forening'
    address?: string
    city?: string
    zipCode?: string
    email?: string
    phone?: string
    vatNumber?: string
    contactPerson?: string
    registrationDate?: string
    fiscalYearEnd?: string
    accountingMethod?: 'cash' | 'invoice'
    vatFrequency?: 'monthly' | 'quarterly' | 'annually'
    isCloselyHeld?: boolean
    hasFskatt?: boolean
    hasEmployees?: boolean
    hasMomsRegistration?: boolean
    shareCapital?: number
    totalShares?: number
}, CompanyInfo | null>({
    name: 'update_company_info',
    description: 'Uppdatera företagsinformation: namn, organisationsnummer, företagsform, adress, skatteuppgifter, räkenskapsår m.m. Använd detta när användaren anger eller korrigerar företagsuppgifter.',
    parameters: {
        type: 'object' as const,
        properties: {
            name: { type: 'string', description: 'Företagsnamn' },
            orgNumber: { type: 'string', description: 'Organisationsnummer (XXXXXX-XXXX)' },
            companyType: { type: 'string', enum: ['ab', 'ef', 'hb', 'kb', 'forening'], description: 'Företagsform' },
            address: { type: 'string', description: 'Gatuadress' },
            city: { type: 'string', description: 'Ort' },
            zipCode: { type: 'string', description: 'Postnummer' },
            email: { type: 'string', description: 'Företagets e-postadress' },
            phone: { type: 'string', description: 'Telefonnummer' },
            vatNumber: { type: 'string', description: 'Momsregistreringsnummer (SE + org.nr + 01)' },
            contactPerson: { type: 'string', description: 'Kontaktperson' },
            registrationDate: { type: 'string', description: 'Registreringsdatum (YYYY-MM-DD)' },
            fiscalYearEnd: { type: 'string', description: 'Räkenskapsårets slutdatum (MM-DD, t.ex. 12-31)' },
            accountingMethod: { type: 'string', enum: ['cash', 'invoice'], description: 'Bokföringsmetod: kontant eller faktura' },
            vatFrequency: { type: 'string', enum: ['monthly', 'quarterly', 'annually'], description: 'Momsredovisningsperiod' },
            isCloselyHeld: { type: 'boolean', description: 'Fåmansföretag (3:12-regler)' },
            hasFskatt: { type: 'boolean', description: 'Innehar F-skattsedel' },
            hasEmployees: { type: 'boolean', description: 'Har anställda' },
            hasMomsRegistration: { type: 'boolean', description: 'Momsregistrerad' },
            shareCapital: { type: 'number', description: 'Aktiekapital i SEK (AB)' },
            totalShares: { type: 'number', description: 'Antal aktier (AB)' },
        },
    },
    requiresConfirmation: true,
    allowedCompanyTypes: [],
    category: 'write',
    domain: 'common',
    keywords: ['företag', 'uppdatera', 'ändra', 'namn', 'organisationsnummer', 'adress', 'företagsform', 'onboarding'],
    execute: async (params, context) => {
        const userId = context?.userId
        const companyId = context?.companyId

        if (!userId) {
            return {
                success: false,
                error: 'Kunde inte identifiera användaren.',
                data: null,
            }
        }

        if (!companyId) {
            return {
                success: false,
                error: 'Inget företag kopplat till ditt konto. Kontakta support om problemet kvarstår.',
                data: null,
            }
        }

        // Build update object from provided params only
        const updates: Record<string, unknown> = {}
        const fieldLabels: string[] = []

        const fieldMap: Record<string, string> = {
            name: 'Företagsnamn',
            orgNumber: 'Organisationsnummer',
            companyType: 'Företagsform',
            address: 'Adress',
            city: 'Ort',
            zipCode: 'Postnummer',
            email: 'E-post',
            phone: 'Telefon',
            vatNumber: 'Momsreg.nr',
            contactPerson: 'Kontaktperson',
            registrationDate: 'Registreringsdatum',
            fiscalYearEnd: 'Räkenskapsår',
            accountingMethod: 'Bokföringsmetod',
            vatFrequency: 'Momsperiod',
            isCloselyHeld: 'Fåmansföretag',
            hasFskatt: 'F-skatt',
            hasEmployees: 'Har anställda',
            hasMomsRegistration: 'Momsregistrerad',
            shareCapital: 'Aktiekapital',
            totalShares: 'Antal aktier',
        }

        for (const [key, label] of Object.entries(fieldMap)) {
            if (params[key as keyof typeof params] !== undefined) {
                updates[key] = params[key as keyof typeof params]
                fieldLabels.push(label)
            }
        }

        if (fieldLabels.length === 0) {
            return {
                success: false,
                error: 'Inga uppgifter att uppdatera. Ange minst ett fält.',
                data: null,
            }
        }

        const result = await companyService.update(companyId, userId, updates)

        if (!result) {
            return {
                success: false,
                error: 'Kunde inte spara ändringarna. Försök igen.',
                data: null,
            }
        }

        return {
            success: true,
            data: result,
            message: `Uppdaterade: ${fieldLabels.join(', ')}.`,
        }
    },
})

export const companyTools = [
    getCompanyInfoTool,
    getCompanyStatsTool,
    updateCompanyInfoTool,
]
