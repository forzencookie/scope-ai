/**
 * AI Tools Registry
 * 
 * Central registry for all AI tools. Provides lookup, validation,
 * and execution with audit logging.
 */

import { AITool, AIToolResult, ActionAuditLog, PendingConfirmation, InteractionContext } from './types'
import { db } from '../database/server-db'

// Re-export types that tools may need
export type { AIConfirmationRequest } from './types'

// =============================================================================
// Tool Registry
// =============================================================================

class AIToolRegistry {
    private tools: Map<string, AITool> = new Map()
    private pendingConfirmations: Map<string, PendingConfirmation> = new Map()
    private auditLog: ActionAuditLog[] = []

    /**
     * Register a tool
     */
    register<TParams, TResult>(tool: AITool<TParams, TResult>): void {
        if (this.tools.has(tool.name)) {
            console.warn(`Tool "${tool.name}" is already registered. Overwriting.`)
        }
        this.tools.set(tool.name, tool as AITool)
    }

    /**
     * Register multiple tools
     */
    registerAll(tools: AITool[]): void {
        tools.forEach(tool => this.register(tool))
    }

    /**
     * Get a tool by name
     */
    get(name: string): AITool | undefined {
        return this.tools.get(name)
    }

    /**
     * Get all registered tools
     */
    getAll(): AITool[] {
        return Array.from(this.tools.values())
    }

    /**
     * Get tools by category
     */
    getByCategory(category: AITool['category']): AITool[] {
        return this.getAll().filter(t => t.category === category)
    }

    /**
     * Check if a tool exists
     */
    has(name: string): boolean {
        return this.tools.has(name)
    }

    /**
     * Execute a tool with the given parameters.
     * Handles confirmation flow for destructive actions.
     */
    async execute<T = unknown>(
        name: string,
        params: unknown,
        options?: {
            userId?: string
            companyId?: string
            skipConfirmation?: boolean
            confirmationId?: string
        }
    ): Promise<AIToolResult<T>> {
        const context: InteractionContext = {
            userId: options?.userId || 'system',
            companyId: options?.companyId || null
        }
        const tool = this.get(name)

        if (!tool) {
            return {
                success: false,
                error: `Tool "${name}" not found`,
            }
        }

        // Check if confirmation is required and not yet provided
        if (tool.requiresConfirmation && !options?.skipConfirmation && !options?.confirmationId) {
            // Return a confirmation request instead of executing
            // The actual confirmation content should be built by the tool
            const preflightResult = await tool.execute(params, context)

            if (preflightResult.confirmationRequired) {
                const confirmationId = crypto.randomUUID()
                const pending: PendingConfirmation = {
                    id: confirmationId,
                    request: preflightResult.confirmationRequired,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
                }
                this.pendingConfirmations.set(confirmationId, pending)

                return {
                    success: true,
                    confirmationRequired: {
                        ...preflightResult.confirmationRequired,
                        action: {
                            toolName: name,
                            params,
                        },
                    },
                } as AIToolResult<T>
            }
        }

        // If confirming a previous request, validate the confirmation
        if (options?.confirmationId) {
            const pending = this.pendingConfirmations.get(options.confirmationId)
            if (!pending) {
                return {
                    success: false,
                    error: 'Confirmation expired or not found. Please try again.',
                }
            }
            if (Date.now() > pending.expiresAt) {
                this.pendingConfirmations.delete(options.confirmationId)
                return {
                    success: false,
                    error: 'Confirmation expired. Please try again.',
                }
            }
            // Clear the pending confirmation
            this.pendingConfirmations.delete(options.confirmationId)
        }

        // Execute the tool
        try {
            const result = await tool.execute(params, context)

            // Log the action for audit trail
            if (tool.requiresConfirmation || tool.category === 'write') {
                this.logAction({
                    toolName: name,
                    params,
                    result,
                    userId: options?.userId || 'system',
                    confirmationId: options?.confirmationId,
                })
            }

            return result as AIToolResult<T>
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            return {
                success: false,
                error: `Tool execution failed: ${errorMessage}`,
            }
        }
    }

    /**
     * Log an action for audit trail
     */
    private async logAction(entry: Omit<ActionAuditLog, 'id' | 'timestamp' | 'payloadHash'>): Promise<void> {
        const log: ActionAuditLog = {
            ...entry,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            payloadHash: this.hashPayload(entry.params),
        }
        this.auditLog.push(log)

        // Persist to database for accounting compliance
        try {
            await db.logAIToolExecution({
                toolName: log.toolName,
                parameters: log.params,
                result: log.result,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                status: (log.result as any)?.success === false ? 'error' : 'success',
                userId: log.userId,
            })
        } catch (error) {
            console.error('[AI Tool Audit] Failed to persist log:', error)
        }

        console.log('[AI Tool Audit]', log)
    }

    /**
     * Simple hash of the payload for audit purposes
     */
    private hashPayload(payload: unknown): string {
        const str = JSON.stringify(payload)
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32-bit integer
        }
        return hash.toString(16)
    }

    /**
     * Get audit log (for debugging/admin)
     */
    getAuditLog(): ActionAuditLog[] {
        return [...this.auditLog]
    }

    /**
     * Clear all pending confirmations (for cleanup)
     */
    clearExpiredConfirmations(): void {
        const now = Date.now()
        for (const [id, pending] of this.pendingConfirmations) {
            if (now > pending.expiresAt) {
                this.pendingConfirmations.delete(id)
            }
        }
    }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const aiToolRegistry = new AIToolRegistry()

// =============================================================================
// Helper for creating tools with proper typing
// =============================================================================

export function defineTool<TParams, TResult>(
    tool: AITool<TParams, TResult>
): AITool<TParams, TResult> {
    return tool
}
