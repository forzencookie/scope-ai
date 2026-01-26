"use client"

/**
 * useSubscription - Hook for subscription tier management
 *
 * Provides access to the user's subscription tier and feature gates.
 * Handles demo mode detection and upgrade prompts.
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "./use-auth"
import {
  SubscriptionTier,
  GatedFeature,
  getFeatureAccess,
  canUseFeature,
  isFeatureSimulated,
  isDemoTier,
  isPaidTier,
  TIER_DISPLAY_NAMES,
  TIER_COLORS,
  getUpgradePrompt,
} from "@/lib/subscription"

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
  const [tier, setTier] = useState<SubscriptionTier>("demo")
  const [loading, setLoading] = useState(true)

  // Fetch subscription tier from profile
  const fetchTier = useCallback(async () => {
    if (!user) {
      setTier("demo")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/user/profile")
      if (res.ok) {
        const profile = await res.json()
        const userTier = profile.subscription_tier as SubscriptionTier
        // Treat 'free' as 'demo'
        setTier(userTier === "free" ? "demo" : userTier || "demo")
      } else {
        setTier("demo")
      }
    } catch (error) {
      console.error("Failed to fetch subscription tier:", error)
      setTier("demo")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) {
      fetchTier()
    }
  }, [authLoading, fetchTier])

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
      loading: loading || authLoading,
      canUse,
      isSimulated,
      getUpgradeMessage,
      refresh: fetchTier,
    }),
    [tier, loading, authLoading, canUse, isSimulated, getUpgradeMessage, fetchTier]
  )
}

// Re-export types for convenience
export type { SubscriptionTier, GatedFeature }
