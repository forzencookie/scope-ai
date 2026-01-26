"use client"

/**
 * Subscription Tier Badge
 * 
 * Displays the user's current subscription tier with appropriate styling.
 * Used in sidebar, profile, and upgrade prompts.
 */

import * as React from "react"
import { Crown, Sparkles, Star, Building2, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSubscription, type SubscriptionTier } from "@/hooks/use-subscription"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TierBadgeProps {
  tier?: SubscriptionTier
  showTooltip?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const TIER_CONFIG: Record<SubscriptionTier, {
  icon: LucideIcon
  label: string
  tooltip: string
  className: string
}> = {
  demo: {
    icon: Sparkles,
    label: "Demo",
    tooltip: "Demo-läge med simulerade funktioner",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
  },
  free: {
    icon: Sparkles,
    label: "Demo",
    tooltip: "Demo-läge med simulerade funktioner",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
  },
  pro: {
    icon: Star,
    label: "Pro",
    tooltip: "Pro-abonnemang med fulla funktioner",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
  },
  enterprise: {
    icon: Building2,
    label: "Enterprise",
    tooltip: "Enterprise med prioriterad support",
    className: "bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20",
  },
}

const SIZE_CONFIG = {
  sm: "h-5 text-xs px-1.5 gap-0.5",
  md: "h-6 text-xs px-2 gap-1",
  lg: "h-7 text-sm px-2.5 gap-1.5",
}

export function TierBadge({ 
  tier: propTier, 
  showTooltip = true,
  size = "md",
  className 
}: TierBadgeProps) {
  const { tier: hookTier, loading } = useSubscription()
  const tier = propTier || hookTier

  if (loading && !propTier) {
    return (
      <Badge 
        variant="outline" 
        className={cn(SIZE_CONFIG[size], "animate-pulse bg-muted", className)}
      >
        <span className="w-8" />
      </Badge>
    )
  }

  const config = TIER_CONFIG[tier]
  const IconComponent = config.icon
  const iconSizeClass = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"

  const badge = (
    <Badge 
      variant="outline" 
      className={cn(SIZE_CONFIG[size], config.className, className)}
    >
      <IconComponent className={iconSizeClass} />
      {config.label}
    </Badge>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Inline tier indicator for use in text
 */
export function TierIndicator({ className }: { className?: string }) {
  const { tier, tierName, tierColor, isDemo } = useSubscription()
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
      tierColor,
      className
    )}>
      {isDemo ? <Sparkles className="h-3 w-3" /> : <Crown className="h-3 w-3" />}
      {tierName}
    </span>
  )
}
