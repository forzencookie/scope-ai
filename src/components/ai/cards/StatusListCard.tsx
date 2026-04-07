"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export type ItemStatus = "done" | "warning" | "error" | "pending"

export interface StatusListItem {
    id: string
    label: string
    description?: string
    status: ItemStatus
}

export interface StatusListCardProps {
    title: string
    description?: string
    icon?: LucideIcon
    accent?: "blue" | "green" | "emerald" | "purple" | "amber" | "red" | "indigo" | "teal"
    items: StatusListItem[]
    className?: string
}

const statusDot: Record<ItemStatus, string> = {
    done:    "bg-emerald-500",
    warning: "bg-amber-500",
    error:   "bg-red-500",
    pending: "bg-muted-foreground/40",
}

const accentIconStyles: Record<NonNullable<StatusListCardProps["accent"]>, { color: string; bg: string }> = {
    blue:    { color: "text-blue-600 dark:text-blue-500",       bg: "bg-blue-500/10" },
    green:   { color: "text-green-600 dark:text-green-500",     bg: "bg-green-500/10" },
    emerald: { color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-500/10" },
    purple:  { color: "text-purple-600 dark:text-purple-500",   bg: "bg-purple-500/10" },
    amber:   { color: "text-amber-600 dark:text-amber-500",     bg: "bg-amber-500/10" },
    red:     { color: "text-red-600 dark:text-red-500",         bg: "bg-red-500/10" },
    indigo:  { color: "text-indigo-600 dark:text-indigo-500",   bg: "bg-indigo-500/10" },
    teal:    { color: "text-teal-600 dark:text-teal-500",       bg: "bg-teal-500/10" },
}

/**
 * StatusListCard — informational display of items with status indicators.
 *
 * NOT a confirmation card. No action buttons.
 * Used when Scooby shows the status of multiple items:
 * monthly close checklist, missing data overview, audit results, etc.
 */
export function StatusListCard({
    title,
    description,
    icon: HeaderIcon,
    accent = "blue",
    items,
    className,
}: StatusListCardProps) {
    const iconStyles = accentIconStyles[accent]
    const doneCount = items.filter(i => i.status === "done").length

    return (
        <div className={cn("w-full max-w-md space-y-1 py-1", className)}>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3">
                {HeaderIcon && (
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0", iconStyles.bg)}>
                        <HeaderIcon className={cn("h-3.5 w-3.5", iconStyles.color)} />
                    </div>
                )}
                <div>
                    <p className="text-sm font-semibold">{title}</p>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
                <span className="ml-auto text-xs text-muted-foreground">
                    {doneCount}/{items.length}
                </span>
            </div>

            {/* Items */}
            <div className="space-y-0.5">
                {items.map((item) => {
                    return (
                        <div
                            key={item.id}
                            className="flex items-start gap-3 px-2 py-1.5 rounded-lg"
                        >
                            <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", statusDot[item.status])} />
                            <div className="flex-1 min-w-0">
                                <span className={cn(
                                    "text-sm",
                                    item.status === "done" && "text-muted-foreground line-through"
                                )}>
                                    {item.label}
                                </span>
                                {item.description && (
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
