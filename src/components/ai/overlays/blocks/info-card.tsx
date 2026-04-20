import { Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { InfoCardProps } from "./types"

const VARIANT_CONFIG = {
  info: { icon: Info, bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-900", text: "text-blue-800 dark:text-blue-300", iconColor: "text-blue-500" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-900", text: "text-amber-800 dark:text-amber-300", iconColor: "text-amber-500" },
  success: { icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-900", text: "text-emerald-800 dark:text-emerald-300", iconColor: "text-emerald-500" },
  error: { icon: XCircle, bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-900", text: "text-red-800 dark:text-red-300", iconColor: "text-red-500" },
} as const

export function InfoCard({ title, content, variant }: InfoCardProps) {
  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon

  return (
    <div className={cn("rounded-lg border px-4 py-3 flex gap-3", config.bg, config.border)}>
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)} />
      <div className={cn("text-sm leading-relaxed", config.text)}>
        {title && <p className="font-medium mb-1">{title}</p>}
        <p>{content}</p>
      </div>
    </div>
  )
}
