import { cn } from "@/lib/utils"
import type { FinancialTableProps } from "./types"

export function FinancialTable({ columns, rows, totals, highlights }: FinancialTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => (
              <th key={col} className="px-4 py-2 text-left font-medium text-muted-foreground">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const rowKey = Object.values(row).join("-")
            const isHighlighted = highlights?.some((h) => Object.values(row).includes(h))
            return (
              <tr
                key={`${rowKey}-${i}`}
                className={cn(
                  "border-b last:border-0",
                  isHighlighted && "bg-amber-50 dark:bg-amber-950/20"
                )}
              >
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 tabular-nums">
                    {row[col] ?? ""}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
        {totals && (
          <tfoot>
            <tr className="border-t-2 font-semibold bg-muted/30">
              {columns.map((col) => (
                <td key={col} className="px-4 py-2 tabular-nums">
                  {totals[col] ?? ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
