/**
 * Server-Side Model Authorization
 * 
 * Prevents users from accessing AI models they haven't paid for.
 * This is the critical security layer that validates model access
 * server-side, preventing client-side bypass attacks.
 */

// TODO: Run `npx supabase gen types typescript` after applying migration

import { createServerClient } from './database/client'
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

export type UserTier = 'pro' | 'max' | 'enterprise'

export interface UsageStats {
    tokensUsed: number
    requestsCount: number
    periodStart: Date
    periodEnd: Date
}

// ============================================================================
// Tier Access Control
// ============================================================================

/**
 * Defines which user tiers can access which model tiers.
 * Users can access their tier and all lower tiers.
 */
const TIER_ACCESS: Record<UserTier, ModelTier[]> = {
    'pro': ['pro'],
    'max': ['pro', 'max'],
    'enterprise': ['pro', 'max', 'enterprise'],
}

/**
 * Monthly token limits per tier
 */
export const TIER_LIMITS: Record<UserTier, { tokensPerMonth: number; requestsPerDay: number }> = {
    'pro': { tokensPerMonth: 10_000_000, requestsPerDay: 5000 },
    'max': { tokensPerMonth: 50_000_000, requestsPerDay: 20000 },
    'enterprise': { tokensPerMonth: 999_999_999, requestsPerDay: 999999 },
}

// ============================================================================
// Core Authorization Functions
// ============================================================================

/**
 * Get user's subscription tier from database
 * Returns 'pro' by default for unauthenticated/new users (so waitlist users can use the app if needed, or based on your default)
 */
export async function getUserTier(userId: string): Promise<UserTier> {
    try {
        const supabase = await createServerClient()

        // Query the profiles table for subscription tier
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .single()

        if (profileError || !profile) {
            console.warn('[ModelAuth] Profile not found for user:', userId)
            return 'pro'
        }

        const tier = profile.subscription_tier as string
        
        // Map legacy tiers or validate known values
        if (['pro', 'max', 'enterprise'].includes(tier)) {
            return tier as UserTier
        }
        
        return 'pro'
    } catch (error) {
        console.error('[ModelAuth] Failed to get user tier:', error)
        // Default to 'pro' to prevent unauthorized access due to DB issues
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
        const supabase = await createServerClient()

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
        const supabase = await createServerClient()
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
    const supabase = await createServerClient()
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
    const supabase = await createServerClient()
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

