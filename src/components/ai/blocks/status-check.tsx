"use client"

import Link from "next/link"
import { Check, AlertTriangle, XCircle, Wrench, ExternalLink } from "lucide-react"
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
        const hasAction = item.actionId && (item.status === "fail" || item.status === "warning")
        const hasLink = item.href

        const content = (
          <>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-sm">{item.label}</span>
              {item.detail && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              )}
              {hasAction && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.dispatchEvent(new CustomEvent("walkthrough-action", {
                      detail: { actionId: item.actionId, label: item.label, status: item.status, detail: item.detail },
                    }))
                  }}
                  className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Wrench className="h-3 w-3" />
                  {item.actionLabel ?? "Åtgärda"}
                </button>
              )}
            </div>
            <div className="shrink-0 flex items-start gap-2 mt-0.5">
              {hasLink && (
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/check:opacity-100 transition-opacity mt-1" />
              )}
              <div className={cn("p-1 rounded", config.iconBg)}>
                <Icon className={cn("h-4 w-4", config.iconClass)} />
              </div>
            </div>
          </>
        )

        if (hasLink) {
          return (
            <Link
              key={i}
              href={item.href!}
              className={cn(
                "rounded-lg px-4 py-3 flex items-start justify-between gap-3 group/check",
                "transition-colors hover:ring-1 hover:ring-border",
                config.bg
              )}
            >
              {content}
            </Link>
          )
        }

        return (
          <div key={i} className={cn("rounded-lg px-4 py-3 flex items-start justify-between gap-3 group/check", config.bg)}>
            {content}
          </div>
        )
      })}
    </div>
  )
}
