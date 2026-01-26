/**
 * Base Agent
 * 
 * Abstract base class that all domain agents extend.
 * Provides common functionality for tool execution, model calls, and logging.
 */

import type {
    Agent,
    AgentDomain,
    AgentContext,
    AgentResponse,
    AgentToolCall,
    AgentToolResult,
    Intent,
    AgentDisplayInstruction,
    AgentConfirmation,
} from './types'
import { aiToolRegistry } from '../ai-tools/registry'
// import { getModelById, DEFAULT_MODEL_ID } from '../ai/models'
import { 
    callLLM, 
    callLLMWithTools, 
    streamLLM,
    type LLMMessage, 
    type LLMToolDefinition,
    type LLMToolCall,
    // type LLMResponse,
    // type LLMStreamChunk,
} from './llm-client'

// =============================================================================
// Base Agent Implementation
// =============================================================================

export abstract class BaseAgent implements Agent {
    abstract id: AgentDomain
    abstract name: string
    abstract description: string
    abstract capabilities: string[]
    abstract tools: string[]
    abstract systemPrompt: string
    
    preferredModel?: string

    // =========================================================================
    // Interface Methods (must implement)
    // =========================================================================

    /**
     * Evaluate if this agent can handle the request.
     * Default implementation checks intent category and capabilities.
     * Override for custom logic.
     */
    async canHandle(intent: Intent, _context: AgentContext): Promise<number> {
        // Map intent categories to domains
        const intentToDomain: Record<string, AgentDomain[]> = {
            'RECEIPT': ['receipts'],
            'INVOICE': ['invoices'],
            'BOOKKEEPING': ['bokforing'],
            'PAYROLL': ['loner'],
            'TAX': ['skatt'],
            'REPORTING': ['rapporter'],
            'COMPLIANCE': ['compliance'],
            'STATISTICS': ['statistik'],
            'EVENTS': ['handelser'],
            'SETTINGS': ['installningar'],
            'NAVIGATION': ['orchestrator'],
            'GENERAL': ['orchestrator'],
        }

        const matchingDomains = intentToDomain[intent.category] || []
        
        if (matchingDomains.includes(this.id)) {
            return intent.confidence
        }

        // Check if any capabilities match entities
        const entityMatches = intent.entities.some(entity =>
            this.capabilities.some(cap =>
                cap.toLowerCase().includes(entity.value.toLowerCase())
            )
        )

        return entityMatches ? 0.5 : 0
    }

    /**
     * Process the request. Must be implemented by each agent.
     */
    abstract handle(message: string, context: AgentContext): Promise<AgentResponse>

    /**
     * Consult this agent for information.
     * Default implementation calls handle() but marks as consultation.
     */
    async consult(question: string, context: AgentContext): Promise<AgentResponse> {
        // Increment consultation depth to prevent loops
        const consultContext: AgentContext = {
            ...context,
            consultationDepth: context.consultationDepth + 1,
        }

        return this.handle(question, consultContext)
    }

    // =========================================================================
    // Helper Methods (available to all agents)
    // =========================================================================

    /**
     * Execute a tool by name with given parameters.
     */
    protected async executeTool(
        toolName: string,
        params: Record<string, unknown>,
        context: AgentContext
    ): Promise<AgentToolResult> {
        // Verify this agent has access to the tool
        if (!this.tools.includes(toolName)) {
            return {
                toolCallId: crypto.randomUUID(),
                toolName,
                success: false,
                error: `Agent ${this.id} does not have access to tool ${toolName}`,
            }
        }

        try {
            const result = await aiToolRegistry.execute(toolName, params, {
                userId: context.userId,
            })

            return {
                toolCallId: crypto.randomUUID(),
                toolName,
                success: result.success,
                result: result.data,
                error: result.error,
            }
        } catch (error) {
            return {
                toolCallId: crypto.randomUUID(),
                toolName,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }
        }
    }

    /**
     * Execute multiple tools in parallel.
     */
    protected async executeTools(
        toolCalls: AgentToolCall[],
        context: AgentContext
    ): Promise<AgentToolResult[]> {
        const results = await Promise.all(
            toolCalls.map(call =>
                this.executeTool(call.toolName, call.params, context)
            )
        )
        return results
    }

