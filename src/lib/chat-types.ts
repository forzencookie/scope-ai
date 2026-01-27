/**
 * Chat type definitions
 * Shared types for chat functionality
 */

import type { MentionItem } from '@/components/ai/mention-popover'

// Import component prop types for type safety
import type { ActivityChange, ComparisonRow } from '@/components/ai'

// Display card data types - discriminated union for type safety
export type MessageDisplay =
    | {
        type: 'ReceiptCard'
        data: {
            receipt?: {
                id?: string
                vendor?: string
                amount?: number
                date?: string
                category?: string
                description?: string
            }
        } & Record<string, unknown>
    }
    | {
        type: 'TransactionCard'
        data: {
            transaction?: {
                id?: string
                description?: string
                amount?: number
                date?: string
                account?: string
                type?: 'income' | 'expense'
            }
        } & Record<string, unknown>
    }
    | {
        type: 'TaskChecklist'
        data: {
            title?: string
            tasks?: Array<{ id?: string; label: string; completed?: boolean }>
        } & Record<string, unknown>
    }
    | {
        type: 'ReceiptsTable'
        data: Record<string, unknown>
    }
    | {
        type: 'ActivityCard'
        data: {
            action?: 'created' | 'updated' | 'deleted' | 'calculated' | 'prepared'
            entityType?: 'receipt' | 'transaction' | 'invoice' | 'payslip' | 'report' | 'shareholder' | 'document'
            title?: string
            subtitle?: string
            changes?: ActivityChange[]
            link?: string
            linkLabel?: string
        } & Record<string, unknown>
    }
    | {
        type: 'ComparisonTable'
        data: {
            title?: string
            rows?: ComparisonRow[]
        } & Record<string, unknown>
    }

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
    display?: MessageDisplay
    confirmationRequired?: {
        id: string
        type: string
        data: Record<string, unknown>
        action: string
    }
    toolResults?: Array<{
        toolName: string
        result: unknown
    }>
}

export interface Conversation {
    id: string
    title: string
    messages: Message[]
    createdAt: number
    updatedAt: number
}
