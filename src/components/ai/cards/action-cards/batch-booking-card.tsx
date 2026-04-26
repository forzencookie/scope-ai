"use client"

/**
 * Batch Summary Card — Read-only ledger with total row
 *
 * For batch booking review: receipts, transactions, etc.
 * Each item shows title + subtitle on the left, value on the right.
 * Ends with a mandatory total row. Matches BatchbokforingCard visual style:
 * bare container, accent header, divided rows, post-confirm phase.
 */

import { AlertCircle, Check, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/utils"
import { accentStyles, completedActionConfig, type ConfirmationAccent, type CompletedAction } from "./tokens"

export interface BatchSummaryItem {
    id: string
    /** Primary label — left side, top line */
    title: string | null
    /** Secondary detail — left side, second line */
    subtitle?: string | null
    /** Numeric value — right side */
    rightValue: string | null
}

export interface BatchBookingCardProps {
    title: string | null
    description?: string | null
    icon?: LucideIcon
    accent?: ConfirmationAccent
    items: BatchSummaryItem[]
    totalLabel?: string
    totalAmount: string | null
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

export function BatchBookingCard({
    title,
    description,
    icon: HeaderIcon,
    accent = "blue",
    items,
    totalLabel = "Totalt:",
    totalAmount,
    confirmLabel = "Bokför alla",
    onConfirm,
    onCancel,
    isLoading = false,
    isDone = false,
    completedAction,
    completedTitle,
    onReset,
    className,
}: BatchBookingCardProps) {
    if (!title || items.length === 0 || totalAmount === null) {
        return (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Fel vid rendering: Saknar summering eller rader i tabellen.</span>
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
                        {description && <p className="text-xs text-muted-foreground">{description}</p>}
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

            {/* Item rows */}
            <div className="divide-y divide-border/60">
                {items.map(item => (
                    <div key={item.id} className="flex justify-between items-start py-2.5 first:pt-0">
                        <div className="flex-1 pr-4 min-w-0">
                            {item.title !== null ? (
                                <p className="text-sm font-medium">{item.title}</p>
                            ) : (
                                <span className="inline-flex font-medium text-amber-600 bg-amber-500/15 px-2 py-0.5 rounded text-xs border border-amber-500/20 mb-1">
                                    Okänd post
                                </span>
                            )}
                            {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                        </div>
                        <div className="shrink-0">
                            {item.rightValue !== null ? (
                                <p className="font-semibold text-sm tabular-nums whitespace-nowrap">{item.rightValue}</p>
                            ) : (
                                <span className="inline-flex font-medium text-amber-600 bg-amber-500/15 px-2 py-0.5 rounded text-xs border border-amber-500/20">
                                    Ej angivet
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Total row */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">{totalLabel}</p>
                <p className="font-bold text-sm tabular-nums">{totalAmount}</p>
            </div>

            {/* Actions */}
            {isDone ? (
                <>
                    {isDone && !actionConfig && (
                        <div className="flex items-center gap-2 pt-3 text-sm">
                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                            </div>
                            <span className="font-medium text-emerald-600 dark:text-emerald-500">Klart</span>
                        </div>
                    )}
                    {onReset && (
                        <button className="text-xs text-muted-foreground underline pt-2 block" onClick={onReset}>
                            Återställ
                        </button>
                    )}
                </>
            ) : (
                <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={onConfirm} disabled={isLoading}>
                        {isLoading ? "Bearbetar..." : `${confirmLabel} (${items.length})`}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
                        Avbryt
                    </Button>
                </div>
            )}
        </div>
    )
}
