"use client"

/**
 * useChat - Custom hook for chat state and logic
 * Handles conversations, messages, streaming, and persistence
 * 
 * This is a composed hook that combines smaller focused hooks.
 */

import { useMemo } from 'react'
import { useConversations, useSendMessage } from './chat'
import type { MentionItem } from '@/components/ai/mention-popover'

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
    // Conversation management
    const {
        conversations,
        setConversations,
        currentConversationId,
        setCurrentConversationId,
        currentConversation,
        startNewConversation,
        loadConversation,
        deleteConversation,
        deleteMessage,
    } = useConversations()

    // Set initial conversation ID if provided
    // Note: This is handled in useConversations, but we could enhance it here

    // Derived state
    const messages = useMemo(() => 
        currentConversation?.messages || [], 
        [currentConversation]
    )

    // Message sending
    const {
        isLoading,
        sendMessage,
        regenerateResponse,
    } = useSendMessage({
        conversations,
        setConversations,
        currentConversationId,
        setCurrentConversationId,
    })

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

// Re-export types for convenience
export type { SendMessageOptions }
