/**
 * Skatt AI Tools - VAT (Moms)
 *
 * Tools for VAT/Moms management and submissions.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { vatService, type VATDeclaration } from '@/lib/services/vat-service'

// =============================================================================
// VAT Read Tools
// =============================================================================

export const getVatReportTool = defineTool<{ period?: string }, VATDeclaration[]>({
    name: 'get_vat_report',
    description: 'Hämta momsdeklarationer. Visar utgående och ingående moms samt nettobelopp.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period (t.ex. "Q4 2024")' },
        },
    },
    execute: async (params) => {
        let periods = await vatService.getDeclarations()

        if (params.period) {
            periods = periods.filter(p => p.period.toLowerCase().includes(params.period!.toLowerCase()))
        }

        const upcoming = periods.find(p => p.status === 'upcoming')

        let message = `Hittade ${periods.length} momsperioder.`
        if (upcoming) {
            const action = upcoming.netVat > 0 ? 'betala' : 'få tillbaka'
            message += ` Nästa period (${upcoming.period}): ${Math.abs(upcoming.netVat).toLocaleString('sv-SE')} kr att ${action}, deadline ${upcoming.dueDate}.`
        }

        return {
            success: true,
            data: periods,
            message,
            display: {
                component: 'VatSummary',
                props: { periods },
                title: 'Momsdeklaration',
                fullViewRoute: '/dashboard/skatt?tab=momsdeklaration',
            },
        }
    },
})

// =============================================================================
// VAT Submit Tool
// =============================================================================

export interface SubmitVatParams {
    period: string
}

export const submitVatTool = defineTool<SubmitVatParams, { submitted: boolean; referenceNumber: string }>({
    name: 'submit_vat_declaration',
    description: 'Skicka in momsdeklaration till Skatteverket. Kräver alltid bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period (t.ex. "Q4 2024")' },
        },
        required: ['period'],
    },
    execute: async (params) => {
        const periods = await vatService.getDeclarations()
        const periodData = periods.find(p => p.period.toLowerCase().includes(params.period.toLowerCase()))

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Skicka momsdeklaration',
            description: `Momsdeklaration för ${params.period}`,
            summary: [
                { label: 'Period', value: params.period },
                { label: 'Utgående moms', value: periodData ? `${periodData.outputVat.toLocaleString('sv-SE')} kr` : 'N/A' },
                { label: 'Ingående moms', value: periodData ? `${periodData.inputVat.toLocaleString('sv-SE')} kr` : 'N/A' },
                { label: 'Att betala/få', value: periodData ? `${periodData.netVat.toLocaleString('sv-SE')} kr` : 'N/A' },
            ],
            action: { toolName: 'submit_vat_declaration', params },
            requireCheckbox: true,
        }

        return {
            success: true,
            data: { submitted: false, referenceNumber: '' },
            message: `Momsdeklaration för ${params.period} förberedd för inskickning.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

export const vatTools = [
    getVatReportTool,
    submitVatTool,
]

