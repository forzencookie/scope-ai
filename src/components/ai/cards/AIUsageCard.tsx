"use client"

import { TrendingUp, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui"

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
  const remainingPercent = Math.max(0, 100 - usage.usagePercent)

  const getIndicatorColor = () => {
    switch (usage.thresholdLevel) {
      case 'exceeded':
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  const getStatusColor = () => {
    switch (usage.thresholdLevel) {
      case 'exceeded':
      case 'critical':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-foreground'
    }
  }

  const getAlertBg = () => {
    switch (usage.thresholdLevel) {
      case 'exceeded':
      case 'critical':
        return 'bg-red-500/10'
      default:
        return 'bg-blue-500/10'
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">AI-användning</h4>
        <span className={cn("text-sm font-medium", getStatusColor())}>
          {remainingPercent}% kvar
        </span>
      </div>

      <Progress
        value={Math.min(100, usage.usagePercent)}
        indicatorClassName={getIndicatorColor()}
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
          <div className={cn("font-medium", usage.thresholdLevel === 'exceeded' || usage.thresholdLevel === 'critical' ? 'text-red-400' : 'text-blue-400')}>
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
          getAlertBg()
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
