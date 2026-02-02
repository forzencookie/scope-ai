import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChecklistProps } from "./types"

export function Checklist({ items }: ChecklistProps) {
  return (
    <div className="rounded-lg border divide-y">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <div className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
            item.checked
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-muted-foreground/30"
          )}>
            {item.checked && <Check className="h-3 w-3" />}
          </div>
          <div className="min-w-0 flex-1">
            <span className={cn("text-sm", item.checked && "line-through text-muted-foreground")}>{item.label}</span>
            {item.detail && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
