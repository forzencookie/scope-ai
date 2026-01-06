/**
 * Chat type definitions
 * Shared types for chat functionality
 */

import type { MentionItem } from '@/components/ai/mention-popover'

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    error?: boolean
    // Attachments for user messages
    attachments?: Array<{ name: string; type: string; dataUrl: string }>
    // Mentions for user messages
    mentions?: MentionItem[]
    // Structured data for AI cards
    display?: {
        type: 'ReceiptCard' | 'TransactionCard' | 'TaskChecklist' | 'ReceiptsTable' | 'ActivityCard' | 'ComparisonTable'
        data: any
    }
    confirmationRequired?: {
        id: string
        type: string
        data: any
        action: string
    }
    toolResults?: Array<{
        toolName: string
        result: any
    }>
}

export interface Conversation {
    id: string
    title: string
    messages: Message[]
    createdAt: number
    updatedAt: number
}
