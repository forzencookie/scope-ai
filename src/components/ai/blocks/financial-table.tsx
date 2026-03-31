import { Calendar, Banknote, Receipt, TrendingUp, Percent, Hash, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FinancialTableProps, FinancialColumnDef } from "./types"

const ICON_MAP: Record<string, LucideIcon> = {
  calendar: Calendar,
  banknote: Banknote,
  receipt: Receipt,
  "trending-up": TrendingUp,
  percent: Percent,
  hash: Hash,
}

const COLOR_CLASSES = {
  default: "",
  red: "text-red-500 dark:text-red-400/80",
  green: "text-emerald-500 dark:text-emerald-400/80",
  muted: "text-muted-foreground",
} as const

function resolveColumn(col: string | FinancialColumnDef): FinancialColumnDef {
  if (typeof col === "string") return { label: col }
  return col
}

function formatValue(value: string | number, color?: FinancialColumnDef["color"]): string {
  const str = String(value)
  if (!color || color === "default" || color === "muted") return str
  // Don't double-prefix if already has a sign
  if (str.startsWith("+") || str.startsWith("–") || str.startsWith("-")) return str
  if (color === "red") return "– " + str
  if (color === "green") return "+ " + str
  return str
}

export function FinancialTable({ columns, rows, totals, highlights, variant = "default" }: FinancialTableProps) {
  const cols = columns.map(resolveColumn)
  const isCompact = variant === "compact"

  return (
    <div className="text-sm space-y-0.5">
      {/* Header */}
      <div className={cn(
        "flex px-4 py-2.5 font-medium text-muted-foreground",
        isCompact ? "border-b border-dashed border-border/60" : "bg-muted/50 rounded-lg"
      )}>
        {cols.map((col, ci) => {
          const Icon = col.icon ? ICON_MAP[col.icon] : null
          return (
            <div
              key={col.label}
              className={cn("flex-1", ci > 0 && "text-right")}
            >
              <span className={cn("inline-flex items-center gap-1.5", ci > 0 && "justify-end")}>
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {col.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Rows */}
      {rows.map((row, i) => {
        const rowKey = Object.values(row).join("-")
        const isHighlighted = highlights?.some((h) => Object.values(row).includes(h))
        return (
          <div
            key={`${rowKey}-${i}`}
            className={cn(
              "flex px-4 py-2 rounded-lg",
              !isCompact && "transition-colors hover:bg-muted/30",
              isHighlighted && "bg-amber-50 dark:bg-amber-950/20"
            )}
          >
            {cols.map((col, ci) => (
              <div
                key={col.label}
                className={cn(
                  "flex-1 tabular-nums",
                  ci === 0 ? "font-medium" : "text-right",
                  col.color ? COLOR_CLASSES[col.color] : (ci > 0 ? "text-muted-foreground" : "")
                )}
              >
                {formatValue(row[col.label] ?? "", col.color)}
              </div>
            ))}
          </div>
        )
      })}

      {/* Totals */}
      {totals && (
        <div className="flex px-4 py-2.5 border-t font-semibold mt-1">
          {cols.map((col, ci) => (
            <div
              key={col.label}
              className={cn(
                "flex-1 tabular-nums",
                ci > 0 && "text-right",
                col.color && COLOR_CLASSES[col.color]
              )}
            >
              {formatValue(totals[col.label] ?? "", col.color)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
