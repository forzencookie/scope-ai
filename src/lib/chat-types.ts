/**
 * Chat type definitions
 * Shared types for chat functionality
 */

import type { MentionItem } from '@/components/ai/mention-popover'
import type {
    TaskChecklist,
    BenefitsTable,
} from './ai-schema'

import type { AuditResult } from '@/components/ai/chat-tools/information-cards/audit-card'
import type { InfoCardData } from '@/components/ai/chat-tools/information-cards'

// Display card data types - strictly typed discriminated union
export type MessageDisplay =
    | { type: 'TaskChecklist'; data: TaskChecklist }
    | { type: 'BenefitsTable'; data: BenefitsTable }
    | { type: 'BalanceAuditCard'; component?: string; data: { audit?: AuditResult } & Record<string, unknown> }
    | { type: 'InfoCard'; data: InfoCardData }
    | { type: 'InfoCards'; data: { cards: InfoCardData[] } }

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    error?: boolean
    // Attachments for user messages
    attachments?: Array<{ name: string; type: string; dataUrl: string }>
    // Mentions for user messages
    mentions?: MentionItem[]
    // Structured data for AI cards (assistant) or action triggers (user)
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
    /** Tool names currently being executed (for loading states) */
    pendingTools?: string[]
    /** Raw tool calls from DB (for reconstructing UIMessage parts on load) */
    toolCalls?: Array<{
        toolCallId: string
        toolName: string
        args: Record<string, unknown>
    }>
}

export interface Conversation {
    id: string
    title: string
    messages: Message[]
    createdAt: number
    updatedAt: number
    /** Incognito conversations are not persisted to DB */
    isIncognito?: boolean
}
