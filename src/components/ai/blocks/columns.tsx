"use client"

import { cn } from "@/lib/utils"
import type { ColumnsProps } from "./types"
import { BlockRenderer } from "./block-renderer"

const GAP_MAP = {
  sm: "gap-3",
  md: "gap-6",
  lg: "gap-8",
} as const

export function Columns({ columns, gap = "md" }: ColumnsProps) {
  const colCount = Math.min(columns.length, 3)

  return (
    <div
      className={cn(
        "grid",
        GAP_MAP[gap],
        colCount === 2 && "grid-cols-1 md:grid-cols-2",
        colCount === 3 && "grid-cols-1 md:grid-cols-3",
      )}
    >
      {columns.slice(0, 3).map((colBlocks, colIdx) => (
        <div key={colIdx} className="space-y-4">
          {colBlocks.map((block, blockIdx) => (
            <BlockRenderer key={block.id ?? blockIdx} block={block} />
          ))}
        </div>
      ))}
    </div>
  )
}
