/**
 * AI Tools Registry
 * 
 * Central registry for all AI tools. Provides lookup, validation,
 * and execution with audit logging.
 */

import { AITool, AIToolResult, ActionAuditLog, PendingConfirmation, InteractionContext, AIToolDomain } from './types'
import { db } from '../database/server-db'

// Re-export types that tools may need
export type { AIConfirmationRequest } from './types'

// =============================================================================
// Tool Registry
// =============================================================================

class AIToolRegistry {
    private tools: Map<string, AITool> = new Map()
    /** In-memory cache — DB is source of truth */
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
     * Get tools marked as core (always loaded)
     */
    getCoreTools(): AITool[] {
        return this.getAll().filter(t => t.coreTool === true)
    }

    /**
     * Get a compact tool index (~300 tokens) listing all tool names + one-liners.
     * Used in system prompt so the model knows what's available without loading schemas.
     */
    getToolIndex(): string {
        return this.getAll()
            .map(t => `- ${t.name}: ${t.description.slice(0, 60)}`)
            .join('\n')
    }

    /**
     * Search tools by query string. Returns lightweight metadata, not full schemas.
     * Scoring: name match = 3, keyword match = 2, description match = 1, domain match = 1.
     */
    search(query: string, limit: number = 10): Array<{ name: string; description: string; domain?: AIToolDomain }> {
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
        if (terms.length === 0) return []

        const scored: Array<{ tool: AITool; score: number }> = []

        for (const tool of this.tools.values()) {
            let score = 0
            const nameLower = tool.name.toLowerCase()
            const descLower = tool.description.toLowerCase()
            const keywordsLower = (tool.keywords || []).map(k => k.toLowerCase())
            const domainLower = (tool.domain || '').toLowerCase()

            for (const term of terms) {
                if (nameLower.includes(term)) score += 3
                if (keywordsLower.some(k => k.includes(term))) score += 2
                if (descLower.includes(term)) score += 1
                if (domainLower.includes(term)) score += 1
            }

            if (score > 0) {
                scored.push({ tool, score })
            }
        }

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(({ tool }) => ({
                name: tool.name,
                description: tool.description,
                domain: tool.domain,
            }))
    }

    /**
     * Get full tool definitions by name array
     */
    getByNames(names: string[]): AITool[] {
        return names
            .map(name => this.tools.get(name))
            .filter((t): t is AITool => t !== undefined)
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
                // Store in memory cache
                this.pendingConfirmations.set(confirmationId, pending)
                // Persist to DB for restart resilience
                this.persistConfirmation(pending, name, params, options?.userId).catch(err =>
                    console.error('[AI Tool Registry] Failed to persist confirmation:', err)
                )

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
            let pending: PendingConfirmation | undefined = this.pendingConfirmations.get(options.confirmationId)
            // Fallback to DB if not in memory (e.g. after server restart)
            if (!pending) {
                pending = await this.loadConfirmationFromDB(options.confirmationId) ?? undefined
            }
            if (!pending) {
                return {
                    success: false,
                    error: 'Confirmation expired or not found. Please try again.',
                }
            }
            if (Date.now() > pending.expiresAt) {
                this.pendingConfirmations.delete(options.confirmationId)
                this.deleteConfirmationFromDB(options.confirmationId).catch(() => {})
                return {
                    success: false,
                    error: 'Confirmation expired. Please try again.',
                }
            }
            // Clear the pending confirmation from both cache and DB
            this.pendingConfirmations.delete(options.confirmationId)
            this.deleteConfirmationFromDB(options.confirmationId).catch(() => {})
            // Mark context as confirmed so the tool knows to persist
            context.isConfirmed = true
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
                parameters: (log.params as Record<string, unknown>) || {},
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
     * Persist a confirmation to DB for restart resilience
     */
    private async persistConfirmation(
        pending: PendingConfirmation,
        toolName: string,
        params: unknown,
        userId?: string,
    ): Promise<void> {
        try {
            await db.logAIToolExecution({
                toolName: `__confirmation__:${pending.id}`,
                parameters: {
                    originalTool: toolName,
                    originalParams: params as Record<string, unknown>,
                    request: pending.request as unknown as Record<string, unknown>,
                    createdAt: pending.createdAt,
                    expiresAt: pending.expiresAt,
                },
                result: { status: 'pending' },
                status: 'pending',
                userId: userId || 'system',
            })
        } catch (error) {
            console.error('[AI Tool Registry] Confirmation persist failed:', error)
        }
    }

    /**
     * Load a confirmation from DB (fallback when not in memory cache)
     */
    private async loadConfirmationFromDB(confirmationId: string): Promise<PendingConfirmation | null> {
        try {
            const { getSupabaseAdmin } = await import('../database/supabase')
            const supabase = getSupabaseAdmin()
            const { data } = await supabase
                .from('ai_audit_log')
                .select('parameters')
                .eq('tool_name', `__confirmation__:${confirmationId}`)
                .single()

            if (!data?.parameters) return null

            const params = data.parameters as Record<string, unknown>
            const pending: PendingConfirmation = {
                id: confirmationId,
                request: params.request as PendingConfirmation['request'],
                createdAt: params.createdAt as number,
                expiresAt: params.expiresAt as number,
            }

            // Re-cache for subsequent lookups
            this.pendingConfirmations.set(confirmationId, pending)
            return pending
        } catch {
            return null
        }
    }

    /**
     * Delete a confirmation from DB after it's been used or expired
     */
    private async deleteConfirmationFromDB(confirmationId: string): Promise<void> {
        try {
            const { getSupabaseAdmin } = await import('../database/supabase')
            const supabase = getSupabaseAdmin()
            await supabase
                .from('ai_audit_log')
                .delete()
                .eq('tool_name', `__confirmation__:${confirmationId}`)
        } catch {
            // Non-critical — cleanup will catch it
        }
    }

    /**
     * Clear all pending confirmations (for cleanup)
     */
    clearExpiredConfirmations(): void {
        const now = Date.now()
        for (const [id, pending] of this.pendingConfirmations) {
            if (now > pending.expiresAt) {
                this.pendingConfirmations.delete(id)
                this.deleteConfirmationFromDB(id).catch(() => {})
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
