/**
 * Agent System - ScopeBrain
 * 
 * Single unified agent for Scope AI.
 * 
 * Usage:
 * ```typescript
 * import { ScopeBrain, createAgentContext } from '@/lib/agents'
 * 
 * const brain = new ScopeBrain()
 * const context = createAgentContext({ userId, companyId, ... })
 * 
 * for await (const chunk of brain.handleStream(message, context)) {
 *     // Handle streaming response
 * }
 * ```
 */

// Types
export * from './types'

// ScopeBrain - The unified agent
export * from './scope-brain'

// Metrics
export { agentMetrics, measureTime, createTimer } from './metrics'
export type { AgentMetric, AgentMetricSummary } from './metrics'
