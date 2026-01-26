"use client"

import { Zap, TrendingUp, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export interface AIUsageCardProps {
  usage: {
    tokensUsed: number
    tokenLimit: number
    extraCredits: number
    totalAvailable: number
    usagePercent: number
    thresholdLevel: 'ok' | 'moderate' | 'high' | 'critical' | 'exceeded'
    shouldShowReminder: boolean
    reminderMessage?: string
  }
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}k`
  return tokens.toString()
}

export function AIUsageCard({ usage }: AIUsageCardProps) {
  const getStatusColor = () => {
    switch (usage.thresholdLevel) {
      case 'exceeded':
        return 'text-red-600 dark:text-red-400'
      case 'critical':
        return 'text-orange-600 dark:text-orange-400'
      case 'high':
        return 'text-amber-600 dark:text-amber-400'
      default:
        return 'text-green-600 dark:text-green-400'
    }
  }

  const getProgressColor = () => {
    switch (usage.thresholdLevel) {
      case 'exceeded':
        return 'bg-red-500'
      case 'critical':
        return 'bg-orange-500'
      case 'high':
        return 'bg-amber-500'
      default:
        return 'bg-green-500'
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          AI-användning
        </h4>
        <span className={cn("text-sm font-medium", getStatusColor())}>
          {usage.usagePercent}%
        </span>
      </div>

      <Progress 
        value={Math.min(100, usage.usagePercent)} 
        className={cn("h-2", getProgressColor())}
      />

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Använt</div>
          <div className="font-medium">{formatTokens(usage.tokensUsed)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Budget</div>
          <div className="font-medium">{formatTokens(usage.totalAvailable)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Kvar</div>
          <div className={cn("font-medium", getStatusColor())}>
            {formatTokens(Math.max(0, usage.totalAvailable - usage.tokensUsed))}
          </div>
        </div>
      </div>

      {usage.extraCredits > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          +{formatTokens(usage.extraCredits)} extra credits
        </div>
      )}

      {usage.thresholdLevel !== 'ok' && (
        <div className={cn(
          "flex items-start gap-2 p-2 rounded-md text-sm",
          usage.thresholdLevel === 'exceeded' ? "bg-red-500/10" :
          usage.thresholdLevel === 'critical' ? "bg-orange-500/10" :
          "bg-amber-500/10"
        )}>
          <AlertTriangle className={cn("h-4 w-4 mt-0.5", getStatusColor())} />
          <span className={getStatusColor()}>
            {usage.reminderMessage || 'Din AI-budget börjar ta slut.'}
          </span>
        </div>
      )}
    </div>
  )
}
