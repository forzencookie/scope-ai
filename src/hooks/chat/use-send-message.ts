"use client"

/**
 * useSendMessage - Hook for sending chat messages
 */

import { useState, useCallback } from 'react'
import type { Message, Conversation } from '@/lib/chat-types'
import type { MentionItem } from '@/components/ai/mention-popover'
import { generateTitle, fileToBase64, fileToDataUrl } from '@/lib/chat-utils'
import { useModel } from '@/providers/model-provider'
import { useStreamParser } from './use-stream-parser'

interface SendMessageOptions {
    content: string
    files?: File[]
    mentions?: MentionItem[]
    retryMessageId?: string
    confirmationId?: string
    /** Action trigger display - shows chip instead of raw prompt */
    actionTrigger?: {
        icon: 'document' | 'meeting' | 'receipt' | 'invoice' | 'decision' | 'shareholders'
        title: string
        subtitle?: string
        meta?: string
    }
}

interface UseSendMessageOptions {
    conversations: Conversation[]
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
    currentConversationId: string | null
    setCurrentConversationId: (id: string | null) => void
}

export function useSendMessage({
    conversations,
    setConversations,
    currentConversationId,
    setCurrentConversationId,
}: UseSendMessageOptions) {
    const { modelId } = useModel()
    const [isLoading, setIsLoading] = useState(false)
    const { parseStreamResponse, dispatchCompletionEvents } = useStreamParser({ setConversations })

    const currentConversation = conversations.find(c => c.id === currentConversationId)
    const messages = currentConversation?.messages || []

    const sendMessage = useCallback(async ({
        content,
        files = [],
        mentions = [],
        retryMessageId,
        confirmationId,
        actionTrigger
    }: SendMessageOptions) => {
        const messageContent = content.trim()
        const hasFiles = files.length > 0

        if (!messageContent && !hasFiles && !retryMessageId && !confirmationId) return
        if (isLoading) return

        let conversationId = currentConversationId
        let updatedMessages = [...messages]

        // If retrying, find and remove the message + subsequent
        if (retryMessageId) {
            const retryIndex = updatedMessages.findIndex(m => m.id === retryMessageId)
            if (retryIndex > 0) {
                updatedMessages = updatedMessages.slice(0, retryIndex)
            }
        }

        // Create assistant message placeholder
        const assistantMessageId = crypto.randomUUID()
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: ''
        }

        // Create or update conversation
        if (!conversationId) {
            conversationId = crypto.randomUUID()
            const newConversation: Conversation = {
                id: conversationId,
                title: generateTitle(updatedMessages),
                messages: updatedMessages,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
            setConversations(prev => [newConversation, ...prev])
            setCurrentConversationId(conversationId)

            // Generate AI title asynchronously
            generateAITitle(conversationId, updatedMessages, setConversations)
        } else {
            const currentTitle = conversations.find(c => c.id === conversationId)?.title

            setConversations(prev => prev.map(c =>
                c.id === conversationId
                    ? { ...c, messages: updatedMessages, updatedAt: Date.now() }
                    : c
            ))

            // Regenerate generic title if needed
            if (currentTitle === 'Ny konversation' || currentTitle === 'New conversation') {
                generateAITitle(conversationId, updatedMessages, setConversations)
            }
        }

        setIsLoading(true)
        window.dispatchEvent(new CustomEvent('ai-dialog-start', { detail: { contentType: 'default' } }))

        try {
            // Convert files for display
            const messageAttachments = await Promise.all(
                files.map(async (file) => ({
                    name: file.name,
                    type: file.type,
                    dataUrl: await fileToDataUrl(file)
                }))
            )

            // Auto-inject context for images
            let enhancedContent = messageContent
            const hasImages = files.some(f => f.type.startsWith('image/'))

            if (hasImages && !messageContent.trim()) {
                enhancedContent = '[Användaren har skickat en bild. Beskriv vad du ser och fråga vad de vill göra.]'
            }

            // Add user message if not retry/confirmation
            if (!retryMessageId) {
                const userMessage: Message = {
                    id: crypto.randomUUID(),
                    role: 'user',
                    content: messageContent,
                    attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
                    mentions: mentions.length > 0 ? mentions : undefined,
                    actionTrigger: actionTrigger
                }
                updatedMessages = [...updatedMessages, userMessage]
            }

            // Add assistant placeholder
            updatedMessages = [...updatedMessages, assistantMessage]

            setConversations(prev => prev.map(c =>
                c.id === conversationId
                    ? { ...c, messages: updatedMessages, updatedAt: Date.now() }
                    : c
            ))

            // Convert files for API
            const attachments = await Promise.all(files.map(fileToBase64))

            // Build messages for API
            const messagesForAPI = updatedMessages
                .filter(m => {
                    if (m.role === 'user' && (m.content || m.attachments?.length)) return true
                    if (m.role === 'assistant' && m.content && typeof m.content === 'string' && m.content.trim()) return true
                    return false
                })
                .map((m, index, arr) => {
                    if (m.role === 'user' && index === arr.length - 1) {
                        return { role: m.role, content: enhancedContent || m.content || '' }
                    }
                    return { role: m.role, content: m.content || '' }
                })

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messagesForAPI,
                    confirmationId,
                    attachments: attachments.length > 0 ? attachments : undefined,
                    mentions: mentions.length > 0 ? mentions : undefined,
                    model: modelId
                })
            })

            if (!response.ok) {
                await handleErrorResponse(response, conversationId, assistantMessageId, setConversations)
                return
            }

            const contentType = response.headers.get('content-type')

            if (contentType?.includes('application/json')) {
                await handleJsonResponse(response, conversationId, assistantMessageId, setConversations)
                return
            }

            // Handle streaming response
            const { fullContent, lastData } = await parseStreamResponse(
                response,
                conversationId,
                assistantMessageId
            )

            dispatchCompletionEvents(fullContent, lastData)

        } catch (error) {
            console.error('SendMessage error:', error)
            handleSendError(conversationId!, assistantMessageId, setConversations)
        } finally {
            setIsLoading(false)
        }
    }, [messages, currentConversationId, isLoading, conversations, modelId, setConversations, setCurrentConversationId, parseStreamResponse, dispatchCompletionEvents])

    const regenerateResponse = useCallback(() => {
        const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')
        if (lastAssistantMessage) {
            sendMessage({ content: '', retryMessageId: lastAssistantMessage.id })
        }
    }, [messages, sendMessage])

    return {
        isLoading,
        sendMessage,
        regenerateResponse,
    }
}

