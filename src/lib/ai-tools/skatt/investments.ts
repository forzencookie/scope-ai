// @ts-nocheck
/**
 * Skatt AI Tools - Investments
 *
 * Tools for managing company investments (properties, shares, crypto).
 */

import { defineTool } from '../registry'
import type { AITool } from '../types'
import {
    listProperties,
    listShareHoldings,
    listCryptoHoldings,
    getInvestmentSummary,
} from '@/services/processors/investments-processor'

// =============================================================================
// Investment Tools
// =============================================================================

const getInvestmentSummaryTool = defineTool({
    name: 'get_investment_summary',
    description: 'Get a summary of all company investments: properties, shares, and crypto holdings.',
    parameters: { type: 'object' as const, properties: {} },
    requiresConfirmation: false,
    category: 'read',
    execute: async () => {
        const summary = await getInvestmentSummary()
        return {
            success: true,
            data: summary,
            message: `Portfolio: ${summary.properties.count} properties, ${summary.shares.count} shares, ${summary.crypto.count} crypto`,
        }
    },
})

const listPropertiesTool = defineTool({
    name: 'list_properties',
    description: 'List all company properties (fastigheter) with depreciation and book values.',
    parameters: { type: 'object' as const, properties: {} },
    requiresConfirmation: false,
    category: 'read',
    execute: async () => {
        const properties = await listProperties()
        return {
            success: true,
            data: properties,
            message: `Found ${properties.length} properties`,
        }
    },
})

const listShareHoldingsTool = defineTool({
    name: 'list_share_holdings',
    description: 'List all share holdings (aktieinnehav) in other companies.',
    parameters: { type: 'object' as const, properties: {} },
    requiresConfirmation: false,
    category: 'read',
    execute: async () => {
        const shares = await listShareHoldings()
        return {
            success: true,
            data: shares,
            message: `Found ${shares.length} share holdings`,
        }
    },
})

const listCryptoHoldingsTool = defineTool({
    name: 'list_crypto_holdings',
    description: 'List all cryptocurrency holdings.',
    parameters: { type: 'object' as const, properties: {} },
    requiresConfirmation: false,
    category: 'read',
    execute: async () => {
        const crypto = await listCryptoHoldings()
        return {
            success: true,
            data: crypto,
            message: `Found ${crypto.length} crypto holdings`,
        }
    },
})

export const investmentTools: AITool<any, any>[] = [
    getInvestmentSummaryTool,
    listPropertiesTool,
    listShareHoldingsTool,
    listCryptoHoldingsTool,
]
