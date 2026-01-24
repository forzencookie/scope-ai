/**
 * Agent Message Bus
 * 
 * Handles communication between agents. Provides message routing,
 * correlation tracking, and event broadcasting.
 */

import type {
    AgentMessage,
    AgentMessageType,
    AgentDomain,
    AgentContext,
    AgentResponse,
    Intent,
} from './types'
import { agentRegistry } from './registry'

// =============================================================================
// Message Bus
// =============================================================================

type MessageHandler = (message: AgentMessage) => Promise<void>
type MessageMiddleware = (message: AgentMessage, next: () => Promise<void>) => Promise<void>

class AgentMessageBus {
    private handlers: Map<AgentDomain, MessageHandler> = new Map()
    private middlewares: MessageMiddleware[] = []
    private messageLog: AgentMessage[] = []
    private maxLogSize = 1000

    /**
     * Register a handler for an agent.
     */
    registerHandler(agentId: AgentDomain, handler: MessageHandler): void {
        this.handlers.set(agentId, handler)
    }

    /**
     * Add middleware to process all messages.
     */
    use(middleware: MessageMiddleware): void {
        this.middlewares.push(middleware)
    }

    /**
     * Send a message from one agent to another.
     */
    async send(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<AgentMessage> {
        const fullMessage: AgentMessage = {
            ...message,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        }

        // Log the message
        this.logMessage(fullMessage)

        // Run through middleware
        await this.runMiddleware(fullMessage)

        // Route to handler
        if (message.to !== 'user') {
            const handler = this.handlers.get(message.to)
            if (handler) {
                await handler(fullMessage)
            }
        }

        return fullMessage
    }

    /**
     * Create a request message.
     */
    createRequest(
        from: AgentDomain | 'user',
        to: AgentDomain,
        content: string,
        options?: {
            intent?: Intent
            payload?: Record<string, unknown>
            correlationId?: string
        }
    ): Omit<AgentMessage, 'id' | 'timestamp'> {
        return {
            type: 'request',
            from,
            to,
            content,
            intent: options?.intent,
            payload: options?.payload,
            correlationId: options?.correlationId || crypto.randomUUID(),
        }
    }

    /**
     * Create a response message.
     */
    createResponse(
        from: AgentDomain,
        to: AgentDomain | 'user',
        content: string,
        parentMessage: AgentMessage,
        options?: {
            display?: AgentMessage['display']
            confirmationRequired?: AgentMessage['confirmationRequired']
            toolResults?: AgentMessage['toolResults']
        }
    ): Omit<AgentMessage, 'id' | 'timestamp'> {
        return {
            type: 'response',
            from,
            to,
            content,
            correlationId: parentMessage.correlationId,
            parentMessageId: parentMessage.id,
            ...options,
        }
    }

    /**
     * Create a handoff message.
     */
    createHandoff(
        from: AgentDomain,
        to: AgentDomain,
        content: string,
        context: AgentContext,
        reason: string
    ): Omit<AgentMessage, 'id' | 'timestamp'> {
        return {
            type: 'handoff',
            from,
            to,
            content,
            payload: {
                reason,
                originalMessage: context.originalMessage,
                intent: context.intent,
            },
            correlationId: context.conversationId,
        }
    }

    /**
     * Create a consultation message.
     */
    createConsultation(
        from: AgentDomain,
        to: AgentDomain,
        question: string,
        correlationId: string
    ): Omit<AgentMessage, 'id' | 'timestamp'> {
        return {
            type: 'consult',
            from,
            to,
            content: question,
            correlationId,
        }
    }

    /**
     * Broadcast a message to all agents.
     */
    async broadcast(
        from: AgentDomain,
        content: string,
        payload?: Record<string, unknown>
    ): Promise<void> {
        const agents = agentRegistry.getAllIds()

        for (const agentId of agents) {
            if (agentId !== from) {
                await this.send({
                    type: 'broadcast',
                    from,
                    to: agentId,
                    content,
                    payload,
                    correlationId: crypto.randomUUID(),
                })
            }
        }
    }

    /**
     * Get message history for a conversation.
     */
    getConversationHistory(correlationId: string): AgentMessage[] {
        return this.messageLog.filter(m => m.correlationId === correlationId)
    }

    /**
     * Get recent messages from an agent.
     */
    getAgentMessages(agentId: AgentDomain, limit = 10): AgentMessage[] {
        return this.messageLog
            .filter(m => m.from === agentId || m.to === agentId)
            .slice(-limit)
    }

    /**
     * Clear message log (useful for testing).
     */
    clearLog(): void {
        this.messageLog = []
    }

    // =========================================================================
    // Private Methods
    // =========================================================================

    private logMessage(message: AgentMessage): void {
        this.messageLog.push(message)

        // Trim log if too large
        if (this.messageLog.length > this.maxLogSize) {
            this.messageLog = this.messageLog.slice(-this.maxLogSize / 2)
        }
    }

    private async runMiddleware(message: AgentMessage): Promise<void> {
        let index = 0

        const next = async (): Promise<void> => {
            if (index < this.middlewares.length) {
                const middleware = this.middlewares[index]
                index++
                await middleware(message, next)
            }
        }

        await next()
    }
}

// Singleton instance
export const messageBus = new AgentMessageBus()

// =============================================================================
// Built-in Middleware
// =============================================================================

/**
 * Logging middleware - logs all messages.
 */
export const loggingMiddleware: MessageMiddleware = async (message, next) => {
    console.log(`[MessageBus] ${message.type}: ${message.from} → ${message.to}`, {
        content: message.content.substring(0, 100),
        correlationId: message.correlationId,
    })
    await next()
}

/**
 * Metrics middleware - tracks message counts and timing.
 */
export const metricsMiddleware: MessageMiddleware = async (message, next) => {
    const start = Date.now()
    await next()
    const duration = Date.now() - start

    // Could emit to metrics system here
    if (duration > 1000) {
        console.warn(`[MessageBus] Slow message processing: ${duration}ms`, {
            type: message.type,
            from: message.from,
            to: message.to,
        })
    }
}
