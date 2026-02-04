/**
 * Löner AI Tools - Owner & Self-Employment
 *
 * Tools for owner-specific payroll scenarios:
 * - Self-employment fees (Egenavgifter)
 * - Owner withdrawals (Delägaruttag)
 * - 3:12 optimization
 */

import { defineTool, AIConfirmationRequest } from '../registry'

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

        // 2024+ rates for egenavgifter
        const rates = {
            sjukforsakring: 0.0338,
            foraldraforsakring: 0.0244,
            alderspension: 0.1021,
            efterlevandepension: 0.0060,
            arbetsmarknadsavgift: 0.0064,
            arbetsskadeforsakring: 0.0022,
            // Total: 28.97%
        }

        // Schablonavdrag is 25% of egenavgifterna
        const totalRate = Object.values(rates).reduce((sum, r) => sum + r, 0)
        const schablonMultiplier = params.deductSchablon !== false ? 0.75 : 1

        const baseForFees = params.income * schablonMultiplier
        const egenavgifter = Math.round(baseForFees * totalRate)
        const schablonAvdrag = Math.round(params.income * 0.25 * totalRate)

        const breakdown = [
            { label: 'Sjukförsäkring', rate: '3.38%', amount: Math.round(baseForFees * rates.sjukforsakring) },
            { label: 'Föräldraförsäkring', rate: '2.44%', amount: Math.round(baseForFees * rates.foraldraforsakring) },
            { label: 'Ålderspension', rate: '10.21%', amount: Math.round(baseForFees * rates.alderspension) },
            { label: 'Efterlevandepension', rate: '0.60%', amount: Math.round(baseForFees * rates.efterlevandepension) },
            { label: 'Arbetsmarknadsavgift', rate: '0.64%', amount: Math.round(baseForFees * rates.arbetsmarknadsavgift) },
            { label: 'Arbetsskadeförsäkring', rate: '0.22%', amount: Math.round(baseForFees * rates.arbetsskadeforsakring) },
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
    execute: async (params) => {
        const type = params.type || 'uttag'
        const date = params.date || new Date().toISOString().split('T')[0]
        const ownerName = params.ownerName || 'Delägare'

        const typeLabels = {
            'lön': 'Lön till delägare',
            'utdelning': 'Utdelning',
            'uttag': 'Privat uttag',
        }

        const accounts = {
            'lön': { debit: '7210 (Löner)', credit: '1930 (Bank)' },
            'utdelning': { debit: '2091 (Utdelning)', credit: '1930 (Bank)' },
            'uttag': { debit: '2013 (Privata uttag)', credit: '1930 (Bank)' },
        }

        const confirmationRequest: AIConfirmationRequest = {
            title: typeLabels[type],
            description: `Registrera ${type} för ${ownerName}`,
            summary: [
                { label: 'Typ', value: typeLabels[type] },
                { label: 'Delägare', value: ownerName },
                { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                { label: 'Datum', value: date },
                { label: 'Konto debet', value: accounts[type].debit },
                { label: 'Konto kredit', value: accounts[type].credit },
            ],
            action: { toolName: 'register_owner_withdrawal', params },
            requireCheckbox: type === 'utdelning', // Extra confirmation for dividends
        }

        return {
            success: true,
            data: {
                id: `withdrawal-${Date.now()}`,
                amount: params.amount,
                type,
                date,
                verificationId: `ver-${Date.now()}`,
            },
            message: `${typeLabels[type]} på ${params.amount.toLocaleString('sv-SE')} kr förberett för ${ownerName}.`,
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

        // 2024+ constants
        const IBB = 74300 // Inkomstbasbelopp
        const PBB = 57300 // Prisbasbelopp

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

        // Calculate optimal dividend (up to gränsbelopp is taxed at 20%)
        const optimalDividend = Math.min(effectiveGransbelopp, companyProfit * 0.794 * (ownershipPercent / 100)) // After 20.6% corp tax

        // Tax calculations
        const dividendTax = Math.round(optimalDividend * 0.20) // 20% on qualified dividends
        const salaryTax = Math.round(optimalSalary * 0.32) // ~32% marginal tax (simplified)
        const totalTax = dividendTax + salaryTax

        // Compare to all salary
        const allSalaryTax = Math.round((optimalSalary + optimalDividend) * 0.52) // ~52% top marginal
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
