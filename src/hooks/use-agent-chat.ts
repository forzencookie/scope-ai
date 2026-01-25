"use client"

/**
 * useAgentChat - Custom hook for multi-agent chat
 * 
 * Drop-in replacement for useChat that uses the agent system.
 * Handles routing, streaming, and specialized agent responses.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Message, Conversation } from '@/lib/chat-types'
import type { MentionItem } from '@/components/ai/mention-popover'
import { generateTitle, fileToBase64, fileToDataUrl } from '@/lib/chat-utils'
import { useModel } from '@/providers/model-provider'
import type { AgentDomain } from '@/lib/agents/types'

// =============================================================================
// Types
// =============================================================================

interface UseAgentChatOptions {
    /** Initial conversation ID to load */
    initialConversationId?: string
    /** Force use of agent system even if feature flag is off */
    forceAgentMode?: boolean
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

interface AgentInfo {
    id: AgentDomain
    name: string
    routing?: string
}

interface AgentChatState {
    conversations: Conversation[]
    currentConversationId: string | null
    isLoading: boolean
    activeAgent: AgentInfo | null
    agentModeEnabled: boolean
    error: string | null
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAgentChat(options: UseAgentChatOptions = {}) {
    const { modelId } = useModel()
    
    const [state, setState] = useState<AgentChatState>({
        conversations: [],
        currentConversationId: options.initialConversationId || null,
        isLoading: false,
        activeAgent: null,
        agentModeEnabled: true,
        error: null,
    })

    const abortControllerRef = useRef<AbortController | null>(null)

    // Derived state
    const currentConversation = state.conversations.find(c => c.id === state.currentConversationId)
    const messages = useMemo(() => currentConversation?.messages || [], [currentConversation])

    // ==========================================================================
    // Load conversations on mount
    // ==========================================================================
    useEffect(() => {
        async function loadConversations() {
            try {
                const res = await fetch('/api/chat/history')
                if (res.ok) {
                    const data = await res.json()
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mapped = data.map((conv: any) => ({
                        id: conv.id,
                        title: conv.title || 'Ny konversation',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        messages: (conv.messages || []).map((m: any) => ({
                            id: m.id || crypto.randomUUID(),
                            role: m.role as 'user' | 'assistant',
                            content: m.content || '',
                            mentions: m.metadata?.mentions || [],
                            attachments: m.metadata?.attachments || [],
                            agent: m.metadata?.agent,
                        })),
                        createdAt: new Date(conv.created_at).getTime(),
                        updatedAt: new Date(conv.updated_at || conv.created_at).getTime()
                    }))
                    setState(prev => ({ ...prev, conversations: mapped }))
                }
            } catch (error) {
                console.error('[AgentChat] Failed to load conversations:', error)
            }
        }
        loadConversations()
    }, [])

    // Check agent system status on mount
    useEffect(() => {
        async function checkAgentStatus() {
            try {
                const res = await fetch('/api/chat/agents')
                if (res.ok) {
                    const data = await res.json()
                    setState(prev => ({
                        ...prev,
                        agentModeEnabled: data.enabled || options.forceAgentMode || false,
                    }))
                }
            } catch {
                // Agent system not available, continue without it
                setState(prev => ({ ...prev, agentModeEnabled: false }))
            }
        }
        checkAgentStatus()
    }, [options.forceAgentMode])

    // Notify sidebar when conversations change
    useEffect(() => {
        if (state.conversations.length > 0) {
            window.dispatchEvent(new Event('ai-conversations-updated'))
        }
    }, [state.conversations])

    // ==========================================================================
    // Conversation Management
    // ==========================================================================

    const startNewConversation = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentConversationId: null,
            activeAgent: null,
            error: null,
        }))
        window.dispatchEvent(new CustomEvent('ai-dialog-hide'))
    }, [])

    const loadConversation = useCallback((conversationId: string) => {
        setState(prev => ({
            ...prev,
            currentConversationId: conversationId,
            activeAgent: null,
            error: null,
        }))
        window.dispatchEvent(new CustomEvent('ai-dialog-hide'))
    }, [])

    const deleteConversation = useCallback((conversationId: string) => {
        setState(prev => ({
            ...prev,
            conversations: prev.conversations.filter(c => c.id !== conversationId),
            currentConversationId: prev.currentConversationId === conversationId 
                ? null 
                : prev.currentConversationId,
        }))
    }, [])

    const deleteMessage = useCallback((messageId: string) => {
        setState(prev => ({
            ...prev,
            conversations: prev.conversations.map(c =>
                c.id === prev.currentConversationId
                    ? { ...c, messages: c.messages.filter(m => m.id !== messageId) }
                    : c
            ),
        }))
    }, [])

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        setState(prev => ({
            ...prev,
            isLoading: false,
            activeAgent: null,
        }))
    }, [])

    // ==========================================================================
    // Send Message
    // ==========================================================================

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
        if (state.isLoading) return

        let conversationId = state.currentConversationId
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
            setState(prev => ({
                ...prev,
                conversations: [newConversation, ...prev.conversations],
                currentConversationId: conversationId!,
            }))

            // Generate AI title asynchronously
            fetch('/api/chat/title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.title) {
                        setState(prev => ({
                            ...prev,
                            conversations: prev.conversations.map(c =>
                                c.id === conversationId ? { ...c, title: data.title } : c
                            ),
                        }))
                    }
                })
                .catch(err => console.error('[AgentChat] Failed to generate title:', err))
        }

        setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
        }))

        // Show thinking dialog
        window.dispatchEvent(new CustomEvent('ai-dialog-start', { 
            detail: { contentType: 'default', agentMode: true } 
        }))

        // Create abort controller for this request
        abortControllerRef.current = new AbortController()

        try {
            // Convert files to base64 for display
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
                    mentions: mentions.length > 0 ? mentions : undefined
                }
                updatedMessages = [...updatedMessages, userMessage]
            }

            // Add assistant placeholder
            updatedMessages = [...updatedMessages, assistantMessage]

            setState(prev => ({
                ...prev,
                conversations: prev.conversations.map(c =>
                    c.id === conversationId
                        ? { ...c, messages: updatedMessages, updatedAt: Date.now() }
                        : c
                ),
            }))

            // Convert files for API
            const attachments = await Promise.all(files.map(fileToBase64))

            // Build messages for API
            const messagesForAPI = updatedMessages
                .filter(m => {
                    if (m.role === 'user' && (m.content || m.attachments?.length)) return true
                    if (m.role === 'assistant' && m.content?.trim()) return true
                    return false
                })
                .map((m, index, arr) => {
                    if (m.role === 'user' && index === arr.length - 1) {
                        return { role: m.role, content: enhancedContent || m.content || '' }
                    }
                    return { role: m.role, content: m.content || '' }
                })

            // === USE AGENT ENDPOINT ===
            const endpoint = state.agentModeEnabled ? '/api/chat/agents' : '/api/chat'

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messagesForAPI,
                    confirmationId,
                    conversationId,
                    attachments: attachments.length > 0 ? attachments : undefined,
                    mentions: mentions.length > 0 ? mentions : undefined,
                    model: modelId,
                    useAgents: true,
                }),
                signal: abortControllerRef.current.signal,
            })

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`)
            }

            // Handle streaming response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (reader) {
                let fullContent = ''
                let buffer = ''
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let lastData: any = null

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
                            // T: Text chunk
                            if (line.startsWith('T:')) {
                                const contentDelta = JSON.parse(line.slice(2))
                                fullContent += contentDelta

                                setState(prev => ({
                                    ...prev,
                                    conversations: prev.conversations.map(c =>
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
                                    ),
                                }))
                            }

                            // D: Data (tool results, display, etc.)
                            if (line.startsWith('D:')) {
                                const data = JSON.parse(line.slice(2))
                                lastData = { ...lastData, ...data }

                                // Update message with structured data
                                setState(prev => ({
                                    ...prev,
                                    conversations: prev.conversations.map(c =>
                                        c.id === conversationId
                                            ? {
                                                ...c,
                                                messages: c.messages.map(msg =>
                                                    msg.id === assistantMessageId
                                                        ? {
                                                            ...msg,
                                                            display: data.display || msg.display,
                                                            confirmationRequired: data.confirmationRequired,
                                                            toolResults: data.toolResults || msg.toolResults,
                                                        }
                                                        : msg
                                                )
                                            }
                                            : c
                                    ),
                                }))

                                // Handle navigation
                                if (data.navigation) {
                                    window.dispatchEvent(new CustomEvent('ai-navigate', {
                                        detail: data.navigation
                                    }))
                                }

                                // Handle display instructions
                                if (data.display) {
                                    window.dispatchEvent(new CustomEvent('ai-dialog-update', {
                                        detail: {
                                            contentType: data.display.component,
                                            title: data.display.title,
                                            data: data.display,
                                        }
                                    }))
                                }
                            }

                            // A: Agent info
                            if (line.startsWith('A:')) {
                                const agentInfo = JSON.parse(line.slice(2))
                                setState(prev => ({
                                    ...prev,
                                    activeAgent: {
                                        id: agentInfo.activeAgent,
                                        name: agentInfo.agentName,
                                        routing: agentInfo.routing,
                                    },
                                }))

                                // Notify UI of agent change
                                window.dispatchEvent(new CustomEvent('ai-agent-active', {
                                    detail: agentInfo
                                }))
                            }

                            // E: Error
                            if (line.startsWith('E:')) {
                                const errorData = JSON.parse(line.slice(2))
                                setState(prev => ({
                                    ...prev,
                                    error: errorData.error,
                                }))
                            }

                        } catch {
                            console.warn('[AgentChat] Failed to parse stream line:', line)
                        }
                    }
                }

                // Dispatch completion event
                window.dispatchEvent(new CustomEvent('ai-dialog-complete', {
                    detail: {
                        contentType: lastData?.display?.component || 'default',
                        title: lastData?.display?.title || 'Klar',
                        content: fullContent,
                        data: lastData,
                        agentMode: true,
                    }
                }))
            }

        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                console.log('[AgentChat] Request aborted')
            } else {
                console.error('[AgentChat] Error:', error)
                setState(prev => ({
                    ...prev,
                    error: (error as Error).message,
                }))
            }
        } finally {
            setState(prev => ({
                ...prev,
                isLoading: false,
                activeAgent: null,
            }))
            abortControllerRef.current = null
        }
    }, [state.currentConversationId, state.isLoading, state.agentModeEnabled, messages, modelId])

    // ==========================================================================
    // Return
    // ==========================================================================

    return {
        // State
        conversations: state.conversations,
        currentConversation,
        currentConversationId: state.currentConversationId,
        messages,
        isLoading: state.isLoading,
        activeAgent: state.activeAgent,
        agentModeEnabled: state.agentModeEnabled,
        error: state.error,

        // Actions
        sendMessage,
        startNewConversation,
        loadConversation,
        deleteConversation,
        deleteMessage,
        stopGeneration,

        // Agent-specific
        getActiveAgentName: () => state.activeAgent?.name || null,
        isAgentProcessing: () => state.isLoading && state.activeAgent !== null,
    }
}

// =============================================================================
// Export type for consumers
// =============================================================================

export type UseAgentChatReturn = ReturnType<typeof useAgentChat>
