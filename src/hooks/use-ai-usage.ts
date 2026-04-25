"use client"

/**
 * useAIUsage - Hook for tracking AI token usage
 *
 * Delegates all data fetching to usageService (single source of truth).
 * This hook adds React Query caching and derived convenience methods.
 */

import { useCallback, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./use-auth"
import { useSubscription } from "./use-subscription"
import { getModelMultiplier } from "@/lib/payments/subscription"
import { usageService, type UsageDetails } from "@/services/common/usage-service"

// Query key for AI usage - shared across all useAIUsage calls
export const aiUsageQueryKey = ["ai", "usage"] as const

export type AIUsageStats = UsageDetails

interface UseAIUsageReturn {
  usage: AIUsageStats | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  /** Check if user can afford a request with given model */
  canAfford: (modelId: string, estimatedTokens?: number) => boolean
}

export function useAIUsage(): UseAIUsageReturn {
  const { user } = useAuth()
  const { tier, loading: tierLoading } = useSubscription()
  const queryClient = useQueryClient()

  const { data: usage = null, isLoading, error: queryError } = useQuery({
    queryKey: [...aiUsageQueryKey, user?.id, tier],
    queryFn: async (): Promise<AIUsageStats | null> => {
      if (!user) return null
      return usageService.getUsageDetails(user.id, tier)
    },
    enabled: !tierLoading && !!user,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  })

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: aiUsageQueryKey })
  }, [queryClient])

  const canAfford = useCallback((modelId: string, estimatedTokens: number = 2000) => {
    if (!usage) return true
    const multiplier = getModelMultiplier(modelId)
    const cost = estimatedTokens * multiplier
    return usage.tokensRemaining >= cost
  }, [usage])

  const error = useMemo(() => {
    if (queryError) {
      return queryError instanceof Error ? queryError.message : "Failed to load usage data"
    }
    return null
  }, [queryError])

  return {
    usage,
    loading: isLoading || tierLoading,
    error,
    refresh,
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
