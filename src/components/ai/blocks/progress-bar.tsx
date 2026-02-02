import type { ProgressBarProps } from "./types"

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <div>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-sm font-medium tabular-nums">{pct}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
