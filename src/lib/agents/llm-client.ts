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

import type { AgentContext, AgentToolResult } from './types'

// =============================================================================
// Types
// =============================================================================

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant' | 'tool'
    content: string
    toolCallId?: string
    name?: string
}

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

export interface LLMCallOptions {
    model: string
    messages: LLMMessage[]
    tools?: LLMToolDefinition[]
    temperature?: number
    maxTokens?: number
    timeout?: number
    signal?: AbortSignal
}

export interface LLMStreamChunk {
    type: 'text' | 'tool_call_start' | 'tool_call_delta' | 'tool_call_end' | 'done'
    content?: string
    toolCall?: Partial<LLMToolCall>
}

// =============================================================================
// Provider Detection
// =============================================================================

type Provider = 'openai' | 'anthropic' | 'google'

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
// OpenAI Implementation
// =============================================================================

async function callOpenAI(options: LLMCallOptions): Promise<LLMResponse> {
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
            // Handle both standard and custom tool call types
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

async function* streamOpenAI(options: LLMCallOptions): AsyncGenerator<LLMStreamChunk> {
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

// =============================================================================
// Anthropic Implementation
// =============================================================================

async function callAnthropic(options: LLMCallOptions): Promise<LLMResponse> {
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

    // Convert tools to Anthropic format with proper typing
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

async function* streamAnthropic(options: LLMCallOptions): AsyncGenerator<LLMStreamChunk> {
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

// =============================================================================
// Google Implementation
// =============================================================================

async function callGoogle(options: LLMCallOptions): Promise<LLMResponse> {
    const { GoogleGenerativeAI, FunctionCallingMode, SchemaType } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

    const systemMessage = options.messages.find(m => m.role === 'system')?.content || ''
    const otherMessages = options.messages.filter(m => m.role !== 'system')

    // Convert tools to Google format - use type assertion for SDK compatibility
    const tools = options.tools ? [{
        functionDeclarations: options.tools.map(t => ({
            name: t.function.name,
            description: t.function.description,
            parameters: {
                type: SchemaType.OBJECT,
                properties: (t.function.parameters as Record<string, unknown>).properties || {},
                required: (t.function.parameters as Record<string, unknown>).required as string[] || [],
            },
        })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }] as any : undefined

    const model = genAI.getGenerativeModel({
        model: options.model,
        systemInstruction: systemMessage,
        tools,
        toolConfig: tools ? { functionCallingConfig: { mode: FunctionCallingMode.AUTO } } : undefined,
    })

    // Convert messages to Google format
    const history = otherMessages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })
    const lastMessage = otherMessages[otherMessages.length - 1]
    
    const result = await chat.sendMessage(lastMessage.content)
    const response = result.response

    const textPart = response.candidates?.[0]?.content?.parts?.find(p => 'text' in p)
    const functionCalls = response.candidates?.[0]?.content?.parts?.filter(p => 'functionCall' in p) || []

    return {
        content: textPart && 'text' in textPart ? (textPart.text ?? null) : null,
        toolCalls: functionCalls.map((fc, i) => {
            if (!('functionCall' in fc) || !fc.functionCall) throw new Error('Expected function call')
            return {
                id: `call_${i}`,
                type: 'function' as const,
                function: {
                    name: fc.functionCall.name || '',
                    arguments: JSON.stringify(fc.functionCall.args || {}),
                },
            }
        }),
        finishReason: functionCalls.length > 0 ? 'tool_calls' : 'stop',
        usage: response.usageMetadata ? {
            promptTokens: response.usageMetadata.promptTokenCount || 0,
            completionTokens: response.usageMetadata.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata.totalTokenCount || 0,
        } : undefined,
    }
}

async function* streamGoogle(options: LLMCallOptions): AsyncGenerator<LLMStreamChunk> {
    const { GoogleGenerativeAI, FunctionCallingMode, SchemaType } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

    const systemMessage = options.messages.find(m => m.role === 'system')?.content || ''
    const otherMessages = options.messages.filter(m => m.role !== 'system')

    // Convert tools to Google format - use type assertion for SDK compatibility
    const tools = options.tools ? [{
        functionDeclarations: options.tools.map(t => ({
            name: t.function.name,
            description: t.function.description,
            parameters: {
                type: SchemaType.OBJECT,
                properties: (t.function.parameters as Record<string, unknown>).properties || {},
                required: (t.function.parameters as Record<string, unknown>).required as string[] || [],
            },
        })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }] as any : undefined

    const model = genAI.getGenerativeModel({
        model: options.model,
        systemInstruction: systemMessage,
        tools,
        toolConfig: tools ? { functionCallingConfig: { mode: FunctionCallingMode.AUTO } } : undefined,
    })

    const history = otherMessages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })
    const lastMessage = otherMessages[otherMessages.length - 1]

    const result = await chat.sendMessageStream(lastMessage.content)

    for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) {
            yield { type: 'text', content: text }
        }

        const functionCalls = chunk.candidates?.[0]?.content?.parts?.filter(p => 'functionCall' in p) || []
        for (const fc of functionCalls) {
            if ('functionCall' in fc && fc.functionCall) {
                const toolCall: LLMToolCall = {
                    id: `call_${Date.now()}`,
                    type: 'function',
                    function: {
                        name: fc.functionCall.name || '',
                        arguments: JSON.stringify(fc.functionCall.args || {}),
                    },
                }
                yield { type: 'tool_call_start', toolCall }
                yield { type: 'tool_call_end', toolCall }
            }
        }
    }

    yield { type: 'done' }
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
