"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Check, type LucideIcon } from "lucide-react"
import type { AIConfirmationRequest } from "@/lib/ai-tools/types"

export type ConfirmationAccent = "blue" | "green" | "emerald" | "purple" | "amber" | "red" | "indigo" | "teal"

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

interface ConfirmationCardProps {
    confirmation: AIConfirmationRequest
    onConfirm: () => void
    onCancel: () => void
    isLoading?: boolean
    isDone?: boolean
    confirmLabel?: string
    icon?: LucideIcon
    accent?: ConfirmationAccent
    className?: string
}

/**
 * Confirmation Card for AI Actions
 *
 * Flat inline UI with colored icon badge + accent button.
 * Philosophy: AI prepares, Human approves.
 */
export function ConfirmationCard({
    confirmation,
    onConfirm,
    onCancel,
    isLoading = false,
    isDone = false,
    confirmLabel,
    icon: Icon,
    accent = "blue",
    className,
}: ConfirmationCardProps) {
    const styles = accentStyles[accent]
    const actionLabel = confirmLabel ?? "Godkänn"

    return (
        <div className={cn('w-full max-w-md space-y-1 py-1', className)}>
            {/* Header with icon badge */}
            <div className="flex items-center gap-2.5 mb-3">
                {Icon && (
                    <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg shrink-0', styles.iconBg)}>
                        <Icon className={cn('h-3.5 w-3.5', styles.iconColor)} />
                    </div>
                )}
                <div>
                    <p className="text-sm font-semibold">{confirmation.title}</p>
                    {confirmation.description && (
                        <p className="text-xs text-muted-foreground">{confirmation.description}</p>
                    )}
                </div>
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

            {/* Warnings */}
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

            {/* Actions / Done state */}
            {isDone ? (
                <div className="flex items-center gap-2 pt-3 text-sm">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                    </div>
                    <span className="font-medium text-emerald-600 dark:text-emerald-500">Klart</span>
                </div>
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
