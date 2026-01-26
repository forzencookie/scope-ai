"use client"

/**
 * Upgrade Prompt
 * 
 * Shown when demo users try to access features that require a paid subscription.
 * Can be displayed inline or as a modal dialog.
 */

import * as React from "react"
import { ArrowRight, Sparkles, Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { GatedFeature } from "@/lib/subscription"
import { getUpgradePrompt } from "@/lib/subscription"

interface UpgradePromptProps {
  feature?: GatedFeature
  title?: string
  description?: string
  className?: string
}

const PRO_FEATURES = [
  "Riktig AI med GPT-4 och Claude",
  "Automatisk dokumentanalys",
  "Bankintegration",
  "Skicka in till Skatteverket",
  "Teamfunktioner",
  "Prioriterad support",
]

/**
 * Inline upgrade prompt card
 */
export function UpgradePrompt({ 
  feature, 
  title,
  description,
  className 
}: UpgradePromptProps) {
  const featureDescription = feature ? getUpgradePrompt(feature) : null
  
  return (
    <Card className={cn(
      "border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <CardTitle className="text-base">
            {title || "Uppgradera till Pro"}
          </CardTitle>
        </div>
        <CardDescription>
          {description || featureDescription || "Lås upp alla funktioner med ett Pro-abonnemang"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          {PRO_FEATURES.slice(0, 4).map((feat) => (
            <div key={feat} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
        <Button className="w-full" asChild>
          <Link href="/priser">
            Se priser
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Compact upgrade button with optional dialog
 */
export function UpgradeButton({ 
  feature,
  showDialog = true,
  variant = "default",
  size = "default",
  className,
}: {
  feature?: GatedFeature
  showDialog?: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}) {
  const featureDescription = feature ? getUpgradePrompt(feature) : null

  if (!showDialog) {
    return (
      <Button variant={variant} size={size} className={className} asChild>
        <Link href="/priser">
          <Zap className="mr-2 h-4 w-4" />
          Uppgradera
        </Link>
      </Button>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Zap className="mr-2 h-4 w-4" />
          Uppgradera
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Uppgradera till Pro
          </DialogTitle>
          <DialogDescription>
            {featureDescription || "Lås upp alla funktioner för ditt företag"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {PRO_FEATURES.map((feat) => (
            <div key={feat} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Button className="flex-1" asChild>
            <Link href="/priser">
              Se priser
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Feature gate wrapper
 * Shows children for paid users, upgrade prompt for demo users
 */
export function FeatureGate({
  feature,
  children,
  fallback,
}: {
  feature: GatedFeature
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { useSubscription } = require("@/hooks/use-subscription")
  const { canUse, isSimulated, loading } = useSubscription()

  if (loading) {
    return null
  }

  if (canUse(feature)) {
    return <>{children}</>
  }

  return fallback ?? <UpgradePrompt feature={feature} />
}
