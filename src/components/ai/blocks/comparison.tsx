import { cn } from "@/lib/utils"
import type { ComparisonProps } from "./types"

export function Comparison({ options }: ComparisonProps) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, 1fr)` }}>
      {options.map((option, i) => (
        <div
          key={i}
          className={cn(
            "rounded-lg border p-4",
            option.recommended && "border-emerald-500 ring-1 ring-emerald-500/20"
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold">{option.title}</h4>
            {option.recommended && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Rekommenderat
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {option.items.map((item, j) => (
              <div key={j} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
