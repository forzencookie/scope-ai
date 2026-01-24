/**
 * Agent System
 * 
 * Multi-agent architecture for Scope AI.
 * 
 * This is the main entry point for the agent system. It exports:
 * - All agent types and interfaces
 * - The orchestrator (Gojo)
 * - All domain agents
 * - The agent registry
 * - The message bus
 * 
 * Usage:
 * ```typescript
 * import { initializeAgents, processMessage } from '@/lib/agents'
 * 
 * // Initialize once at app startup
 * initializeAgents()
 * 
 * // Process user messages
 * const response = await processMessage(userMessage, context)
 * ```
 */

// Types
export * from './types'

// Base Agent
export { BaseAgent } from './base-agent'

// Registry
export { agentRegistry } from './registry'

// Message Bus
export { messageBus, loggingMiddleware, metricsMiddleware } from './message-bus'

// Metrics
export { agentMetrics, measureTime, createTimer } from './metrics'
export type { AgentMetric, AgentMetricSummary } from './metrics'

// Orchestrator
export {
    OrchestratorAgent,
    orchestrator,
    classifyIntent,
    classifyIntentWithLLM,
    createWorkflowPlan,
    getExecutableSteps,
    canRunParallel,
} from './orchestrator'
export type { WorkflowPlan, WorkflowStep } from './orchestrator'

// Domain Agents
export {
    domainAgents,
    BokforingAgent,
    bokforingAgent,
    ReceiptAgent,
    receiptAgent,
    InvoiceAgent,
    invoiceAgent,
    LonerAgent,
    lonerAgent,
    SkattAgent,
    skattAgent,
    RapporterAgent,
    rapporterAgent,
    ComplianceAgent,
    complianceAgent,
    StatistikAgent,
    statistikAgent,
    HandelserAgent,
    handelserAgent,
    InstallningarAgent,
    installningarAgent,
} from './domains'

// =============================================================================
// Initialization
// =============================================================================

import { agentRegistry } from './registry'
import { messageBus, loggingMiddleware, metricsMiddleware } from './message-bus'
import { orchestrator } from './orchestrator'
import { domainAgents } from './domains'
import type { AgentContext, AgentResponse } from './types'
import { createAgentContext } from './types'

let initialized = false

/**
 * Initialize all agents and register them with the registry.
 * Call this once at application startup.
 */
export function initializeAgents(): void {
    if (initialized) {
        console.log('[Agents] Already initialized')
        return
    }

    // Register orchestrator
    agentRegistry.register(orchestrator)

    // Register all domain agents
    for (const agent of domainAgents) {
        agentRegistry.register(agent)
    }

    // Set up message bus middleware
    if (process.env.NODE_ENV === 'development') {
        messageBus.use(loggingMiddleware)
    }
    messageBus.use(metricsMiddleware)

    initialized = true

    console.log('[Agents] Initialized successfully')
    console.log(`[Agents] Registered ${agentRegistry.getAll().length} agents:`)
    console.log(`  - Orchestrator: 1`)
    console.log(`  - Domain Agents: ${domainAgents.length}`)
    
    const summary = agentRegistry.getSummary()
    for (const [id, info] of Object.entries(summary)) {
        console.log(`    • ${id}: ${info.name} (${info.tools} tools, ${info.capabilities} capabilities)`)
    }
}

/**
 * Process a user message through the agent system.
 * This is the main entry point for handling user requests.
 */
export async function processMessage(
    message: string,
    context: AgentContext
): Promise<AgentResponse> {
    // Ensure agents are initialized
    if (!initialized) {
        initializeAgents()
    }

    // Route through orchestrator
    return orchestrator.handle(message, context)
}

/**
 * Convenience function to create context and process a message.
 */
export async function handleUserMessage(
    message: string,
    userId: string,
    companyId: string,
    companyType: 'AB' | 'EF' | 'HB' | 'KB' | 'FORENING',
    conversationId?: string
): Promise<AgentResponse> {
    const context = createAgentContext(userId, companyId, companyType, message, conversationId)
    return processMessage(message, context)
}

/**
 * Get agent by ID.
 */
export function getAgent(id: string) {
    return agentRegistry.get(id as any)
}

/**
 * Get all registered agents.
 */
export function getAllAgents() {
    return agentRegistry.getAll()
}

/**
 * Check if agents are initialized.
 */
export function isInitialized(): boolean {
    return initialized
}
