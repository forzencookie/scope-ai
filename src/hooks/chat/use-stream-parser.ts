"use client"

/**
 * useStreamParser - Hook for parsing streaming chat responses
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Message, Conversation } from '@/lib/chat-types'

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
    display?: unknown
    navigation?: { route: string }
    confirmationRequired?: unknown
    toolResults?: unknown[]
    walkthrough?: {
        title: string
        summary: string
        date?: string
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
                    } else if (line.startsWith('W:')) {
                        const walkthroughData = JSON.parse(line.slice(2)) as WalkthroughBlockResponse
                        lastData = {
                            ...(lastData || {}),
                            walkthroughBlocks: walkthroughData,
                        } as StreamData
                    } else if (line.startsWith('D:')) {
                        const data = JSON.parse(line.slice(2)) as StreamData
                        // Merge data chunks instead of overwriting
                        lastData = {
                            ...(lastData || {}),
                            ...data,
                            display: data.display || lastData?.display,
                            toolResults: data.toolResults || lastData?.toolResults,
                            confirmationRequired: data.confirmationRequired || lastData?.confirmationRequired,
                        } as StreamData

                        // Handle immediate navigation
                        if (data.navigation) {
                            router.push(data.navigation.route)
                        }

                        setConversations(prev => prev.map(c =>
                            c.id === conversationId
                                ? {
                                    ...c,
                                    messages: c.messages.map(msg =>
                                        msg.id === assistantMessageId
                                            ? {
                                                ...msg,
                                                display: data.display || msg.display,
                                                confirmationRequired: data.confirmationRequired || msg.confirmationRequired,
                                                toolResults: data.toolResults || msg.toolResults
                                            } as typeof msg
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
        ])

        // Check all data chunks for inline-only display components
        const displayComponent = (lastData?.display as any)?.component || (lastData?.display as any)?.type || ''
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
        const walkthroughData = lastData?.walkthrough || (lastData?.toolResults as any)?.[0]?.result?.walkthrough
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
                    highlightId: (lastData?.toolResults?.[0] as { result?: { id?: string } })?.result?.id
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
