/**
 * LLM Client Types
 * 
 * Shared types for multi-provider LLM client
 */

// =============================================================================
// Message Types
// =============================================================================

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant' | 'tool'
    content: string
    toolCallId?: string
    name?: string
}

// =============================================================================
// Tool Types
// =============================================================================

export interface LLMToolDefinition {
    type: 'function'
    function: {
        name: string
        description: string
        parameters: Record<string, unknown>
    }
}

export interface LLMToolCall {
    id: string
    type: 'function'
    function: {
        name: string
        arguments: string
    }
}

// =============================================================================
// Response Types
// =============================================================================

export interface LLMResponse {
    content: string | null
    toolCalls: LLMToolCall[]
    finishReason: 'stop' | 'tool_calls' | 'length' | 'error'
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
}

// =============================================================================
// Options Types
// =============================================================================

export interface LLMCallOptions {
    model: string
    messages: LLMMessage[]
    tools?: LLMToolDefinition[]
    temperature?: number
    maxTokens?: number
    timeout?: number
    signal?: AbortSignal
}

// =============================================================================
// Streaming Types
// =============================================================================

export interface LLMStreamChunk {
    type: 'text' | 'tool_call_start' | 'tool_call_delta' | 'tool_call_end' | 'done'
    content?: string
    toolCall?: Partial<LLMToolCall>
}

// =============================================================================
// Provider Types
// =============================================================================

export type Provider = 'openai' | 'anthropic' | 'google'
