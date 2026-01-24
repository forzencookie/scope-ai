/**
 * Orchestrator Agent (Gojo)
 * 
 * The master coordinator that routes requests to specialized agents,
 * manages multi-agent workflows, and handles ambiguous requests.
 * 
 * "Throughout Heaven and Earth, I Alone Am The Honored One"
 */

import { BaseAgent } from '../base-agent'
import type {
    AgentDomain,
    AgentContext,
    AgentResponse,
    Intent,
    IntentCategory,
} from '../types'
import { agentRegistry } from '../registry'
import { messageBus } from '../message-bus'
import { classifyIntent } from './router'
import { createWorkflowPlan, type WorkflowPlan } from './planner'

// =============================================================================
// Orchestrator System Prompt
// =============================================================================

const ORCHESTRATOR_PROMPT = `# Gojo - Scope AI Orchestrator

You are the central coordinator for the Scope AI system. Always respond in Swedish. Your responsibilities:

1. **Understand user intent** - Classify what the user wants to do
2. **Route to the right expert** - Send requests to specialized agents
3. **Handle complex workflows** - Coordinate when multiple agents are needed
4. **Resolve ambiguity** - Ask for clarification when intent is unclear

## Available Expert Agents

| Agent | Domain | Handles |
|-------|-------|----------|
| bokforing | Bookkeeping | Verifications, chart of accounts, bank matching |
| receipts | Receipts | Receipt parsing, expense categorization |
| invoices | Invoices | Customer invoices, payments |
| loner | Payroll | Salary calculations, benefits, tax tables |
| skatt | Tax | VAT, tax returns, periodiseringsfonder |
| rapporter | Reports | P&L, balance sheet, key metrics |
| compliance | Compliance | Deadlines, government filings |
| statistik | Statistics | KPIs, trends, company health |
| handelser | Events | Timeline, company events |
| installningar | Settings | Configuration, integrations |

## Behavior Guidelines

- ALWAYS respond in the same language as the user (typically Swedish)
- Be brief and concise
- If uncertain, ask the user for clarification
- Always log routing decisions
`

// =============================================================================
// Orchestrator Agent
// =============================================================================

export class OrchestratorAgent extends BaseAgent {
    id: AgentDomain = 'orchestrator'
    name = 'Gojo (Orchestrator)'
    description = 'Routes requests to specialized agents and coordinates multi-agent workflows'
    
    capabilities = [
        'routing',
        'coordination',
        'disambiguation',
        'workflow',
        'multi-agent',
        'navigation',
        'general questions',
    ]
    
    // Orchestrator has access to navigation tool only
    tools = ['navigate']
    
    systemPrompt = ORCHESTRATOR_PROMPT
    preferredModel = 'gpt-4o-mini'  // Fast and cheap for routing

    // Active workflows
    private activeWorkflows: Map<string, WorkflowPlan> = new Map()

    /**
     * Orchestrator always returns high confidence for routing.
     */
    async canHandle(intent: Intent, context: AgentContext): Promise<number> {
        // Orchestrator handles routing, so always high confidence
        return 1.0
    }

    /**
     * Main entry point - classify intent and route to appropriate agent.
     */
    async handle(message: string, context: AgentContext): Promise<AgentResponse> {
        this.log('info', 'Processing request', { message: message.substring(0, 100) })

        try {
            // Step 1: Classify intent
            const intent = await classifyIntent(message, context)
            context.intent = intent

            this.log('info', 'Intent classified', {
                category: intent.category,
                confidence: intent.confidence,
                entities: intent.entities.length,
            })

            // Step 2: Route based on intent
            return await this.route(message, intent, context)

        } catch (error) {
            this.log('error', 'Failed to process request', error)
            return this.errorResponse(
                error instanceof Error ? error.message : 'Unknown error'
            )
        }
    }

    /**
     * Route to the appropriate agent based on intent.
     */
    private async route(
        message: string,
        intent: Intent,
        context: AgentContext
    ): Promise<AgentResponse> {
        // Handle special cases first
        if (intent.category === 'GENERAL') {
            return this.handleGeneral(message, context)
        }

        if (intent.category === 'NAVIGATION') {
            return this.handleNavigation(message, intent, context)
        }

        if (intent.category === 'MULTI_DOMAIN' || intent.requiresMultiAgent) {
            return this.handleMultiDomain(message, intent, context)
        }

        // Find the best agent for this intent
        const candidates = await agentRegistry.findBestAgents(intent, context)

        if (candidates.length === 0) {
            this.log('warn', 'No agent found for intent', { category: intent.category })
            return this.handleGeneral(message, context)
        }

        const bestMatch = candidates[0]

        // Check confidence threshold
        if (bestMatch.confidence < 0.5) {
            // Low confidence - ask for clarification
            return this.askForClarification(message, intent, candidates)
        }

        // Hand off to the best agent
        this.log('info', `Routing to agent: ${bestMatch.agent.id}`, {
            confidence: bestMatch.confidence,
        })

        return this.handoffToAgent(bestMatch.agent.id, message, context)
    }

