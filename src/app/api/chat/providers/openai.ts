/**
 * OpenAI GPT Provider for Chat API
 */

import { streamText, streamData } from '../streaming'
import { SYSTEM_PROMPT } from '../system-prompt'
import { aiToolRegistry, toolsToOpenAIFunctions, type AIToolResult } from '@/lib/ai-tools'
import type { 
    AIContentPart, 
    AIToolDefinition, 
    ProviderHandlerParams 
} from '../types'

// Model mapping
const OPENAI_MODEL_MAP: Record<string, string> = {
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'gpt-4-turbo': 'gpt-4-turbo',
}

/**
 * Handle a chat request using OpenAI's GPT API
 */
export async function handleOpenAIProvider(params: ProviderHandlerParams): Promise<string> {
    const { 
        modelId, 
        messagesForAI, 
        controller, 
        conversationId, 
        tools, 
        userDb 
    } = params

    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })

    const actualModel = OPENAI_MODEL_MAP[modelId] || 'gpt-4o-mini'

    // Convert messages to OpenAI format with null safety
    const openaiMessages = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        ...messagesForAI.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: typeof m.content === 'string'
                ? m.content
                : Array.isArray(m.content)
                    ? (m.content as AIContentPart[]).map((c) => {
                        if (c.type === 'text') return { type: 'text' as const, text: c.text || '' }
                        if (c.type === 'image_url' && c.image_url && typeof c.image_url === 'object' && 'url' in c.image_url) {
                            return {
                                type: 'image_url' as const,
                                image_url: { url: (c.image_url as { url: string }).url, detail: 'low' as const }
                            }
                        }
                        return { type: 'text' as const, text: '' }
                    })
                    : m.content || ''
        }))
    ]

    // Convert tools to OpenAI function format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openaiTools = tools.length > 0 ? toolsToOpenAIFunctions(tools as any) : undefined

    // Debug: Log tools being passed
    console.log(`[OpenAI] Passing ${openaiTools?.length || 0} tools to model ${actualModel}`)
    if (openaiTools && openaiTools.length > 0) {
        console.log(`[OpenAI] Tool names:`, openaiTools.map(t => t.function.name).join(', '))
    }

    let fullContent = ''

    // Debug: Log message structure
    console.log('[OpenAI] Messages structure:')
    for (const msg of openaiMessages) {
        if (typeof msg.content === 'string') {
            console.log(`  ${msg.role}: string (${msg.content.length} chars)`)
        } else if (Array.isArray(msg.content)) {
            console.log(`  ${msg.role}: array with ${msg.content.length} parts:`)
            for (const part of msg.content) {
                if (part.type === 'text') {
                    console.log(`    - text: "${part.text?.slice(0, 50)}..."`)
                } else if (part.type === 'image_url') {
                    const url = part.image_url?.url || ''
                    console.log(`    - image_url: ${url.slice(0, 50)}... (${url.length} chars)`)
                } else {
                    console.log(`    - unknown type: ${JSON.stringify(part).slice(0, 100)}`)
                }
            }
        } else {
            console.log(`  ${msg.role}: ${typeof msg.content}`)
        }
    }

    try {
        const stream = await openai.chat.completions.create({
            model: actualModel,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            messages: openaiMessages as any,
            stream: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tools: openaiTools as any,
            tool_choice: openaiTools ? 'auto' : undefined,
        })

        // Accumulate tool calls across chunks (OpenAI streams them incrementally)
        const toolCallsInProgress: Map<number, { id: string; name: string; arguments: string }> = new Map()

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta
            const finishReason = chunk.choices[0]?.finish_reason

            // Handle text content
            if (delta?.content) {
                fullContent += delta.content
                streamText(controller, delta.content)
            }

            // Accumulate tool call chunks
            if (delta?.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                    const index = toolCall.index
                    const existing = toolCallsInProgress.get(index) || { id: '', name: '', arguments: '' }

                    if (toolCall.id) existing.id = toolCall.id
                    if (toolCall.function?.name) existing.name += toolCall.function.name
                    if (toolCall.function?.arguments) existing.arguments += toolCall.function.arguments

                    toolCallsInProgress.set(index, existing)
                }
            }

            // When streaming completes with tool_calls finish reason, execute them
            if (finishReason === 'tool_calls' || finishReason === 'stop') {
                for (const [, toolCall] of toolCallsInProgress) {
                    if (toolCall.name && toolCall.arguments) {
                        console.log(`[OpenAI] Executing tool: ${toolCall.name}`)
                        try {
                            const toolArgs = JSON.parse(toolCall.arguments)
                            const tool = aiToolRegistry.get(toolCall.name)

                            if (tool) {
                                const result = await tool.execute(toolArgs, {
                                    userId: userDb?.userId || '',
                                    companyId: userDb?.companyId || '',
                                    userDb: userDb!
                                }) as AIToolResult

                                // Stream back the result data
                                if (result.display) {
                                    streamData(controller, { display: result.display })
                                }
                                if (result.navigation) {
                                    streamData(controller, { navigation: result.navigation })
                                }
                                if (result.confirmationRequired) {
                                    streamData(controller, { confirmationRequired: result.confirmationRequired })
                                }
                                streamData(controller, { toolResults: [{ tool: toolCall.name, result: result.data }] })
                            } else {
                                console.error(`[OpenAI] Tool not found: ${toolCall.name}`)
                            }
                        } catch (parseError) {
                            console.error(`[OpenAI] Tool ${toolCall.name} failed:`, parseError)
                        }
                    }
                }
                toolCallsInProgress.clear()
            }
        }
    } catch (error: unknown) {
        console.error('OpenAI API error:', error)
        // Extract meaningful error message from OpenAI error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let errorDetail = (error as any).message || 'Ett fel uppstod vid generering.'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((error as any).error?.message) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            errorDetail = (error as any).error.message
        }
        // Check for common image-related errors
        if (errorDetail.includes('image') || errorDetail.includes('content_policy')) {
            errorDetail = 'Kunde inte behandla bilden. Försök med en annan bild eller mindre storlek.'
        }
        const errorMsg = `\n\nFel: ${errorDetail}`
        fullContent += errorMsg
        streamText(controller, errorMsg)
    }

    // Persist message
    if (conversationId && fullContent && userDb) {
        try {
            await userDb.messages.create({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullContent,
                user_id: userDb.userId
            })
        } catch (e) {
            console.error('Failed to save message', e)
        }
    }

    return fullContent
}
