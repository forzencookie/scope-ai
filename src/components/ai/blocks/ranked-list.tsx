import type { RankedListProps } from "./types"

export function RankedList({ items }: RankedListProps) {
  return (
    <div className="rounded-lg border divide-y">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <span className="text-sm font-mono text-muted-foreground w-6 text-right">{item.rank}</span>
          <span className="flex-1 text-sm font-medium">{item.label}</span>
          {item.badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{item.badge}</span>
          )}
          <span className="text-sm tabular-nums font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
