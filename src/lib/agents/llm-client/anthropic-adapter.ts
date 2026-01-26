/**
 * Anthropic Claude LLM Adapter
 */

import type { 
    LLMCallOptions, 
    LLMResponse, 
    LLMToolCall, 
    LLMStreamChunk 
} from './types'

export async function callAnthropic(options: LLMCallOptions): Promise<LLMResponse> {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Separate system message from others
    const systemMessage = options.messages.find(m => m.role === 'system')?.content || ''
    const otherMessages = options.messages.filter(m => m.role !== 'system')

    // Convert messages to Anthropic format
    const messages = otherMessages.map(m => {
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
        if (m.role === 'assistant') {
            return {
                role: 'assistant' as const,
                content: m.content,
            }
        }
        return {
            role: 'user' as const,
            content: m.content,
        }
    })

    // Convert tools to Anthropic format
    const tools = options.tools?.map(t => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: {
            type: 'object' as const,
            ...t.function.parameters,
        },
    }))

    const response = await anthropic.messages.create({
        model: options.model,
        max_tokens: options.maxTokens ?? 2000,
        system: systemMessage,
        messages,
        tools,
    })

    const textContent = response.content.find(c => c.type === 'text')
    const toolUseBlocks = response.content.filter(c => c.type === 'tool_use')

    return {
        content: textContent?.type === 'text' ? textContent.text : null,
        toolCalls: toolUseBlocks.map(tc => {
            if (tc.type !== 'tool_use') throw new Error('Unexpected content type')
            return {
                id: tc.id,
                type: 'function' as const,
                function: {
                    name: tc.name,
                    arguments: JSON.stringify(tc.input),
                },
            }
        }),
        finishReason: response.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
        usage: {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
    }
}

export async function* streamAnthropic(options: LLMCallOptions): AsyncGenerator<LLMStreamChunk> {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemMessage = options.messages.find(m => m.role === 'system')?.content || ''
    const otherMessages = options.messages.filter(m => m.role !== 'system')

    const messages = otherMessages.map(m => {
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
        if (m.role === 'assistant') {
            return {
                role: 'assistant' as const,
                content: m.content,
            }
        }
        return {
            role: 'user' as const,
            content: m.content,
        }
    })

    const tools = options.tools?.map(t => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: {
            type: 'object' as const,
            ...t.function.parameters,
        },
    }))

    const stream = anthropic.messages.stream({
        model: options.model,
        max_tokens: options.maxTokens ?? 2000,
        system: systemMessage,
        messages,
        tools,
    })

    let currentToolCall: Partial<LLMToolCall> | null = null
    let toolArgumentsBuffer = ''

    for await (const event of stream) {
        if (event.type === 'content_block_start') {
            if (event.content_block.type === 'tool_use') {
                currentToolCall = {
                    id: event.content_block.id,
                    type: 'function',
                    function: { name: event.content_block.name, arguments: '' },
                }
                toolArgumentsBuffer = ''
                yield { type: 'tool_call_start', toolCall: currentToolCall }
            }
        } else if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
                yield { type: 'text', content: event.delta.text }
            } else if (event.delta.type === 'input_json_delta') {
                toolArgumentsBuffer += event.delta.partial_json
                yield { 
                    type: 'tool_call_delta', 
                    toolCall: { function: { name: currentToolCall?.function?.name || '', arguments: event.delta.partial_json } }
                }
            }
        } else if (event.type === 'content_block_stop') {
            if (currentToolCall) {
                currentToolCall.function = {
                    name: currentToolCall.function?.name || '',
                    arguments: toolArgumentsBuffer,
                }
                yield { type: 'tool_call_end', toolCall: currentToolCall as LLMToolCall }
                currentToolCall = null
            }
        }
    }

    yield { type: 'done' }
}
