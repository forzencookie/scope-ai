"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CreditCard, Download, Eye } from "lucide-react"

/**
 * BillingHistoryRow - Row for billing history table
 */
export interface BillingHistoryRowProps {
    date: string
    id: string
    paymentMethod: string
    cardLastFour?: string
    amount: string
    status: "Betald" | "Obetald" | "Väntande"
    onDownloadReceipt?: () => void
    onViewInvoice?: () => void
}

export function BillingHistoryRow({
    date,
    paymentMethod,
    cardLastFour,
    amount,
    status,
    onDownloadReceipt,
    onViewInvoice,
}: BillingHistoryRowProps) {
    const statusColors = {
        "Betald": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        "Obetald": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        "Väntande": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    }

    return (
        <div className="grid grid-cols-[80px_1fr_80px_70px_50px] gap-2 items-center text-sm py-2 border-b last:border-0">
            <span className="text-muted-foreground text-xs">{date}</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="h-3 w-3 shrink-0" />
                <span className="truncate">{paymentMethod}{cardLastFour && ` ·${cardLastFour}`}</span>
            </span>
            <span className="text-right text-xs font-medium">{amount}</span>
            <span className={cn("text-xs px-1.5 py-0.5 rounded text-center", statusColors[status])}>
                {status}
            </span>
            <div className="flex items-center justify-end gap-0.5">
                {onDownloadReceipt && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDownloadReceipt}>
                        <Download className="h-3 w-3 text-muted-foreground" />
                    </Button>
                )}
                {onViewInvoice && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onViewInvoice}>
                        <Eye className="h-3 w-3 text-muted-foreground" />
                    </Button>
                )}
            </div>
        </div>
    )
}

/**
 * SettingsActionCard - Card for critical actions (Export/Delete) with consistent styling
 */
export interface SettingsActionCardProps {
    title: string
    description: string
    actionLabel: string
    onAction: () => void
    variant?: "info" | "destructive"
    icon: React.ComponentType<{ className?: string }>
}

export function SettingsActionCard({
    title,
    description,
    actionLabel,
    onAction,
    variant = "info",
    icon: Icon,
}: SettingsActionCardProps) {
    const isDestructive = variant === "destructive"

    const containerClass = isDestructive
        ? "bg-red-50 dark:bg-red-900/10"
        : "bg-blue-50 dark:bg-blue-900/10"

    const titleClass = isDestructive
        ? "text-red-900 dark:text-red-100"
        : "text-blue-900 dark:text-blue-100"

    const descClass = isDestructive
        ? "text-red-700/80 dark:text-red-200/70"
        : "text-blue-700/80 dark:text-blue-200/70"

    const buttonClass = isDestructive
        ? "text-red-600 hover:bg-red-600/20 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-400/20"
        : "text-blue-600 hover:bg-blue-600/20 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-400/20"

    return (
        <div className={cn("flex items-center justify-between rounded-lg p-4", containerClass)}>
            <div>
                <p className={cn("font-medium", titleClass)}>{title}</p>
                <p className={cn("text-sm", descClass)}>{description}</p>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className={buttonClass}
                onClick={onAction}
            >
                {actionLabel}
                <Icon className="ml-2 h-4 w-4" />
            </Button>
        </div>
    )
}

/**
 * ModeButton - Selectable mode button (for Enkel/Avancerad mode)
 */
export interface ModeButtonProps {
    label: string
    description: string
    selected?: boolean
    onClick?: () => void
}

export function ModeButton({
    label,
    description,
    selected = false,
    onClick,
}: ModeButtonProps) {
    const Check = React.lazy(() => import("lucide-react").then(m => ({ default: m.Check })))

    return (
        <Button
            variant="outline"
            className={cn(
                "h-auto py-4 flex flex-col items-center gap-2 transition-all",
                selected && "border-primary bg-primary/5 ring-2 ring-primary"
            )}
            onClick={onClick}
        >
            <span className="text-base font-medium">{label}</span>
            <span className="text-xs text-muted-foreground text-center">{description}</span>
            {selected && (
                <React.Suspense fallback={null}>
                    <Check className="h-4 w-4 text-primary" />
                </React.Suspense>
            )}
        </Button>
    )
}
