import { createBrowserClient } from '@/lib/database/client'
import { TIER_TOKEN_LIMITS, getModelMultiplier } from '@/lib/subscription'
import type { AIUsageStatus } from '@/lib/ai-schema'

export const USAGE_THRESHOLDS = {
    moderate: 50,
    high: 75,
    critical: 90,
    exceeded: 100,
}

export const usageService = {
    /**
     * Get detailed AI usage statistics for a user
     */
    async getUsageStatus(userId: string): Promise<AIUsageStatus> {
        const supabase = createBrowserClient()

        // 1. Get current billing period
        const now = new Date()
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        // 2. Fetch usage, profile, and credits in parallel
        const [usageRes, profileRes, creditsRes] = await Promise.all([
            supabase
                .from('ai_usage')
                .select('tokens_used, model_id')
                .eq('user_id', userId)
                .gte('period_start', periodStart.toISOString())
                .lte('period_end', periodEnd.toISOString()),
            supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', userId)
                .single(),
            supabase
                .from('user_credits')
                .select('credits_remaining')
                .eq('user_id', userId)
                .eq('is_active', true)
                .gt('expires_at', new Date().toISOString())
        ])

        // 3. Calculate effective tokens
        let tokensUsed = 0
        if (usageRes.data) {
            for (const row of usageRes.data) {
                const multiplier = getModelMultiplier(row.model_id || 'gpt-4o-mini')
                tokensUsed += (row.tokens_used || 0) * multiplier
            }
        }

        // 4. Determine limits
        const tier = (profileRes.data?.subscription_tier as keyof typeof TIER_TOKEN_LIMITS) || 'pro'
        const tokenLimit = TIER_TOKEN_LIMITS[tier] || 0
        const extraCredits = creditsRes.data?.reduce((sum, row) => sum + (row.credits_remaining || 0), 0) || 0
        const totalAvailable = tokenLimit + extraCredits

        // 5. Calculate percentage and threshold
        const usagePercent = totalAvailable > 0 ? Math.round((tokensUsed / totalAvailable) * 100) : 0

        let thresholdLevel: AIUsageStatus['thresholdLevel'] = 'ok'
        let shouldShowReminder = false
        let reminderMessage: string | undefined

        if (usagePercent >= USAGE_THRESHOLDS.exceeded) {
            thresholdLevel = 'exceeded'
            shouldShowReminder = true
            reminderMessage = '⚠️ Du har förbrukat din månadskvot. Köp fler credits under Inställningar > Fakturering för att fortsätta använda AI.'
        } else if (usagePercent >= USAGE_THRESHOLDS.critical) {
            thresholdLevel = 'critical'
            shouldShowReminder = true
            reminderMessage = `📊 Du har använt ${usagePercent}% av din månatliga AI-budget. Du kan köpa fler credits under Inställningar om du behöver.`
        } else if (usagePercent >= USAGE_THRESHOLDS.high) {
            thresholdLevel = 'high'
            shouldShowReminder = true
            reminderMessage = `💡 Du har använt ${usagePercent}% av din AI-budget denna månad.`
        } else if (usagePercent >= USAGE_THRESHOLDS.moderate) {
            thresholdLevel = 'moderate'
            // Only show moderate reminder occasionally (every 5th check at this level)
            shouldShowReminder = Math.random() < 0.2
            if (shouldShowReminder) {
                reminderMessage = `📈 Du har använt ${usagePercent}% av din AI-budget.`
            }
        }

        return {
            tokensUsed,
            tokenLimit,
            extraCredits,
            totalAvailable,
            usagePercent,
            thresholdLevel,
            shouldShowReminder,
            reminderMessage,
        }
    }
}
