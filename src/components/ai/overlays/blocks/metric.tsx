import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MetricProps } from "./types"

const TREND_CONFIG = {
  up: { icon: TrendingUp, color: "text-emerald-600" },
  down: { icon: TrendingDown, color: "text-red-500" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
} as const

export function Metric({ label, value, change, trend }: MetricProps) {
  const trendCfg = trend ? TREND_CONFIG[trend] : null
  const TrendIcon = trendCfg?.icon

  return (
    <div className="flex items-baseline gap-3">
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
      {change && (
        <span className={cn("flex items-center gap-1 text-xs", trendCfg?.color)}>
          {TrendIcon && <TrendIcon className="h-3 w-3" />}
          {change}
        </span>
      )}
    </div>
  )
}
