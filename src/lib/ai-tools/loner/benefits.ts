/**
 * Löner AI Tools - Benefits (Förmåner)
 *
 * Tools for managing employee benefits.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import {
    listAvailableBenefits,
    getBenefitDetails,
    // assignBenefit,
    suggestUnusedBenefits,
} from '../../formaner'

// =============================================================================
// Benefits Read Tools
// =============================================================================

export interface GetBenefitsParams {
    category?: 'tax_free' | 'taxable' | 'deduction'
}

export const getAvailableBenefitsTool = defineTool<GetBenefitsParams, any[]>({
    name: 'get_available_benefits',
    description: 'Hämta tillgängliga personalförmåner (t.ex. friskvård, bilförmån).',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            category: { type: 'string', enum: ['tax_free', 'taxable', 'deduction'], description: 'Filtrera på kategori' },
        },
    },
    execute: async (params) => {
        const benefits = await listAvailableBenefits('AB')
        let filtered = benefits
        if (params.category) {
            filtered = benefits.filter(b => b.category === params.category)
        }

        return {
            success: true,
            data: filtered,
            message: `Hittade ${filtered.length} tillgängliga förmåner.`,
            display: {
                component: 'BenefitsTable' as any,
                props: { benefits: filtered },
                title: 'Tillgängliga Förmåner',
                fullViewRoute: '/dashboard/loner?tab=formaner',
            },
        }
    },
})

export const listBenefitsTool = defineTool({
    name: 'list_benefits',
    description: 'List all available employee benefits (förmåner). Filter by company type if needed.',
    parameters: {
        type: 'object' as const,
        properties: {
            companyType: { type: 'string', enum: ['AB', 'EF', 'EnskildFirma'], description: 'Company type filter' },
        },
    },
    requiresConfirmation: false,
    category: 'read',
    execute: async (params: { companyType?: 'AB' | 'EF' | 'EnskildFirma' }) => {
        const benefits = await listAvailableBenefits(params.companyType)
        return {
            success: true,
            data: benefits,
            message: `Found ${benefits.length} available benefits`,
        }
    },
})

export const getBenefitDetailsTool = defineTool({
    name: 'get_benefit_details',
    description: 'Get detailed information about a specific benefit type, including tax rules and limits.',
    parameters: {
        type: 'object' as const,
        properties: {
            benefitId: { type: 'string', description: 'ID of the benefit (e.g., friskvard, tjanstebil)' },
        },
        required: ['benefitId'],
    },
    requiresConfirmation: false,
    category: 'read',
    execute: async (params: { benefitId: string }) => {
        const benefit = await getBenefitDetails(params.benefitId)
        if (benefit) {
            return { success: true, data: benefit, message: `Details for ${benefit.name}` }
        }
        return { success: false, error: 'Benefit not found' }
    },
})

export const suggestUnusedBenefitsTool = defineTool({
    name: 'suggest_unused_benefits',
    description: 'Suggest tax-free benefits that an employee has not used yet this year.',
    parameters: {
        type: 'object' as const,
        properties: {
            employeeName: { type: 'string', description: 'Name of the employee' },
            year: { type: 'number', description: 'Year to check' },
        },
        required: ['employeeName', 'year'],
    },
    requiresConfirmation: false,
    category: 'read',
    execute: async (params: { employeeName: string; year: number }) => {
        const suggestions = await suggestUnusedBenefits(params.employeeName, params.year)
        return {
            success: true,
            data: suggestions,
            message: suggestions.length > 0
                ? `${suggestions.length} unused tax-free benefits available`
                : 'All tax-free benefits have been used',
        }
    },
})

// =============================================================================
// Benefits Write Tools
// =============================================================================

export interface AssignBenefitParams {
    employeeName: string
    benefitId: string
    amount: number
    year?: number
}

export const assignBenefitTool = defineTool<AssignBenefitParams, { success: boolean }>({
    name: 'assign_benefit',
    description: 'Tilldela en förmån till en anställd. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            employeeName: { type: 'string', description: 'Namn på anställd' },
            benefitId: { type: 'string', description: 'ID för förmånen' },
            amount: { type: 'number', description: 'Belopp i kronor' },
            year: { type: 'number', description: 'År (standard: nuvarande)' },
        },
        required: ['employeeName', 'benefitId', 'amount'],
    },
    execute: async (params) => {
        const year = params.year || new Date().getFullYear()

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Tilldela förmån',
            description: `Tilldela ${params.benefitId} till ${params.employeeName}`,
            summary: [
                { label: 'Anställd', value: params.employeeName },
                { label: 'Förmån', value: params.benefitId },
                { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                { label: 'År', value: String(year) },
            ],
            action: { toolName: 'assign_benefit', params },
            requireCheckbox: false,
        }

        return {
            success: true,
            data: { success: true },
            message: `Förmån ${params.benefitId} förberedd för ${params.employeeName}. Belopp: ${params.amount} kr.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

export const benefitsTools = [
    getAvailableBenefitsTool,
    listBenefitsTool,
    getBenefitDetailsTool,
    suggestUnusedBenefitsTool,
    assignBenefitTool,
]
