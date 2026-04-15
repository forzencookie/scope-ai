"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Plus, Pencil, Trash2, Check, Calculator, FileText, type LucideIcon } from "lucide-react"
import type { AIConfirmationRequest } from "@/lib/ai-tools/types"

export type ConfirmationAccent = "blue" | "green" | "emerald" | "purple" | "amber" | "red" | "indigo" | "teal"

export type CompletedAction = "created" | "updated" | "deleted" | "calculated" | "prepared" | "booked"

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

export const completedActionConfig: Record<CompletedAction, { icon: LucideIcon; color: string; bg: string; label: string }> = {
    created:    { icon: Plus,       color: "text-green-600 dark:text-green-500",   bg: "bg-green-500/10",   label: "skapad" },
    updated:    { icon: Pencil,     color: "text-blue-600 dark:text-blue-500",     bg: "bg-blue-500/10",    label: "uppdaterad" },
    deleted:    { icon: Trash2,     color: "text-red-600 dark:text-red-500",       bg: "bg-red-500/10",     label: "borttagen" },
    calculated: { icon: Calculator, color: "text-purple-600 dark:text-purple-500", bg: "bg-purple-500/10",  label: "beräknad" },
    prepared:   { icon: FileText,   color: "text-amber-600 dark:text-amber-500",   bg: "bg-amber-500/10",   label: "förberedd" },
    booked:     { icon: Check,      color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-500/10", label: "bokförd" },
}

interface ConfirmationCardProps {
    confirmation: AIConfirmationRequest
    onConfirm: () => void
    onCancel: () => void
    isLoading?: boolean
    isDone?: boolean
    /** Post-confirm phase: which action was completed */
    completedAction?: CompletedAction
    /** Post-confirm phase: override the title (e.g. "Faktura #2026-043 skapad") */
    completedTitle?: string
    confirmLabel?: string
    icon?: LucideIcon
    accent?: ConfirmationAccent
    className?: string
}

/**
 * Confirmation Card for AI Actions
 *
 * Three-phase card:
 * 1. Pre-confirm — summary rows + confirm/cancel buttons
 * 2. Post-confirm — action badge (+ skapad, ✓ bokförd), title updates, buttons gone
 * 3. Link card — emitted separately as an inline card after this card
 *
 * Philosophy: AI prepares, Human approves, Card transforms.
 */
export function ConfirmationCard({
    confirmation,
    onConfirm,
    onCancel,
    isLoading = false,
    isDone = false,
    completedAction,
    completedTitle,
    confirmLabel,
    icon: Icon,
    accent = "blue",
    className,
}: ConfirmationCardProps) {
    const styles = accentStyles[accent]
    const actionLabel = confirmLabel ?? "Godkänn"
    const isPostConfirm = isDone && completedAction

    // Post-confirm badge config
    const actionConfig = completedAction ? completedActionConfig[completedAction] : null
    const ActionIcon = actionConfig?.icon

    // Title: use completedTitle if post-confirm, otherwise original
    const displayTitle = isPostConfirm && completedTitle ? completedTitle : confirmation.title

    return (
        <div className={cn(
            'w-full max-w-md py-1',
            // Animate the transition when switching to post-confirm
            isPostConfirm && 'animate-in fade-in duration-300',
            className,
        )}>
            {/* Header with icon badge + action badge */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    {Icon && (
                        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg shrink-0', styles.iconBg)}>
                            <Icon className={cn('h-3.5 w-3.5', styles.iconColor)} />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-semibold">{displayTitle}</p>
                        {confirmation.description && (
                            <p className="text-xs text-muted-foreground">{confirmation.description}</p>
                        )}
                    </div>
                </div>

                {/* Post-confirm: action badge */}
                {isPostConfirm && actionConfig && ActionIcon && (
                    <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 animate-in fade-in slide-in-from-right-2 duration-300',
                        actionConfig.bg, actionConfig.color,
                    )}>
                        <ActionIcon className="h-3 w-3" />
                        {actionConfig.label}
                    </span>
                )}
            </div>

            {/* Summary rows */}
            <div className="space-y-1.5 text-sm">
                {confirmation.summary.map((item, index) => (
                    <div key={index} className="flex items-center py-0.5">
                        <span className="text-muted-foreground w-2/5 text-xs">{item.label}</span>
                        <span className="flex-1 font-medium text-sm">{item.value}</span>
                    </div>
                ))}
            </div>

            {/* Warnings — only in pre-confirm */}
            {!isDone && confirmation.warnings && confirmation.warnings.length > 0 && (
                <div className="space-y-1.5 pt-2">
                    {confirmation.warnings.map((warning, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>{warning}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions / Post-confirm / Legacy done state */}
            {isDone ? (
                isPostConfirm ? null : (
                    // Legacy fallback: simple "Klart" for isDone without completedAction
                    <div className="flex items-center gap-2 pt-3 text-sm">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                        </div>
                        <span className="font-medium text-emerald-600 dark:text-emerald-500">Klart</span>
                    </div>
                )
            ) : (
                <div className="flex gap-2 pt-3">
                    <Button
                        size="sm"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sparar...' : actionLabel}
                    </Button>

                    <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
                        Avbryt
                    </Button>
                </div>
            )}
        </div>
    )
}