    /**
     * Hand off to a specific agent.
     */
    private async handoffToAgent(
        agentId: AgentDomain,
        message: string,
        context: AgentContext
    ): Promise<AgentResponse> {
        const agent = agentRegistry.get(agentId)

        if (!agent) {
            return this.errorResponse(`Agent ${agentId} not found`)
        }

        // Update context
        context.activeAgent = agentId
        context.handoffStack.push('orchestrator')

        // Send handoff message
        await messageBus.send(
            messageBus.createHandoff(
                'orchestrator',
                agentId,
                message,
                context,
                `Routed from orchestrator: ${context.intent?.category}`
            )
        )

        // Execute the agent
        const response = await agent.handle(message, context)

        // Check if agent wants to hand off to another agent
        if (response.handoffTo) {
            return this.handoffToAgent(response.handoffTo, response.handoffMessage || message, context)
        }

        return response
    }

    /**
     * Handle general/chitchat requests.
     */
    private async handleGeneral(
        message: string,
        context: AgentContext
    ): Promise<AgentResponse> {
        // For now, return a friendly response
        // In production, this would call the LLM with general system prompt
        
        const isSwedish = /[åäöÅÄÖ]/.test(message) || context.locale === 'sv'
        
        return this.successResponse(
            isSwedish
                ? 'Hej! Jag är Scope AI. Hur kan jag hjälpa dig med bokföring, fakturor, kvitton, löner eller skatter idag?'
                : 'Hi! I\'m Scope AI. How can I help you with accounting, invoices, receipts, payroll, or taxes today?'
        )
    }

    /**
     * Handle navigation requests.
     */
    private async handleNavigation(
        message: string,
        intent: Intent,
        context: AgentContext
    ): Promise<AgentResponse> {
        // Extract destination from entities or message
        const destination = this.extractNavigationDestination(message, intent)

        if (!destination) {
            return this.successResponse(
                context.locale === 'sv'
                    ? 'Vart vill du navigera? Säg till exempel "gå till fakturor" eller "öppna kvitton".'
                    : 'Where would you like to go? Try "go to invoices" or "open receipts".'
            )
        }

        const result = await this.executeTool('navigate', { page: destination }, context)

        if (result.success) {
            return this.successResponse(
                context.locale === 'sv'
                    ? `Navigerar till ${destination}...`
                    : `Navigating to ${destination}...`
            )
        }

        return this.errorResponse(result.error || 'Navigation failed')
    }

    /**
     * Handle multi-domain requests that need multiple agents.
     */
    private async handleMultiDomain(
        message: string,
        intent: Intent,
        context: AgentContext
    ): Promise<AgentResponse> {
        // Create a workflow plan
        const plan = await createWorkflowPlan(message, intent, context)

        if (plan.steps.length === 0) {
            return this.handleGeneral(message, context)
        }

        // Store the workflow
        this.activeWorkflows.set(context.conversationId, plan)

        // Execute first step
        return this.executeWorkflowStep(plan, 0, context)
    }

    /**
     * Execute a step in a multi-agent workflow.
     */
    private async executeWorkflowStep(
        plan: WorkflowPlan,
        stepIndex: number,
        context: AgentContext
    ): Promise<AgentResponse> {
        if (stepIndex >= plan.steps.length) {
            // Workflow complete
            this.activeWorkflows.delete(context.conversationId)
            return this.successResponse(
                context.locale === 'sv'
                    ? 'Alla steg är klara!'
                    : 'All steps complete!'
            )
        }

        const step = plan.steps[stepIndex]
        const agent = agentRegistry.get(step.agentId)

        if (!agent) {
            return this.errorResponse(`Agent ${step.agentId} not found`)
        }

        // Execute the agent
        const response = await agent.handle(step.task, context)

        // Store result in shared memory
        context.sharedMemory[`step_${stepIndex}_result`] = response

        // If this step needs confirmation, wait for it
        if (response.confirmationRequired) {
            plan.currentStep = stepIndex
            return response
        }

        // Continue to next step
        return this.executeWorkflowStep(plan, stepIndex + 1, context)
    }

    /**
     * Ask user for clarification when intent is ambiguous.
     */
    private askForClarification(
        message: string,
        intent: Intent,
        candidates: Array<{ agent: { id: AgentDomain; name: string }; confidence: number }>
    ): AgentResponse {
        const options = candidates.slice(0, 3).map((c, i) => `${i + 1}) ${c.agent.name}`)

        return this.successResponse(
            `Jag är osäker på vad du menar. Handlar det om:\n${options.join('\n')}\n\nVilket passar bäst?`
        )
    }

    /**
     * Extract navigation destination from message/intent.
     */
    private extractNavigationDestination(message: string, intent: Intent): string | null {
        // Check entities first
        const pageEntity = intent.entities.find(e => e.type === 'other')
        if (pageEntity) return pageEntity.value

        // Simple keyword matching
        const pageMap: Record<string, string> = {
            'faktura': 'invoices',
            'fakturor': 'invoices',
            'kvitto': 'receipts',
            'kvitton': 'receipts',
            'lön': 'payroll',
            'löner': 'payroll',
            'skatt': 'tax',
            'moms': 'tax',
            'rapport': 'reports',
            'rapporter': 'reports',
            'statistik': 'statistics',
            'händelser': 'events',
            'inställningar': 'settings',
            'dashboard': 'dashboard',
            'översikt': 'dashboard',
        }

        const lowerMessage = message.toLowerCase()
        for (const [keyword, page] of Object.entries(pageMap)) {
            if (lowerMessage.includes(keyword)) {
                return page
            }
        }

        return null
    }
}

// Export singleton instance
export const orchestrator = new OrchestratorAgent()
