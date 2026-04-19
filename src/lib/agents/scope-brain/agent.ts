/**
 * Scope Brain - Unified AI Agent
 *
 * Single agent with access to all tools and domain expertise.
 * Uses OpenAI GPT-5 with tool calling and streaming.
 */

import type {
    AgentContext,
    AgentResponse,
    AgentToolResult,
    LLMMessage,
    LLMToolDefinition,
} from '../types'
import { aiToolRegistry } from '../../ai-tools/registry'
import fs from 'fs'
import path from 'path'
import { selectModel, getModelId, type ModelConfig } from './model-selector'
import { nullToUndefined } from '@/lib/utils'

const _PROMPT_DIR = path.join(process.cwd(), 'src', 'lib', 'agents', 'scope-brain', 'prompt')
const _COMPANY_TYPE_NAMES: Record<string, string> = {
    AB: 'Aktiebolag (AB)', EF: 'Enskild firma (EF)',
    HB: 'Handelsbolag (HB)', KB: 'Kommanditbolag (KB)', FORENING: 'Förening',
}

function buildSystemPrompt(context: AgentContext): string {
    const parts: string[] = []
    const mainPath = path.join(_PROMPT_DIR, 'main.md')
    const main = fs.existsSync(mainPath) ? fs.readFileSync(mainPath, 'utf-8').trim() : ''
    if (main) parts.push(main)
    const today = new Date().toISOString().slice(0, 10)
    if (!context.companyId || !context.companyType) {
        parts.push(`## Context\n\nDatum: **${today}**\n\n⚠️ Ingen företagsprofil kopplad.`)
    } else {
        const typeName = _COMPANY_TYPE_NAMES[context.companyType] ?? context.companyType
        parts.push(`## Context\n\nDatum: **${today}**\nFöretagstyp: **${typeName}**\n\nAnvänd get_company_info när du behöver specifika företagsuppgifter.`)
    }
    return parts.join('\n\n---\n\n')
}
import type OpenAI from 'openai'

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
    private activeToolNames: Set<string>

    constructor(options: ScopeBrainOptions = {}) {
        this.options = {
            maxToolIterations: 10,
            temperature: 0.7,
            ...options,
        }
        // Activate all tools upfront — no search_tools discovery needed
        this.activeToolNames = new Set(
            aiToolRegistry.getAll().map(t => t.name)
        )
    }

    // =========================================================================
    // Main Handle Method
    // =========================================================================

    async handle(message: string, context: AgentContext): Promise<AgentResponse> {
        try {
            const modelConfig = this.options.forceModel ?? selectModel(message)
            const modelId = getModelId(modelConfig)

            console.log(`[ScopeBrain] Using model: ${modelId}, active tools: ${this.activeToolNames.size}`)

            const messages = this.buildMessages(message, context)
            const tools = this.getActiveToolDefinitions()

            const { text, toolResults } = await this.callLLMWithTools(modelId, messages, tools, context)

            return {
                success: true,
                message: text,
                agentId: 'orchestrator',
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

    async *handleStream(
        message: string,
        context: AgentContext
    ): AsyncGenerator<StreamChunk> {
        try {
            const modelConfig = this.options.forceModel ?? selectModel(message)
            const modelId = getModelId(modelConfig)

            console.log(`[ScopeBrain] Streaming with model: ${modelId}, active tools: ${this.activeToolNames.size}`)

            const messages = this.buildMessages(message, context)
            const tools = this.getActiveToolDefinitions()

            yield* this.streamLLMWithTools(modelId, messages, tools, context)

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

    private async callLLMWithTools(
        modelId: string,
        messages: LLMMessage[],
        tools: LLMToolDefinition[],
        context: AgentContext,
    ): Promise<{ text: string; toolResults: AgentToolResult[] }> {
        const { default: OpenAIClient } = await import('openai')
        const openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY })

        const allToolResults: AgentToolResult[] = []
        let iterations = 0
        let currentMessages = [...messages]
        // Use mutable tool list that refreshes when new tools are discovered
        let currentTools = tools

        while (iterations < (this.options.maxToolIterations ?? 10)) {
            const openaiMessages = this.convertToOpenAIMessages(currentMessages)
            const openaiTools = this.convertToOpenAITools(currentTools)

            const response = await openai.chat.completions.create({
                model: modelId,
                messages: openaiMessages,
                tools: openaiTools.length > 0 ? openaiTools : undefined,
                tool_choice: openaiTools.length > 0 ? 'auto' : undefined,
                max_tokens: 4096,
                temperature: this.options.temperature ?? 0.7,
            })

            const choice = response.choices[0]
            const textContent = choice.message.content || ''
            // Cast to the standard tool call type (OpenAI SDK union can include custom types)
            type StandardToolCall = { id: string; function: { name: string; arguments: string } }
            const toolCalls = (choice.message.tool_calls || []) as StandardToolCall[]

            if (choice.finish_reason !== 'tool_calls' || toolCalls.length === 0) {
                return { text: textContent, toolResults: allToolResults }
            }

            const toolResults = await Promise.all(
                toolCalls.map(async (tc) => {
                    let params: Record<string, unknown> = {}
                    try { params = JSON.parse(tc.function.arguments || '{}') } catch { /* use empty */ }
                    return this.executeTool(tc.function.name, params, context)
                })
            )
            allToolResults.push(...toolResults)
            currentTools = this.getActiveToolDefinitions()

            currentMessages.push({ role: 'assistant', content: textContent })

            for (let i = 0; i < toolCalls.length; i++) {
                const tc = toolCalls[i]
                currentMessages.push({
                    role: 'tool',
                    content: JSON.stringify(toolResults[i].result ?? toolResults[i].error),
                    toolCallId: tc.id,
                    name: tc.function.name,
                })
            }

            iterations++
        }

        throw new Error(`Tool execution loop exceeded ${this.options.maxToolIterations} iterations`)
    }

    private async *streamLLMWithTools(
        modelId: string,
        messages: LLMMessage[],
        tools: LLMToolDefinition[],
        context: AgentContext,
    ): AsyncGenerator<StreamChunk> {
        const { default: OpenAIClient } = await import('openai')
        const openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY })

        let currentMessages = [...messages]
        let iterations = 0
        let currentTools = tools

        while (iterations < (this.options.maxToolIterations ?? 10)) {
            const openaiMessages = this.convertToOpenAIMessages(currentMessages)
            const openaiTools = this.convertToOpenAITools(currentTools)

            const stream = await openai.chat.completions.create({
                model: modelId,
                messages: openaiMessages,
                tools: openaiTools.length > 0 ? openaiTools : undefined,
                tool_choice: openaiTools.length > 0 ? 'auto' : undefined,
                max_tokens: 4096,
                temperature: this.options.temperature ?? 0.7,
                stream: true,
            })

            let fullText = ''
            // Map from tool call index → accumulated buffer
            const toolCallBuffers = new Map<number, { id: string; name: string; args: string }>()

            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta

                if (delta?.content) {
                    fullText += delta.content
                    yield { type: 'text', content: delta.content }
                }

                if (delta?.tool_calls) {
                    for (const tc of delta.tool_calls) {
                        const idx = tc.index
                        if (!toolCallBuffers.has(idx)) {
                            toolCallBuffers.set(idx, { id: tc.id || '', name: tc.function?.name || '', args: '' })
                            if (tc.function?.name) {
                                yield { type: 'tool_start', toolName: tc.function.name }
                            }
                        }
                        const buf = toolCallBuffers.get(idx)!
                        if (tc.id) buf.id = tc.id
                        if (tc.function?.name) buf.name = tc.function.name
                        if (tc.function?.arguments) buf.args += tc.function.arguments
                    }
                }
            }

            if (toolCallBuffers.size === 0) {
                return
            }

            // Execute tools and add to message history
            const toolCalls = Array.from(toolCallBuffers.values())
            const toolResults: AgentToolResult[] = []

            for (const tc of toolCalls) {
                let params: Record<string, unknown> = {}
                try { params = JSON.parse(tc.args || '{}') } catch { /* use empty */ }
                const result = await this.executeTool(tc.name, params, context)
                toolResults.push(result)
                yield { type: 'tool_result', toolName: tc.name, toolResult: result }
            }
            // Refresh tool definitions to include any newly discovered tools
            currentTools = this.getActiveToolDefinitions()

            currentMessages.push({ role: 'assistant', content: fullText })

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

    private async executeTool(
        toolName: string,
        params: Record<string, unknown>,
        context: AgentContext
    ): Promise<AgentToolResult> {
        try {
            const result = await aiToolRegistry.execute(toolName, params, {
                userId: context.userId,
                companyId: nullToUndefined(context.companyId),
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

    private buildMessages(userMessage: string, context: AgentContext): LLMMessage[] {
        const systemPrompt = buildSystemPrompt(context)

        const messages: LLMMessage[] = [
            { role: 'system', content: systemPrompt },
        ]

        for (const msg of context.conversationHistory) {
            if (msg.from === 'user') {
                messages.push({ role: 'user', content: msg.content })
            } else {
                messages.push({ role: 'assistant', content: msg.content })
            }
        }

        messages.push({ role: 'user', content: userMessage })

        return messages
    }

    private getActiveToolDefinitions(): LLMToolDefinition[] {
        return aiToolRegistry.getByNames([...this.activeToolNames]).map(tool => ({
            type: 'function' as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters as Record<string, unknown>,
            },
        }))
    }

    // =========================================================================
    // OpenAI Format Conversion
    // =========================================================================

    private convertToOpenAIMessages(messages: LLMMessage[]): OpenAI.ChatCompletionMessageParam[] {
        return messages.map(m => {
            if (m.role === 'tool') {
                return {
                    role: 'tool' as const,
                    tool_call_id: m.toolCallId!,
                    content: m.content,
                }
            }
            if (m.role === 'system') {
                return { role: 'system' as const, content: m.content }
            }
            if (m.role === 'assistant') {
                return { role: 'assistant' as const, content: m.content }
            }
            return { role: 'user' as const, content: m.content }
        })
    }

    private convertToOpenAITools(tools: LLMToolDefinition[]): OpenAI.ChatCompletionTool[] {
        return tools.map(t => ({
            type: 'function' as const,
            function: {
                name: t.function.name,
                description: t.function.description,
                parameters: t.function.parameters,
            },
        }))
    }
}

// =============================================================================
// Factory Functions
// =============================================================================

export function createScopeBrain(options?: ScopeBrainOptions): ScopeBrain {
    return new ScopeBrain(options)
}

export async function handleWithScopeBrain(
    message: string,
    context: AgentContext,
    options?: ScopeBrainOptions
): Promise<AgentResponse> {
    const brain = new ScopeBrain(options)
    return brain.handle(message, context)
}
