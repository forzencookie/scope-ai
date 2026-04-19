"use client"

/**
 * Generic Confirmation Card — Key-Value grid layout
 *
 * For standalone transactions: invoices, verifications, asset registrations, etc.
 * Matches ActionCard visual style: bare container, icon badge, accent color, post-confirm phase.
 */

import { AlertCircle, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ConfirmationAccent = "blue" | "green" | "emerald" | "purple" | "amber" | "red" | "indigo" | "teal"

export type CompletedAction = "created" | "updated" | "deleted" | "calculated" | "prepared" | "booked"

import { Plus, Pencil, Trash2, Check, Calculator, FileText } from "lucide-react"

export const completedActionConfig: Record<CompletedAction, { icon: LucideIcon; color: string; bg: string; label: string }> = {
    created:    { icon: Plus,       color: "text-green-600 dark:text-green-500",     bg: "bg-green-500/10",   label: "skapad" },
    updated:    { icon: Pencil,     color: "text-blue-600 dark:text-blue-500",       bg: "bg-blue-500/10",    label: "uppdaterad" },
    deleted:    { icon: Trash2,     color: "text-red-600 dark:text-red-500",         bg: "bg-red-500/10",     label: "borttagen" },
    calculated: { icon: Calculator, color: "text-purple-600 dark:text-purple-500",   bg: "bg-purple-500/10",  label: "beräknad" },
    prepared:   { icon: FileText,   color: "text-amber-600 dark:text-amber-500",     bg: "bg-amber-500/10",   label: "förberedd" },
    booked:     { icon: Check,      color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-500/10", label: "bokförd" },
}

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
    properties: GenericSummaryItem[]
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
    properties,
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
    if (!title || properties.length === 0) {
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

            {/* Property rows */}
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
