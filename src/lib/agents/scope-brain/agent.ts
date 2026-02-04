/**
 * Scope Brain - Unified AI Agent
 *
 * Single agent with access to all tools and domain expertise.
 * Replaces the multi-agent orchestration with a simpler, more
 * effective architecture.
 *
 * Features:
 * - Intelligent model selection (Haiku/Sonnet/Sonnet+Thinking)
 * - All tools available
 * - Unified Swedish accounting expertise
 * - Streaming support
 */

import type {
    AgentContext,
    AgentResponse,
    AgentToolResult,
    AgentDisplayInstruction,
    AgentConfirmation,
} from '../types'
import { aiToolRegistry } from '../../ai-tools/registry'
import { selectModel, getModelId, type ModelConfig } from './model-selector'
import { buildSystemPrompt } from './system-prompt'
import type { LLMMessage, LLMToolDefinition, LLMToolCall } from '../llm-client/types'

// =============================================================================
// Types
// =============================================================================

export interface ScopeBrainOptions {
    /** Override automatic model selection */
    forceModel?: ModelConfig
    /** Maximum tool execution iterations */
    maxToolIterations?: number
    /** Temperature for LLM calls */
    temperature?: number
}

export interface StreamChunk {
    type: 'text' | 'thinking' | 'tool_start' | 'tool_result' | 'error' | 'done'
    content?: string
    toolName?: string
    toolResult?: AgentToolResult
    error?: string
}

// =============================================================================
// Scope Brain Implementation
// =============================================================================

export class ScopeBrain {
    private options: ScopeBrainOptions

    constructor(options: ScopeBrainOptions = {}) {
        this.options = {
            maxToolIterations: 10,
            temperature: 0.7,
            ...options,
        }
    }

    // =========================================================================
    // Main Handle Method
    // =========================================================================

    /**
     * Handle a user message and return a response.
     * This is the primary entry point for non-streaming usage.
     */
    async handle(message: string, context: AgentContext): Promise<AgentResponse> {
        try {
            // Select model based on query complexity
            const modelConfig = this.options.forceModel ?? selectModel(message)
            const modelId = getModelId(modelConfig)

            console.log(`[ScopeBrain] Using model: ${modelId}, thinking: ${modelConfig.thinking}`)

            // Build messages
            const messages = this.buildMessages(message, context)
            const tools = this.getAllToolDefinitions()

            // Call LLM with tool loop
            const { text, toolResults } = await this.callLLMWithTools(
                modelId,
                messages,
                tools,
                context,
                modelConfig
            )

            return {
                success: true,
                message: text,
                agentId: 'orchestrator', // For compatibility
                toolResults: toolResults.length > 0 ? toolResults : undefined,
            }
        } catch (error) {
            console.error('[ScopeBrain] Error:', error)
            return {
                success: false,
                message: 'Ett fel uppstod. Försök igen.',
                error: error instanceof Error ? error.message : 'Unknown error',
                shouldRetry: true,
                agentId: 'orchestrator',
            }
        }
    }

    // =========================================================================
    // Streaming Support
    // =========================================================================

    /**
     * Handle a user message with streaming response.
     * Yields chunks as they arrive from the LLM.
     */
    async *handleStream(
        message: string,
        context: AgentContext
    ): AsyncGenerator<StreamChunk> {
        try {
            const modelConfig = this.options.forceModel ?? selectModel(message)
            const modelId = getModelId(modelConfig)

            console.log(`[ScopeBrain] Streaming with model: ${modelId}`)

            const messages = this.buildMessages(message, context)
            const tools = this.getAllToolDefinitions()

            yield* this.streamLLMWithTools(
                modelId,
                messages,
                tools,
                context,
                modelConfig
            )

            yield { type: 'done' }
        } catch (error) {
            yield {
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
            }
        }
    }

    // =========================================================================
    // LLM Integration
    // =========================================================================

