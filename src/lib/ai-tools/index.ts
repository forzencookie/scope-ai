/**
 * AI Tools - Central Export
 *
 * Main entry point for all AI tools, organized by domain.
 */

// Export types
export * from './types'

// Export registry
export { aiToolRegistry, defineTool } from './registry'

// ============================================================================
// Domain Exports
// ============================================================================

// Bokföring (Accounting)
export { bokforingTools } from './bokforing'
export * from './bokforing/transactions'
export * from './bokforing/invoices'
export * from './bokforing/receipts'
export * from './bokforing/reports'
export * from './bokforing/inventarier'
export * from './bokforing/verifications'
export * from './bokforing/accounts'

// Löner (Payroll)
export { lonerTools } from './loner'
export * from './loner/payroll'
export * from './loner/benefits'
export * from './loner/owner-payroll'

// Skatt (Tax)
export { skattTools } from './skatt'
export * from './skatt/vat'
export * from './skatt/k10'
export * from './skatt/periodiseringsfonder'
export * from './skatt/investments'

// Parter (Partners/Shareholders)
export { parterTools } from './parter'
export * from './parter/shareholders'
export * from './parter/partners'
export * from './parter/compliance'
export * from './parter/board'

// Common (Navigation, Company, Settings, Events, Statistics)
export { commonTools } from './common'
export * from './common/navigation'
export * from './common/company'
export * from './common/settings'
export * from './common/events'
export * from './common/statistics'

// Planning (Roadmaps)
export { planningTools } from './planning'
export * from './planning/roadmap'

// ============================================================================
// Registration
// ============================================================================

import { aiToolRegistry } from './registry'
import { toolsToGoogleFunctions, toolsToOpenAIFunctions, type AITool } from './types'
import { bokforingTools } from './bokforing'
import { lonerTools } from './loner'
import { skattTools } from './skatt'
import { parterTools } from './parter'
import { commonTools } from './common'
import { planningTools } from './planning'

/**
 * Initialize all tools by registering them with the registry.
 * Call this once at app startup.
 */
export function initializeAITools(): void {
    const allTools = [
        ...bokforingTools,
        ...lonerTools,
        ...skattTools,
        ...parterTools,
        ...commonTools,
        ...planningTools,
    ]

    for (const tool of allTools) {
        aiToolRegistry.register(tool as unknown as AITool)
    }

    console.log(`[AI Tools] Registered ${aiToolRegistry.getAll().length} tools`)
    console.log(`  - Bokföring: ${bokforingTools.length} tools`)
    console.log(`  - Löner: ${lonerTools.length} tools`)
    console.log(`  - Skatt: ${skattTools.length} tools`)
    console.log(`  - Parter: ${parterTools.length} tools`)
    console.log(`  - Common: ${commonTools.length} tools`)
    console.log(`  - Planning: ${planningTools.length} tools`)
}

/**
 * Get all tools in OpenAI function calling format
 */
export function getOpenAITools() {
    return toolsToOpenAIFunctions(aiToolRegistry.getAll())
}

/**
 * Get all tools in Google Gemini format
 */
export function getGoogleTools() {
    return toolsToGoogleFunctions(aiToolRegistry.getAll())
}
