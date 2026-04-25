import { createBrowserClient } from '@/lib/database/client'
import { TIER_TOKEN_LIMITS, getModelMultiplier } from '@/lib/payments/subscription'
import type { AIUsageStatus } from '@/lib/ai/schema'

export const USAGE_THRESHOLDS = {
    moderate: 50,
    high: 75,
    critical: 90,
    exceeded: 100,
}

/** Extended usage data including raw counts and period dates (used by UI hooks) */
export interface UsageDetails extends AIUsageStatus {
    rawTokensUsed: number
    requestsCount: number
    tokensRemaining: number
    isOverLimit: boolean
    periodStart: Date
    periodEnd: Date
}

function getCurrentBillingPeriod(): { start: Date; end: Date } {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    return { start, end }
}

export const usageService = {
    /**
     * Get AI usage status with threshold reminders (used by AI tools).
     */
    async getUsageStatus(userId: string): Promise<AIUsageStatus> {
        const details = await usageService.getUsageDetails(userId)
        return {
            tokensUsed: details.tokensUsed,
            tokenLimit: details.tokenLimit,
            extraCredits: details.extraCredits,
            totalAvailable: details.totalAvailable,
            usagePercent: details.usagePercent,
            thresholdLevel: details.thresholdLevel,
            shouldShowReminder: details.shouldShowReminder,
            reminderMessage: details.reminderMessage,
        }
    },

    /**
     * Get detailed usage data including raw tokens, request counts, and period info.
     * Single source of truth for all AI usage queries.
     */
    async getUsageDetails(userId: string, tier?: string): Promise<UsageDetails> {
        const supabase = createBrowserClient()
        const { start, end } = getCurrentBillingPeriod()

        // Fetch usage and credits in parallel
        const [usageRes, creditsRes, profileRes] = await Promise.all([
            supabase
                .from('ai_usage')
                .select('tokens_used, requests_count, model_id')
                .eq('user_id', userId)
                .gte('period_start', start.toISOString())
                .lte('period_end', end.toISOString()),
            supabase.rpc('get_user_credits', { p_user_id: userId }),
            // Only fetch profile if tier not provided (avoids redundant query when hook already has it)
            tier
                ? Promise.resolve({ data: null })
                : supabase
                    .from('profiles')
                    .select('subscription_tier')
                    .eq('id', userId)
                    .single(),
        ])

        // Calculate effective tokens with model multipliers
        let tokensUsed = 0
        let rawTokensUsed = 0
        let requestsCount = 0

        if (usageRes.data) {
            for (const row of usageRes.data) {
                const tokens = row.tokens_used || 0
                const multiplier = getModelMultiplier(row.model_id || 'gpt-5-mini')
                rawTokensUsed += tokens
                tokensUsed += tokens * multiplier
                requestsCount += row.requests_count || 0
            }
        }

        // Determine tier and limits
        const effectiveTier = (tier || profileRes.data?.subscription_tier || 'pro') as keyof typeof TIER_TOKEN_LIMITS
        const tokenLimit = TIER_TOKEN_LIMITS[effectiveTier] || 0
        const extraCredits = typeof creditsRes.data === 'number' ? creditsRes.data : 0
        const totalAvailable = tokenLimit + extraCredits
        const tokensRemaining = Math.max(0, totalAvailable - tokensUsed)
        const usagePercent = totalAvailable > 0 ? Math.min(100, Math.round((tokensUsed / totalAvailable) * 100)) : 0

        // Threshold logic
        let thresholdLevel: AIUsageStatus['thresholdLevel'] = 'ok'
        let shouldShowReminder = false
        let reminderMessage: string | undefined

        if (usagePercent >= USAGE_THRESHOLDS.exceeded) {
            thresholdLevel = 'exceeded'
            shouldShowReminder = true
            reminderMessage = 'Du har förbrukat din månadskvot. Köp fler credits under Inställningar > Fakturering för att fortsätta använda AI.'
        } else if (usagePercent >= USAGE_THRESHOLDS.critical) {
            thresholdLevel = 'critical'
            shouldShowReminder = true
            reminderMessage = `Du har använt ${usagePercent}% av din månatliga AI-budget. Du kan köpa fler credits under Inställningar om du behöver.`
        } else if (usagePercent >= USAGE_THRESHOLDS.high) {
            thresholdLevel = 'high'
            shouldShowReminder = true
            reminderMessage = `Du har använt ${usagePercent}% av din AI-budget denna månad.`
        } else if (usagePercent >= USAGE_THRESHOLDS.moderate) {
            thresholdLevel = 'moderate'
            shouldShowReminder = Math.random() < 0.2
            if (shouldShowReminder) {
                reminderMessage = `Du har använt ${usagePercent}% av din AI-budget.`
            }
        }

        return {
            tokensUsed,
            rawTokensUsed,
            requestsCount,
            tokenLimit,
            extraCredits,
            totalAvailable,
            usagePercent,
            tokensRemaining,
            isOverLimit: tokensUsed >= totalAvailable && totalAvailable > 0,
            periodStart: start,
            periodEnd: end,
            thresholdLevel,
            shouldShowReminder,
            reminderMessage,
        }
    },
}
