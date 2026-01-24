/**
 * Agent Metrics Service
 * 
 * Tracks and logs agent interactions for analytics and debugging.
 * Stores metrics in database for analysis.
 */

import { createClient } from '@supabase/supabase-js'
import type { AgentDomain, IntentCategory, AgentResponse } from '@/lib/agents/types'

// =============================================================================
// Types
// =============================================================================

export interface AgentMetric {
    id?: string
    timestamp: Date
    
    // Request info
    userId: string
    companyId?: string
    conversationId?: string
    
    // Agent routing
    intent: IntentCategory
    intentConfidence: number
    selectedAgent: AgentDomain
    handoffs?: AgentDomain[]
    isMultiAgent: boolean
    
    // Performance
    classificationTimeMs: number
    executionTimeMs: number
    totalTimeMs: number
    
    // Tool usage
    toolsCalled: string[]
    toolsSucceeded: number
    toolsFailed: number
    
    // Response
    responseSuccess: boolean
    responseLength: number
    hasDisplay: boolean
    hasConfirmation: boolean
    hasNavigation: boolean
    
    // Model
    modelId?: string
    tokensEstimate?: number
    
    // Error tracking
    error?: string
    errorAgent?: AgentDomain
}

export interface AgentMetricSummary {
    totalRequests: number
    successRate: number
    avgResponseTimeMs: number
    agentDistribution: Record<AgentDomain, number>
    intentDistribution: Record<IntentCategory, number>
    topTools: Array<{ name: string; count: number }>
    errorRate: number
}

// =============================================================================
// Metrics Collector
// =============================================================================

class AgentMetricsCollector {
    private queue: AgentMetric[] = []
    private flushInterval: ReturnType<typeof setInterval> | null = null
    private readonly batchSize = 10
    private readonly flushIntervalMs = 5000

    constructor() {
        // Start background flush
        if (typeof window === 'undefined') {
            // Server-side only
            this.startBackgroundFlush()
        }
    }

    /**
     * Record a metric for an agent interaction.
     */
    record(metric: AgentMetric): void {
        this.queue.push({
            ...metric,
            timestamp: metric.timestamp || new Date(),
        })

        // Flush if batch size reached
        if (this.queue.length >= this.batchSize) {
            this.flush()
        }
    }

    /**
     * Create a metric from a request/response pair.
     */
    createMetric(params: {
        userId: string
        companyId?: string
        conversationId?: string
        intent: IntentCategory
        intentConfidence: number
        selectedAgent: AgentDomain
        handoffs?: AgentDomain[]
        isMultiAgent: boolean
        classificationTimeMs: number
        executionTimeMs: number
        totalTimeMs: number
        toolsCalled: string[]
        response: AgentResponse
        modelId?: string
        error?: string
    }): AgentMetric {
        return {
            timestamp: new Date(),
            userId: params.userId,
            companyId: params.companyId,
            conversationId: params.conversationId,
            intent: params.intent,
            intentConfidence: params.intentConfidence,
            selectedAgent: params.selectedAgent,
            handoffs: params.handoffs,
            isMultiAgent: params.isMultiAgent,
            classificationTimeMs: params.classificationTimeMs,
            executionTimeMs: params.executionTimeMs,
            totalTimeMs: params.totalTimeMs,
            toolsCalled: params.toolsCalled,
            toolsSucceeded: params.response.toolResults?.filter(r => r.success).length || 0,
            toolsFailed: params.response.toolResults?.filter(r => !r.success).length || 0,
            responseSuccess: params.response.success,
            responseLength: (params.response.text || params.response.message || '').length,
            hasDisplay: !!params.response.display || !!params.response.displayInstructions?.length,
            hasConfirmation: !!params.response.confirmationRequired,
            hasNavigation: !!params.response.navigationInstructions?.length,
            modelId: params.modelId,
            error: params.error,
        }
    }

    /**
     * Flush metrics to database.
     */
    async flush(): Promise<void> {
        if (this.queue.length === 0) return

        const batch = this.queue.splice(0, this.batchSize)
        
        try {
            await this.persistMetrics(batch)
        } catch (error) {
            console.error('[AgentMetrics] Failed to persist metrics:', error)
            // Put back in queue on failure
            this.queue.unshift(...batch)
        }
    }

