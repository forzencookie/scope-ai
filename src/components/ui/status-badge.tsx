"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    BookOpen,
    type LucideIcon,
} from "lucide-react"
import {
    type StatusVariant,
    type AppStatus,
    getStatusVariant,
} from "@/lib/status-types"

// Re-export types for convenience
export type { StatusVariant, AppStatus }
export { getStatusVariant }

/**
 * @description Low-level status badge component with manual variant control.
 * @see AppStatusBadge - Preferred component for app-wide status display with automatic styling.
 * 
 * Use StatusBadge only when you need custom variant control.
 * For standard statuses, use AppStatusBadge which automatically determines the correct variant.
 */
export interface StatusBadgeProps {
    /** The status text to display */
    status: string
    /** The visual variant */
    variant?: StatusVariant
    /** Optional custom icon */
    icon?: LucideIcon
    /** Show icon */
    showIcon?: boolean
    /** Size variant */
    size?: "sm" | "md"
    /** Additional className */
    className?: string
}

const variantConfig: Record<StatusVariant, { color: string; bgColor: string; defaultIcon: LucideIcon; srLabel: string }> = {
    success: { color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-950/50", defaultIcon: CheckCircle2, srLabel: "Slutförd" },
    warning: { color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-950/50", defaultIcon: Clock, srLabel: "Väntar" },
    error: { color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-950/50", defaultIcon: AlertCircle, srLabel: "Fel" },
    info: { color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-950/50", defaultIcon: AlertCircle, srLabel: "Information" },
    neutral: { color: "text-stone-600 dark:text-stone-400", bgColor: "bg-stone-100 dark:bg-stone-800/50", defaultIcon: Clock, srLabel: "Neutral" },
    violet: { color: "text-violet-700 dark:text-violet-400", bgColor: "bg-violet-100 dark:bg-violet-950/50", defaultIcon: AlertCircle, srLabel: "Info" },
    purple: { color: "text-purple-700 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-950/50", defaultIcon: AlertCircle, srLabel: "Info" },
}

export function StatusBadge({
    status,
    variant = "neutral",
    icon,
    showIcon = false,
    size = "sm",
    className,
}: StatusBadgeProps) {
    const config = variantConfig[variant]
    const Icon = icon || config.defaultIcon

    return (
        <span
            role="status"
            className={cn(
                "inline-flex items-center gap-1.5 rounded-sm font-medium",
                config.color,
                config.bgColor,
                size === "sm" && "text-xs px-2 py-0.5",
                size === "md" && "text-sm px-2.5 py-1",
                className
            )}
        >
            <span className="sr-only">{`Status: ${config.srLabel} -`}</span>
            {showIcon && <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5", "flex-shrink-0")} aria-hidden="true" />}
            {status}
        </span>
    )
}

/**
 * 🎯 PRIMARY STATUS BADGE COMPONENT
 * 
 * Auto-styled status badge that uses centralized status types.
 * Automatically determines the correct visual variant based on the status value.
 * 
 * This is the recommended component for displaying statuses throughout the app.
 * It ensures consistent status presentation by using the centralized status type system.
 * 
 * @example
 * // Transaction status
 * <AppStatusBadge status="Bokförd" />
 * 
 * // Invoice status
 * <AppStatusBadge status="Betald" />
 * 
 * // With size control
 * <AppStatusBadge status="Väntar" size="sm" />
 * 
 * @see status-types.ts for all available status values
 */
import { useTextMode } from "@/providers/text-mode-provider"

const EASY_MODE_MAP: Record<string, string> = {
    "Attesterad": "Godkänd",
    "Tvist": "Problem",
    "Makulerad": "Borttagen",
    "Avvisad": "Nekad",
    "Bearbetar": "Läser in...",
    "Förfallen": "Sen",
    "Granskning krävs": "Kolla över",
    "Behandlad": "Klar",
    "Att bokföra": "Att sortera",
    "Saknar underlag": "Saknar kvitto",
    "Mottagen": "Ny",
}

export function AppStatusBadge({
    status,
    className,
    size = "sm",
    showIcon = false,
}: {
    status: AppStatus
    className?: string
    size?: "sm" | "md"
    showIcon?: boolean
}) {
    const { isEnkel } = useTextMode()
    const variant = getStatusVariant(status)
    const isBooked = status === "Bokförd"

    // Determine display text
    const displayText = (isEnkel && EASY_MODE_MAP[status]) ? EASY_MODE_MAP[status] : status

    // Automatically use BookOpen icon for 'Bokförd' status
    const statusIcon = isBooked ? BookOpen : undefined
    // For booked items, we might want to ensure the icon is shown if it adds context
    // but we respect the prop if it's explicitly false (though default is false).
    // Let's passed it as the icon prop, the consumer can choose to show it via showIcon.

    return <StatusBadge status={displayText} variant={variant} size={size} showIcon={showIcon || isBooked} icon={statusIcon} className={className} />
}

/**
 * @deprecated Use AppStatusBadge instead - this is kept for backward compatibility
 */
export function SwedishStatusBadge({
    status,
    className
}: {
    status: AppStatus
    className?: string
}) {
    return <AppStatusBadge status={status} className={className} />
}

// Keep SwedishStatus as alias for backward compatibility
/** @deprecated Use AppStatus from @/lib/status-types instead */
export type SwedishStatus = AppStatus
