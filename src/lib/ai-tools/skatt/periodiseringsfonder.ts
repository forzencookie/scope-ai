/**
 * Skatt AI Tools - Periodiseringsfonder
 *
 * Tools for managing periodiseringsfonder (tax allocation reserves).
 */

import { defineTool } from '../registry'
import type { AITool } from '../types'
import {
    listPeriodiseringsfonder,
    // createPeriodiseringsfond,
    dissolvePeriodiseringsfond,
    getExpiringFonder,
    calculateTaxSavings,
} from '@/services/processors/periodiseringsfonder-processor'

// =============================================================================
// Periodiseringsfonder Tools
// =============================================================================

const listPeriodiseringsfondsTools = defineTool({
    name: 'list_periodiseringsfonder',
    description: 'List all periodiseringsfonder (tax allocation reserves). Shows active fonder with amounts, years, and expiry dates.',
    parameters: { type: 'object' as const, properties: {} },
    requiresConfirmation: false,
    category: 'read',
    execute: async () => {
        const fonder = await listPeriodiseringsfonder()
        return {
            success: true,
            data: fonder,
            message: `Found ${fonder.length} periodiseringsfonder`,
        }
    },
})

const createPeriodiseringsfondTool = defineTool({
    name: 'create_periodiseringsfond',
    description: 'Create a new periodiseringsfond to defer tax. Max 25% of profit for AB, 30% for EF. Must be dissolved within 6 years.',
    parameters: {
        type: 'object' as const,
        properties: {
            year: { type: 'number', description: 'Tax year (beskattningsår)' },
            amount: { type: 'number', description: 'Amount to allocate in SEK' },
        },
        required: ['year', 'amount'],
    },
    requiresConfirmation: true,
    category: 'write',
    execute: async (params: { year: number; amount: number }) => {
        const taxSavings = calculateTaxSavings(params.amount, 'AB')
        return {
            success: true,
            confirmationRequired: {
                title: 'Skapa periodiseringsfond',
                description: `Avsätt ${params.amount.toLocaleString('sv-SE')} kr för beskattningsår ${params.year}`,
                summary: [
                    { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                    { label: 'Skattebespaing', value: `${taxSavings.taxSaved.toLocaleString('sv-SE')} kr` },
                    { label: 'Löper ut', value: `${params.year + 6}-12-31` },
                ],
                action: { toolName: 'create_periodiseringsfond', params },
            },
        }
    },
})

const dissolvePeriodiseringsfondTool = defineTool({
    name: 'dissolve_periodiseringsfond',
    description: 'Dissolve (återför) a periodiseringsfond. Can be partial or full dissolution.',
    parameters: {
        type: 'object' as const,
        properties: {
            id: { type: 'string', description: 'ID of the fond to dissolve' },
            amount: { type: 'number', description: 'Amount to dissolve (optional, full dissolution if not specified)' },
        },
        required: ['id'],
    },
    requiresConfirmation: true,
    category: 'write',
    execute: async (params: { id: string; amount?: number }) => {
        const result = await dissolvePeriodiseringsfond(params.id, params.amount)
        if (result) {
            return { success: true, data: result, message: `Fond dissolved successfully` }
        }
        return { success: false, error: 'Failed to dissolve fond' }
    },
})

const getExpiringFonderTool = defineTool({
    name: 'get_expiring_fonder',
    description: 'Get periodiseringsfonder that are expiring within a specified number of months.',
    parameters: {
        type: 'object' as const,
        properties: {
            withinMonths: { type: 'number', description: 'Number of months to look ahead (default 12)' },
        },
    },
    requiresConfirmation: false,
    category: 'read',
    execute: async (params: { withinMonths?: number }) => {
        const fonder = await getExpiringFonder(params.withinMonths || 12)
        return {
            success: true,
            data: fonder,
            message: fonder.length > 0
                ? `${fonder.length} fonder expiring within ${params.withinMonths || 12} months`
                : 'No fonder expiring soon',
        }
    },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const periodiseringsfonderTools: AITool<any, any>[] = [
    listPeriodiseringsfondsTools,
    createPeriodiseringsfondTool,
    dissolvePeriodiseringsfondTool,
    getExpiringFonderTool,
]
