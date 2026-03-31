import {
  TrendingUp, TrendingDown, Minus,
  Calculator, Wallet, Banknote, Receipt, Percent,
  PiggyBank, TrendingUp as Growth, BarChart3, CreditCard,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { StatCardsProps } from "./types"

const TREND_CONFIG = {
  up: { icon: TrendingUp, color: "text-emerald-600" },
  down: { icon: TrendingDown, color: "text-red-500" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
} as const

const ICON_MAP: Record<string, LucideIcon> = {
  calculator: Calculator,
  wallet: Wallet,
  banknote: Banknote,
  receipt: Receipt,
  percent: Percent,
  "piggy-bank": PiggyBank,
  growth: Growth,
  "bar-chart": BarChart3,
  "credit-card": CreditCard,
}

const ICON_COLOR_CONFIG = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-500" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-500" },
  red: { bg: "bg-red-500/10", text: "text-red-500" },
  muted: { bg: "bg-muted", text: "text-muted-foreground" },
} as const

export function StatCards({ items }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((item, i) => {
        const trend = item.trend ? TREND_CONFIG[item.trend] : null
        const TrendIcon = trend?.icon
        const ItemIcon = item.icon ? ICON_MAP[item.icon] : null
        const iconColor = item.iconColor ? ICON_COLOR_CONFIG[item.iconColor] : ICON_COLOR_CONFIG.muted
        return (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              {ItemIcon && (
                <div className={cn("h-6 w-6 rounded-md flex items-center justify-center shrink-0", iconColor.bg)}>
                  <ItemIcon className={cn("h-4 w-4", iconColor.text)} />
                </div>
              )}
            </div>
            <p className="text-xl font-semibold tracking-tight">
              {item.valueColor === "red" ? "– " : item.valueColor === "green" ? "+ " : ""}{item.value}
            </p>
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
