import { cn } from "@/lib/utils"
import type { DataTableProps } from "./types"

export function DataTable({ columns, rows, caption }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        {caption && (
          <caption className="px-4 py-2 text-left text-xs text-muted-foreground bg-muted/30">
            {caption}
          </caption>
        )}
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-2 font-medium text-muted-foreground",
                  col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-2 tabular-nums",
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  )}
                >
                  {row[col.key] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
