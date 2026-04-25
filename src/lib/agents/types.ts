/**
 * Agent Context Types
 *
 * Minimal types for Scooby's per-request context.
 * Multi-agent orchestration types removed — single Scooby + Vercel AI SDK.
 */

// =============================================================================
// Agent Context
// =============================================================================

export interface AgentContext {
    userId: string
    companyId: string | null
    companyType: 'AB' | 'EF' | 'HB' | 'KB' | 'FORENING' | null
    companyName?: string
    hasEmployees?: boolean

    conversationId: string
    conversationHistory: AgentMessage[]
    originalMessage: string

    sharedMemory: Record<string, unknown>

    locale: 'sv' | 'en'
    timestamp: number
}

export function createAgentContext(config: {
    userId: string
    companyId: string | null
    companyType: AgentContext['companyType']
    companyName?: string
    hasEmployees?: boolean
    locale?: 'sv' | 'en'
    conversationId?: string
    messages?: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>
    modelId?: string
}): AgentContext {
    const conversationHistory: AgentMessage[] = (config.messages || []).map(m => ({
        id: m.id,
        from: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
        timestamp: m.timestamp.getTime(),
    }))

    return {
        userId: config.userId,
        companyId: config.companyId,
        companyType: config.companyType,
        companyName: config.companyName,
        hasEmployees: config.hasEmployees,
        conversationId: config.conversationId || crypto.randomUUID(),
        conversationHistory,
        originalMessage: config.messages?.[config.messages.length - 1]?.content || '',
        sharedMemory: { modelId: config.modelId },
        locale: config.locale || 'sv',
        timestamp: Date.now(),
    }
}

// =============================================================================
// Agent Message
// =============================================================================

export interface AgentMessage {
    id: string
    from: 'user' | 'assistant'
    content: string
    timestamp: number
}

// =============================================================================
// Tool Types
// =============================================================================

export interface AgentToolCall {
    id: string
    toolName: string
    params: Record<string, unknown>
}

export interface AgentToolResult {
    toolCallId: string
    toolName: string
    success: boolean
    result?: unknown
    error?: string
}
