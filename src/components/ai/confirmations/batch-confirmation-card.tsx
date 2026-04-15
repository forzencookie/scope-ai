"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Check, type LucideIcon } from "lucide-react"
import { useState } from "react"
import { completedActionConfig } from "./confirmation-card"
import type { ConfirmationAccent, CompletedAction } from "./confirmation-card"

const accentIconStyles: Record<ConfirmationAccent, { color: string; bg: string }> = {
    blue:    { color: "text-blue-600 dark:text-blue-500",       bg: "bg-blue-500/10" },
    green:   { color: "text-green-600 dark:text-green-500",     bg: "bg-green-500/10" },
    emerald: { color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-500/10" },
    purple:  { color: "text-purple-600 dark:text-purple-500",   bg: "bg-purple-500/10" },
    amber:   { color: "text-amber-600 dark:text-amber-500",     bg: "bg-amber-500/10" },
    red:     { color: "text-red-600 dark:text-red-500",         bg: "bg-red-500/10" },
    indigo:  { color: "text-indigo-600 dark:text-indigo-500",   bg: "bg-indigo-500/10" },
    teal:    { color: "text-teal-600 dark:text-teal-500",       bg: "bg-teal-500/10" },
}

export interface BatchItemBadge {
    label: string
    className: string
}

export interface BatchItem {
    id: string
    label: string
    description: string
    status: "pending" | "warning" | "error"
    checked: boolean
    /** Optional colored status badge (pill) — matches read-only page style */
    badge?: BatchItemBadge
    /** Optional "from" badge for state transitions (shows before → after) */
    fromBadge?: BatchItemBadge
}

interface BatchConfirmationCardProps {
    title: string
    description?: string
    icon?: LucideIcon
    accent?: ConfirmationAccent
    items: BatchItem[]
    confirmLabel?: string
    onConfirm: (selectedIds: string[]) => void
    onCancel: () => void
    isLoading?: boolean
    isDone?: boolean
    completedAction?: CompletedAction
    completedTitle?: string
    onReset?: () => void
    className?: string
}

const statusDot: Record<BatchItem["status"], string> = {
    pending: "bg-muted-foreground/40",
    warning: "bg-amber-500",
    error:   "bg-red-500",
}

export function BatchConfirmationCard({
    title,
    description,
    icon: HeaderIcon,
    accent = "blue",
    items: initialItems,
    confirmLabel = "Åtgärda valda",
    onConfirm,
    onCancel,
    isLoading = false,
    isDone = false,
    completedAction,
    completedTitle,
    onReset,
    className,
}: BatchConfirmationCardProps) {
    const [items, setItems] = useState(initialItems)
    const iconStyles = accentIconStyles[accent]

    const toggle = (id: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ))
    }

    const toggleAll = () => {
        const allChecked = items.every(i => i.checked)
        setItems(prev => prev.map(item => ({ ...item, checked: !allChecked })))
    }

    const selectedCount = items.filter(i => i.checked).length

    const actionConfig = completedAction ? completedActionConfig[completedAction] : null
    const ActionIcon = actionConfig?.icon
    const displayTitle = isDone && completedTitle ? completedTitle : title

    return (
        <div className={cn("w-full max-w-md space-y-1 py-1", className)}>
            {/* Header with icon badge + optional action badge */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    {HeaderIcon && (
                        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0", iconStyles.bg)}>
                            <HeaderIcon className={cn("h-3.5 w-3.5", iconStyles.color)} />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-semibold">{displayTitle}</p>
                        {description && (
                            <p className="text-xs text-muted-foreground">{description}</p>
                        )}
                    </div>
                </div>
                {isDone && actionConfig && ActionIcon && (
                    <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 animate-in fade-in slide-in-from-right-2 duration-300",
                        actionConfig.bg, actionConfig.color,
                    )}>
                        <ActionIcon className="h-3 w-3" />
                        {actionConfig.label}
                    </span>
                )}
            </div>

            {isDone ? (
                /* Post-confirm: read-only list of confirmed items */
                <>
                    <div className="space-y-0.5">
                        {items.filter(i => i.checked).map((item) => (
                            <div key={item.id} className="flex items-start gap-3 px-2 py-2">
                                <div className="flex h-5 w-5 items-center justify-center rounded border mt-0.5 shrink-0 bg-foreground border-foreground">
                                    <Check className="h-3 w-3 text-background" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{item.label}</span>
                                        {item.badge && (
                                            <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", item.badge.className)}>
                                                {item.badge.label}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {onReset && (
                        <button className="text-xs text-muted-foreground underline pt-2 block" onClick={onReset}>
                            Återställ
                        </button>
                    )}
                </>
            ) : (
                /* Pre-confirm: interactive checklist */
                <>
                    <button
                        onClick={toggleAll}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
                    >
                        {items.every(i => i.checked) ? "Avmarkera alla" : "Markera alla"}
                    </button>

                    <div className="space-y-0.5">
                        {items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => toggle(item.id)}
                                disabled={isLoading}
                                className={cn(
                                    "w-full flex items-start gap-3 px-2 py-2 rounded-lg text-left transition-colors",
                                    "hover:bg-muted/50",
                                    item.checked && "bg-muted/30"
                                )}
                            >
                                <div className={cn(
                                    "flex h-5 w-5 items-center justify-center rounded border mt-0.5 shrink-0 transition-colors",
                                    item.checked
                                        ? "bg-foreground border-foreground"
                                        : "border-border"
                                )}>
                                    {item.checked && <Check className="h-3 w-3 text-background" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{item.label}</span>
                                        {item.fromBadge && item.badge ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", item.fromBadge.className)}>
                                                    {item.fromBadge.label}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">→</span>
                                                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", item.badge.className)}>
                                                    {item.badge.label}
                                                </span>
                                            </div>
                                        ) : item.badge ? (
                                            <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", item.badge.className)}>
                                                {item.badge.label}
                                            </span>
                                        ) : (
                                            <div className={cn("h-2 w-2 rounded-full shrink-0", statusDot[item.status])} />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 pt-3">
                        <Button
                            size="sm"
                            onClick={() => onConfirm(items.filter(i => i.checked).map(i => i.id))}
                            disabled={isLoading || selectedCount === 0}
                        >
                            {isLoading ? "Bearbetar..." : `${confirmLabel} (${selectedCount})`}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
                            Avbryt
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
