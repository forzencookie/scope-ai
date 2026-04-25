/**
 * Settings Service (Server-only)
 *
 * Manages user settings, integrations, and subscription data.
 * Use this in Server Components, Route Handlers, and Server Actions.
 */

import 'server-only'
import { createServerClient } from '@/lib/database/server'
import { getMonthlyUsage, checkUsageLimits } from '@/lib/ai/model-auth'
import { 
    UserProfile, 
    SubscriptionStatus 
} from './settings-service'

// =============================================================================
// Tier Limits Configuration
// =============================================================================

const TIER_LIMITS: Record<string, { tokens: number; requests: number }> = {
    pro: { tokens: 2000000, requests: 2000 },
    max: { tokens: 10000000, requests: 10000 },
    enterprise: { tokens: 999999999, requests: 999999 },
}

// =============================================================================
// Profile & Subscription
// =============================================================================

/**
 * Get user profile from the database
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = await createServerClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, subscription_tier, created_at, updated_at')
        .eq('id', userId)
        .single()

    if (error || !data) {
        console.error('[SettingsService] Failed to fetch profile:', error)
        return null
    }

    return data as UserProfile
}

/**
 * Get subscription status with real usage data
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    const profile = await getUserProfile(userId)
    if (!profile) return null

    // Get real usage from model-auth
    const usage = await getMonthlyUsage(userId)
    const limits = await checkUsageLimits(userId)

    const tier = (profile.subscription_tier || 'pro') as keyof typeof TIER_LIMITS
    const tierConfig = TIER_LIMITS[tier] || TIER_LIMITS.pro

    // Calculate period end (end of current month)
    const now = new Date()
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
        plan: tier as SubscriptionStatus['plan'],
        status: 'active', // Would integrate with Stripe in production
        currentPeriodEnd: periodEnd.toISOString().split('T')[0],
        usageThisMonth: {
            aiRequests: usage?.requestsCount || 0,
            aiRequestsLimit: tierConfig.requests,
            tokensUsed: usage?.tokensUsed || 0,
            tokensLimit: tierConfig.tokens,
        },
        billingEmail: profile.email,
        remainingTokens: limits?.tokensRemaining ?? tierConfig.tokens,
    }
}

// =============================================================================
// Export Service Object
// =============================================================================

export const settingsService = {
    getUserProfile,
    getSubscriptionStatus,
}
