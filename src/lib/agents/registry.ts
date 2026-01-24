/**
 * Agent Registry
 * 
 * Central registry for all agents. Provides lookup, registration,
 * and query functionality.
 */

import type { Agent, AgentDomain, AgentContext, Intent } from './types'

// =============================================================================
// Agent Registry
// =============================================================================

class AgentRegistry {
    private agents: Map<AgentDomain, Agent> = new Map()

    /**
     * Register an agent.
     */
    register(agent: Agent): void {
        if (this.agents.has(agent.id)) {
            console.warn(`Agent "${agent.id}" is already registered. Overwriting.`)
        }
        this.agents.set(agent.id, agent)
        console.log(`[AgentRegistry] Registered agent: ${agent.id} (${agent.name})`)
    }

    /**
     * Register multiple agents.
     */
    registerAll(agents: Agent[]): void {
        for (const agent of agents) {
            this.register(agent)
        }
    }

    /**
     * Get an agent by ID.
     */
    get(id: AgentDomain): Agent | undefined {
        return this.agents.get(id)
    }

    /**
     * Get all registered agents.
     */
    getAll(): Agent[] {
        return Array.from(this.agents.values())
    }

    /**
     * Get all agent IDs.
     */
    getAllIds(): AgentDomain[] {
        return Array.from(this.agents.keys())
    }

    /**
     * Check if an agent exists.
     */
    has(id: AgentDomain): boolean {
        return this.agents.has(id)
    }

    /**
     * Find the best agent to handle a request based on intent.
     * Returns agents sorted by confidence score.
     */
    async findBestAgents(
        intent: Intent,
        context: AgentContext,
        excludeOrchestrator = true
    ): Promise<Array<{ agent: Agent; confidence: number }>> {
        const results: Array<{ agent: Agent; confidence: number }> = []

        for (const agent of this.agents.values()) {
            // Skip orchestrator if requested
            if (excludeOrchestrator && agent.id === 'orchestrator') {
                continue
            }

            const confidence = await agent.canHandle(intent, context)
            if (confidence > 0) {
                results.push({ agent, confidence })
            }
        }

        // Sort by confidence (highest first)
        results.sort((a, b) => b.confidence - a.confidence)

        return results
    }

    /**
     * Get agents by capability keyword.
     */
    findByCapability(keyword: string): Agent[] {
        const lowerKeyword = keyword.toLowerCase()
        return this.getAll().filter(agent =>
            agent.capabilities.some(cap =>
                cap.toLowerCase().includes(lowerKeyword)
            )
        )
    }

    /**
     * Get summary of all registered agents.
     */
    getSummary(): Record<AgentDomain, { name: string; tools: number; capabilities: number }> {
        const summary: Record<string, { name: string; tools: number; capabilities: number }> = {}

        for (const [id, agent] of this.agents.entries()) {
            summary[id] = {
                name: agent.name,
                tools: agent.tools.length,
                capabilities: agent.capabilities.length,
            }
        }

        return summary as Record<AgentDomain, { name: string; tools: number; capabilities: number }>
    }

    /**
     * Clear all registered agents (useful for testing).
     */
    clear(): void {
        this.agents.clear()
    }
}

// Singleton instance
export const agentRegistry = new AgentRegistry()
