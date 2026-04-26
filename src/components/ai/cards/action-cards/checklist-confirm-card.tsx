"use client"

/**
 * Batch Selection Card — Interactive checklist
 *
 * For bulk entity mutations after chat discussion: employee status changes,
 * bulk role assignments, etc. Matches BatchActionCard visual style:
 * bare container, accent header, fromBadge→toBadge transitions, post-confirm phase.
 */

import { useState } from "react"
import { AlertCircle, Check, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/utils"
import { accentStyles, completedActionConfig, type ConfirmationAccent, type CompletedAction } from "./tokens"
import { BlockRenderer } from "@/components/ai/overlays/blocks/block-renderer"
import type { BlockProps } from "@/components/ai/overlays/blocks/types"

export interface BatchSelectionItem {
    id: string
    label: string
    description?: string | null
    /** Badge showing current/destination state — e.g. "Aktiv", "Föräldraledig" */
    badge?: { label: string; className: string } | null
    /** Badge showing origin state — renders as fromBadge → badge transition */
    fromBadge?: { label: string; className: string } | null
}

export interface ChecklistConfirmCardProps {
    title: string | null
    description?: string | null
    icon?: LucideIcon
    accent?: ConfirmationAccent
    items?: BatchSelectionItem[]
    blocks?: BlockProps[]
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

export function ChecklistConfirmCard({
    title,
    description,
    icon: HeaderIcon,
    accent = "blue",
    items: initialItems = [],
    blocks,
    confirmLabel = "Uppdatera valda",
    onConfirm,
    onCancel,
    isLoading = false,
    isDone = false,
    completedAction,
    completedTitle,
    onReset,
    className,
}: ChecklistConfirmCardProps) {
    const [checked, setChecked] = useState<Set<string>>(new Set(initialItems.map(i => i.id)))

    if (!title || (initialItems.length === 0 && (!blocks || blocks.length === 0))) {
        return (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Saknar objekt för att visa listan.</span>
            </div>
        )
    }

    const toggle = (id: string) => {
        setChecked(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        if (checked.size === initialItems.length) setChecked(new Set())
        else setChecked(new Set(initialItems.map(i => i.id)))
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

            {blocks && blocks.length > 0 && !isDone ? (
                /* Blocks mode: render block content instead of interactive checklist */
                <>
                    <div className="space-y-2">
                        {blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}
                    </div>
                    <div className="flex items-center gap-2 pt-3">
                        <Button
                            size="sm"
                            onClick={() => onConfirm([])}
                            disabled={isLoading}
                        >
                            {isLoading ? "Bearbetar..." : confirmLabel}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
                            Avbryt
                        </Button>
                    </div>
                </>
            ) : isDone ? (
                /* Post-confirm: read-only list of confirmed items */
                <>
                    <div className="space-y-0.5">
                        {initialItems.filter(i => checked.has(i.id)).map((item) => (
                            <div key={item.id} className="flex items-start gap-3 px-2 py-2">
                                <div className="flex h-5 w-5 items-center justify-center rounded border mt-0.5 shrink-0 bg-foreground border-foreground">
                                    <Check className="h-3 w-3 text-background" />
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
                                        ) : item.badge && (
                                            <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", item.badge.className)}>
                                                {item.badge.label}
                                            </span>
                                        )}
                                    </div>
                                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
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
                        {checked.size === initialItems.length ? "Avmarkera alla" : "Markera alla"}
                    </button>

                    <div className="space-y-0.5">
                        {initialItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => toggle(item.id)}
                                disabled={isLoading}
                                className={cn(
                                    "w-full flex items-start gap-3 px-2 py-2 rounded-lg text-left transition-colors",
                                    "hover:bg-muted/50",
                                    checked.has(item.id) && "bg-muted/30"
                                )}
                            >
                                <div className={cn(
                                    "flex h-5 w-5 items-center justify-center rounded border mt-0.5 shrink-0 transition-colors",
                                    checked.has(item.id) ? "bg-foreground border-foreground" : "border-border"
                                )}>
                                    {checked.has(item.id) && <Check className="h-3 w-3 text-background" />}
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
                                        ) : null}
                                    </div>
                                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 pt-3">
                        <Button
                            size="sm"
                            onClick={() => onConfirm(Array.from(checked))}
                            disabled={isLoading || checked.size === 0}
                        >
                            {isLoading ? "Bearbetar..." : `${confirmLabel} (${checked.size})`}
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
