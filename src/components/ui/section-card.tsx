"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface SectionCardProps {
    /** Optional icon to display */
    icon?: LucideIcon
    /** Title of the section */
    title: string
    /** Description text */
    description?: string
    /** Additional content on the right side */
    action?: React.ReactNode
    /** Children content */
    children?: React.ReactNode
    /** Additional className */
    className?: string
    /** Card variant */
    variant?: "default" | "highlight" | "info"
}

export function SectionCard({
    icon: Icon,
    title,
    description,
    action,
    children,
    className,
    variant = "default",
}: SectionCardProps) {
    return (
        <div
            className={cn(
                "border rounded-lg p-4",
                variant === "default" && "border-border/50",
                variant === "highlight" && "border-primary/30 bg-primary/5",
                variant === "info" && "border-border/50 bg-muted/30",
                className
            )}
        >
            <div className="flex items-start gap-3">
                {Icon && (
                    <Icon className={cn(
                        "h-5 w-5 mt-0.5 shrink-0",
                        variant === "highlight" ? "text-primary" : "text-muted-foreground"
                    )} />
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium">{title}</p>
                            {description && (
                                <p className="text-sm text-muted-foreground mt-1">{description}</p>
                            )}
                        </div>
                        {action && <div className="shrink-0">{action}</div>}
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
}

export function ListCard({
    title,
    headerActions,
    children,
    dividers = true,
    className,
}: ListCardProps) {
    return (
        <div className={cn("border border-border/50 rounded-lg", className)}>
            {(title || headerActions) && (
                <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
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
                "px-4 py-3 flex items-center justify-between gap-3",
                onClick && "hover:bg-muted/30 cursor-pointer transition-colors",
                className
            )}
            onClick={onClick}
        >
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {icon}
                <div className="min-w-0 flex-1">{children}</div>
            </div>
            {trailing}
        </div>
    )
}
