import { cn } from "@/lib/utils"
import type { AnnotationProps } from "./types"

const VARIANT_STYLES = {
  muted: "bg-muted text-muted-foreground",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
} as const

export function Annotation({ text, variant }: AnnotationProps) {
  return (
    <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-medium", VARIANT_STYLES[variant])}>
      {text}
    </span>
  )
}
