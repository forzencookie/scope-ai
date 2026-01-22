/**
 * Server-Side Model Authorization
 * 
 * Prevents users from accessing AI models they haven't paid for.
 * This is the critical security layer that validates model access
 * server-side, preventing client-side bypass attacks.
 */

// @ts-nocheck - Supabase types need regeneration after migration runs
// TODO: Run `npx supabase gen types typescript` after applying migration

import { getSupabaseAdmin } from './supabase'
import { getModelById, DEFAULT_MODEL_ID, AI_MODELS, type ModelTier, type AIModel } from './ai-models'

// ============================================================================
// Types
// ============================================================================

export interface ModelAuthResult {
    authorized: boolean
    modelId: string           // Authorized model ID (may be fallback)
    model: AIModel
    userTier: UserTier
    requestedTier: ModelTier | 'unknown'
    reason?: string
}

export type UserTier = 'free' | 'pro' | 'enterprise'

export interface UsageStats {
    tokensUsed: number
    requestsCount: number
    periodStart: Date
    periodEnd: Date
}

export interface SecurityEvent {
    eventType: 'unauthorized_model_access' | 'rate_limit_exceeded' | 'suspicious_activity' | 'auth_failure' | 'admin_action'
    userId?: string
    requestedResource?: string
    allowedResource?: string
    userTier?: string
    ipAddress?: string
    userAgent?: string
    metadata?: Record<string, unknown>
}

// ============================================================================
// Tier Access Control
// ============================================================================

/**
 * Defines which user tiers can access which model tiers.
 * Users can access their tier and all lower tiers.
 */
const TIER_ACCESS: Record<UserTier, ModelTier[]> = {
    'free': ['free'],
    'pro': ['free', 'pro'],
    'enterprise': ['free', 'pro', 'enterprise'],
}

/**
 * Monthly token limits per tier
 */
export const TIER_LIMITS: Record<UserTier, { tokensPerMonth: number; requestsPerDay: number }> = {
    'free': { tokensPerMonth: 50_000, requestsPerDay: 50 },
    'pro': { tokensPerMonth: 500_000, requestsPerDay: 500 },
    'enterprise': { tokensPerMonth: 5_000_000, requestsPerDay: 5000 },
}

// ============================================================================
// Core Authorization Functions
// ============================================================================

/**
 * Get user's subscription tier from database
 * Returns 'pro' by default (allows all basic models)
 * In production, this should query the actual subscription status
 */
export async function getUserTier(userId: string): Promise<UserTier> {
    try {
        const supabase = getSupabaseAdmin()

        // Try to get user from auth.users to verify they exist
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)

        if (userError || !user) {
            console.warn('[ModelAuth] User not found:', userId)
            return 'free'
        }

        // For now, give all authenticated users 'pro' access
        // TODO: Implement proper subscription tiers with Stripe integration
        return 'pro'
    } catch (error) {
        console.error('[ModelAuth] Failed to get user tier:', error)
        // Default to 'pro' to prevent blocking users due to DB issues
        return 'pro'
    }
}

/**
 * Authorize a model request
 * Returns the authorized model ID (original if allowed, fallback if not)
 */
export async function authorizeModel(
    userId: string,
    requestedModelId: string
): Promise<ModelAuthResult> {
    const userTier = await getUserTier(userId)
    const model = getModelById(requestedModelId)

    // Unknown model - use default
    if (!model) {
        const defaultModel = getModelById(DEFAULT_MODEL_ID)!
        return {
            authorized: false,
            modelId: DEFAULT_MODEL_ID,
            model: defaultModel,
            userTier,
            requestedTier: 'unknown',
            reason: `Unknown model requested: ${requestedModelId}`
        }
    }

    const allowedTiers = TIER_ACCESS[userTier]
    const isAuthorized = allowedTiers.includes(model.tier)

    if (isAuthorized) {
        return {
            authorized: true,
            modelId: requestedModelId,
            model,
            userTier,
            requestedTier: model.tier,
        }
    }

    // Find the best fallback model for the user's tier
    // Prefer same provider, then fall back to default
    const fallbackModel = AI_MODELS.find(m =>
        allowedTiers.includes(m.tier) && m.provider === model.provider
    ) || getModelById(DEFAULT_MODEL_ID)!

    return {
        authorized: false,
        modelId: fallbackModel.id,
        model: fallbackModel,
        userTier,
        requestedTier: model.tier,
        reason: `Model '${model.name}' requires ${model.tier} tier, user has ${userTier}`
    }
}

