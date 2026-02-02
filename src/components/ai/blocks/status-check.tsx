import { Check, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StatusCheckProps } from "./types"

const STATUS_CONFIG = {
  pass: { icon: Check, iconClass: "text-emerald-600", bg: "bg-emerald-500/10", iconBg: "bg-emerald-500/20" },
  warning: { icon: AlertTriangle, iconClass: "text-amber-500", bg: "bg-amber-500/10", iconBg: "bg-amber-500/20" },
  fail: { icon: XCircle, iconClass: "text-red-500", bg: "bg-red-500/10", iconBg: "bg-red-500/20" },
} as const

export function StatusCheck({ items }: StatusCheckProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((item, i) => {
        const config = STATUS_CONFIG[item.status]
        const Icon = config.icon
        return (
          <div key={i} className={cn("rounded-lg px-4 py-3 flex items-start justify-between gap-3", config.bg)}>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-sm">{item.label}</span>
              {item.detail && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              )}
            </div>
            <div className={cn("shrink-0 mt-0.5 p-1 rounded", config.iconBg)}>
              <Icon className={cn("h-4 w-4", config.iconClass)} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
