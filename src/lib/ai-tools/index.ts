/**
 * AI Tools - Central Export
 * 
 * Main entry point for all AI tools.
 */

// Export types
export * from './types'

// Export registry
export { aiToolRegistry, defineTool } from './registry'

// Export tool collections
export { readTools } from './read-tools'
export { writeTools } from './write-tools'
export { navigationTools } from './navigation-tools'
export { taxPlanningTools } from './tax-planning-tools'
export { complianceTools } from './compliance-tools'

// Import for registration
import { aiToolRegistry } from './registry'
import { readTools } from './read-tools'
import { writeTools } from './write-tools'
import { navigationTools } from './navigation-tools'
import { taxPlanningTools } from './tax-planning-tools'
import { complianceTools } from './compliance-tools'

/**
 * Initialize all tools by registering them with the registry.
 * Call this once at app startup.
 */
export function initializeAITools(): void {
    // Register each tool, casting to base AITool to avoid generic variance issues
    for (const tool of readTools) {
        aiToolRegistry.register(tool as unknown as import('./types').AITool)
    }
    for (const tool of writeTools) {
        aiToolRegistry.register(tool as unknown as import('./types').AITool)
    }
    for (const tool of navigationTools) {
        aiToolRegistry.register(tool as unknown as import('./types').AITool)
    }
    for (const tool of taxPlanningTools) {
        aiToolRegistry.register(tool as unknown as import('./types').AITool)
    }
    for (const tool of complianceTools) {
        aiToolRegistry.register(tool as unknown as import('./types').AITool)
    }

    console.log(`[AI Tools] Registered ${aiToolRegistry.getAll().length} tools`)
}

/**
 * Get all tools in OpenAI function calling format
 */
export function getOpenAITools() {
    const { toolsToOpenAIFunctions } = require('./types')
    return toolsToOpenAIFunctions(aiToolRegistry.getAll())
}

