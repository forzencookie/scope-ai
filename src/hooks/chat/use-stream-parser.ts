"use client"

/**
 * useStreamParser - Hook for parsing streaming chat responses
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Message, Conversation, type MessageDisplay } from '@/lib/chat-types'
import { normalizeAIDisplay } from '@/lib/ai-schema'


/** Extract the AI's prose comment, stripping markdown/emoji formatting from tool output */
function cleanAIComment(text: string): string {
    if (!text) return ''
    // Remove lines that are just emoji + bold check results (e.g. "✅ **Name**: desc")
    const lines = text.split('\n').filter(line => {
        const trimmed = line.trim()
        if (!trimmed) return false
        // Skip emoji-prefixed audit result lines
        if (/^[✅⚠️❌🔍📊]/.test(trimmed)) return false
        // Skip lines that are just bold markers
        if (/^\*\*.*\*\*:?$/.test(trimmed)) return false
        return true
    })
    // Strip remaining markdown bold
    return lines.map(l => l.replace(/\*\*/g, '')).join(' ').trim()
}

interface WalkthroughBlock {
    type: string
    props: Record<string, unknown>
    id?: string
}

interface WalkthroughBlockResponse {
    mode: "fixed" | "dynamic"
    title: string
    subtitle?: string
    blocks: WalkthroughBlock[]
}

interface StreamData {
    display?: MessageDisplay
    navigation?: { route: string }
    confirmationRequired?: Message['confirmationRequired']
    toolResults?: Message['toolResults']
    walkthrough?: {
        title: string
        summary: string
        date?: string
        aiComment?: string
        sections: Array<{
            heading: string
            status: "pass" | "warning" | "fail"
            description: string
            details?: string
        }>
    }
    walkthroughBlocks?: WalkthroughBlockResponse
}

interface UseStreamParserOptions {
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
}

