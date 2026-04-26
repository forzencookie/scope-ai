/**
 * Parter AI Tools - Partners (HB/KB Delägare)
 *
 * Tools for managing partners in HB/KB companies.
 */

import { defineTool } from '../registry'
import { shareholderService } from '@/services/corporate/shareholder-service'

// =============================================================================
// Partner Tools
// =============================================================================

interface PartnerStats {
    partnerCount?: number
    [key: string]: unknown
}

export const getPartnersTool = defineTool<Record<string, never>, PartnerStats>({
    name: 'get_partners',
    description: 'Hämta alla delägare i handelsbolag eller kommanditbolag.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: ["hb","kb"],
  domain: 'parter',
    keywords: ['delägare', 'partners', 'ägare'],
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            const data = await shareholderService.getPartnerStats()
            const stats = data as unknown as PartnerStats
            return {
                success: true,
                data: stats,
                message: `Hittade ${stats.partnerCount || 0} delägare.`,
            }
        } catch (error) {
            console.error('Failed to fetch partners:', error)
        }

        return { success: false, error: 'Kunde inte hämta delägare.' }
    },
})

interface MemberStats {
    totalMembers?: number
    activeMembers?: number
    [key: string]: unknown
}

export const getMembersTool = defineTool<Record<string, never>, MemberStats>({
    name: 'get_members',
    description: 'Hämta alla medlemmar i ekonomisk förening.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: ["hb","kb"],
  domain: 'parter',
    keywords: ['medlemmar', 'förening', 'register'],
    parameters: { type: 'object', properties: {} },
    execute: async () => {
        try {
            const data = await shareholderService.getMemberStats()
            const stats = data as unknown as MemberStats
            return {
                success: true,
                data: stats,
                message: `Föreningen har ${stats.totalMembers || 0} medlemmar, varav ${stats.activeMembers || 0} aktiva.`,
            }
        } catch (error) {
            console.error('Failed to fetch members:', error)
        }

        return { success: false, error: 'Kunde inte hämta medlemmar.' }
    },
})

// =============================================================================
// register_partner
// =============================================================================

interface PartnerRecord {
    id: string
    name: string
    personal_number: string | null
    type: string
    capital_contribution: number | null
    current_capital_balance: number | null
    email: string | null
}

export interface RegisterPartnerParams {
    name: string
    personnummer?: string
    partnerType: 'general' | 'limited'
    capitalContribution?: number
}

export const registerPartnerTool = defineTool<RegisterPartnerParams, PartnerRecord>({
    name: 'register_partner',
    description: 'Registrerar en ny delägare i bolaget. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    allowedCompanyTypes: ['hb', 'kb'],
    domain: 'parter',
    keywords: ['registrera delägare', 'ny partner', 'handelsbolag', 'kommanditbolag'],
    parameters: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Delägarens fullständiga namn' },
            personnummer: { type: 'string', description: 'Personnummer (YYYYMMDD-XXXX)' },
            partnerType: { type: 'string', enum: ['general', 'limited'], description: 'Typ: general = bolagsman, limited = kommanditdelägare' },
            capitalContribution: { type: 'number', description: 'Kapitalinsats i kronor' },
        },
        required: ['name', 'partnerType'],
    },
    execute: async (params, context) => {
        if (context?.isConfirmed) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                const res = await fetch(`${baseUrl}/api/partners`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: params.name,
                        personal_number: params.personnummer ?? null,
                        type: params.partnerType === 'general' ? 'Bolagsman' : 'Kommanditdelägare',
                        capital_contribution: params.capitalContribution ?? null,
                        current_capital_balance: params.capitalContribution ?? null,
                    }),
                })
                if (!res.ok) {
                    const err = await res.json().catch(() => ({})) as { error?: string }
                    return { success: false, error: err.error ?? 'Kunde inte registrera delägare.' }
                }
                const data = await res.json() as { partner: PartnerRecord }
                const typeLabel = params.partnerType === 'general' ? 'bolagsman' : 'kommanditdelägare'
                return {
                    success: true,
                    data: data.partner,
                    message: `${params.name} registrerad som ${typeLabel}${params.capitalContribution ? ` med ${params.capitalContribution.toLocaleString('sv-SE')} kr i kapitalinsats` : ''}.`,
                }
            } catch {
                return { success: false, error: 'Kunde inte registrera delägare.' }
            }
        }
        const typeLabel = params.partnerType === 'general' ? 'Bolagsman' : 'Kommanditdelägare'
        const summaryItems: Array<{ label: string; value: string }> = [
            { label: 'Namn', value: params.name },
            { label: 'Typ', value: typeLabel },
        ]
        if (params.personnummer) summaryItems.push({ label: 'Personnummer', value: params.personnummer })
        if (params.capitalContribution) summaryItems.push({ label: 'Kapitalinsats', value: `${params.capitalContribution.toLocaleString('sv-SE')} kr` })
        return {
            success: true,
            data: { id: '', name: params.name, personal_number: params.personnummer ?? null, type: params.partnerType, capital_contribution: params.capitalContribution ?? null, current_capital_balance: params.capitalContribution ?? null, email: null },
            message: `Förbereder registrering av ${params.name} som ${typeLabel.toLowerCase()}.`,
            confirmationRequired: {
                title: 'Registrera delägare',
                description: `Lägger till ${params.name} som ${typeLabel.toLowerCase()} i bolaget.`,
                summary: summaryItems,
                action: { toolName: 'register_partner', params },
            },
        }
    },
})

