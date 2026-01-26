"use client"

/**
 * useAIUsage - Hook for tracking AI token usage
 *
 * Fetches the user's current AI usage for the billing period
 * and provides helpers for displaying usage stats.
 */

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "./use-auth"
import { useSubscription } from "./use-subscription"
import { TIER_TOKEN_LIMITS } from "@/lib/subscription"
import { getSupabaseClient } from "@/lib/database/supabase"

export interface AIUsageStats {
  /** Total tokens used this period */
  tokensUsed: number
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

      // Fetch usage for current period
      const { data: usageData, error: usageError } = await supabase
        .from("aiusage")
        .select("tokens_used, requests_count")
        .eq("user_id", user.id)
        .gte("period_start", start.toISOString())
        .lte("period_end", end.toISOString())

      if (usageError) {
        console.error("Failed to fetch AI usage:", usageError)
        // Don't throw - just use defaults
      }

      // Sum up usage across all models
      const tokensUsed = usageData?.reduce((sum: number, row: { tokens_used?: number }) => sum + (row.tokens_used || 0), 0) || 0
      const requestsCount = usageData?.reduce((sum: number, row: { requests_count?: number }) => sum + (row.requests_count || 0), 0) || 0

      // TODO: Fetch extra credits from a credits table when implemented
      const extraCredits = 0

      const tokenLimit = TIER_TOKEN_LIMITS[tier] || 0
      const totalAvailable = tokenLimit + extraCredits
      const tokensRemaining = Math.max(0, totalAvailable - tokensUsed)
      const usagePercent = totalAvailable > 0 
        ? Math.min(100, Math.round((tokensUsed / totalAvailable) * 100))
        : 0

      setUsage({
        tokensUsed,
        requestsCount,
        tokenLimit,
        extraCredits,
        totalAvailable,
        usagePercent,
        isOverLimit: tokensUsed >= totalAvailable && totalAvailable > 0,
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

  return {
    usage,
    loading: loading || tierLoading,
    error,
    refresh: fetchUsage,
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
