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
    success: { color: "text-[#15803d]", bgColor: "bg-[#dcfce7]", defaultIcon: CheckCircle2, srLabel: "Slutförd" }, // green-700, green-100
    warning: { color: "text-[#b45309]", bgColor: "bg-[#fef3c7]", defaultIcon: Clock, srLabel: "Väntar" }, // amber-700, amber-100
    error: { color: "text-[#b91c1c]", bgColor: "bg-[#fee2e2]", defaultIcon: AlertCircle, srLabel: "Fel" }, // red-700, red-100
    info: { color: "text-[#1d4ed8]", bgColor: "bg-[#dbeafe]", defaultIcon: AlertCircle, srLabel: "Information" }, // blue-700, blue-100
    neutral: { color: "text-[#78716c]", bgColor: "bg-[#f5f5f4]", defaultIcon: Clock, srLabel: "Neutral" }, // stone-500, stone-100
    violet: { color: "text-[#6d28d9]", bgColor: "bg-[#ede9fe]", defaultIcon: AlertCircle, srLabel: "Info" }, // violet-700, violet-100
    purple: { color: "text-[#7e22ce]", bgColor: "bg-[#f3e8ff]", defaultIcon: AlertCircle, srLabel: "Info" }, // purple-700, purple-100
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
