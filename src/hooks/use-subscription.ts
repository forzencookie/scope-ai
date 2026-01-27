"use client"

/**
 * useSubscription - Hook for subscription tier management
 *
 * Provides access to the user's subscription tier and feature gates.
 * Handles demo mode detection and upgrade prompts.
 * 
 * PERFORMANCE: Uses React Query for automatic caching and deduplication.
 * Multiple components calling useSubscription() share the same cached data.
 */

import { useCallback, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./use-auth"
import {
  SubscriptionTier,
  GatedFeature,
  canUseFeature,
  isFeatureSimulated,
  isDemoTier,
  isPaidTier,
  TIER_DISPLAY_NAMES,
  TIER_COLORS,
  getUpgradePrompt,
} from "@/lib/subscription"

// Query key for subscription data - shared across all useSubscription calls
export const subscriptionQueryKey = ["subscription", "tier"] as const

interface UseSubscriptionReturn {
  /** Current subscription tier */
  tier: SubscriptionTier
  /** Display name for the tier */
  tierName: string
  /** Tailwind classes for tier badge */
  tierColor: string
  /** Whether user is in demo mode */
  isDemo: boolean
  /** Whether user has paid subscription */
  isPaid: boolean
  /** Loading state */
  loading: boolean
  /** Check if a feature is available */
  canUse: (feature: GatedFeature) => boolean
  /** Check if feature should be simulated */
  isSimulated: (feature: GatedFeature) => boolean
  /** Get upgrade prompt for a feature */
  getUpgradeMessage: (feature: GatedFeature) => string
  /** Refresh subscription from server */
  refresh: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()

  // Use React Query for caching and deduplication
  const { data: tier = "demo", isLoading } = useQuery({
    queryKey: subscriptionQueryKey,
    queryFn: async (): Promise<SubscriptionTier> => {
      if (!user) return "demo"
      
      const res = await fetch("/api/user/profile")
      if (res.ok) {
        const profile = await res.json()
        const userTier = profile.subscription_tier as SubscriptionTier
        // Treat 'free' as 'demo'
        return userTier === "free" ? "demo" : userTier || "demo"
      }
      return "demo"
    },
    enabled: !authLoading && !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    placeholderData: "demo" as SubscriptionTier,
  })

  // Refresh function
  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: subscriptionQueryKey })
  }, [queryClient])

  // Memoized helpers
  const canUse = useCallback(
    (feature: GatedFeature) => canUseFeature(tier, feature),
    [tier]
  )

  const isSimulated = useCallback(
    (feature: GatedFeature) => isFeatureSimulated(tier, feature),
    [tier]
  )

  const getUpgradeMessage = useCallback(
    (feature: GatedFeature) => getUpgradePrompt(feature),
    []
  )

  return useMemo(
    () => ({
      tier,
      tierName: TIER_DISPLAY_NAMES[tier],
      tierColor: TIER_COLORS[tier],
      isDemo: isDemoTier(tier),
      isPaid: isPaidTier(tier),
      loading: isLoading || authLoading,
      canUse,
      isSimulated,
      getUpgradeMessage,
      refresh,
    }),
    [tier, isLoading, authLoading, canUse, isSimulated, getUpgradeMessage, refresh]
  )
}

// Re-export types for convenience
export type { SubscriptionTier, GatedFeature }
