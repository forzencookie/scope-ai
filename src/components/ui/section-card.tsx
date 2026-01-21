"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { AIActionButton } from "./ai-action-button"

export interface SectionCardProps {
    /** Optional icon to display */
    icon?: LucideIcon
    /** Title of the section */
    title: string
    /** Description text */
    description?: string
    /** Additional content on the right side - for custom action elements */
    action?: React.ReactNode
    /** Click handler for AI variant - automatically renders AIActionButton with "Generera" text */
    onAction?: () => void
    /** Custom text for the action button (only used with onAction) */
    actionLabel?: string
    /** Children content */
    children?: React.ReactNode
    /** Additional className */
    className?: string
    /** Card variant */
    variant?: "default" | "highlight" | "info" | "ai" | "warning" | "success"
}

export function SectionCard({
    icon: Icon,
    title,
    description,
    action,
    onAction,
    actionLabel = "Generera",
    children,
    className,
    variant = "default",
}: SectionCardProps) {
    // If onAction is provided and variant is "ai", render AIActionButton automatically
    const resolvedAction = action ?? (onAction && variant === "ai" ? (
        <AIActionButton onClick={onAction}>{actionLabel}</AIActionButton>
    ) : null)
    return (
        <div
            className={cn(
                "rounded-lg p-4",
                variant === "default" && "border border-border/40",
                variant === "highlight" && "border border-primary/30 bg-primary/5",
                variant === "info" && "border border-border/40 bg-muted/30",
                variant === "ai" && "bg-[oklch(0.98_0.01_290)] dark:bg-[oklch(0.18_0.02_290)] border-0",
                variant === "warning" && "bg-amber-50/50 dark:bg-amber-950/20 border-0",
                variant === "success" && "bg-emerald-50/50 dark:bg-emerald-950/20 border-0",
                className
            )}
        >
            <div className="flex items-start gap-3">
                {Icon && variant !== "ai" && (
                    <Icon className={cn(
                        "h-5 w-5 mt-0.5 shrink-0",
                        variant === "highlight" && "text-primary",
                        variant === "warning" && "text-amber-600 dark:text-amber-500",
                        variant === "success" && "text-emerald-600 dark:text-emerald-500",
                        variant !== "highlight" && variant !== "warning" && variant !== "success" && "text-muted-foreground"
                    )} />
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div>
                            <p className="text-sm font-medium">{title}</p>
                            {description && (
                                <p className="text-sm text-muted-foreground mt-1">{description}</p>
                            )}
                        </div>
                        {resolvedAction && <div className="shrink-0">{resolvedAction}</div>}
                    </div>
                    {children && <div className="mt-3">{children}</div>}
                </div>
            </div>
        </div>
    )
}

export interface ListCardProps {
    /** Title of the list section */
    title?: string
    /** Actions to show in the header */
    headerActions?: React.ReactNode
    /** Children content */
    children: React.ReactNode
    /** Show dividers between items */
    dividers?: boolean
    /** Additional className */
    className?: string
    /** Minimal variant - borders only top and bottom, no sides */
    variant?: "default" | "minimal"
}

export function ListCard({
    title,
    headerActions,
    children,
    dividers = true,
    className,
    variant = "default",
}: ListCardProps) {
    const isMinimal = variant === "minimal"
    return (
        <div className={cn(
            isMinimal ? "border-y border-border/40" : "border border-border/40 rounded-lg",
            className
        )}>
            {(title || headerActions) && (
                <div className={cn(
                    "px-4 py-3 flex items-center justify-between",
                    !isMinimal && "border-b border-border/40"
                )}>
                    {title && <h2 className="font-medium">{title}</h2>}
                    {headerActions}
                </div>
            )}
            <div className={cn(dividers && "divide-y divide-border/40")}>
                {children}
            </div>
        </div>
    )
}

export interface ListCardItemProps {
    /** Left content (icon, avatar, etc.) */
    icon?: React.ReactNode
    /** Main content */
    children: React.ReactNode
    /** Right side content */
    trailing?: React.ReactNode
    /** Click handler */
    onClick?: () => void
    /** Additional className */
    className?: string
}

export function ListCardItem({
    icon,
    children,
    trailing,
    onClick,
    className,
}: ListCardItemProps) {
    return (
        <div
            className={cn(
                "px-4 py-4 flex items-center justify-between gap-4 relative group",
                onClick && "cursor-pointer",
                className
            )}
            onClick={onClick}
        >
            {/* Rounded hover pill highlight that doesn't touch the lines */}
            {onClick && (
                <div className="absolute inset-x-0 inset-y-1 rounded-xl bg-transparent group-hover:bg-muted/40 transition-colors z-0" />
            )}

            <div className="flex items-center gap-4 min-w-0 flex-1 relative z-10">
                {icon}
                <div className="min-w-0 flex-1">{children}</div>
            </div>
            {trailing && <div className="relative z-10">{trailing}</div>}
        </div>
    )
}
