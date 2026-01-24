/**
 * Agent System Types
 * 
 * Core type definitions for the multi-agent architecture.
 * These types define how agents communicate, what they can do,
 * and how they coordinate with each other.
 */

// =============================================================================
// Agent Domains
// =============================================================================

/**
 * All possible agent domains in the system.
 * Each domain represents a specialized area of expertise.
 */
export type AgentDomain =
    | 'orchestrator'    // Gojo - routes and coordinates
    | 'bokforing'       // Accounting, verifications, chart of accounts
    | 'receipts'        // Receipt parsing, expense categorization
    | 'invoices'        // Customer invoices, payments
    | 'loner'           // Payroll, salaries, benefits
    | 'skatt'           // Tax, VAT, declarations
    | 'rapporter'       // Financial reports, P&L, balance sheet
    | 'compliance'      // Deadlines, filings, authorities
    | 'statistik'       // KPIs, trends, company health
    | 'handelser'       // Events, timeline, corporate actions
    | 'installningar'   // Settings, integrations, preferences

// =============================================================================
// Intent Classification
// =============================================================================

/**
 * High-level intent categories the orchestrator can classify.
 */
export type IntentCategory =
    | 'RECEIPT'           // Expense/receipt handling
    | 'INVOICE'           // Customer invoice operations
    | 'BOOKKEEPING'       // Transactions, verifications
    | 'PAYROLL'           // Salary, benefits, AGI
    | 'TAX'               // VAT, declarations, tax planning
    | 'REPORTING'         // Financial reports, metrics
    | 'COMPLIANCE'        // Deadlines, filings
    | 'STATISTICS'        // KPIs, company health
    | 'EVENTS'            // Timeline, corporate actions
    | 'SETTINGS'          // User/company configuration
    | 'NAVIGATION'        // Go to a page
    | 'GENERAL'           // Chitchat, unclear
    | 'MULTI_DOMAIN'      // Requires multiple agents

/**
 * Classified intent with metadata.
 */
export interface Intent {
    category: IntentCategory
    confidence: number          // 0-1 how confident we are
    subIntent?: string          // More specific action (e.g., "create", "query", "update")
    entities: IntentEntity[]    // Extracted entities from the message
    requiresMultiAgent?: boolean
    suggestedAgents?: AgentDomain[]
}

/**
 * Entity extracted from user message.
 */
export interface IntentEntity {
    type: 'amount' | 'date' | 'account' | 'person' | 'company' | 'document' | 'period' | 'other'
    value: string
    raw: string                 // Original text
    confidence: number
}

// =============================================================================
// Agent Context
// =============================================================================

/**
 * Context passed between agents during request handling.
 * Contains all the information an agent needs to do its job.
 */
export interface AgentContext {
    // User & Company
    userId: string
    companyId: string
    companyType: 'AB' | 'EF' | 'HB' | 'KB' | 'FORENING'
    companyName?: string
    
    // Conversation
    conversationId: string
    conversationHistory: AgentMessage[]
    
    // Current request
    originalMessage: string
    intent?: Intent
    currentIntent?: Intent    // Active intent during processing
    
    // Agent coordination
    activeAgent?: AgentDomain
    handoffStack: AgentDomain[]     // Track agent-to-agent handoffs
    consultationDepth: number       // Prevent infinite loops
    
    // Shared state between agents
    sharedMemory: Record<string, unknown>
    
    // Metadata
    locale: 'sv' | 'en'
    timestamp: number
}

/**
 * Create a fresh context for a new conversation.
 */
export function createAgentContext(
    userId: string,
    companyId: string,
    companyType: AgentContext['companyType'],
    message: string,
    conversationId?: string
): AgentContext
export function createAgentContext(config: {
    userId: string
    companyId: string
    companyType: AgentContext['companyType']
    companyName?: string
    locale?: 'sv' | 'en'
    conversationId?: string
    messages?: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>
    modelId?: string
}): AgentContext
export function createAgentContext(
    userIdOrConfig: string | {
        userId: string
        companyId: string
        companyType: AgentContext['companyType']
        companyName?: string
        locale?: 'sv' | 'en'
        conversationId?: string
        messages?: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>
        modelId?: string
    },
    companyId?: string,
    companyType?: AgentContext['companyType'],
    message?: string,
    conversationId?: string
): AgentContext {
    // Object-based signature
    if (typeof userIdOrConfig === 'object') {
        const config = userIdOrConfig
        const conversationHistory: AgentMessage[] = (config.messages || []).map(m => ({
            id: m.id,
            type: 'request' as const,
            from: m.role === 'user' ? 'user' as const : 'orchestrator' as const,
            to: 'orchestrator' as const,
            content: m.content,
            correlationId: config.conversationId || crypto.randomUUID(),
            timestamp: m.timestamp.getTime(),
        }))
        
        return {
            userId: config.userId,
            companyId: config.companyId,
            companyType: config.companyType,
            companyName: config.companyName,
            conversationId: config.conversationId || crypto.randomUUID(),
            conversationHistory,
            originalMessage: config.messages?.[config.messages.length - 1]?.content || '',
            handoffStack: [],
            consultationDepth: 0,
            sharedMemory: { modelId: config.modelId },
            locale: config.locale || 'sv',
            timestamp: Date.now(),
        }
    }
    
    // Positional arguments signature (backwards compatible)
    return {
        userId: userIdOrConfig,
        companyId: companyId!,
        companyType: companyType!,
        conversationId: conversationId || crypto.randomUUID(),
        conversationHistory: [],
        originalMessage: message || '',
        handoffStack: [],
        consultationDepth: 0,
        sharedMemory: {},
        locale: 'sv',
        timestamp: Date.now(),
    }
}