    /**
     * Build the full prompt with system prompt, context, and few-shot examples.
     */
    protected buildPrompt(
        userMessage: string,
        context: AgentContext,
        additionalContext?: string
    ): string {
        let prompt = this.systemPrompt

        // Add company context
        prompt += `\n\n## Current Context\n`
        prompt += `- Company Type: ${context.companyType}\n`
        prompt += `- Locale: ${context.locale}\n`
        if (context.companyName) {
            prompt += `- Company: ${context.companyName}\n`
        }

        // Add any shared memory relevant to this agent
        const relevantMemory = this.getRelevantMemory(context)
        if (relevantMemory) {
            prompt += `\n## Relevant Information\n${relevantMemory}\n`
        }

        // Add additional context if provided
        if (additionalContext) {
            prompt += `\n## Additional Context\n${additionalContext}\n`
        }

        return prompt
    }

    /**
     * Extract relevant information from shared memory.
     */
    protected getRelevantMemory(context: AgentContext): string | null {
        const memoryKeys = Object.keys(context.sharedMemory)
        if (memoryKeys.length === 0) return null

        const relevant: string[] = []
        
        for (const key of memoryKeys) {
            // Each agent can filter for relevant keys
            if (this.isRelevantMemoryKey(key)) {
                relevant.push(`${key}: ${JSON.stringify(context.sharedMemory[key])}`)
            }
        }

        return relevant.length > 0 ? relevant.join('\n') : null
    }

    /**
     * Check if a memory key is relevant to this agent.
     * Override in subclasses for specific filtering.
     */
    protected isRelevantMemoryKey(_key: string): boolean {
        // Default: include everything
        return true
    }

    // =========================================================================
    // LLM Integration Methods
    // =========================================================================

    /**
     * Get the model to use for this agent.
     * Uses preferredModel if set, otherwise falls back to default.
     */
    protected getModel(): string {
        return this.preferredModel || 'gpt-4o'
    }