export function useStreamParser({ setConversations }: UseStreamParserOptions) {
    const router = useRouter()

    const parseStreamResponse = useCallback(async (
        response: Response,
        conversationId: string,
        assistantMessageId: string
    ): Promise<{ fullContent: string; lastData: StreamData | null }> => {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
            return { fullContent: '', lastData: null }
        }

        let fullContent = ''
        let buffer = ''
        let lastData: StreamData | null = null

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const textChunk = decoder.decode(value, { stream: true })
            buffer += textChunk

            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
                if (!line.trim()) continue

                try {
                    if (line.startsWith('T:')) {
                        const contentDelta = JSON.parse(line.slice(2))
                        fullContent += contentDelta
                    } else if (line.startsWith('TH:')) {
                        // Extended thinking from Sonnet - consume but don't display to user
                        // This is internal reasoning, logged only in development
                        if (process.env.NODE_ENV === 'development') {
                            const thinking = JSON.parse(line.slice(3))
                            console.debug('[AI Thinking]', thinking)
                        }
                    } else if (line.startsWith('W:')) {
                        const walkthroughData = JSON.parse(line.slice(2))
                        // walkthroughBlocks is a specialized display type
                        const normalizedWalkthrough = normalizeAIDisplay('DiscoveredTools', walkthroughData) // Using this as proxy for now or add WalkthroughSchema
                        lastData = {
                            ...(lastData || {}),
                            walkthroughBlocks: normalizedWalkthrough,
                        }
                    } else if (line.startsWith('D:')) {
                        const data = JSON.parse(line.slice(2)) as Record<string, unknown>

                        // Transform and normalize display data
                        let displayData = data.display as Record<string, unknown> | null
                        if (data.type === 'inline_card') {
                            displayData = {
                                type: 'InlineCard',
                                data: {
                                    cardType: data.cardType,
                                    data: data.data
                                }
                            }
                        }

                        if (displayData && displayData.type) {
                            try {
                                displayData = normalizeAIDisplay(
                                    displayData.type as string,
                                    (displayData.data || displayData) as Record<string, unknown>
                                ) as Record<string, unknown> | null
                            } catch (e) {
                                console.error('[StreamParser] Normalization failed:', e)
                                // Keep going but without the broken display part
                                displayData = null
                            }
                        }

                        // Merge data chunks instead of overwriting
                        const navigation = data.navigation as StreamData['navigation'] | undefined
                        const toolResults = (data.toolResults || lastData?.toolResults) as StreamData['toolResults']
                        const confirmationRequired = (data.confirmationRequired || lastData?.confirmationRequired) as StreamData['confirmationRequired']

                        const streamPayload = data as StreamData
                        const merged: StreamData = {
                            ...(lastData ?? {}),
                            display: (displayData as MessageDisplay | null) ?? lastData?.display,
                            toolResults,
                            confirmationRequired,
                            navigation,
                            walkthrough: streamPayload.walkthrough ?? lastData?.walkthrough,
                            walkthroughBlocks: streamPayload.walkthroughBlocks ?? lastData?.walkthroughBlocks,
                        }
                        lastData = merged

                        // Handle immediate navigation
                        if (navigation) {
                            router.push(navigation.route)
                        }

                        const currentLastData = lastData
                        setConversations(prev => prev.map(c =>
                            c.id === conversationId
                                ? {
                                    ...c,
                                    messages: c.messages.map(msg =>
                                        msg.id === assistantMessageId
                                            ? {
                                                ...msg,
                                                display: currentLastData?.display || msg.display,
                                                confirmationRequired: currentLastData?.confirmationRequired || msg.confirmationRequired,
                                                toolResults: currentLastData?.toolResults || msg.toolResults
                                            }
                                            : msg
                                    )
                                }
                                : c
                        ))
                    }
                } catch (e) {
                    console.error('Error parsing stream line:', line, e)
                }
            }

            // Update content state
            setConversations(prev => prev.map(c =>
                c.id === conversationId
                    ? {
                        ...c,
                        messages: c.messages.map(msg =>
                            msg.id === assistantMessageId
                                ? { ...msg, content: fullContent }
                                : msg
                        )
                    }
                    : c
            ))
        }

        return { fullContent, lastData }
    }, [router, setConversations])

    const dispatchCompletionEvents = useCallback((
        fullContent: string,
        lastData: StreamData | null
    ) => {
        const isErrorResponse = fullContent.includes('Ett fel uppstod') ||
            fullContent.includes('fel uppstod vid generering') ||
            (fullContent.includes('error') && fullContent.length < 100)

        // Display-only components that should render inline in chat, not in the overlay dialog
        const inlineOnlyComponents = new Set<string>([
            'InlineCard',
            'InlineCards',
        ])

        // Check all data chunks for inline-only display components
        const displayObj = lastData?.display as { component?: string; type?: string } | undefined
        const displayComponent = displayObj?.component || displayObj?.type || ''
        const isInlineOnly = inlineOnlyComponents.has(displayComponent)

        const hasStructuredOutput = lastData && !isInlineOnly && (
            lastData.display ||
            lastData.navigation ||
            (lastData.toolResults && lastData.toolResults.length > 0) ||
            lastData.confirmationRequired
        )

        // Check for block-based walkthrough (new system)
        if (lastData?.walkthroughBlocks) {
            window.dispatchEvent(new CustomEvent('ai-dialog-walkthrough-blocks', {
                detail: lastData.walkthroughBlocks
            }))
            return
        }

        // Check for walkthrough content (e.g. balanskontroll) — legacy
        const firstToolResult = lastData?.toolResults?.[0] as { result?: { walkthrough?: StreamData['walkthrough']; id?: string } } | undefined
        const walkthroughData = lastData?.walkthrough || firstToolResult?.result?.walkthrough
        console.log('[walkthrough debug]', { walkthroughData, fullContentLength: fullContent.length, fullContentPreview: fullContent.slice(0, 200), lastDataKeys: lastData ? Object.keys(lastData) : null })
        if (walkthroughData) {
            window.dispatchEvent(new CustomEvent('ai-dialog-walkthrough', {
                detail: {
                    ...walkthroughData,
                    aiComment: cleanAIComment(fullContent) || walkthroughData.aiComment,
                }
            }))
            return
        }

        if (isErrorResponse) {
            window.dispatchEvent(new CustomEvent('ai-dialog-error', {
                detail: { contentType: 'error', title: 'Fel uppstod', content: fullContent }
            }))
        } else if (hasStructuredOutput) {
            window.dispatchEvent(new CustomEvent('ai-dialog-complete', {
                detail: {
                    contentType: (lastData?.display as { component?: string })?.component ||
                        (lastData?.confirmationRequired ? 'confirmation' : 'action'),
                    title: (lastData?.display as { title?: string })?.title ||
                        (lastData?.confirmationRequired ? 'Bekräfta åtgärd' : 'Åtgärd slutförd'),
                    content: fullContent,
                    data: lastData,
                    display: lastData?.display,
                    navigation: lastData?.navigation,
                    confirmationRequired: lastData?.confirmationRequired,
                    highlightId: firstToolResult?.result?.id
                }
            }))
        } else {
            window.dispatchEvent(new CustomEvent('ai-dialog-hide'))
        }
    }, [])

    return {
        parseStreamResponse,
        dispatchCompletionEvents,
    }
}
