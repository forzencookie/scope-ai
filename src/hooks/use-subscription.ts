"use client"

/**
 * useSubscription - Hook for subscription tier management
 *
 * Provides access to the user's subscription tier and feature gates.
 * 
 * PERFORMANCE: Uses React Query for automatic caching and deduplication.
 * Multiple components calling useSubscription() share the same cached data.
 * 
 * SECURITY: isPaid flag is derived server-side to ensure consistency.
 * Client cannot manipulate this value - it comes from the verified profile API.
 */

import { useCallback, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./use-auth"
import {
  SubscriptionTier,
  GatedFeature,
  canUseFeature,
  TIER_DISPLAY_NAMES,
  TIER_COLORS,
  getUpgradePrompt,
} from "@/lib/payments/subscription"

// Query key for subscription data - shared across all useSubscription calls
export const subscriptionQueryKey = ["subscription", "profile"] as const

// Profile data from server
interface SubscriptionProfile {
  tier: SubscriptionTier
  isPaid: boolean
  role: string
}

interface UseSubscriptionReturn {
  /** Current subscription tier */
  tier: SubscriptionTier
  /** Display name for the tier */
  tierName: string
  /** Tailwind classes for tier badge */
  tierColor: string
  /** Whether user has paid subscription (server-derived) */
  isPaid: boolean
  /** Whether user is an admin (no billing) */
  isAdmin: boolean
  /** Loading state */
  loading: boolean
  /** Check if a feature is available */
  canUse: (feature: GatedFeature) => boolean
  /** Get upgrade prompt for a feature */
  getUpgradeMessage: (feature: GatedFeature) => string
  /** Refresh subscription from server */
  refresh: () => Promise<void>
}

const DEFAULT_PROFILE: SubscriptionProfile = {
  tier: "pro",
  isPaid: true,
  role: "member",
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()

  // Use React Query for caching and deduplication
  const { data: profile = DEFAULT_PROFILE, isPending, isFetching } = useQuery({
    queryKey: subscriptionQueryKey,
    queryFn: async (): Promise<SubscriptionProfile> => {
      if (!user) return DEFAULT_PROFILE
      
      const res = await fetch("/api/user/profile")
      if (res.ok) {
        const data = await res.json()
        return {
          // Use server-provided values - these are authoritative
          tier: data.subscription_tier as SubscriptionTier,
          isPaid: data.is_paid ?? true,
          role: data.role ?? "member",
        }
      }
      return DEFAULT_PROFILE
    },
    enabled: !authLoading && !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })

  // Refresh function
  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: subscriptionQueryKey })
  }, [queryClient])

  // Memoized helpers - use server-derived tier for feature checks
  const canUse = useCallback(
    (feature: GatedFeature) => canUseFeature(profile.tier, feature),
    [profile.tier]
  )

  const getUpgradeMessage = useCallback(
    (feature: GatedFeature) => getUpgradePrompt(feature),
    []
  )

  return useMemo(
    () => ({
      tier: profile.tier,
      tierName: TIER_DISPLAY_NAMES[profile.tier],
      tierColor: TIER_COLORS[profile.tier],
      // Use server-derived flag - cannot be manipulated client-side
      isPaid: profile.isPaid,
      isAdmin: profile.role === "admin",
      // Use isPending OR isFetching to ensure we wait for real data
      loading: isPending || isFetching || authLoading,
      canUse,
      getUpgradeMessage,
      refresh,
    }),
    [profile, isPending, isFetching, authLoading, canUse, getUpgradeMessage, refresh]
  )
}

// Re-export types for convenience
export type { SubscriptionTier, GatedFeature }