    /**
     * Persist metrics to Supabase.
     */
    private async persistMetrics(metrics: AgentMetric[]): Promise<void> {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            // Log to console in development
            if (process.env.NODE_ENV === 'development') {
                console.log('[AgentMetrics] Would persist:', metrics.length, 'metrics')
                for (const m of metrics) {
                    console.log(`  [${m.selectedAgent}] ${m.intent} → ${m.responseSuccess ? '✓' : '✗'} (${m.totalTimeMs}ms)`)
                }
            }
            return
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        const { error } = await supabase
            .from('agent_metrics')
            .insert(metrics.map(m => ({
                user_id: m.userId,
                company_id: m.companyId,
                conversation_id: m.conversationId,
                intent: m.intent,
                intent_confidence: m.intentConfidence,
                selected_agent: m.selectedAgent,
                handoffs: m.handoffs,
                is_multi_agent: m.isMultiAgent,
                classification_time_ms: m.classificationTimeMs,
                execution_time_ms: m.executionTimeMs,
                total_time_ms: m.totalTimeMs,
                tools_called: m.toolsCalled,
                tools_succeeded: m.toolsSucceeded,
                tools_failed: m.toolsFailed,
                response_success: m.responseSuccess,
                response_length: m.responseLength,
                has_display: m.hasDisplay,
                has_confirmation: m.hasConfirmation,
                has_navigation: m.hasNavigation,
                model_id: m.modelId,
                error: m.error,
                created_at: m.timestamp.toISOString(),
            })))

        if (error) {
            throw error
        }
    }

    /**
     * Start background flush interval.
     */
    private startBackgroundFlush(): void {
        if (this.flushInterval) return

        this.flushInterval = setInterval(() => {
            this.flush()
        }, this.flushIntervalMs)
    }

    /**
     * Stop background flush (for cleanup).
     */
    stop(): void {
        if (this.flushInterval) {
            clearInterval(this.flushInterval)
            this.flushInterval = null
        }
        // Flush remaining
        this.flush()
    }

    /**
     * Get summary statistics for a time period.
     */
    async getSummary(
        userId?: string,
        fromDate?: Date,
        toDate?: Date
    ): Promise<AgentMetricSummary | null> {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            return null
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        let query = supabase.from('agent_metrics').select('*')

        if (userId) {
            query = query.eq('user_id', userId)
        }
        if (fromDate) {
            query = query.gte('created_at', fromDate.toISOString())
        }
        if (toDate) {
            query = query.lte('created_at', toDate.toISOString())
        }

        const { data, error } = await query

        if (error || !data) {
            console.error('[AgentMetrics] Failed to get summary:', error)
            return null
        }

        // Calculate summary
        const totalRequests = data.length
        const successCount = data.filter(m => m.response_success).length
        const totalTime = data.reduce((sum, m) => sum + (m.total_time_ms || 0), 0)
        const errorCount = data.filter(m => m.error).length

        const agentDistribution: Record<string, number> = {}
        const intentDistribution: Record<string, number> = {}
        const toolCounts: Record<string, number> = {}

        for (const m of data) {
            agentDistribution[m.selected_agent] = (agentDistribution[m.selected_agent] || 0) + 1
            intentDistribution[m.intent] = (intentDistribution[m.intent] || 0) + 1
            
            for (const tool of m.tools_called || []) {
                toolCounts[tool] = (toolCounts[tool] || 0) + 1
            }
        }

        const topTools = Object.entries(toolCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }))

        return {
            totalRequests,
            successRate: totalRequests > 0 ? successCount / totalRequests : 0,
            avgResponseTimeMs: totalRequests > 0 ? totalTime / totalRequests : 0,
            agentDistribution: agentDistribution as Record<AgentDomain, number>,
            intentDistribution: intentDistribution as Record<IntentCategory, number>,
            topTools,
            errorRate: totalRequests > 0 ? errorCount / totalRequests : 0,
        }
    }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const agentMetrics = new AgentMetricsCollector()

// =============================================================================
// Timing Helpers
// =============================================================================

export function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
    const start = performance.now()
    return fn().then(result => ({
        result,
        timeMs: Math.round(performance.now() - start),
    }))
}

export function createTimer() {
    const start = performance.now()
    return {
        elapsed: () => Math.round(performance.now() - start),
    }
}
