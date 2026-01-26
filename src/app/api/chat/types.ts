/**
 * Shared types for Chat API
 */

import type { UserScopedDb } from '@/lib/database/user-scoped-db'
import type { AITool, AIToolResult as BaseAIToolResult } from '@/lib/ai-tools/types'

// Re-export AITool for use in providers
export type { AITool, BaseAIToolResult as AIToolResult }

// Types for AI interactions
export type AIContentPart = { type: string; text?: string; [key: string]: unknown }
export type AIContent = string | AIContentPart[]
export type AIMessage = {
    role: string
    content: AIContent
    tool_calls?: unknown[]
    [key: string]: unknown
}

// Generic tool definition for provider compatibility
export type AIToolDefinition = AITool<unknown, unknown>

export interface ToolExecutionContext {
    userId: string
    companyId: string
    userDb: UserScopedDb
}

export interface ToolExecutionResult {
    display?: unknown
    navigation?: unknown
    confirmationRequired?: unknown
    data?: unknown
    message?: string
    success?: boolean
}

export interface ProviderHandlerParams {
    modelId: string
    messagesForAI: AIMessage[]
    controller: ReadableStreamDefaultController
    conversationId: string | null
    tools: AIToolDefinition[]
    userDb: UserScopedDb | null
    confirmationId?: string
    userId: string
}

export interface StreamController {
    streamText: (text: string) => void
    streamData: (data: unknown) => void
}
