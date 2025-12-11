import { cn } from "@/lib/utils"

export type BadgeStatus = "active" | "pending" | "complete" | "warning"

interface StatusBadgeProps {
  status: BadgeStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = {
    active: "bg-blue-100 text-blue-700 border-blue-300",
    pending: "bg-amber-100 text-amber-700 border-amber-300",
    complete: "bg-emerald-100 text-emerald-700 border-emerald-300",
    warning: "bg-red-100 text-red-700 border-red-300",
  }

  const labels = {
    active: "Processing",
    pending: "Pending",
    complete: "Complete",
    warning: "Attention",
  }

  return (
    <span className={cn("text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 border", colors[status])}>
      {labels[status]}
    </span>
  )
}
