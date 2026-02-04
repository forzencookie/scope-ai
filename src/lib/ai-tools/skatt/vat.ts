/**
 * Skatt AI Tools - VAT (Moms)
 *
 * Tools for VAT/Moms management and submissions.
 * Uses vat-service.ts to query real data from Supabase.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { vatService, type VATDeclaration, type VATStats } from '@/services/vat-service'

// =============================================================================
// VAT Read Tools
// =============================================================================

export const getVatReportTool = defineTool<{ period?: string; year?: number }, VATDeclaration[]>({
    name: 'get_vat_report',
    description: 'Visa momsdeklarationer med utgående och ingående moms. Beräknar nettobelopp att betala/få tillbaka. Använd för att förbereda momsredovisning. Vanliga frågor: "dags för momsen", "hur mycket moms ska jag betala", "momsrapporten".',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period (t.ex. "Q4 2024", "januari 2025")' },
            year: { type: 'number', description: 'Filtrera på år (t.ex. 2024, 2025)' },
        },
    },
    execute: async (params) => {
        // Fetch real VAT declarations from database
        const declarations = await vatService.getDeclarations(params.year)

        // Filter by period string if provided
        let filtered = declarations
        if (params.period) {
            const periodLower = params.period.toLowerCase()
            filtered = declarations.filter(d =>
                d.period.toLowerCase().includes(periodLower)
            )
        }

        if (filtered.length === 0) {
            // Try to get current stats as fallback
            const stats = await vatService.getCurrentStats()
            if (stats.netVat !== 0) {
                const fallbackDeclaration: VATDeclaration = {
                    id: 'current',
                    period: stats.currentPeriod,
                    periodType: 'quarterly',
                    year: new Date().getFullYear(),
                    startDate: '',
                    endDate: '',
                    dueDate: stats.dueDate,
                    outputVat: stats.outputVat,
                    inputVat: stats.inputVat,
                    netVat: stats.netVat,
                    status: 'upcoming',
                }
                filtered = [fallbackDeclaration]
            }
        }

        if (filtered.length === 0) {
            return {
                success: true,
                data: [],
                message: 'Inga momsdeklarationer hittades för den valda perioden.',
            }
        }

        // Calculate totals for summary
        const totalOutput = filtered.reduce((sum, d) => sum + d.outputVat, 0)
        const totalInput = filtered.reduce((sum, d) => sum + d.inputVat, 0)
        const totalNet = filtered.reduce((sum, d) => sum + d.netVat, 0)

        const latestDeclaration = filtered[0]
        const action = totalNet > 0 ? 'betala' : 'få tillbaka'
        const message = filtered.length === 1
            ? `Moms för ${latestDeclaration.period}: ${Math.abs(latestDeclaration.netVat).toLocaleString('sv-SE')} kr att ${action}.${latestDeclaration.dueDate ? ` Deadline: ${latestDeclaration.dueDate}.` : ''}`
            : `Hittade ${filtered.length} momsdeklarationer. Totalt ${Math.abs(totalNet).toLocaleString('sv-SE')} kr att ${action}.`

        return {
            success: true,
            data: filtered,
            message,
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
    description: 'Skicka momsdeklaration till Skatteverket för en period. Deadline: 12:e (26:e för stora företag). Visar förhandsgranskning innan bekräftelse. Vanliga frågor: "skicka momsen", "deklarera moms". Kräver bekräftelse.',
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
        // Fetch real data for the period
        const declarations = await vatService.getDeclarations()
        const periodLower = params.period.toLowerCase()
        const matchingDeclaration = declarations.find(d =>
            d.period.toLowerCase().includes(periodLower)
        )

        // Use real data if found, otherwise get current stats
        let vatData: { outputVat: number; inputVat: number; netVat: number }
        if (matchingDeclaration) {
            vatData = {
                outputVat: matchingDeclaration.outputVat,
                inputVat: matchingDeclaration.inputVat,
                netVat: matchingDeclaration.netVat,
            }
        } else {
            const stats = await vatService.getCurrentStats()
            vatData = {
                outputVat: stats.outputVat,
                inputVat: stats.inputVat,
                netVat: stats.netVat,
            }
        }

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Skicka momsdeklaration',
            description: `Momsdeklaration för ${params.period}`,
            summary: [
                { label: 'Period', value: params.period },
                { label: 'Utgående moms', value: `${vatData.outputVat.toLocaleString('sv-SE')} kr` },
                { label: 'Ingående moms', value: `${vatData.inputVat.toLocaleString('sv-SE')} kr` },
                { label: 'Att betala', value: `${vatData.netVat.toLocaleString('sv-SE')} kr` },
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

