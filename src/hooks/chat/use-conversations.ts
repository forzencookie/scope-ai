"use client"

/**
 * useConversations - Hook for managing conversation list
 */

import { useState, useCallback, useEffect } from 'react'
import type { Conversation } from '@/lib/chat-types'

export function useConversations() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)

    // Derived state
    const currentConversation = conversations.find(c => c.id === currentConversationId)

    // Load conversations from Supabase on mount
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
        window.dispatchEvent(new CustomEvent('ai-dialog-hide'))
    }, [])

    // Load a conversation
    const loadConversation = useCallback((conversationId: string) => {
        setCurrentConversationId(conversationId)
        window.dispatchEvent(new CustomEvent('ai-dialog-hide'))
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
    }
}
