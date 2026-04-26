/**
 * Skatt AI Tools - Investments
 *
 * Tools for managing company investments (shares).
 */

import { defineTool } from '../registry'
import type { AITool } from '../types'
import {
    listShareHoldings,
    getInvestmentSummary,
} from '@/services/processors/investments-processor'

// =============================================================================
// Investment Tools
// =============================================================================

const getInvestmentSummaryTool = defineTool({
    name: 'get_investment_summary',
    description: 'Get a summary of all company investments: shares and holdings.',
    parameters: { type: 'object' as const, properties: {} },
    requiresConfirmation: false,
    category: 'read',
    domain: 'skatt',
    keywords: ['investering', 'aktier', 'portfölj'],
    execute: async () => {
        const summary = await getInvestmentSummary()
        return {
            success: true,
            data: summary,
            message: `Portfolio: ${summary.shares.count} share holdings`,
        }
    },
})

const listShareHoldingsTool = defineTool({
    name: 'list_share_holdings',
    description: 'List all share holdings (aktieinnehav) in other companies.',
    parameters: { type: 'object' as const, properties: {} },
    requiresConfirmation: false,
    category: 'read',
    domain: 'skatt',
    keywords: ['aktieinnehav', 'aktier', 'innehav'],
    execute: async () => {
        const shares = await listShareHoldings()
        return {
            success: true,
            data: shares,
            message: `Found ${shares.length} share holdings`,
        }
    },
})

export const investmentTools: AITool[] = [
    getInvestmentSummaryTool,
    listShareHoldingsTool,
]
