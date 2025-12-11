"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    XCircle,
    LucideIcon,
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
    success: { color: "text-green-700 dark:text-green-500/70", bgColor: "bg-green-100 dark:bg-green-900/20", defaultIcon: CheckCircle2, srLabel: "Slutförd" },
    warning: { color: "text-amber-700 dark:text-amber-500/70", bgColor: "bg-amber-100 dark:bg-amber-900/20", defaultIcon: Clock, srLabel: "Väntar" },
    error: { color: "text-red-700 dark:text-red-500/70", bgColor: "bg-red-100 dark:bg-red-900/20", defaultIcon: AlertCircle, srLabel: "Fel" },
    info: { color: "text-blue-700 dark:text-blue-500/70", bgColor: "bg-blue-100 dark:bg-blue-900/20", defaultIcon: AlertCircle, srLabel: "Information" },
    neutral: { color: "text-muted-foreground", bgColor: "bg-muted/50", defaultIcon: Clock, srLabel: "Neutral" },
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
                "inline-flex items-center gap-1.5 rounded-full font-medium",
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
    const variant = getStatusVariant(status)
    return <StatusBadge status={status} variant={variant} size={size} showIcon={showIcon} className={className} />
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
