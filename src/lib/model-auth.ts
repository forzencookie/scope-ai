/**
 * Server-Side Model Authorization
 * 
 * Prevents users from accessing AI models they haven't paid for.
 * This is the critical security layer that validates model access
 * server-side, preventing client-side bypass attacks.
 */

// TODO: Run `npx supabase gen types typescript` after applying migration

import { getSupabaseAdmin } from './database/supabase'
import { getModelById, DEFAULT_MODEL_ID, AI_MODELS, type ModelTier, type AIModel } from './ai/models'

// ============================================================================
// Types
// ============================================================================

interface UsageRow {
    tokens_used?: number
    requests_count?: number
    period_start?: string
    period_end?: string
}

export interface ModelAuthResult {
    authorized: boolean
    modelId: string           // Authorized model ID (may be fallback)
    model: AIModel
    userTier: UserTier
    requestedTier: ModelTier | 'unknown'
    reason?: string
}

export type UserTier = 'demo' | 'free' | 'pro' | 'enterprise'

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
 * Demo users cannot access any real AI models.
 */
const TIER_ACCESS: Record<UserTier, ModelTier[]> = {
    'demo': [], // Demo users get simulated responses, no real AI
    'free': [], // Free deprecated, treat same as demo
    'pro': ['free', 'pro'],
    'enterprise': ['free', 'pro', 'enterprise'],
}

/**
 * Monthly token limits per tier
 */
export const TIER_LIMITS: Record<UserTier, { tokensPerMonth: number; requestsPerDay: number }> = {
    'demo': { tokensPerMonth: 0, requestsPerDay: 0 }, // Demo gets simulated AI, no real tokens
    'free': { tokensPerMonth: 0, requestsPerDay: 0 }, // Free deprecated, same as demo
    'pro': { tokensPerMonth: 500_000, requestsPerDay: 500 },
    'enterprise': { tokensPerMonth: 5_000_000, requestsPerDay: 5000 },
}

// ============================================================================
// Core Authorization Functions
// ============================================================================

/**
 * Get user's subscription tier from database
 * Returns 'demo' by default for unauthenticated/new users
 */
export async function getUserTier(userId: string): Promise<UserTier> {
    try {
        const supabase = getSupabaseAdmin()

        // Query the profiles table for subscription tier
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .single()

        if (profileError || !profile) {
            console.warn('[ModelAuth] Profile not found for user:', userId)
            return 'demo'
        }

        const tier = profile.subscription_tier as UserTier
        
        // Treat 'free' as 'demo' (free is deprecated)
        if (tier === 'free') {
            return 'demo'
        }
        
        // Validate tier is one of our known values
        if (['demo', 'pro', 'enterprise'].includes(tier)) {
            return tier
        }
        
        return 'demo'
    } catch (error) {
        console.error('[ModelAuth] Failed to get user tier:', error)
        // Default to 'demo' to prevent unauthorized access due to DB issues
        return 'demo'
    }
}

/**
 * Check if user is in demo mode (simulated AI, no real API calls)
 */
export function isDemoMode(tier: UserTier): boolean {
    return tier === 'demo' || tier === 'free'
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await supabase
            .from('ai_usage' as any)
            .select('tokens_used, requests_count, period_start, period_end')
            .eq('user_id', userId)
            .gte('period_start', periodStart.toISOString())

        if (error || !data || data.length === 0) {
            return null
        }

        // Aggregate across all models
        const totals = (data as UsageRow[]).reduce((acc, row) => ({
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
 * Now includes purchased credits as additional budget
 */
export async function checkUsageLimits(userId: string): Promise<{
    withinLimits: boolean
    tokensRemaining: number
    requestsRemaining: number
    tierTokensRemaining: number
    purchasedCreditsRemaining: number
}> {
    const supabase = getSupabaseAdmin()
    const userTier = await getUserTier(userId)
    const limits = TIER_LIMITS[userTier]
    const usage = await getMonthlyUsage(userId)

    const tokensUsed = usage?.tokensUsed || 0
    const requestsUsed = usage?.requestsCount || 0
    
    // Get purchased credits
    const { data: creditsData } = await supabase.rpc('get_user_credits', {
        p_user_id: userId
    })
    const purchasedCredits = creditsData || 0

    const tierTokensRemaining = Math.max(0, limits.tokensPerMonth - tokensUsed)
    const totalRemaining = tierTokensRemaining + purchasedCredits

    return {
        withinLimits: totalRemaining > 0,
        tokensRemaining: totalRemaining,
        requestsRemaining: Math.max(0, limits.requestsPerDay - requestsUsed),
        tierTokensRemaining,
        purchasedCreditsRemaining: purchasedCredits,
    }
}

/**
 * Consume tokens from user's budget.
 * First uses tier allocation, then purchased credits.
 * Returns true if consumption was successful.
 */
export async function consumeTokens(
    userId: string,
    tokensToConsume: number,
    modelId: string
): Promise<{ success: boolean; source: 'tier' | 'credits' | 'mixed'; tokensFromCredits: number }> {
    const supabase = getSupabaseAdmin()
    const limits = await checkUsageLimits(userId)
    
    // Apply model multiplier for effective cost
    const { getModelMultiplier } = await import('./subscription')
    const multiplier = getModelMultiplier(modelId)
    const effectiveTokens = Math.ceil(tokensToConsume * multiplier)

    if (effectiveTokens > limits.tokensRemaining) {
        // Not enough budget
        return { success: false, source: 'tier', tokensFromCredits: 0 }
    }

    let tokensFromCredits = 0
    let source: 'tier' | 'credits' | 'mixed' = 'tier'

    // If tier budget is exhausted or will be exhausted, use credits
    if (limits.tierTokensRemaining < effectiveTokens) {
        // Need to use some credits
        tokensFromCredits = effectiveTokens - limits.tierTokensRemaining
        
        if (limits.tierTokensRemaining === 0) {
            source = 'credits'
        } else {
            source = 'mixed'
        }

        // Consume from purchased credits
        const { data: consumeSuccess } = await supabase.rpc('consume_user_credits', {
            p_user_id: userId,
            p_amount: tokensFromCredits
        })

        if (!consumeSuccess) {
            console.error('[ModelAuth] Failed to consume credits')
            return { success: false, source: 'tier', tokensFromCredits: 0 }
        }
    }

    return { success: true, source, tokensFromCredits }
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('security_audit_log' as any).insert({
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
