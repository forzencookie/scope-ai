/**
 * LLM Client for Agents
 *
 * OpenAI-only client with tool calling and streaming support.
 */

import type { AgentToolResult } from '../types'
import { callOpenAI, streamOpenAI } from './openai-adapter'
import type {
    LLMCallOptions,
    LLMResponse,
    LLMToolCall,
    LLMStreamChunk,
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
// Public API
// =============================================================================

/**
 * Call an LLM with the given options.
 */
export async function callLLM(options: LLMCallOptions): Promise<LLMResponse> {
    const timeout = options.timeout ?? 30000

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
        return await callOpenAI({ ...options, signal: controller.signal })
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * Stream an LLM response.
 */
export async function* streamLLM(options: LLMCallOptions): AsyncGenerator<LLMStreamChunk> {
    yield* streamOpenAI(options)
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
