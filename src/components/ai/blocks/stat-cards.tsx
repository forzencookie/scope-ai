import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StatCardsProps } from "./types"

const TREND_CONFIG = {
  up: { icon: TrendingUp, color: "text-emerald-600" },
  down: { icon: TrendingDown, color: "text-red-500" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
} as const

export function StatCards({ items }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((item, i) => {
        const trend = item.trend ? TREND_CONFIG[item.trend] : null
        const TrendIcon = trend?.icon
        return (
          <div key={i} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className="text-xl font-semibold tracking-tight">{item.value}</p>
            {item.change && (
              <div className={cn("flex items-center gap-1 mt-1 text-xs", trend?.color)}>
                {TrendIcon && <TrendIcon className="h-3 w-3" />}
                <span>{item.change}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
