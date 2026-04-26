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

// Bookkeeping (Accounting)
export { bokforingTools } from './bookkeeping'
export * from './bookkeeping/transactions'
export * from './bookkeeping/invoices'
export * from './bookkeeping/receipts'
export * from './bookkeeping/reports'
export * from './bookkeeping/inventarier'
export * from './bookkeeping/verifications'
export * from './bookkeeping/accounts'

// Payroll
export { lonerTools } from './payroll'
export * from './payroll/payroll'
export * from './payroll/benefits'
export * from './payroll/owner-payroll'

// Tax
export { skattTools } from './tax'
export * from './tax/vat'
export * from './tax/k10'
export * from './tax/periodiseringsfonder'
export * from './tax/investments'

// Ownership (Partners/Shareholders)
export { parterTools } from './ownership'
export * from './ownership/shareholders'
export * from './ownership/partners'
export * from './ownership/compliance'
export * from './ownership/board'

// Common (Navigation, Company, Settings, Events, Statistics)
export { commonTools } from './common'
export * from './common/navigation'
export * from './common/company'
export * from './common/settings'
export * from './common/events'

// ============================================================================
// Registration
// ============================================================================

import { aiToolRegistry } from './registry'
import type { AITool } from './types'
import { bokforingTools } from './bookkeeping'
import { lonerTools } from './payroll'
import { skattTools } from './tax'
import { parterTools } from './ownership'
import { commonTools } from './common'

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
    ]

    for (const tool of allTools as AITool[]) {
        aiToolRegistry.register(tool)
    }

    console.log(`[AI Tools] Registered ${aiToolRegistry.getAll().length} tools`)
    console.log(`  - Bookkeeping: ${bokforingTools.length} tools`)
    console.log(`  - Payroll: ${lonerTools.length} tools`)
    console.log(`  - Tax: ${skattTools.length} tools`)
    console.log(`  - Ownership: ${parterTools.length} tools`)
    console.log(`  - Common: ${commonTools.length} tools`)
}
