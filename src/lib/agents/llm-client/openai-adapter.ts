/**
 * OpenAI LLM Adapter
 */

import type { 
    LLMCallOptions, 
    LLMResponse, 
    LLMToolCall, 
    LLMStreamChunk 
} from './types'

export async function callOpenAI(options: LLMCallOptions): Promise<LLMResponse> {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const messages = options.messages.map(m => {
        if (m.role === 'tool') {
            return {
                role: 'tool' as const,
                content: m.content,
                tool_call_id: m.toolCallId!,
            }
        }
        return {
            role: m.role as 'system' | 'user' | 'assistant',
            content: m.content,
        }
    })

    const response = await openai.chat.completions.create({
        model: options.model,
        messages,
        tools: options.tools,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
    }, { signal: options.signal })

    const choice = response.choices[0]
    const toolCalls = choice.message.tool_calls || []
    
    return {
        content: choice.message.content,
        toolCalls: toolCalls.map(tc => {
            const fn = 'function' in tc ? tc.function : null
            return {
                id: tc.id,
                type: 'function' as const,
                function: {
                    name: fn?.name || '',
                    arguments: fn?.arguments || '{}',
                },
            }
        }),
        finishReason: choice.finish_reason === 'tool_calls' ? 'tool_calls' : 'stop',
        usage: response.usage ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
        } : undefined,
    }
}

export async function* streamOpenAI(options: LLMCallOptions): AsyncGenerator<LLMStreamChunk> {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const messages = options.messages.map(m => {
        if (m.role === 'tool') {
            return {
                role: 'tool' as const,
                content: m.content,
                tool_call_id: m.toolCallId!,
            }
        }
        return {
            role: m.role as 'system' | 'user' | 'assistant',
            content: m.content,
        }
    })

    const stream = await openai.chat.completions.create({
        model: options.model,
        messages,
        tools: options.tools,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        stream: true,
    }, { signal: options.signal })

    const toolCalls: Map<number, LLMToolCall> = new Map()

    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta

        if (delta?.content) {
            yield { type: 'text', content: delta.content }
        }

        if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
                if (!toolCalls.has(tc.index)) {
                    toolCalls.set(tc.index, {
                        id: tc.id || '',
                        type: 'function',
                        function: { name: '', arguments: '' },
                    })
                    yield { type: 'tool_call_start', toolCall: { id: tc.id } }
                }

                const existing = toolCalls.get(tc.index)!
                if (tc.id) existing.id = tc.id
                if (tc.function?.name) existing.function.name = tc.function.name
                if (tc.function?.arguments) {
                    existing.function.arguments += tc.function.arguments
                    yield { 
                        type: 'tool_call_delta', 
                        toolCall: { function: { name: existing.function.name, arguments: tc.function.arguments } } 
                    }
                }
            }
        }

        if (chunk.choices[0]?.finish_reason === 'tool_calls') {
            for (const tc of toolCalls.values()) {
                yield { type: 'tool_call_end', toolCall: tc }
            }
        }
    }

    yield { type: 'done' }
}
