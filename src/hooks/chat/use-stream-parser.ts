"use client"

/**
 * useStreamParser - Hook for parsing streaming chat responses
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Message, Conversation } from '@/lib/chat-types'

interface StreamData {
    display?: unknown
    navigation?: { route: string }
    confirmationRequired?: unknown
    toolResults?: unknown[]
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
                    } else if (line.startsWith('D:')) {
                        const data = JSON.parse(line.slice(2)) as StreamData
                        lastData = data

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

        const hasStructuredOutput = lastData && (
            lastData.display ||
            lastData.navigation ||
            (lastData.toolResults && lastData.toolResults.length > 0) ||
            lastData.confirmationRequired
        )

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
