"use client"

/**
 * useChat - Custom hook for chat state and logic
 * Handles conversations, messages, streaming, and persistence
 */

import { useState, useCallback, useEffect } from 'react'
import type { Message, Conversation } from '@/lib/chat-types'
import type { MentionItem } from '@/components/ai/mention-popover'
import { generateTitle, fileToBase64, fileToDataUrl } from '@/lib/chat-utils'
import { useModel } from '@/providers/model-provider'
import { useRouter } from 'next/navigation'

interface UseChatOptions {
    /** Initial conversation ID to load */
    initialConversationId?: string
}

interface SendMessageOptions {
    /** Text content to send */
    content: string
    /** Files to attach */
    files?: File[]
    /** Mentions to include */
    mentions?: MentionItem[]
    /** ID of message to retry */
    retryMessageId?: string
    /** ID of confirmation to respond to */
    confirmationId?: string
}

export function useChat(options: UseChatOptions = {}) {
    const router = useRouter()
    const { modelId } = useModel()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(
        options.initialConversationId || null
    )
    const [isLoading, setIsLoading] = useState(false)

    // Derived state
    const currentConversation = conversations.find(c => c.id === currentConversationId)
    const messages = currentConversation?.messages || []

    // Load conversations from Supabase on mount
    useEffect(() => {
        async function loadConversations() {
            try {
                const res = await fetch('/api/chat/history')
                if (res.ok) {
                    const data = await res.json()
                    const mapped = data.map((conv: any) => ({
                        id: conv.id,
                        title: conv.title || 'Ny konversation',
                        messages: (conv.messages || []).map((m: any) => ({
                            id: m.id || crypto.randomUUID(),
                            role: m.role as 'user' | 'assistant',
                            content: m.content || '',
                            mentions: m.metadata?.mentions || [],
                            attachments: m.metadata?.attachments || []
                        })),
                        createdAt: new Date(conv.created_at).getTime(),
                        updatedAt: new Date(conv.updated_at || conv.created_at).getTime()
                    }))
                    setConversations(mapped)
                }
            } catch (error) {
                console.error('Failed to load conversations:', error)
            }
        }
        loadConversations()
    }, [])

    // Notify sidebar when conversations change
    useEffect(() => {
        if (conversations.length > 0) {
            window.dispatchEvent(new Event('ai-conversations-updated'))
        }
    }, [conversations])

    // Start new conversation
    const startNewConversation = useCallback(() => {
        setCurrentConversationId(null)
    }, [])

    // Load a conversation
    const loadConversation = useCallback((conversationId: string) => {
        setCurrentConversationId(conversationId)
    }, [])

    // Delete a conversation
    const deleteConversation = useCallback((conversationId: string) => {
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        if (currentConversationId === conversationId) {
            setCurrentConversationId(null)
        }
    }, [currentConversationId])

    // Delete a message
    const deleteMessage = useCallback((messageId: string) => {
        setConversations(prev => prev.map(c =>
            c.id === currentConversationId
                ? { ...c, messages: c.messages.filter(m => m.id !== messageId) }
                : c
        ))
    }, [currentConversationId])

    // Send message
    const sendMessage = useCallback(async ({
        content,
        files = [],
        mentions = [],
        retryMessageId,
        confirmationId
    }: SendMessageOptions) => {
        const messageContent = content.trim()
        const hasFiles = files.length > 0

        // Validate we have something to send
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
            fetch('/api/chat/title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.title) {
                        setConversations(prev => prev.map(c =>
                            c.id === conversationId ? { ...c, title: data.title } : c
                        ))
                    }
                })
                .catch(err => console.error('Failed to generate title:', err))
        } else {
            const currentTitle = conversations.find(c => c.id === conversationId)?.title

            setConversations(prev => prev.map(c =>
                c.id === conversationId
                    ? { ...c, messages: updatedMessages, updatedAt: Date.now() }
                    : c
            ))

            // Regenerate generic title if needed
            if (currentTitle === 'Ny konversation' || currentTitle === 'New conversation') {
                fetch('/api/chat/title', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: updatedMessages })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.title && data.title !== 'Ny konversation') {
                            setConversations(prev => prev.map(c =>
                                c.id === conversationId ? { ...c, title: data.title } : c
                            ))
                        }
                    })
                    .catch(err => console.error('Failed to regenerate title:', err))
            }
        }

        setIsLoading(true)
        window.dispatchEvent(new CustomEvent('ai-dialog-start', { detail: { contentType: 'default' } }))

        try {
            // Convert files to base64 for display and API
            const messageAttachments = await Promise.all(
                files.map(async (file) => ({
                    name: file.name,
                    type: file.type,
                    dataUrl: await fileToDataUrl(file)
                }))
            )

            // Add user message if not retry/confirmation
            if (!retryMessageId) {
                const userMessage: Message = {
                    id: crypto.randomUUID(),
                    role: 'user',
                    content: messageContent,
                    attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
                    mentions: mentions.length > 0 ? mentions : undefined
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

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages
                        .filter(m => m.role === 'user' || (m.role === 'assistant' && (m.content || m.display || m.confirmationRequired)))
                        .map(m => ({ role: m.role, content: m.content })),
                    confirmationId,
                    attachments: attachments.length > 0 ? attachments : undefined,
                    mentions: mentions.length > 0 ? mentions : undefined,
                    model: modelId
                })
            })

            if (!response.ok) {
                throw new Error('Failed to get response')
            }

            const contentType = response.headers.get('content-type')

            // Handle JSON response (tool results)
            if (contentType?.includes('application/json')) {
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

                // Dispatch completion event
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
                return
            }

            // Handle streaming response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (reader) {
                let fullContent = ''
                let buffer = ''
                let lastData: any = null // Capture data for completion event

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
                                const data = JSON.parse(line.slice(2))
                                lastData = data // Store for completion

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

                // Check if the response contains error indicators
                const isErrorResponse = fullContent.includes('Ett fel uppstod') ||
                    fullContent.includes('fel uppstod vid generering') ||
                    fullContent.includes('error') && fullContent.length < 100

                // Check if there's structured output that warrants showing the dialog
                const hasStructuredOutput = lastData && (
                    lastData.display ||
                    lastData.navigation ||
                    lastData.toolResults?.length > 0 ||
                    lastData.confirmationRequired
                )

                // Dispatch appropriate event
                if (isErrorResponse) {
                    window.dispatchEvent(new CustomEvent('ai-dialog-error', {
                        detail: {
                            contentType: 'error',
                            title: 'Fel uppstod',
                            content: fullContent,
                        }
                    }))
                } else if (hasStructuredOutput) {
                    // Only show dialog for tool calls / structured output
                    window.dispatchEvent(new CustomEvent('ai-dialog-complete', {
                        detail: {
                            contentType: lastData?.display?.component || (lastData?.confirmationRequired ? 'confirmation' : 'action'),
                            title: lastData?.display?.title || (lastData?.confirmationRequired ? 'Bekräfta åtgärd' : 'Åtgärd slutförd'),
                            content: fullContent,
                            data: lastData,
                            display: lastData?.display,
                            navigation: lastData?.navigation,
                            confirmationRequired: lastData?.confirmationRequired,
                            highlightId: lastData?.toolResults?.[0]?.result?.id
                        }
                    }))
                } else {
                    // Plain text response - just hide the dialog, don't show complete state
                    window.dispatchEvent(new CustomEvent('ai-dialog-hide'))
                }
            }
        } catch (error) {
            console.error('SendMessage error:', error)
            const errorMessage = 'Ett fel uppstod. Försök igen.'

            // Dispatch error event
            window.dispatchEvent(new CustomEvent('ai-dialog-error', {
                detail: {
                    contentType: 'error',
                    title: 'Fel uppstod',
                    content: errorMessage,
                }
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
        } finally {
            setIsLoading(false)
        }
    }, [messages, currentConversationId, isLoading, conversations, modelId])

    // Regenerate last response
    const regenerateResponse = useCallback(() => {
        const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')
        if (lastAssistantMessage) {
            sendMessage({ content: '', retryMessageId: lastAssistantMessage.id })
        }
    }, [messages, sendMessage])

    return {
        // State
        conversations,
        currentConversationId,
        currentConversation,
        messages,
        isLoading,

        // Actions
        sendMessage,
        regenerateResponse,
        startNewConversation,
        loadConversation,
        deleteConversation,
        deleteMessage,
        setCurrentConversationId,
    }
}