// =============================================================================
// Helper Functions
// =============================================================================

function generateAITitle(
    conversationId: string,
    messages: Message[],
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
) {
    fetch('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
    })
        .then(res => res.json())
        .then(data => {
            if (data.title && data.title !== 'Ny konversation') {
                setConversations(prev => prev.map(c =>
                    c.id === conversationId ? { ...c, title: data.title } : c
                ))
            }
        })
        .catch(err => console.error('Failed to generate title:', err))
}

async function handleErrorResponse(
    response: Response,
    conversationId: string,
    assistantMessageId: string,
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
) {
    if (response.status === 402) {
        setConversations(prev => prev.map(c =>
            c.id === conversationId
                ? {
                    ...c,
                    messages: c.messages.map(msg =>
                        msg.id === assistantMessageId
                            ? {
                                ...msg,
                                content: '⚠️ Du har förbrukat din AI-budget för denna månad. Köp fler credits för att fortsätta använda AI.',
                                display: {
                                    component: 'BuyCreditsPrompt',
                                    props: {
                                        packages: [
                                            { tokens: 2000000, price: 99, label: '2M tokens' },
                                            { tokens: 5000000, price: 199, label: '5M tokens', popular: true, savings: 'Spara 20%' },
                                            { tokens: 15000000, price: 499, label: '15M tokens', savings: 'Spara 33%' },
                                        ]
                                    },
                                    title: 'Köp AI-credits'
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                } as any
                            }
                            : msg
                    )
                }
                : c
        ))
        return
    }
    throw new Error('Failed to get response')
}

async function handleJsonResponse(
    response: Response,
    conversationId: string,
    assistantMessageId: string,
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
) {
    const data = await response.json()

    setConversations(prev => prev.map(c =>
        c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map(msg =>
                    msg.id === assistantMessageId
                        ? {
                            ...msg,
                            content: data.content,
                            display: data.display,
                            confirmationRequired: data.confirmationRequired,
                            toolResults: data.toolResults
                        }
                        : msg
                )
            }
            : c
    ))

    window.dispatchEvent(new CustomEvent('ai-dialog-complete', {
        detail: {
            contentType: data.display?.component || 'json',
            title: data.display?.title || 'Klar',
            content: data.content,
            data: data,
            display: data.display,
            navigation: data.navigation,
            highlightId: data.toolResults?.[0]?.result?.id
        }
    }))
}

function handleSendError(
    conversationId: string,
    assistantMessageId: string,
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
) {
    window.dispatchEvent(new CustomEvent('ai-dialog-error', {
        detail: { contentType: 'error', title: 'Fel uppstod', content: 'Ett fel uppstod. Försök igen.' }
    }))

    setConversations(prev => prev.map(c =>
        c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: 'Ett fel uppstod. Försök igen.', error: true }
                        : msg
                )
            }
            : c
    ))
}
