"use client"

/**
 * useConversations — Folder-level conversation management.
 *
 * Manages the conversation list (React Query cache), current selection,
 * and CRUD operations. Lives above the key boundary — never remounts
 * when conversations switch.
 *
 * Conversation switching orchestration (memory extraction, incognito cleanup,
 * ID generation) is handled by ChatProvider, not here.
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
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
    // Start with a fresh conversation ID so the first message is always persisted.
    // handleNewConversation generates a new UUID when switching conversations.
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(
        () => crypto.randomUUID()
    )

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
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
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
        try {
            const stored = localStorage.getItem('scope_company_data')
            const companyId = stored ? JSON.parse(stored)?.id : null
            if (!companyId) return

            fetch('/api/chat/extract-memories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, companyId }),
            }).catch(() => {}) // Silent — memory extraction is best-effort
        } catch {
            // localStorage access can throw in some environments
        }
    }, [])

    // Remove an incognito conversation from the cache
    const cleanupIncognitoConversation = useCallback((conversationId: string) => {
        queryClient.setQueryData<Conversation[]>(conversationsQueryKey, (old = []) =>
            old.filter(c => c.id !== conversationId)
        )
    }, [queryClient])

    // Load a conversation (fetches messages if not already loaded)
    const loadConversation = useCallback(async (conversationId: string) => {
        setCurrentConversationId(conversationId)

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

            queryClient.setQueryData<Conversation[]>(conversationsQueryKey, (old = []) =>
                old.map(c => c.id === conversationId ? { ...c, messages: mapped.messages } : c)
            )
        } catch (err) {
            console.error('[useConversations] Failed to load messages:', err)
        }
    }, [queryClient])

    // Delete a conversation
    const deleteConversation = useCallback((conversationId: string) => {
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
        loadConversation,
        deleteConversation,
        deleteMessage,
        refreshConversations,
        extractMemories,
        cleanupIncognitoConversation,
        isLoading,
    }
}
