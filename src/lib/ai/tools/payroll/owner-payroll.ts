/**
 * Löner AI Tools - Owner & Self-Employment
 *
 * Tools for owner-specific payroll scenarios:
 * - Self-employment fees (Egenavgifter)
 * - Owner withdrawals (Delägaruttag)
 * - 3:12 optimization
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { taxService } from '@/services/tax'
import { companyService } from '@/services/company/company-service.server'
import { shareholderService } from '@/services/corporate'
import { OWNER_ACCOUNTS, EQUITY_ACCOUNTS } from '@/data/account-constants'

/**
 * Get the correct private withdrawal account for the company type.
 * EF uses 2013, HB/KB uses partner-specific 2072/2075/etc., AB doesn't normally have private withdrawals.
 */
async function getWithdrawalAccount(userId?: string, ownerName?: string): Promise<{ account: string; label: string }> {
    if (userId) {
        try {
            const company = await companyService.getByUserId(userId)
            if (company) {
                switch (company.companyType) {
                    case 'hb':
                    case 'kb': {
                        // Look up partner-specific account from DB
                        const { getPartnerAccounts } = await import('@/types/withdrawal')
                        try {
                            const partners = await shareholderService.getPartners()
                            if (partners && partners.length > 0) {
                                const partner = ownerName
                                    ? partners.find(p => p.name.toLowerCase().includes(ownerName.toLowerCase()))
                                    : partners[0]
                                
                                if (partner) {
                                    const idx = partners.indexOf(partner)
                                    const accountBase = (partner as unknown as { account_base?: number }).account_base || 2070
                                    const accounts = getPartnerAccounts(idx, accountBase)
                                    return { account: accounts.withdrawal, label: `${accounts.withdrawal} (Privata uttag ${partner.name})` }
                                }
                            }
                        } catch (err) { 
                            console.warn('[AI Tool] Failed to fetch partners for withdrawal account:', err)
                        }
                        // Fallback to first partner's default
                        const defaultAccounts = getPartnerAccounts(0)
                        return { account: defaultAccounts.withdrawal, label: `${defaultAccounts.withdrawal} (Privata uttag HB/KB)` }
                    }
                    case 'ab':
                        // AB: private withdrawals are unusual — typically salary or dividend
                        return { account: OWNER_ACCOUNTS.PRIVATE_WITHDRAWAL_EF, label: `${OWNER_ACCOUNTS.PRIVATE_WITHDRAWAL_EF} (Privata uttag — obs: ovanligt för AB)` }
                    default:
                        // EF, enskild firma
                        return { account: OWNER_ACCOUNTS.PRIVATE_WITHDRAWAL_EF, label: `${OWNER_ACCOUNTS.PRIVATE_WITHDRAWAL_EF} (Privata uttag)` }
                }
            }
        } catch { /* fall through to default */ }
    }
    return { account: OWNER_ACCOUNTS.PRIVATE_WITHDRAWAL_EF, label: `${OWNER_ACCOUNTS.PRIVATE_WITHDRAWAL_EF} (Privata uttag)` }
}

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
  allowedCompanyTypes: ["ef","hb","kb"],
  domain: 'loner',
    keywords: ['egenavgift', 'enskild firma', 'avgift'],
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
        if (!taxRates) {
            return { success: false, error: `Skattesatser för ${year} saknas i databasen — kan inte beräkna egenavgifter.` }
        }

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
  allowedCompanyTypes: ["ef","hb","kb"],
  domain: 'loner',
    keywords: ['delägaruttag', 'uttag', 'ägare'],
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

        // Get company-type-aware withdrawal account (pass ownerName for HB/KB partner lookup)
        const withdrawal = await getWithdrawalAccount(context?.userId, ownerName)

        const accountMap = {
            'lön': { debit: OWNER_ACCOUNTS.OWNER_SALARY, credit: '1930' },
            'utdelning': { debit: EQUITY_ACCOUNTS.VINST_FOREGAENDE_AR, credit: '1930' },
            'uttag': { debit: withdrawal.account, credit: '1930' },
        }

        const accountLabels = {
            'lön': { debit: `${OWNER_ACCOUNTS.OWNER_SALARY} (Löner till företagsledare)`, credit: '1930 (Bank)' },
            'utdelning': { debit: `${EQUITY_ACCOUNTS.VINST_FOREGAENDE_AR} (Vinst föregående år)`, credit: '1930 (Bank)' },
            'uttag': { debit: withdrawal.label, credit: '1930 (Bank)' },
        }

        // If confirmed, create verification directly
        if (context?.isConfirmed) {
            try {
                const { verificationService } = await import('@/services/accounting/verification-service')
                const accounts = accountMap[type]

                const verification = await verificationService.createVerification({
                    series: 'A',
                    date,
                    description: `${typeLabels[type]} — ${ownerName}`,
                    entries: [
                        { account: accounts.debit, debit: params.amount, credit: 0, description: typeLabels[type] },
                        { account: accounts.credit, debit: 0, credit: params.amount, description: `Utbetalning ${ownerName}` },
                    ],
                    sourceType: 'owner_withdrawal',
                    sourceId: `withdrawal-${Date.now()}`,
                })

                return {
                    success: true,
                    data: {
                        id: verification.id,
                        amount: params.amount,
                        type,
                        date,
                        verificationId: verification.id,
                    },
                    message: `${typeLabels[type]} på ${params.amount.toLocaleString('sv-SE')} kr bokförd för ${ownerName}. Verifikation: ${verification.series}${verification.number}.`,
                }
            } catch (error) {
                return { success: false, error: 'Kunde inte skapa verifikation.' }
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

export const ownerPayrollTools = [
    calculateSelfEmploymentFeesTool,
    registerOwnerWithdrawalTool,
]