    /**
     * Get tool definitions in LLM format.
     */
    protected getLLMToolDefinitions(): LLMToolDefinition[] {
        const allTools = aiToolRegistry.getAll()
        const agentTools = allTools.filter(t => this.tools.includes(t.name))
        
        return agentTools.map(tool => ({
            type: 'function' as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters as Record<string, unknown>,
            },
        }))
    }

    /**
     * Build messages array for LLM call.
     */
    protected buildMessages(
        userMessage: string,
        context: AgentContext,
        conversationHistory?: LLMMessage[]
    ): LLMMessage[] {
        const systemPrompt = this.buildPrompt(userMessage, context)
        
        const messages: LLMMessage[] = [
            { role: 'system', content: systemPrompt },
        ]

        // Add conversation history if provided
        if (conversationHistory) {
            messages.push(...conversationHistory)
        }

        // Add the current user message
        messages.push({ role: 'user', content: userMessage })

        return messages
    }

    /**
     * Execute a tool call from the LLM.
     */
    protected async executeToolCall(
        toolCall: LLMToolCall,
        context: AgentContext
    ): Promise<AgentToolResult> {
        const { name, arguments: argsString } = toolCall.function
        
        try {
            const params = JSON.parse(argsString)
            return await this.executeTool(name, params, context)
        } catch (error) {
            return {
                toolCallId: toolCall.id,
                toolName: name,
                success: false,
                error: error instanceof Error ? error.message : 'Failed to parse tool arguments',
            }
        }
    }

    /**
     * Call the LLM with the agent's system prompt and tools.
     * This is the primary method for getting intelligent responses.
     */
    protected async callLLM(
        userMessage: string,
        context: AgentContext,
        options?: {
            conversationHistory?: LLMMessage[]
            maxToolIterations?: number
            temperature?: number
        }
    ): Promise<{ text: string; toolResults: AgentToolResult[] }> {
        const messages = this.buildMessages(
            userMessage, 
            context, 
            options?.conversationHistory
        )
        
        const tools = this.getLLMToolDefinitions()

        // If we have tools, use the tool execution loop
        if (tools.length > 0) {
            const { response, allToolResults } = await callLLMWithTools(
                {
                    model: this.getModel(),
                    messages,
                    tools,
                    temperature: options?.temperature ?? 0.7,
                },
                (tc) => this.executeToolCall(tc, context),
                options?.maxToolIterations ?? 5
            )

            return {
                text: response.content || '',
                toolResults: allToolResults,
            }
        }

        // No tools, simple call
        const response = await callLLM({
            model: this.getModel(),
            messages,
            temperature: options?.temperature ?? 0.7,
        })

        return {
            text: response.content || '',
            toolResults: [],
        }
    }

    /**
     * Stream LLM response with real-time text output.
     * Yields text chunks as they arrive.
     */
    protected async *streamLLMResponse(
        userMessage: string,
        context: AgentContext,
        options?: {
            conversationHistory?: LLMMessage[]
            temperature?: number
        }
    ): AsyncGenerator<{ type: 'text' | 'tool' | 'done'; content?: string; toolCall?: LLMToolCall }> {
        const messages = this.buildMessages(
            userMessage, 
            context, 
            options?.conversationHistory
        )
        
        const tools = this.getLLMToolDefinitions()

        for await (const chunk of streamLLM({
            model: this.getModel(),
            messages,
            tools: tools.length > 0 ? tools : undefined,
            temperature: options?.temperature ?? 0.7,
        })) {
            if (chunk.type === 'text' && chunk.content) {
                yield { type: 'text', content: chunk.content }
            } else if (chunk.type === 'tool_call_end' && chunk.toolCall) {
                yield { type: 'tool', toolCall: chunk.toolCall as LLMToolCall }
            } else if (chunk.type === 'done') {
                yield { type: 'done' }
            }
        }
    }

    /**
     * Simple helper to get an LLM response and wrap it in AgentResponse.
     * Use this in handle() methods for quick LLM-powered responses.
     */
    protected async generateResponse(
        userMessage: string,
        context: AgentContext,
        options?: {
            conversationHistory?: LLMMessage[]
            maxToolIterations?: number
            temperature?: number
        }
    ): Promise<AgentResponse> {
        try {
            const { text, toolResults } = await this.callLLM(userMessage, context, options)

            return this.successResponse(text, {
                toolResults: toolResults.length > 0 ? toolResults : undefined,
            })
        } catch (error) {
            this.log('error', 'LLM call failed', error)
            return this.errorResponse(
                error instanceof Error ? error.message : 'Unknown error',
                true // shouldRetry
            )
        }
    }

    /**
     * Get the tools available to this agent in OpenAI function format.
     * @deprecated Use getLLMToolDefinitions() instead
     */
    protected getToolDefinitions(): unknown[] {
        const allTools = aiToolRegistry.getAll()
        const agentTools = allTools.filter(t => this.tools.includes(t.name))
        
        return agentTools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
            },
        }))
    }

    /**
     * Create a success response.
     */
    protected successResponse(
        message: string,
        options?: {
            display?: AgentDisplayInstruction
            confirmationRequired?: AgentConfirmation
            toolCalls?: AgentToolCall[]
            toolResults?: AgentToolResult[]
            handoffTo?: AgentDomain
            handoffMessage?: string
        }
    ): AgentResponse {
        return {
            success: true,
            message,
            agentId: this.id,
            ...options,
        }
    }

    /**
     * Create an error response.
     */
    protected errorResponse(
        error: string,
        shouldRetry = false
    ): AgentResponse {
        return {
            success: false,
            message: 'Ett fel uppstod. Försök igen.',
            error,
            shouldRetry,
            agentId: this.id,
        }
    }

    /**
     * Create a handoff response to transfer to another agent.
     */
    protected handoffResponse(
        targetAgent: AgentDomain,
        reason: string,
        contextMessage?: string
    ): AgentResponse {
        return {
            success: true,
            message: reason,
            handoffTo: targetAgent,
            handoffMessage: contextMessage,
            agentId: this.id,
        }
    }

    /**
     * Log agent activity (for debugging and metrics).
     */
    protected log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
        const prefix = `[Agent:${this.id}]`
        
        switch (level) {
            case 'info':
                console.log(prefix, message, data || '')
                break
            case 'warn':
                console.warn(prefix, message, data || '')
                break
            case 'error':
                console.error(prefix, message, data || '')
                break
        }
    }
}
