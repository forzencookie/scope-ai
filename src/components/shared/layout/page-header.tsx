"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
    /** Main title */
    title: string
    /** Optional subtitle/description */
    subtitle?: string
    /** Action buttons or controls */
    actions?: ReactNode
    /** Additional className for the container */
    className?: string
    /** Hide title on mobile (for space-constrained layouts) */
    hideTitleOnMobile?: boolean
}

/**
 * PageHeader - Responsive page header with title, subtitle, and actions
 * 
 * Stacks vertically on mobile, horizontal on sm+
 */
export function PageHeader({
    title,
    subtitle,
    actions,
    className,
    hideTitleOnMobile = false
}: PageHeaderProps) {
    return (
        <div className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4",
            className
        )}>
            <div className={cn("min-w-0", hideTitleOnMobile && "hidden sm:block")}>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight truncate">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    )
}

interface PageHeaderActionsProps {
    children: ReactNode
    className?: string
}

/**
 * PageHeaderActions - Container for action buttons
 * 
 * Buttons are full-width on mobile, auto-width on sm+
 */
export function PageHeaderActions({ children, className }: PageHeaderActionsProps) {
    return (
        <div className={cn("flex flex-col sm:flex-row items-stretch sm:items-center gap-2", className)}>
            {children}
        </div>
    )
}
