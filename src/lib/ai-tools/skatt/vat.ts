/**
 * Skatt AI Tools - VAT (Moms)
 *
 * Tools for VAT/Moms management and submissions.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { mockVatReport } from '@/data/mock-data'

// =============================================================================
// VAT Read Tools
// =============================================================================

interface VATDeclaration {
    id: string
    period: string
    outputVat: number
    inputVat: number
    netVat: number
    dueDate: string
    status: string
}

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
        // Use mock data
        const vatData: VATDeclaration = {
            id: 'vat-1',
            period: mockVatReport.period,
            outputVat: mockVatReport.salesVat,
            inputVat: mockVatReport.purchaseVat,
            netVat: mockVatReport.vatToPay,
            dueDate: mockVatReport.dueDate,
            status: mockVatReport.status,
        }

        const periods = [vatData]
        const action = vatData.netVat > 0 ? 'betala' : 'få tillbaka'
        const message = `Moms för ${vatData.period}: ${vatData.netVat.toLocaleString('sv-SE')} kr att ${action}. Deadline: ${vatData.dueDate}.`

        return {
            success: true,
            data: periods,
            message,
            display: {
                component: 'VatSummary',
                props: {
                    periods,
                    summary: {
                        outputVat: vatData.outputVat,
                        inputVat: vatData.inputVat,
                        netVat: vatData.netVat,
                        dueDate: vatData.dueDate,
                    }
                },
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
        // Use mock data
        const confirmationRequest: AIConfirmationRequest = {
            title: 'Skicka momsdeklaration',
            description: `Momsdeklaration för ${params.period}`,
            summary: [
                { label: 'Period', value: params.period },
                { label: 'Utgående moms', value: `${mockVatReport.salesVat.toLocaleString('sv-SE')} kr` },
                { label: 'Ingående moms', value: `${mockVatReport.purchaseVat.toLocaleString('sv-SE')} kr` },
                { label: 'Att betala', value: `${mockVatReport.vatToPay.toLocaleString('sv-SE')} kr` },
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