    /**
     * Call LLM with automatic tool execution loop.
     */
    private async callLLMWithTools(
        modelId: string,
        messages: LLMMessage[],
        tools: LLMToolDefinition[],
        context: AgentContext,
        modelConfig: ModelConfig
    ): Promise<{ text: string; toolResults: AgentToolResult[] }> {
        const Anthropic = (await import('@anthropic-ai/sdk')).default
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

        const allToolResults: AgentToolResult[] = []
        let iterations = 0
        let currentMessages = [...messages]

        while (iterations < (this.options.maxToolIterations ?? 10)) {
            // Prepare Anthropic-specific format
            const systemMessage = currentMessages.find(m => m.role === 'system')?.content || ''
            const otherMessages = currentMessages.filter(m => m.role !== 'system')

            const anthropicMessages = this.convertToAnthropicMessages(otherMessages)
            const anthropicTools = this.convertToAnthropicTools(tools)

            // Build request options
            const requestOptions: Parameters<typeof anthropic.messages.create>[0] = {
                model: modelId,
                max_tokens: modelConfig.thinking ? 16000 : 4096,
                system: systemMessage,
                messages: anthropicMessages,
                tools: anthropicTools,
            }

            // Add thinking if enabled (extended thinking API)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const finalOptions: any = { ...requestOptions }
            if (modelConfig.thinking && modelConfig.thinkingBudget) {
                finalOptions.thinking = {
                    type: 'enabled',
                    budget_tokens: modelConfig.thinkingBudget,
                }
            }

            const response = await anthropic.messages.create(finalOptions)

            // Extract content - handle Message type
            type ContentBlock = { type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: unknown }
            const content = response.content as ContentBlock[]
            const textContent = content.find((c): c is { type: 'text'; text: string } => c.type === 'text')
            const toolUseBlocks = content.filter((c): c is { type: 'tool_use'; id: string; name: string; input: unknown } => c.type === 'tool_use')

            // If no tool calls, we're done
            if (response.stop_reason !== 'tool_use' || toolUseBlocks.length === 0) {
                return {
                    text: textContent?.text ?? '',
                    toolResults: allToolResults,
                }
            }

            // Execute tool calls
            const toolResults = await Promise.all(
                toolUseBlocks.map(async (tc) => {
                    return this.executeTool(tc.name, tc.input as Record<string, unknown>, context)
                })
            )
            allToolResults.push(...toolResults)

            // Add assistant message with tool use
            currentMessages.push({
                role: 'assistant',
                content: textContent?.text ?? '',
            })

            // Add tool results
            for (let i = 0; i < toolUseBlocks.length; i++) {
                const tc = toolUseBlocks[i]
                currentMessages.push({
                    role: 'tool',
                    content: JSON.stringify(toolResults[i].result ?? toolResults[i].error),
                    toolCallId: tc.id,
                    name: tc.name,
                })
            }

            iterations++
        }

        throw new Error(`Tool execution loop exceeded ${this.options.maxToolIterations} iterations`)
    }

    /**
     * Stream LLM response with tool execution.
     */
    private async *streamLLMWithTools(
        modelId: string,
        messages: LLMMessage[],
        tools: LLMToolDefinition[],
        context: AgentContext,
        modelConfig: ModelConfig
    ): AsyncGenerator<StreamChunk> {
        const Anthropic = (await import('@anthropic-ai/sdk')).default
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

        let currentMessages = [...messages]
        let iterations = 0

        while (iterations < (this.options.maxToolIterations ?? 10)) {
            const systemMessage = currentMessages.find(m => m.role === 'system')?.content || ''
            const otherMessages = currentMessages.filter(m => m.role !== 'system')

            const anthropicMessages = this.convertToAnthropicMessages(otherMessages)
            const anthropicTools = this.convertToAnthropicTools(tools)

            const stream = anthropic.messages.stream({
                model: modelId,
                max_tokens: modelConfig.thinking ? 16000 : 4096,
                system: systemMessage,
                messages: anthropicMessages,
                tools: anthropicTools,
            })

            let fullText = ''
            const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = []
            let currentToolId = ''
            let currentToolName = ''
            let toolInputBuffer = ''

            for await (const event of stream) {
                if (event.type === 'content_block_start') {
                    if (event.content_block.type === 'tool_use') {
                        currentToolId = event.content_block.id
                        currentToolName = event.content_block.name
                        toolInputBuffer = ''
                        yield { type: 'tool_start', toolName: currentToolName }
                    }
                } else if (event.type === 'content_block_delta') {
                    if (event.delta.type === 'text_delta') {
                        fullText += event.delta.text
                        yield { type: 'text', content: event.delta.text }
                    } else if (event.delta.type === 'thinking_delta') {
                        yield { type: 'thinking', content: (event.delta as { thinking?: string }).thinking }
                    } else if (event.delta.type === 'input_json_delta') {
                        toolInputBuffer += event.delta.partial_json
                    }
                } else if (event.type === 'content_block_stop') {
                    if (currentToolId && currentToolName) {
                        try {
                            const input = JSON.parse(toolInputBuffer || '{}')
                            toolCalls.push({ id: currentToolId, name: currentToolName, input })
                        } catch {
                            toolCalls.push({ id: currentToolId, name: currentToolName, input: {} })
                        }
                        currentToolId = ''
                        currentToolName = ''
                    }
                }
            }

            // If no tool calls, we're done
            if (toolCalls.length === 0) {
                return
            }

            // Execute tools and yield results
            const toolResults: AgentToolResult[] = []
            for (const tc of toolCalls) {
                const result = await this.executeTool(tc.name, tc.input, context)
                toolResults.push(result)
                yield { type: 'tool_result', toolName: tc.name, toolResult: result }
            }

            // Add messages for next iteration
            currentMessages.push({
                role: 'assistant',
                content: fullText,
            })

            for (let i = 0; i < toolCalls.length; i++) {
                currentMessages.push({
                    role: 'tool',
                    content: JSON.stringify(toolResults[i].result ?? toolResults[i].error),
                    toolCallId: toolCalls[i].id,
                    name: toolCalls[i].name,
                })
            }

            iterations++
        }
    }

