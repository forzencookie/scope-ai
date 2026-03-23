"use client"

/**
 * useConversations - Hook for managing conversation list
 * 
 * PERFORMANCE: Uses React Query for automatic caching and deduplication.
 * The conversation history is fetched once and cached.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Conversation, Message } from '@/lib/chat-types'

// Query key for conversations - shared across all useConversations calls
export const conversationsQueryKey = ["chat", "conversations"] as const

interface RawConversation {
    id: string
    title?: string
    messages?: RawMessage[]
    created_at: string
    updated_at?: string
}

interface RawMessage {
    id?: string
    role: string
    content?: string
    metadata?: { mentions?: unknown[]; attachments?: unknown[] }
    tool_calls?: string | unknown[]
    tool_results?: string | unknown[]
}

function mapConversation(conv: RawConversation): Conversation {
    return {
        id: conv.id,
        title: conv.title || 'Ny konversation',
        messages: (conv.messages || []).map((m: RawMessage) => ({
            id: m.id || crypto.randomUUID(),
            role: m.role as 'user' | 'assistant',
            content: m.content || '',
            mentions: (m.metadata?.mentions ?? []) as Message['mentions'],
            attachments: (m.metadata?.attachments ?? []) as Message['attachments'],
            toolCalls: m.tool_calls ? (typeof m.tool_calls === 'string' ? JSON.parse(m.tool_calls) : m.tool_calls) as Message['toolCalls'] : undefined,
            toolResults: m.tool_results ? (typeof m.tool_results === 'string' ? JSON.parse(m.tool_results) : m.tool_results) as Message['toolResults'] : undefined,
        })),
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at || conv.created_at).getTime()
    }
}

export function useConversations() {
    const queryClient = useQueryClient()
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    // Ref mirrors the state so startNewConversation can read it without a dependency
    const conversationIdRef = useRef(currentConversationId)
    conversationIdRef.current = currentConversationId

    // Use React Query for caching conversation history
    const { data: conversations = [], isLoading } = useQuery({
        queryKey: conversationsQueryKey,
        queryFn: async (): Promise<Conversation[]> => {
            const res = await fetch('/api/chat/history')
            if (res.ok) {
                const data = await res.json()
                return data.map(mapConversation)
            }
            return []
        },
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
        gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    })

    // Derived state
    const currentConversation = useMemo(() => 
        conversations.find(c => c.id === currentConversationId),
        [conversations, currentConversationId]
    )

    // Notify sidebar when conversations change
    useEffect(() => {
        if (conversations.length > 0) {
            window.dispatchEvent(new Event('ai-conversations-updated'))
        }
    }, [conversations])

    // Update conversations in cache (for optimistic updates)
    const setConversations = useCallback((updater: Conversation[] | ((prev: Conversation[]) => Conversation[])) => {
        queryClient.setQueryData<Conversation[]>(conversationsQueryKey, (old = []) => {
            return typeof updater === 'function' ? updater(old) : updater
        })
    }, [queryClient])

    // Refresh conversations from server
    const refreshConversations = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: conversationsQueryKey })
    }, [queryClient])

    // Extract memories from a completed conversation (fire-and-forget)
    const extractMemories = useCallback((conversationId: string) => {
        // Get companyId from localStorage (same source as CompanyProvider)
        try {
            const stored = localStorage.getItem('scope_company_data')
            const companyId = stored ? JSON.parse(stored)?.id : null
            if (!companyId) return

            fetch('/api/chat/extract-memories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, companyId }),
            }).catch(() => {}) // Silent — memory extraction is best-effort
        } catch {}
    }, [])

    // Start new conversation — reads the current ID from a ref to avoid
    // recreating this callback when currentConversationId changes.
    const startNewConversation = useCallback(() => {
        const prevId = conversationIdRef.current
        // Extract memories from the conversation we're leaving (skip incognito)
        if (prevId) {
            const current = queryClient.getQueryData<Conversation[]>(conversationsQueryKey)
            const conv = current?.find(c => c.id === prevId)
            if (conv && !conv.isIncognito) {
                extractMemories(prevId)
            }
            // Remove incognito conversations from cache when leaving
            if (conv?.isIncognito) {
                queryClient.setQueryData<Conversation[]>(conversationsQueryKey, (old = []) =>
                    old.filter(c => c.id !== prevId)
                )
            }
        }
        setCurrentConversationId(crypto.randomUUID())
        window.dispatchEvent(new CustomEvent('ai-dialog-hide'))
    }, [extractMemories, queryClient])

    // Load a conversation (fetches messages if not already loaded)
    const loadConversation = useCallback(async (conversationId: string) => {
        setCurrentConversationId(conversationId)
        window.dispatchEvent(new CustomEvent('ai-dialog-hide'))

        // Check if this conversation already has messages loaded
        const existing = queryClient.getQueryData<Conversation[]>(conversationsQueryKey)
        const conv = existing?.find(c => c.id === conversationId)
        if (conv && conv.messages.length > 0) return

        // Fetch messages from the server
        try {
            const res = await fetch(`/api/chat/history/${conversationId}`)
            if (!res.ok) return
            const data = await res.json()
            const mapped = mapConversation(data)

            // Update the conversation in cache with its messages
            queryClient.setQueryData<Conversation[]>(conversationsQueryKey, (old = []) =>
                old.map(c => c.id === conversationId ? { ...c, messages: mapped.messages } : c)
            )
        } catch (err) {
            console.error('[useConversations] Failed to load messages:', err)
        }
    }, [queryClient])

    // Delete a conversation
    const deleteConversation = useCallback((conversationId: string) => {
        // Extract memories before deleting
        extractMemories(conversationId)
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        if (currentConversationId === conversationId) {
            setCurrentConversationId(null)
        }
    }, [currentConversationId, setConversations, extractMemories])

    // Delete a message
    const deleteMessage = useCallback((messageId: string) => {
        setConversations(prev => prev.map(c =>
            c.id === currentConversationId
                ? { ...c, messages: c.messages.filter(m => m.id !== messageId) }
                : c
        ))
    }, [currentConversationId, setConversations])

    return {
        conversations,
        setConversations,
        currentConversationId,
        setCurrentConversationId,
        currentConversation,
        startNewConversation,
        loadConversation,
        deleteConversation,
        deleteMessage,
        refreshConversations,
        isLoading,
    }
}
