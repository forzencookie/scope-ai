/**
 * Google Gemini LLM Adapter
 */

import type { 
    LLMCallOptions, 
    LLMResponse, 
    LLMToolCall, 
    LLMStreamChunk 
} from './types'

export async function callGoogle(options: LLMCallOptions): Promise<LLMResponse> {
    const { GoogleGenerativeAI, FunctionCallingMode, SchemaType } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

    const systemMessage = options.messages.find(m => m.role === 'system')?.content || ''
    const otherMessages = options.messages.filter(m => m.role !== 'system')

    // Convert tools to Google format
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

export async function* streamGoogle(options: LLMCallOptions): AsyncGenerator<LLMStreamChunk> {
    const { GoogleGenerativeAI, FunctionCallingMode, SchemaType } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

    const systemMessage = options.messages.find(m => m.role === 'system')?.content || ''
    const otherMessages = options.messages.filter(m => m.role !== 'system')

    // Convert tools to Google format
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