/**
 * Get models available to a user based on their tier
 */
export async function getAvailableModels(userId: string): Promise<AIModel[]> {
    const userTier = await getUserTier(userId)
    const allowedTiers = TIER_ACCESS[userTier]

    return AI_MODELS.filter(model => allowedTiers.includes(model.tier))
}

// ============================================================================
// Usage Tracking
// ============================================================================

/**
 * Increment usage counters for a user
 */
export async function trackUsage(
    userId: string,
    modelId: string,
    provider: string,
    tokensUsed: number = 0
): Promise<void> {
    try {
        const supabase = getSupabaseAdmin()

        // Use the database function to increment usage
        await supabase.rpc('increment_ai_usage', {
            p_user_id: userId,
            p_model_id: modelId,
            p_provider: provider,
            p_tokens: tokensUsed
        })
    } catch (error) {
        // Don't fail the request if usage tracking fails
        console.error('[ModelAuth] Failed to track usage:', error)
    }
}

/**
 * Get current month's usage for a user
 */
export async function getMonthlyUsage(userId: string): Promise<UsageStats | null> {
    try {
        const supabase = getSupabaseAdmin()
        const periodStart = new Date()
        periodStart.setDate(1)
        periodStart.setHours(0, 0, 0, 0)

        const { data, error } = await supabase
            .from('ai_usage')
            .select('tokens_used, requests_count, period_start, period_end')
            .eq('user_id', userId)
            .gte('period_start', periodStart.toISOString())

        if (error || !data || data.length === 0) {
            return null
        }

        // Aggregate across all models
        const totals = data.reduce((acc, row) => ({
            tokensUsed: acc.tokensUsed + (row.tokens_used || 0),
            requestsCount: acc.requestsCount + (row.requests_count || 0),
        }), { tokensUsed: 0, requestsCount: 0 })

        return {
            tokensUsed: totals.tokensUsed,
            requestsCount: totals.requestsCount,
            periodStart,
            periodEnd: new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1)
        }
    } catch (error) {
        console.error('[ModelAuth] Failed to get usage:', error)
        return null
    }
}

/**
 * Check if user is within their usage limits
 */
export async function checkUsageLimits(userId: string): Promise<{
    withinLimits: boolean
    tokensRemaining: number
    requestsRemaining: number
}> {
    const userTier = await getUserTier(userId)
    const limits = TIER_LIMITS[userTier]
    const usage = await getMonthlyUsage(userId)

    const tokensUsed = usage?.tokensUsed || 0
    const requestsUsed = usage?.requestsCount || 0

    return {
        withinLimits: tokensUsed < limits.tokensPerMonth,
        tokensRemaining: Math.max(0, limits.tokensPerMonth - tokensUsed),
        requestsRemaining: Math.max(0, limits.requestsPerDay - requestsUsed) // Note: This is simplified
    }
}

// ============================================================================
// Security Audit Logging
// ============================================================================

/**
 * Log a security event for audit purposes
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
        const supabase = getSupabaseAdmin()

        await supabase.from('security_audit_log').insert({
            user_id: event.userId,
            event_type: event.eventType,
            requested_resource: event.requestedResource,
            allowed_resource: event.allowedResource,
            user_tier: event.userTier,
            ip_address: event.ipAddress,
            user_agent: event.userAgent,
            metadata: event.metadata || {}
        })
    } catch (error) {
        // Log to console as fallback - never fail the request
        console.error('[SecurityAudit] Failed to log event:', event, error)
    }
}

/**
 * Log an unauthorized model access attempt
 */
export async function logUnauthorizedModelAccess(
    userId: string,
    requestedModel: string,
    allowedModel: string,
    userTier: string,
    request?: Request
): Promise<void> {
    await logSecurityEvent({
        eventType: 'unauthorized_model_access',
        userId,
        requestedResource: requestedModel,
        allowedResource: allowedModel,
        userTier,
        ipAddress: request?.headers.get('x-forwarded-for') ||
            request?.headers.get('x-real-ip') ||
            undefined,
        userAgent: request?.headers.get('user-agent') || undefined,
        metadata: {
            timestamp: new Date().toISOString(),
            severity: 'warning'
        }
    })
}
