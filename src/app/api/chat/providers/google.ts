/**
 * Google Gemini Provider for Chat API
 */

import { streamText, streamData } from '../streaming'
import { SYSTEM_PROMPT } from '../system-prompt'
import type { 
    AIMessage, 
    AIContentPart, 
    AIToolDefinition, 
    ProviderHandlerParams,
    ToolExecutionResult 
} from '../types'

// Model mapping
const GOOGLE_MODEL_MAP: Record<string, string> = {
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-2.0-pro-low': 'gemini-2.0-pro',
    'gemini-2.0-pro-high': 'gemini-2.0-pro',
}

/**
 * Helper to format tool result for Google's expected format
 */
function resultToGoogleResponse(result: ToolExecutionResult): { result: unknown } {
    return { result: result.data || result.message || result.success }
}

/**
 * Handle a chat request using Google's Gemini API
 */
export async function handleGoogleProvider(params: ProviderHandlerParams): Promise<string> {
    const { 
        modelId, 
        messagesForAI, 
        controller, 
        conversationId, 
        tools, 
        userDb, 
        userId 
    } = params

    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

    const actualModel = GOOGLE_MODEL_MAP[modelId] || 'gemini-2.0-flash'
    const model = genAI.getGenerativeModel({ model: actualModel })

    // Convert messages to Google format
    const history = messagesForAI.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ 
            text: typeof m.content === 'string' 
                ? m.content 
                : (m.content as AIContentPart[]).map((c) => c.text || '').join('\n') 
        }]
    }))

    const lastMessage = messagesForAI[messagesForAI.length - 1]
    const lastContent = typeof lastMessage.content === 'string'
        ? lastMessage.content
        : (lastMessage.content as AIContentPart[]).map((c) => c.text || '').join('\n')

    const { toolsToGoogleFunctions } = await import('@/lib/ai-tools')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const googleTools = toolsToGoogleFunctions(tools as any[])

    const chat = model.startChat({
        history,
        systemInstruction: SYSTEM_PROMPT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: googleTools.length > 0 ? [{ functionDeclarations: googleTools }] as any : undefined,
    })

    let fullContent = ''
    let currentMessage: string | unknown[] = lastContent

    // Loop to handle tool calls (max 5 turns)
    for (let i = 0; i < 5; i++) {
        try {
            const result = await chat.sendMessageStream(currentMessage as string)
            let gotFunctionCall = false
            const functionCalls: unknown[] = []

            for await (const chunk of result.stream) {
                // Check for text
                const text = chunk.text()
                if (text) {
                    fullContent += text
                    streamText(controller, text)
                }

                // Check for function calls
                const calls = typeof chunk.functionCalls === 'function' ? chunk.functionCalls() : undefined
                if (calls && calls.length > 0) {
                    gotFunctionCall = true
                    functionCalls.push(...calls)
                }
            }

            if (!gotFunctionCall) {
                break
            }

            // Execute tools
            const functionResponses: { functionResponse: { name: string; response: Record<string, unknown> } }[] = []
            
            for (const call of functionCalls as Array<{ name: string; args: unknown }>) {
                const tool = tools.find((t) => t.name === call.name) as AIToolDefinition | undefined
                
                if (tool && tool.execute) {
                    try {
                        const toolResult = await tool.execute(call.args, {
                            userId: userDb?.userId || userId,
                            companyId: userDb?.companyId || '',
                            userDb: userDb!
                        })

                        // Send data to frontend
                        if (toolResult.display || toolResult.navigation || toolResult.confirmationRequired) {
                            streamData(controller, {
                                display: toolResult.display,
                                navigation: toolResult.navigation,
                                confirmationRequired: toolResult.confirmationRequired,
                                toolResults: [{ toolName: call.name, result: toolResult }]
                            })
                        }

                        functionResponses.push({
                            functionResponse: {
                                name: call.name,
                                response: resultToGoogleResponse(toolResult)
                            }
                        })
                    } catch (err: unknown) {
                        functionResponses.push({
                            functionResponse: {
                                name: call.name,
                                response: { name: call.name, content: { error: (err as Error).message } }
                            }
                        })
                    }
                } else {
                    functionResponses.push({
                        functionResponse: {
                            name: call.name,
                            response: { error: 'Tool not found' }
                        }
                    })
                }
            }

            // Send responses back to model as next message
            currentMessage = functionResponses

        } catch (error: unknown) {
            console.error('Google AI error:', error)
            const errorMsg = '\n\nEtt fel uppstod vid generering.'
            fullContent += errorMsg
            streamText(controller, errorMsg)
            break
        }
    }

    // Persist message
    if (conversationId && fullContent && userDb) {
        try {
            await userDb.messages.create({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullContent,
                user_id: userId
            })
        } catch (e) {
            console.error('Failed to save message', e)
        }
    }

    return fullContent
}
