"use client"

/**
 * Domain Confirmation Card — Icon-row list layout
 *
 * For entity registrations and role assignments: employees, owners, members, meetings.
 * Each row has a leading icon + text. Matches DomainCard visual style: bare container,
 * accent-aware header icon, post-confirm phase.
 */

import { AlertCircle, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { completedActionConfig, type ConfirmationAccent, type CompletedAction } from "./action-confirm-card"

const accentStyles: Record<ConfirmationAccent, { iconColor: string; iconBg: string }> = {
    blue:    { iconColor: "text-blue-600 dark:text-blue-500",       iconBg: "bg-blue-500/10" },
    green:   { iconColor: "text-green-600 dark:text-green-500",     iconBg: "bg-green-500/10" },
    emerald: { iconColor: "text-emerald-600 dark:text-emerald-500", iconBg: "bg-emerald-500/10" },
    purple:  { iconColor: "text-purple-600 dark:text-purple-500",   iconBg: "bg-purple-500/10" },
    amber:   { iconColor: "text-amber-600 dark:text-amber-500",     iconBg: "bg-amber-500/10" },
    red:     { iconColor: "text-red-600 dark:text-red-500",         iconBg: "bg-red-500/10" },
    indigo:  { iconColor: "text-indigo-600 dark:text-indigo-500",   iconBg: "bg-indigo-500/10" },
    teal:    { iconColor: "text-teal-600 dark:text-teal-500",       iconBg: "bg-teal-500/10" },
}

export interface DomainConfirmationItem {
    icon: LucideIcon
    text: string | null
    bold?: boolean
}

export interface EntityUpdateCardProps {
    title: string | null
    subtitle?: string | null
    headerIcon?: LucideIcon
    accent?: ConfirmationAccent
    items: DomainConfirmationItem[]
    confirmLabel?: string
    onConfirm: () => void
    onCancel: () => void
    isLoading?: boolean
    isDone?: boolean
    completedAction?: CompletedAction
    completedTitle?: string
    onReset?: () => void
    className?: string
}

export function EntityUpdateCard({
    title,
    subtitle,
    headerIcon: HeaderIcon,
    accent = "blue",
    items,
    confirmLabel = "Bekräfta",
    onConfirm,
    onCancel,
    isLoading = false,
    isDone = false,
    completedAction,
    completedTitle,
    onReset,
    className,
}: EntityUpdateCardProps) {
    if (!title || items.length === 0) {
        return (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Kunde inte rendera kortet. Nödvändig information saknas.</span>
            </div>
        )
    }

    const styles = accentStyles[accent]
    const actionConfig = completedAction ? completedActionConfig[completedAction] : null
    const ActionIcon = actionConfig?.icon
    const displayTitle = isDone && completedTitle ? completedTitle : title

    return (
        <div className={cn("w-full max-w-md space-y-1 py-1", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    {HeaderIcon && (
                        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0", styles.iconBg)}>
                            <HeaderIcon className={cn("h-3.5 w-3.5", styles.iconColor)} />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-semibold">{displayTitle}</p>
                        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
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

            {/* Icon rows */}
            <div className="space-y-2.5 text-sm">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {item.text !== null ? (
                            item.bold
                                ? <p className="font-medium">{item.text}</p>
                                : <span className="text-muted-foreground">{item.text}</span>
                        ) : (
                            <span className="inline-flex font-medium text-amber-600 bg-amber-500/15 px-2 py-0.5 rounded text-xs border border-amber-500/20">
                                Uppgift saknas
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Actions */}
            {isDone ? (
                onReset && (
                    <button className="text-xs text-muted-foreground underline pt-2 block" onClick={onReset}>
                        Återställ
                    </button>
                )
            ) : (
                <div className="flex gap-2 pt-3">
                    <Button size="sm" onClick={onConfirm} disabled={isLoading}>
                        {isLoading ? "Sparar..." : confirmLabel}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
                        Avbryt
                    </Button>
                </div>
            )}
        </div>
    )
}