// =============================================================================
// create_partnership_contribution
// =============================================================================

export interface CreatePartnershipContributionParams {
    partnerId: string
    amount: number
    date?: string
    description?: string
}

interface ContributionResult {
    partnerId: string
    amount: number
    date: string
    description: string
    verificationId?: string
}

export const createPartnershipContributionTool = defineTool<CreatePartnershipContributionParams, ContributionResult>({
    name: 'create_partnership_contribution',
    description: 'Registrerar ett kapitaltillskott från en delägare. Skapar bokföringspost. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    allowedCompanyTypes: ['hb', 'kb'],
    domain: 'parter',
    keywords: ['kapitaltillskott', 'insättning', 'kapital', 'delägare'],
    parameters: {
        type: 'object',
        properties: {
            partnerId: { type: 'string', description: 'ID för delägaren som gör tillskottet' },
            amount: { type: 'number', description: 'Belopp i kronor' },
            date: { type: 'string', description: 'Datum (YYYY-MM-DD), standard: idag' },
            description: { type: 'string', description: 'Beskrivning av tillskottet' },
        },
        required: ['partnerId', 'amount'],
    },
    execute: async (params, context) => {
        const txDate = params.date ?? new Date().toISOString().split('T')[0]
        const txDescription = params.description ?? 'Kapitaltillskott från delägare'
        if (context?.isConfirmed) {
            try {
                const { verificationService } = await import('@/services/accounting/verification-service')
                const verification = await verificationService.createVerification({
                    date: txDate,
                    description: txDescription,
                    entries: [
                        { account: '1930', debit: params.amount, credit: 0, description: 'Företagskonto / bank' },
                        { account: '2050', debit: 0, credit: params.amount, description: 'Eget kapital — delägare' },
                    ],
                    sourceType: 'partner_contribution',
                })
                return {
                    success: true,
                    data: { partnerId: params.partnerId, amount: params.amount, date: txDate, description: txDescription, verificationId: verification?.id },
                    message: `Kapitaltillskott på ${params.amount.toLocaleString('sv-SE')} kr registrerat (${txDate}). Bokfört: 1930 ↔ 2050.`,
                }
            } catch {
                return { success: false, error: 'Kunde inte registrera kapitaltillskott.' }
            }
        }
        return {
            success: true,
            data: { partnerId: params.partnerId, amount: params.amount, date: txDate, description: txDescription },
            message: `Förbereder registrering av kapitaltillskott på ${params.amount.toLocaleString('sv-SE')} kr.`,
            confirmationRequired: {
                title: 'Registrera kapitaltillskott',
                description: 'Skapar bokföringspost för delägarens kapitaltillskott.',
                summary: [
                    { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                    { label: 'Datum', value: txDate },
                    { label: 'Beskrivning', value: txDescription },
                    { label: 'Bokföring', value: '1930 Debet ↔ 2050 Kredit' },
                ],
                action: { toolName: 'create_partnership_contribution', params },
            },
        }
    },
})

// =============================================================================
// create_partnership_withdrawal
// =============================================================================

export interface CreatePartnershipWithdrawalParams {
    partnerId: string
    amount: number
    date?: string
    description?: string
}

interface WithdrawalResult {
    partnerId: string
    amount: number
    date: string
    description: string
    verificationId?: string
}

export const createPartnershipWithdrawalTool = defineTool<CreatePartnershipWithdrawalParams, WithdrawalResult>({
    name: 'create_partnership_withdrawal',
    description: 'Registrerar ett kapitaluttag för en delägare. Skapar bokföringspost. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    allowedCompanyTypes: ['hb', 'kb'],
    domain: 'parter',
    keywords: ['uttag', 'delägaruttag', 'kapitaluttag'],
    parameters: {
        type: 'object',
        properties: {
            partnerId: { type: 'string', description: 'ID för delägaren som gör uttaget' },
            amount: { type: 'number', description: 'Belopp i kronor' },
            date: { type: 'string', description: 'Datum (YYYY-MM-DD), standard: idag' },
            description: { type: 'string', description: 'Beskrivning av uttaget' },
        },
        required: ['partnerId', 'amount'],
    },
    execute: async (params, context) => {
        const txDate = params.date ?? new Date().toISOString().split('T')[0]
        const txDescription = params.description ?? 'Kapitaluttag av delägare'
        if (context?.isConfirmed) {
            try {
                const { verificationService } = await import('@/services/accounting/verification-service')
                const verification = await verificationService.createVerification({
                    date: txDate,
                    description: txDescription,
                    entries: [
                        { account: '2050', debit: params.amount, credit: 0, description: 'Eget kapital — delägare' },
                        { account: '1930', debit: 0, credit: params.amount, description: 'Företagskonto / bank' },
                    ],
                    sourceType: 'partner_withdrawal',
                })
                return {
                    success: true,
                    data: { partnerId: params.partnerId, amount: params.amount, date: txDate, description: txDescription, verificationId: verification?.id },
                    message: `Kapitaluttag på ${params.amount.toLocaleString('sv-SE')} kr registrerat (${txDate}). Bokfört: 2050 ↔ 1930.`,
                }
            } catch {
                return { success: false, error: 'Kunde inte registrera kapitaluttag.' }
            }
        }
        return {
            success: true,
            data: { partnerId: params.partnerId, amount: params.amount, date: txDate, description: txDescription },
            message: `Förbereder registrering av kapitaluttag på ${params.amount.toLocaleString('sv-SE')} kr.`,
            confirmationRequired: {
                title: 'Registrera kapitaluttag',
                description: 'Skapar bokföringspost för delägarens kapitaluttag.',
                summary: [
                    { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                    { label: 'Datum', value: txDate },
                    { label: 'Beskrivning', value: txDescription },
                    { label: 'Bokföring', value: '2050 Debet ↔ 1930 Kredit' },
                ],
                action: { toolName: 'create_partnership_withdrawal', params },
            },
        }
    },
})

// =============================================================================
// register_member
// =============================================================================

interface MemberRecord {
    id: string
    name: string
    email: string | null
    join_date: string
    membership_type: string
}

export interface RegisterMemberParams {
    name: string
    email?: string
    personnummer?: string
    membershipFee?: number
    joinDate?: string
}

export const registerMemberTool = defineTool<RegisterMemberParams, MemberRecord>({
    name: 'register_member',
    description: 'Registrerar en ny medlem i föreningen. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    allowedCompanyTypes: ['forening'],
    domain: 'parter',
    keywords: ['registrera medlem', 'ny medlem', 'förening', 'medlemskap'],
    parameters: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Medlemmens fullständiga namn' },
            email: { type: 'string', description: 'E-postadress' },
            personnummer: { type: 'string', description: 'Personnummer (YYYYMMDD-XXXX)' },
            membershipFee: { type: 'number', description: 'Medlemsavgift i kronor' },
            joinDate: { type: 'string', description: 'Inträdesdag (YYYY-MM-DD), standard: idag' },
        },
        required: ['name'],
    },
    execute: async (params, context) => {
        const date = params.joinDate ?? new Date().toISOString().split('T')[0]
        if (context?.isConfirmed) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                const res = await fetch(`${baseUrl}/api/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: params.name,
                        email: params.email ?? null,
                        joinDate: date,
                        status: 'active',
                        membershipType: 'standard',
                        lastPaidYear: params.membershipFee ? new Date().getFullYear() : null,
                    }),
                })
                if (!res.ok) {
                    const err = await res.json().catch(() => ({})) as { error?: string }
                    return { success: false, error: err.error ?? 'Kunde inte registrera medlem.' }
                }
                const data = await res.json() as { member: MemberRecord }
                return {
                    success: true,
                    data: data.member,
                    message: `${params.name} registrerad som ny medlem (inträde ${date}).`,
                }
            } catch {
                return { success: false, error: 'Kunde inte registrera medlem.' }
            }
        }
        const summaryItems: Array<{ label: string; value: string }> = [
            { label: 'Namn', value: params.name },
            { label: 'Inträdesdag', value: date },
        ]
        if (params.email) summaryItems.push({ label: 'E-post', value: params.email })
        if (params.membershipFee) summaryItems.push({ label: 'Medlemsavgift', value: `${params.membershipFee.toLocaleString('sv-SE')} kr` })
        return {
            success: true,
            data: { id: '', name: params.name, email: params.email ?? null, join_date: date, membership_type: 'standard' },
            message: `Förbereder registrering av ${params.name} som ny medlem.`,
            confirmationRequired: {
                title: 'Registrera ny medlem',
                description: `Lägger till ${params.name} i föreningens medlemsregister.`,
                summary: summaryItems,
                action: { toolName: 'register_member', params },
            },
        }
    },
})

export const partnerTools = [
    getPartnersTool,
    getMembersTool,
    registerPartnerTool,
    createPartnershipContributionTool,
    createPartnershipWithdrawalTool,
    registerMemberTool,
]
