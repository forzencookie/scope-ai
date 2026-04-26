"use client"

/**
 * Generic Confirmation Card — Key-Value grid layout
 *
 * For standalone transactions: invoices, verifications, asset registrations, etc.
 * Matches ActionCard visual style: bare container, icon badge, accent color, post-confirm phase.
 */

import { AlertCircle, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/utils"
import { accentStyles, completedActionConfig, type ConfirmationAccent, type CompletedAction } from "./tokens"
import { BlockRenderer } from "@/components/ai/overlays/blocks/block-renderer"
import type { BlockProps } from "@/components/ai/overlays/blocks/types"

export type { ConfirmationAccent, CompletedAction }
export { completedActionConfig }

export interface GenericSummaryItem {
    label: string
    /** Pass null to render amber fallback pill — for incomplete AI payloads */
    value: string | null
}

export interface ActionConfirmCardProps {
    title: string | null
    description?: string | null
    icon?: LucideIcon
    accent?: ConfirmationAccent
    properties?: GenericSummaryItem[]
    blocks?: BlockProps[]
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

export function ActionConfirmCard({
    title,
    description,
    icon: Icon,
    accent = "blue",
    properties = [],
    blocks,
    confirmLabel = "Bekräfta",
    onConfirm,
    onCancel,
    isLoading = false,
    isDone = false,
    completedAction,
    completedTitle,
    onReset,
    className,
}: ActionConfirmCardProps) {
    if (!title || (properties.length === 0 && (!blocks || blocks.length === 0))) {
        return (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Ett fel uppstod vid rendering av kortet. Saknar nödvändig data.</span>
            </div>
        )
    }

    const styles = accentStyles[accent]
    const actionConfig = completedAction ? completedActionConfig[completedAction] : null
    const ActionIcon = actionConfig?.icon
    const displayTitle = isDone && completedTitle ? completedTitle : title

    return (
        <div className={cn("w-full max-w-md py-1", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    {Icon && (
                        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0", styles.iconBg)}>
                            <Icon className={cn("h-3.5 w-3.5", styles.iconColor)} />
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

            {/* Content: blocks take precedence over typed property rows */}
            {blocks && blocks.length > 0 ? (
                <div className="space-y-2">
                    {blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}
                </div>
            ) : (
                <div className="space-y-1.5 text-sm">
                    {properties.map((prop, i) => (
                        <div key={i} className="flex items-center py-0.5">
                            <span className="text-muted-foreground w-2/5 text-xs">{prop.label}</span>
                            <span className="flex-1 font-medium text-sm">
                                {prop.value !== null ? prop.value : (
                                    <span className="inline-flex font-medium text-amber-600 bg-amber-500/15 px-2 py-0.5 rounded text-xs border border-amber-500/20">
                                        Uppgift saknas
                                    </span>
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            )}

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
