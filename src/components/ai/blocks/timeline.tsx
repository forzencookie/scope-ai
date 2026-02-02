import { cn } from "@/lib/utils"
import type { TimelineProps } from "./types"

const STATUS_STYLES = {
  done: "bg-emerald-500",
  active: "bg-blue-500 ring-4 ring-blue-500/20",
  pending: "bg-muted-foreground/30",
} as const

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
      <div className="space-y-4">
        {events.map((event, i) => {
          const status = event.status || "pending"
          return (
            <div key={i} className="relative flex gap-3">
              <div className={cn("absolute left-[-18px] top-1.5 h-2.5 w-2.5 rounded-full", STATUS_STYLES[status])} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{event.title}</span>
                  <span className="text-xs text-muted-foreground">{event.date}</span>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
