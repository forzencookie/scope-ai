import { cn } from "@/lib/utils"
import type { HeadingProps } from "./types"

const LEVEL_STYLES = {
  1: "text-2xl font-semibold tracking-tight",
  2: "text-lg font-semibold",
  3: "text-sm font-semibold uppercase tracking-wider text-muted-foreground",
} as const

export function Heading({ text, level, subtitle }: HeadingProps) {
  const Tag = `h${level}` as const
  return (
    <div>
      <Tag className={cn(LEVEL_STYLES[level])}>{text}</Tag>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  )
}
