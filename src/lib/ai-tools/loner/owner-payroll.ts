/**
 * Löner AI Tools - Owner & Self-Employment
 *
 * Tools for owner-specific payroll scenarios:
 * - Self-employment fees (Egenavgifter)
 * - Owner withdrawals (Delägaruttag)
 * - 3:12 optimization
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { taxService, FALLBACK_TAX_RATES } from '@/services/tax-service'

// =============================================================================
// Calculate Self-Employment Fees Tool
// =============================================================================

export interface CalculateSelfEmploymentFeesParams {
    income: number
    year?: number
    deductSchablon?: boolean
}

export interface SelfEmploymentFeesResult {
    grossIncome: number
    egenavgifter: number
    schablonAvdrag: number
    netIncome: number
    breakdown: Array<{ label: string; rate: string; amount: number }>
}

export const calculateSelfEmploymentFeesTool = defineTool<CalculateSelfEmploymentFeesParams, SelfEmploymentFeesResult>({
    name: 'calculate_self_employment_fees',
    description: 'Beräkna egenavgifter för enskild näringsidkare eller handelsbolagsdelägare.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            income: { type: 'number', description: 'Inkomst av näringsverksamhet' },
            year: { type: 'number', description: 'Inkomstår (standard: nuvarande)' },
            deductSchablon: { type: 'boolean', description: 'Dra av schablonavdrag (25%)' },
        },
        required: ['income'],
    },
    execute: async (params) => {
        const year = params.year || new Date().getFullYear()
        const taxRates = await taxService.getAllTaxRates(year)

        const components = taxRates.egenavgiftComponents
        const totalRate = taxRates.egenavgifterFull
        const schablonMultiplier = params.deductSchablon !== false ? 0.75 : 1

        const baseForFees = params.income * schablonMultiplier
        const egenavgifter = Math.round(baseForFees * totalRate)
        const schablonAvdrag = Math.round(params.income * 0.25 * totalRate)

        const breakdown = [
            { label: 'Sjukförsäkring', rate: `${(components.sjukforsakring * 100).toFixed(2)}%`, amount: Math.round(baseForFees * components.sjukforsakring) },
            { label: 'Föräldraförsäkring', rate: `${(components.foraldraforsakring * 100).toFixed(2)}%`, amount: Math.round(baseForFees * components.foraldraforsakring) },
            { label: 'Ålderspension', rate: `${(components.alderspension * 100).toFixed(2)}%`, amount: Math.round(baseForFees * components.alderspension) },
            { label: 'Efterlevandepension', rate: `${(components.efterlevandepension * 100).toFixed(2)}%`, amount: Math.round(baseForFees * components.efterlevandepension) },
            { label: 'Arbetsmarknadsavgift', rate: `${(components.arbetsmarknadsavgift * 100).toFixed(2)}%`, amount: Math.round(baseForFees * components.arbetsmarknadsavgift) },
            { label: 'Arbetsskadeavgift', rate: `${(components.arbetsskadeavgift * 100).toFixed(2)}%`, amount: Math.round(baseForFees * components.arbetsskadeavgift) },
        ]

        return {
            success: true,
            data: {
                grossIncome: params.income,
                egenavgifter,
                schablonAvdrag,
                netIncome: params.income - egenavgifter,
                breakdown,
            },
            message: `Egenavgifter på ${params.income.toLocaleString('sv-SE')} kr: ${egenavgifter.toLocaleString('sv-SE')} kr (ca ${(totalRate * 100 * schablonMultiplier).toFixed(1)}%).`,
        }
    },
})

// =============================================================================
// Register Owner Withdrawal Tool
// =============================================================================

export interface RegisterOwnerWithdrawalParams {
    amount: number
    ownerName?: string
    date?: string
    type?: 'lön' | 'utdelning' | 'uttag'
}

export interface OwnerWithdrawalResult {
    id: string
    amount: number
    type: string
    date: string
    verificationId: string
}

export const registerOwnerWithdrawalTool = defineTool<RegisterOwnerWithdrawalParams, OwnerWithdrawalResult>({
    name: 'register_owner_withdrawal',
    description: 'Registrera ett delägaruttag (lön, utdelning eller privat uttag).',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            amount: { type: 'number', description: 'Belopp i kronor' },
            ownerName: { type: 'string', description: 'Namn på delägaren' },
            date: { type: 'string', description: 'Datum (YYYY-MM-DD)' },
            type: { type: 'string', enum: ['lön', 'utdelning', 'uttag'], description: 'Typ av uttag' },
        },
        required: ['amount'],
    },
    execute: async (params, context) => {
        const type = params.type || 'uttag'
        const date = params.date || new Date().toISOString().split('T')[0]
        const ownerName = params.ownerName || 'Delägare'

        const typeLabels = {
            'lön': 'Lön till delägare',
            'utdelning': 'Utdelning',
            'uttag': 'Privat uttag',
        }

        const accountMap = {
            'lön': { debit: '7210', credit: '1930' },
            'utdelning': { debit: '2098', credit: '1930' },
            'uttag': { debit: '2013', credit: '1930' },
        }

        const accountLabels = {
            'lön': { debit: '7210 (Löner)', credit: '1930 (Bank)' },
            'utdelning': { debit: '2098 (Vinst föregående år)', credit: '1930 (Bank)' },
            'uttag': { debit: '2013 (Privata uttag)', credit: '1930 (Bank)' },
        }

        // If confirmed, persist verification to database
        if (context?.isConfirmed) {
            try {
                const { verificationService } = await import('@/services/verification-service')
                const accounts = accountMap[type]

                const verification = await verificationService.createVerification({
                    series: 'A',
                    date,
                    description: `${typeLabels[type]} — ${ownerName}`,
                    entries: [
                        { account: accounts.debit, debit: params.amount, credit: 0, description: typeLabels[type] },
                        { account: accounts.credit, debit: 0, credit: params.amount, description: `Utbetalning ${ownerName}` },
                    ],
                    sourceType: 'ai',
                })

                return {
                    success: true,
                    data: {
                        id: verification?.id || `withdrawal-${Date.now()}`,
                        amount: params.amount,
                        type,
                        date,
                        verificationId: verification?.id || '',
                    },
                    message: `${typeLabels[type]} på ${params.amount.toLocaleString('sv-SE')} kr bokförd för ${ownerName}. Verifikation skapad.`,
                }
            } catch (error) {
                return { success: false, error: 'Kunde inte bokföra uttaget.' }
            }
        }

        // Preflight: return confirmation request
        const confirmationRequest: AIConfirmationRequest = {
            title: typeLabels[type],
            description: `Registrera ${type} för ${ownerName}`,
            summary: [
                { label: 'Typ', value: typeLabels[type] },
                { label: 'Delägare', value: ownerName },
                { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                { label: 'Datum', value: date },
                { label: 'Konto debet', value: accountLabels[type].debit },
                { label: 'Konto kredit', value: accountLabels[type].credit },
            ],
            action: { toolName: 'register_owner_withdrawal', params },
            requireCheckbox: type === 'utdelning',
        }

        return {
            success: true,
            data: {
                id: 'pending',
                amount: params.amount,
                type,
                date,
                verificationId: '',
            },
            message: `${typeLabels[type]} på ${params.amount.toLocaleString('sv-SE')} kr förberett för ${ownerName}. Bekräfta för att bokföra.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

// =============================================================================
// Optimize 3:12 Tool
// =============================================================================

export interface Optimize312Params {
    ownerName: string
    annualSalary?: number
    companyProfit?: number
    ownershipPercent?: number
    currentYear?: number
}

export interface Optimization312Result {
    recommendation: 'salary' | 'dividend' | 'mix'
    optimalSalary: number
    optimalDividend: number
    gransbelopp: number
    taxOnSalary: number
    taxOnDividend: number
    totalTax: number
    savings: number
    explanation: string
}

export const optimize312Tool = defineTool<Optimize312Params, Optimization312Result>({
    name: 'optimize_312',
    description: 'Beräkna optimal fördelning mellan lön och utdelning enligt 3:12-reglerna för fåmansbolag.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            ownerName: { type: 'string', description: 'Namn på delägaren' },
            annualSalary: { type: 'number', description: 'Nuvarande årslön' },
            companyProfit: { type: 'number', description: 'Bolagets resultat före skatt' },
            ownershipPercent: { type: 'number', description: 'Ägarandel i procent (0-100)' },
            currentYear: { type: 'number', description: 'Inkomstår' },
        },
        required: ['ownerName'],
    },
    execute: async (params) => {
        const year = params.currentYear || new Date().getFullYear()
        const ownershipPercent = params.ownershipPercent || 100
        const companyProfit = params.companyProfit || 500000
        const currentSalary = params.annualSalary || 0

        const taxRates = await taxService.getAllTaxRates(year)
        const IBB = taxRates.ibb

        // Förenklingsregeln: 2.75 × IBB
        const forenklingsbelopp = Math.round(2.75 * IBB * (ownershipPercent / 100))

        // Salary requirement for lönebaserat utrymme: 6 × IBB + 5% of company salaries
        const minSalaryForLoneutrymme = 6 * IBB

        // Check if current salary qualifies for löneunderlag
        const qualifiesForLoneutrymme = currentSalary >= minSalaryForLoneutrymme

        // Calculate optimal salary (just above 6 × IBB threshold)
        const optimalSalary = Math.max(currentSalary, Math.round(minSalaryForLoneutrymme * 1.05))

        // Gränsbelopp (simplified)
        const gransbelopp = qualifiesForLoneutrymme
            ? Math.round(optimalSalary * 0.5 * (ownershipPercent / 100))
            : forenklingsbelopp

        // Take the higher of förenkling or lönebaserat
        const effectiveGransbelopp = Math.max(forenklingsbelopp, gransbelopp)

        // Calculate optimal dividend (up to gränsbelopp is taxed at kapitalskatt rate)
        const afterCorpTax = 1 - taxRates.corporateTaxRate
        const optimalDividend = Math.min(effectiveGransbelopp, companyProfit * afterCorpTax * (ownershipPercent / 100))

        // Tax calculations
        // Note: These marginal tax rates are approximations for individual income tax.
        // They vary by municipality (kommunalskatt) and income level (statlig skatt).
        // A proper implementation would look up the user's specific kommun tax rate.
        const dividendTax = Math.round(optimalDividend * taxRates.dividendTaxKapital)
        const salaryTax = Math.round(optimalSalary * 0.32) // ~32% average marginal tax
        const totalTax = dividendTax + salaryTax

        // Compare to all salary
        const allSalaryTax = Math.round((optimalSalary + optimalDividend) * 0.52) // ~52% top marginal rate
        const savings = allSalaryTax - totalTax

        const recommendation = optimalDividend > optimalSalary ? 'dividend' :
            optimalDividend > 0 ? 'mix' : 'salary'

        const explanation = `
Med ${ownershipPercent}% ägande är ditt gränsbelopp ${effectiveGransbelopp.toLocaleString('sv-SE')} kr.

**Rekommendation:**
- Ta ut ${optimalSalary.toLocaleString('sv-SE')} kr i lön (kvalificerar för löneunderlag)
- Ta ut ${optimalDividend.toLocaleString('sv-SE')} kr i utdelning (beskattas med 20%)

**Skattejämförelse:**
- Optimerad strategi: ${totalTax.toLocaleString('sv-SE')} kr i skatt
- Allt som lön: ${allSalaryTax.toLocaleString('sv-SE')} kr i skatt
- **Besparing: ${savings.toLocaleString('sv-SE')} kr**
        `.trim()

        return {
            success: true,
            data: {
                recommendation,
                optimalSalary,
                optimalDividend,
                gransbelopp: effectiveGransbelopp,
                taxOnSalary: salaryTax,
                taxOnDividend: dividendTax,
                totalTax,
                savings,
                explanation,
            },
            message: `3:12-optimering för ${params.ownerName}: Gränsbelopp ${effectiveGransbelopp.toLocaleString('sv-SE')} kr. Besparing: ${savings.toLocaleString('sv-SE')} kr.`,
        }
    },
})

export const ownerPayrollTools = [
    calculateSelfEmploymentFeesTool,
    registerOwnerWithdrawalTool,
    optimize312Tool,
]
