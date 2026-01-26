/**
 * Anthropic Claude Provider for Chat API
 */

import { streamText } from '../streaming'
import { SYSTEM_PROMPT } from '../system-prompt'
import type { 
    AIMessage, 
    AIContentPart, 
    ProviderHandlerParams 
} from '../types'

// Model mapping
const ANTHROPIC_MODEL_MAP: Record<string, string> = {
    'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
    'claude-opus-4-20250514': 'claude-opus-4-20250514',
}

/**
 * Handle a chat request using Anthropic's Claude API
 */
export async function handleAnthropicProvider(params: ProviderHandlerParams): Promise<string> {
    const { 
        modelId, 
        messagesForAI, 
        controller, 
        conversationId, 
        userDb 
    } = params

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const actualModel = ANTHROPIC_MODEL_MAP[modelId] || 'claude-sonnet-4-20250514'

    // Convert messages to Anthropic format
    const anthropicMessages = messagesForAI.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' 
            ? m.content 
            : (m.content as AIContentPart[]).map((c) => {
                if (c.type === 'text') return { type: 'text' as const, text: c.text || '' }
                if (c.type === 'image_url' && c.image_url && typeof c.image_url === 'object' && 'url' in c.image_url) {
                    // Extract base64 data from data URL
                    const url = (c.image_url as { url: string }).url
                    const match = url.match(/^data:([^;]+);base64,(.+)$/)
                    if (match) {
                        return {
                            type: 'image' as const,
                            source: {
                                type: 'base64' as const,
                                media_type: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                                data: match[2]
                            }
                        }
                    }
                }
                return { type: 'text' as const, text: c.text || '' }
            })
    })) as { 
        role: 'user' | 'assistant'
        content: string | { 
            type: 'text' | 'image'
            text?: string
            source?: { type: string; media_type: string; data: string } 
        }[] 
    }[]

    let fullContent = ''

    try {
        const stream = await anthropic.messages.stream({
            model: actualModel,
            max_tokens: 1500,
            system: SYSTEM_PROMPT,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            messages: anthropicMessages as any,
        })

        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                const text = event.delta.text
                if (text) {
                    fullContent += text
                    streamText(controller, text)
                }
            }
        }
    } catch (error: unknown) {
        console.error('Anthropic API error:', error)
        const errorMsg = '\n\nEtt fel uppstod vid generering.'
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
