/**
 * Löner AI Tools - Benefits (Förmåner)
 *
 * Tools for managing employee benefits.
 * Benefit catalog rules live in knowledge/accounting/formaner.md — read via read_skill.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import {
    assignBenefit,
    suggestUnusedBenefits,
    getBenefitDetails,
} from '@/services/payroll'

// =============================================================================
// Suggest Unused Benefits
// =============================================================================

export const suggestUnusedBenefitsTool = defineTool({
    name: 'suggest_unused_benefits',
    description: 'Föreslå skattefria förmåner som en anställd inte nyttjat ännu i år.',
    parameters: {
        type: 'object' as const,
        properties: {
            employeeName: { type: 'string', description: 'Namn på anställd' },
            year: { type: 'number', description: 'År att kontrollera' },
        },
        required: ['employeeName', 'year'],
    },
    requiresConfirmation: false,
    domain: 'loner',
    keywords: ['förmån', 'förslag', 'outnyttjad', 'skattefri'],
    category: 'read',
    execute: async (params: { employeeName: string; year: number }) => {
        const suggestions = await suggestUnusedBenefits(params.employeeName, params.year)
        return {
            success: true,
            data: suggestions,
            message: suggestions.length > 0
                ? `${suggestions.length} outnyttjade skattefria förmåner för ${params.employeeName}`
                : `${params.employeeName} nyttjar redan alla tillgängliga skattefria förmåner`,
        }
    },
})

// =============================================================================
// Assign Benefit
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
    allowedCompanyTypes: [],
    domain: 'loner',
    keywords: ['tilldela', 'förmån', 'anställd'],
    parameters: {
        type: 'object',
        properties: {
            employeeName: { type: 'string', description: 'Namn på anställd' },
            benefitId: { type: 'string', description: 'ID för förmånen (t.ex. friskvard, tjanstebil)' },
            amount: { type: 'number', description: 'Belopp i kronor' },
            year: { type: 'number', description: 'År (standard: nuvarande)' },
        },
        required: ['employeeName', 'benefitId', 'amount'],
    },
    execute: async (params, context) => {
        const year = params.year || new Date().getFullYear()
        const benefit = await getBenefitDetails(params.benefitId)

        const benefitName = benefit?.name ?? params.benefitId
        const taxStatus = benefit?.taxFree
            ? benefit.maxAmount
                ? `Skattefritt (≤ ${benefit.maxAmount.toLocaleString('sv-SE')} kr)`
                : 'Skattefritt'
            : 'Skattepliktigt — läggs på bruttolön'
        const account = benefit?.basAccount ?? '7690 Personalvård'

        if (context?.isConfirmed) {
            const result = await assignBenefit({
                employeeName: params.employeeName,
                benefitType: params.benefitId,
                amount: params.amount,
                year,
            })

            if (result) {
                return {
                    success: true,
                    data: { success: true },
                    message: `${benefitName} tilldelad ${params.employeeName} — ${params.amount.toLocaleString('sv-SE')} kr.`,
                }
            }
            return { success: false, error: 'Kunde inte tilldela förmånen.' }
        }

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Tilldela förmån',
            description: `${params.employeeName} — ${benefitName}`,
            summary: [
                { label: 'Anställd', value: params.employeeName },
                { label: 'Förmån', value: benefitName },
                { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr / år` },
                { label: 'Skatteeffekt', value: taxStatus },
                { label: 'Konto', value: account },
                { label: 'År', value: String(year) },
            ],
            action: { toolName: 'assign_benefit', params },
            requireCheckbox: false,
        }

        return {
            success: true,
            data: { success: true },
            message: `${benefitName} förberedd för ${params.employeeName} — ${params.amount.toLocaleString('sv-SE')} kr. Bekräfta för att tilldela.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

export const benefitsTools = [
    suggestUnusedBenefitsTool,
    assignBenefitTool,
]