    // =========================================================================
    // Tool Execution
    // =========================================================================

    /**
     * Execute a tool by name.
     */
    private async executeTool(
        toolName: string,
        params: Record<string, unknown>,
        context: AgentContext
    ): Promise<AgentToolResult> {
        try {
            const result = await aiToolRegistry.execute(toolName, params, {
                userId: context.userId,
                companyId: context.companyId,
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

    // =========================================================================
    // Message Building
    // =========================================================================

    /**
     * Build the messages array for LLM call.
     */
    private buildMessages(userMessage: string, context: AgentContext): LLMMessage[] {
        const systemPrompt = buildSystemPrompt(context)

        const messages: LLMMessage[] = [
            { role: 'system', content: systemPrompt },
        ]

        // Add conversation history
        for (const msg of context.conversationHistory) {
            if (msg.from === 'user') {
                messages.push({ role: 'user', content: msg.content })
            } else {
                // Any agent response becomes assistant message
                messages.push({ role: 'assistant', content: msg.content })
            }
        }

        // Add current message
        messages.push({ role: 'user', content: userMessage })

        return messages
    }

    /**
     * Get all tool definitions for the LLM.
     */
    private getAllToolDefinitions(): LLMToolDefinition[] {
        const allTools = aiToolRegistry.getAll()

        return allTools.map(tool => ({
            type: 'function' as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters as Record<string, unknown>,
            },
        }))
    }

    // =========================================================================
    // Anthropic Format Conversion
    // =========================================================================

    /**
     * Convert messages to Anthropic format.
     */
    private convertToAnthropicMessages(messages: LLMMessage[]): Array<{
        role: 'user' | 'assistant'
        content: string | Array<{ type: 'tool_result'; tool_use_id: string; content: string }>
    }> {
        return messages.map(m => {
            if (m.role === 'tool') {
                return {
                    role: 'user' as const,
                    content: [{
                        type: 'tool_result' as const,
                        tool_use_id: m.toolCallId!,
                        content: m.content,
                    }],
                }
            }
            return {
                role: m.role as 'user' | 'assistant',
                content: m.content,
            }
        })
    }

    /**
     * Convert tools to Anthropic format.
     */
    private convertToAnthropicTools(tools: LLMToolDefinition[]): Array<{
        name: string
        description: string
        input_schema: { type: 'object' } & Record<string, unknown>
    }> {
        return tools.map(t => ({
            name: t.function.name,
            description: t.function.description,
            input_schema: {
                type: 'object' as const,
                ...t.function.parameters,
            },
        }))
    }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a new ScopeBrain instance with default options.
 */
export function createScopeBrain(options?: ScopeBrainOptions): ScopeBrain {
    return new ScopeBrain(options)
}

/**
 * Quick helper to handle a message with default settings.
 */
export async function handleWithScopeBrain(
    message: string,
    context: AgentContext,
    options?: ScopeBrainOptions
): Promise<AgentResponse> {
    const brain = new ScopeBrain(options)
    return brain.handle(message, context)
}
