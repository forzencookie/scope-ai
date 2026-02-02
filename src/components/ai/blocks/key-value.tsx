import { cn } from "@/lib/utils"
import type { KeyValueProps } from "./types"

export function KeyValue({ items, columns = 1 }: KeyValueProps) {
  return (
    <div className={cn(
      "grid gap-x-6 gap-y-2",
      columns === 2 && "grid-cols-2",
      columns === 3 && "grid-cols-3",
      columns === 1 && "grid-cols-1"
    )}>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between py-1.5 border-b border-dashed last:border-0">
          <span className="text-sm text-muted-foreground">{item.label}</span>
          <span className="text-sm font-medium tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