// =============================================================================
// Agent Messages
// =============================================================================

/**
 * Message types for agent communication.
 */
export type AgentMessageType =
    | 'request'     // Initial request to an agent
    | 'response'    // Agent's response
    | 'handoff'     // Transfer to another agent
    | 'consult'     // Ask another agent for help (expects response)
    | 'broadcast'   // Notify all agents (e.g., settings changed)
    | 'error'       // Something went wrong

/**
 * Message passed between agents.
 */
export interface AgentMessage {
    id: string
    type: AgentMessageType
    from: AgentDomain | 'user'
    to: AgentDomain | 'user'
    
    // Content
    content: string
    payload?: Record<string, unknown>
    
    // For responses
    intent?: Intent
    toolCalls?: AgentToolCall[]
    toolResults?: AgentToolResult[]
    
    // Display instructions for UI
    display?: AgentDisplayInstruction
    confirmationRequired?: AgentConfirmation
    
    // Metadata
    correlationId: string       // Track conversation flow
    parentMessageId?: string
    timestamp: number
}

/**
 * Tool call made by an agent.
 */
export interface AgentToolCall {
    id: string
    toolName: string
    params: Record<string, unknown>
}

/**
 * Result from a tool execution.
 */
export interface AgentToolResult {
    toolCallId: string
    toolName: string
    success: boolean
    result?: unknown
    error?: string
}

/**
 * Instructions for how to display the response in UI.
 */
export interface AgentDisplayInstruction {
    type: 'card' | 'table' | 'chart' | 'list' | 'confirmation' | 'text'
    cardType?: string           // e.g., 'ReceiptCard', 'TransactionCard'
    data: unknown
}

/**
 * Confirmation request for destructive actions.
 */
export interface AgentConfirmation {
    id: string
    action: string              // Human-readable action description
    type: 'create' | 'update' | 'delete' | 'submit'
    data: unknown               // Preview data
    toolName: string
    toolParams: Record<string, unknown>
}

/**
 * Navigation instruction for the UI.
 */
export interface AgentNavigationInstruction {
    path: string
    params?: Record<string, string>
    highlightId?: string
}

// =============================================================================
// Agent Response
// =============================================================================

/**
 * What an agent returns after processing a request.
 */
export interface AgentResponse {
    success: boolean
    
    // Content for user
    message: string
    text?: string               // Alias for message (convenience)
    display?: AgentDisplayInstruction
    displayInstructions?: AgentDisplayInstruction[]  // Multiple display components
    navigationInstructions?: AgentNavigationInstruction[]
    confirmationRequired?: AgentConfirmation
    
    // Tool usage
    toolCalls?: AgentToolCall[]
    toolResults?: AgentToolResult[]
    
    // Agent coordination
    handoffTo?: AgentDomain     // Transfer to another agent
    handoffMessage?: string     // Context for the receiving agent
    consultResult?: unknown     // Result from consulting another agent
    
    // Metadata
    agentId: AgentDomain
    tokensUsed?: number
    latencyMs?: number
    
    // Error handling
    error?: string
    shouldRetry?: boolean
}

// =============================================================================
// Agent Definition
// =============================================================================

/**
 * Base interface for all agents.
 */
export interface Agent {
    /** Unique identifier for this agent */
    id: AgentDomain
    
    /** Human-readable name */
    name: string
    
    /** What this agent does */
    description: string
    
    /** Keywords/phrases this agent responds to */
    capabilities: string[]
    
    /** Tool names this agent can use */
    tools: string[]
    
    /** The system prompt for this agent */
    systemPrompt: string
    
    /** Preferred model for this agent */
    preferredModel?: string
    
    /**
     * Evaluate if this agent can handle the request.
     * Returns a confidence score 0-1.
     */
    canHandle(intent: Intent, context: AgentContext): Promise<number>
    
    /**
     * Process the request and return a response.
     */
    handle(message: string, context: AgentContext): Promise<AgentResponse>
    
    /**
     * Consult this agent for information (doesn't take over conversation).
     */
    consult(question: string, context: AgentContext): Promise<AgentResponse>
}

// =============================================================================
// Agent Configuration
// =============================================================================

/**
 * Configuration for agent behavior.
 */
export interface AgentConfig {
    /** Maximum consultation depth to prevent loops */
    maxConsultationDepth: number
    
    /** Maximum handoffs before escalating */
    maxHandoffs: number
    
    /** Confidence threshold for auto-routing */
    routingConfidenceThreshold: number
    
    /** Whether to log agent interactions */
    enableLogging: boolean
    
    /** Whether to track metrics */
    enableMetrics: boolean
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
    maxConsultationDepth: 3,
    maxHandoffs: 5,
    routingConfidenceThreshold: 0.7,
    enableLogging: true,
    enableMetrics: true,
}

// =============================================================================
// Agent Metrics
// =============================================================================

/**
 * Metrics collected for each agent interaction.
 */
export interface AgentMetrics {
    agentId: AgentDomain
    requestId: string
    conversationId: string
    
    // Performance
    latencyMs: number
    tokensUsed: number
    modelId: string
    
    // Quality
    intentMatchConfidence: number
    handoffCount: number
    consultationCount: number
    toolCallCount: number
    
    // Outcome
    success: boolean
    errorType?: string
    
    timestamp: number
}
