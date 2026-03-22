/**
 * AI Tools Registry
 * 
 * Central registry for all AI tools. Provides lookup, validation,
 * and execution with audit logging.
 */

import { AITool, AIToolResult, ActionAuditLog, PendingConfirmation, InteractionContext, AIToolDomain } from './types'
import { aiAuditService } from '@/services/common/ai-audit-service'

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
        const byDomain = new Map<string, AITool[]>()
        for (const t of this.tools.values()) {
            const domain = t.domain || 'common'
            if (!byDomain.has(domain)) byDomain.set(domain, [])
            byDomain.get(domain)!.push(t)
        }
        const lines: string[] = []
        for (const [domain, tools] of byDomain) {
            lines.push(`### ${domain}`)
            for (const t of tools) {
                lines.push(`- ${t.name}: ${t.description.slice(0, 60)}`)
            }
        }
        return lines.join('\n')
    }

    /**
     * Search tools by query string. Returns lightweight metadata, not full schemas.
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

            for (const term of terms) {
                if (nameLower.includes(term)) score += 3
                if (keywordsLower.some(k => k.includes(term))) score += 2
                if (descLower.includes(term)) score += 1
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
            companyId: options?.companyId || '',
            isConfirmed: false
        }
        const tool = this.get(name)

        if (!tool) {
            return {
                success: false,
                error: `Tool "${name}" not found`,
            }
        }

        // 1. Company-Type Guard (Enforce legal scope)
        if (tool.allowedCompanyTypes && tool.allowedCompanyTypes.length > 0) {
            const { companyService } = await import('@/services/company/company-service.server')
            const company = await companyService.getByUserId(context.userId)
            
            if (!company || !tool.allowedCompanyTypes.includes(company.companyType)) {
                const typeLabels: Record<string, string> = {
                    ab: 'aktiebolag',
                    ef: 'enskild firma',
                    hb: 'handelsbolag',
                    kb: 'kommanditbolag',
                    forening: 'förening'
                }
                const allowedLabels = tool.allowedCompanyTypes.map(t => typeLabels[t] || t).join(' eller ')
                return {
                    success: false,
                    error: `Denna funktion (${name}) är endast tillgänglig för ${allowedLabels}. Ditt företag är registrerat som ${typeLabels[company?.companyType || ''] || 'okänd typ'}.`,
                }
            }
        }

        // Check if confirmation is required and not yet provided
        if (tool.requiresConfirmation && !options?.skipConfirmation && !options?.confirmationId) {
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
                
                await aiAuditService.savePendingConfirmation(
                    confirmationId, 
                    { 
                        originalTool: name, 
                        originalParams: params, 
                        request: preflightResult.confirmationRequired,
                        expiresAt: pending.expiresAt 
                    }, 
                    context.userId,
                    context.companyId || ''
                ).catch(err => console.error('[Registry] Failed to persist confirmation:', err))

                return {
                    success: true,
                    confirmationRequired: {
                        ...preflightResult.confirmationRequired,
                        action: { toolName: name, params },
                    },
                } as AIToolResult<T>
            }
        }

        // If confirming a previous request, validate the confirmation
        if (options?.confirmationId) {
            let pending: PendingConfirmation | undefined = this.pendingConfirmations.get(options.confirmationId)
            
            if (!pending) {
                const dbParams = await aiAuditService.getPendingConfirmation(options.confirmationId)
                if (dbParams) {
                    pending = {
                        id: options.confirmationId,
                        request: dbParams.request as unknown as PendingConfirmation['request'],
                        createdAt: Date.now(), // approximation
                        expiresAt: (dbParams.expiresAt as number) || (Date.now() + 1000),
                    }
                }
            }

            if (!pending || Date.now() > pending.expiresAt) {
                if (options.confirmationId) {
                    this.pendingConfirmations.delete(options.confirmationId)
                    aiAuditService.deletePendingConfirmation(options.confirmationId).catch(() => {})
                }
                return {
                    success: false,
                    error: 'Bekräftelsen har utgått eller hittades inte. Försök igen.',
                }
            }

            this.pendingConfirmations.delete(options.confirmationId)
            aiAuditService.deletePendingConfirmation(options.confirmationId).catch(() => {})
            context.isConfirmed = true
        }

        // Execute the tool
        try {
            const result = await tool.execute(params, context)

            // Log the action for audit trail
            if (tool.requiresConfirmation || tool.category === 'write') {
                await aiAuditService.logToolExecution(
                    name,
                    params,
                    result,
                    context.userId,
                    context.companyId || ''
                )
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
     * Clear all pending confirmations (for cleanup)
     */
    clearExpiredConfirmations(): void {
        const now = Date.now()
        for (const [id, pending] of this.pendingConfirmations) {
            if (now > pending.expiresAt) {
                this.pendingConfirmations.delete(id)
                aiAuditService.deletePendingConfirmation(id).catch(() => {})
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
