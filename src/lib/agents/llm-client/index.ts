/**
 * LLM Client for Agents
 * 
 * Multi-provider LLM client supporting:
 * - OpenAI (GPT-4o, GPT-4o-mini)
 * - Anthropic (Claude Sonnet, Opus)
 * - Google (Gemini 2.0)
 * 
 * Features:
 * - Tool calling with automatic execution loop
 * - Streaming support
 * - Timeout handling
 * - Provider-agnostic interface
 */

import type { AgentToolResult } from '../types'
import { callOpenAI, streamOpenAI } from './openai-adapter'
import { callAnthropic, streamAnthropic } from './anthropic-adapter'
import { callGoogle, streamGoogle } from './google-adapter'
import type { 
    LLMCallOptions, 
    LLMResponse, 
    LLMToolCall, 
    LLMStreamChunk,
    Provider 
} from './types'

// Re-export types
export type { 
    LLMMessage, 
    LLMToolDefinition, 
    LLMToolCall, 
    LLMResponse, 
    LLMCallOptions, 
    LLMStreamChunk,
    Provider 
} from './types'

// =============================================================================
// Provider Detection
// =============================================================================

function getProviderFromModel(model: string): Provider {
    if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) {
        return 'openai'
    }
    if (model.startsWith('claude-')) {
        return 'anthropic'
    }
    if (model.startsWith('gemini-')) {
        return 'google'
    }
    // Default to OpenAI
    return 'openai'
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Call an LLM with the given options.
 * Automatically selects the correct provider based on model name.
 */
export async function callLLM(options: LLMCallOptions): Promise<LLMResponse> {
    const provider = getProviderFromModel(options.model)
    const timeout = options.timeout ?? 30000

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
        const callOptions = { ...options, signal: controller.signal }

        switch (provider) {
            case 'openai':
                return await callOpenAI(callOptions)
            case 'anthropic':
                return await callAnthropic(callOptions)
            case 'google':
                return await callGoogle(callOptions)
            default:
                throw new Error(`Unknown provider: ${provider}`)
        }
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * Stream an LLM response.
 * Automatically selects the correct provider based on model name.
 */
export async function* streamLLM(options: LLMCallOptions): AsyncGenerator<LLMStreamChunk> {
    const provider = getProviderFromModel(options.model)

    switch (provider) {
        case 'openai':
            yield* streamOpenAI(options)
            break
        case 'anthropic':
            yield* streamAnthropic(options)
            break
        case 'google':
            yield* streamGoogle(options)
            break
        default:
            throw new Error(`Unknown provider: ${provider}`)
    }
}

/**
 * Call LLM with automatic tool execution loop.
 * Continues calling until the model stops requesting tools or max iterations reached.
 */
export async function callLLMWithTools(
    options: LLMCallOptions,
    executeToolFn: (toolCall: LLMToolCall) => Promise<AgentToolResult>,
    maxIterations = 10
): Promise<{ response: LLMResponse; allToolResults: AgentToolResult[] }> {
    const messages = [...options.messages]
    const allToolResults: AgentToolResult[] = []
    let iterations = 0

    while (iterations < maxIterations) {
        const response = await callLLM({ ...options, messages })

        if (response.finishReason !== 'tool_calls' || response.toolCalls.length === 0) {
            return { response, allToolResults }
        }

        // Execute all tool calls
        const toolResults = await Promise.all(
            response.toolCalls.map(tc => executeToolFn(tc))
        )
        allToolResults.push(...toolResults)

        // Add assistant message with tool calls
        messages.push({
            role: 'assistant',
            content: response.content || '',
        })

        // Add tool results
        for (let i = 0; i < response.toolCalls.length; i++) {
            messages.push({
                role: 'tool',
                content: JSON.stringify(toolResults[i].result ?? toolResults[i].error),
                toolCallId: response.toolCalls[i].id,
                name: response.toolCalls[i].function.name,
            })
        }

        iterations++
    }

    throw new Error(`Tool execution loop exceeded ${maxIterations} iterations`)
}
