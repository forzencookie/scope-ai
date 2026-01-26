"use client"

/**
 * useAIUsage - Hook for tracking AI token usage
 *
 * Fetches the user's current AI usage for the billing period.
 * Uses model multipliers - expensive models consume more of the budget.
 */

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "./use-auth"
import { useSubscription } from "./use-subscription"
import { TIER_TOKEN_LIMITS, getModelMultiplier } from "@/lib/subscription"
import { getSupabaseClient } from "@/lib/database/supabase"

export interface AIUsageStats {
  /** Effective tokens used (with model multipliers applied) */
  tokensUsed: number
  /** Raw tokens used (actual API tokens) */
  rawTokensUsed: number
  /** Total requests this period */
  requestsCount: number
  /** Token limit for current tier */
  tokenLimit: number
  /** Extra credits purchased (tokens) */
  extraCredits: number
  /** Total available tokens (limit + credits) */
  totalAvailable: number
  /** Usage percentage (0-100) */
  usagePercent: number
  /** Whether user is over their limit */
  isOverLimit: boolean
  /** Tokens remaining */
  tokensRemaining: number
  /** Period start date */
  periodStart: Date
  /** Period end date */
  periodEnd: Date
}

interface UseAIUsageReturn {
  usage: AIUsageStats | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  /** Check if user can afford a request with given model */
  canAfford: (modelId: string, estimatedTokens?: number) => boolean
}

function getCurrentBillingPeriod(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return { start, end }
}

export function useAIUsage(): UseAIUsageReturn {
  const { user } = useAuth()
  const { tier, loading: tierLoading } = useSubscription()
  const [usage, setUsage] = useState<AIUsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      const { start, end } = getCurrentBillingPeriod()

      // Fetch usage for current period - include model_id for multiplier calculation
      const { data: usageData, error: usageError } = await supabase
        .from("aiusage")
        .select("tokens_used, requests_count, model_id")
        .eq("user_id", user.id)
        .gte("period_start", start.toISOString())
        .lte("period_end", end.toISOString())

      if (usageError) {
        console.error("Failed to fetch AI usage:", usageError)
      }

      // Calculate effective tokens with model multipliers
      let effectiveTokensUsed = 0
      let rawTokensUsed = 0
      let requestsCount = 0

      if (usageData) {
        for (const row of usageData) {
          const tokens = row.tokens_used || 0
          const modelId = row.model_id || 'gpt-4o-mini'
          const multiplier = getModelMultiplier(modelId)
          
          rawTokensUsed += tokens
          effectiveTokensUsed += tokens * multiplier
          requestsCount += row.requests_count || 0
        }
      }

      // TODO: Fetch extra credits from a credits table when implemented
      const extraCredits = 0

      const tokenLimit = TIER_TOKEN_LIMITS[tier] || 0
      const totalAvailable = tokenLimit + extraCredits
      const tokensRemaining = Math.max(0, totalAvailable - effectiveTokensUsed)
      const usagePercent = totalAvailable > 0 
        ? Math.min(100, Math.round((effectiveTokensUsed / totalAvailable) * 100))
        : 0

      setUsage({
        tokensUsed: effectiveTokensUsed,
        rawTokensUsed,
        requestsCount,
        tokenLimit,
        extraCredits,
        totalAvailable,
        usagePercent,
        isOverLimit: effectiveTokensUsed >= totalAvailable && totalAvailable > 0,
        tokensRemaining,
        periodStart: start,
        periodEnd: end,
      })
    } catch (err) {
      console.error("Error fetching AI usage:", err)
      setError(err instanceof Error ? err.message : "Failed to load usage data")
    } finally {
      setLoading(false)
    }
  }, [user, tier])

  useEffect(() => {
    if (!tierLoading) {
      fetchUsage()
    }
  }, [tierLoading, fetchUsage])

  // Check if user can afford a request with given model
  const canAfford = useCallback((modelId: string, estimatedTokens: number = 2000) => {
    if (!usage) return true // Assume yes if loading
    const multiplier = getModelMultiplier(modelId)
    const cost = estimatedTokens * multiplier
    return usage.tokensRemaining >= cost
  }, [usage])

  return {
    usage,
    loading: loading || tierLoading,
    error,
    refresh: fetchUsage,
    canAfford,
  }
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(0)}k`
  }
  return tokens.toString()
}
