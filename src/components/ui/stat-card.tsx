"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon, HelpCircle, ArrowUpRight, ArrowDownRight } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"

export interface StatCardProps {
    /** Main label/title */
    label: string
    /** Main value to display */
    value: string | number
    /** Optional subtitle or secondary info */
    subtitle?: string
    /** Optional icon to display */
    icon?: LucideIcon
    /** Optional tooltip explanation */
    tooltip?: string
    /** Optional change percentage/value */
    change?: string
    /** Whether the change is positive (green), negative (red), or neutral */
    changeType?: "positive" | "negative" | "neutral"
    /** Optional href to make the card clickable */
    href?: string
    /** Additional className */
    className?: string
    /** Card variant */
    variant?: "default" | "bordered" | "filled"
    /** Icon position relative to text */
    iconPosition?: "right" | "inline"
    /** Additional styling for the icon container */
    iconClassName?: string
    /** Optional icon to display next to the header label with rounded background */
    headerIcon?: LucideIcon
    /** Additional styling for the header icon container */
    headerIconClassName?: string
}

export function StatCard({
    label,
    value,
    subtitle,
    icon: Icon,
    tooltip,
    change,
    changeType,
    href,
    className,
    variant = "bordered",
    iconPosition = "right",
    iconClassName,
    headerIcon: HeaderIcon,
    headerIconClassName,
}: StatCardProps) {
    const cardContent = (
        <div
            className={cn(
                "bg-card rounded-lg p-4 transition-colors border-2 border-border/60",
                href && "hover:bg-muted/30 cursor-pointer",
                className
            )}
        >
            <div className={cn(
                "flex justify-between items-start mb-1",
                iconPosition === "inline" && "flex-col-reverse justify-start gap-4"
            )}>
                <div className={cn("flex flex-col", iconPosition === "inline" && "w-full")}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                        {/* Auto-magically handle both legacy 'icon' and new 'headerIcon' props to ensure consistency */}
                        {(HeaderIcon || (Icon && iconPosition === "right")) && (
                            <div className={cn(
                                "h-6 w-6 rounded-md flex items-center justify-center bg-muted/50",
                                headerIconClassName
                            )}>
                                {(HeaderIcon || Icon) && React.createElement(HeaderIcon || Icon!, {
                                    className: "h-3.5 w-3.5 text-muted-foreground",
                                    strokeWidth: 2
                                })}
                            </div>
                        )}
                        {tooltip && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[250px] text-sm">
                                    <p>{tooltip}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                    {iconPosition === "inline" && (
                        <div className="flex items-center justify-between w-full mt-1">
                            <p className="text-2xl font-semibold">{value}</p>
                            {Icon && (
                                <div className={cn(
                                    "h-10 w-10 rounded-lg flex items-center justify-center bg-muted/50",
                                    iconClassName
                                )}>
                                    <Icon className="h-5 w-5 text-foreground" strokeWidth={2} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* Legacy right-icon support removed to enforce consistency */}
            </div>

            {iconPosition === "right" && <p className="text-2xl font-semibold mt-1">{value}</p>}

            {(subtitle || change) && (
                <div className={cn("mt-1 flex items-center gap-2", iconPosition === "inline" && "mt-0")}>
                    {change && (
                        <div
                            className={cn(
                                "flex items-center gap-1 text-sm px-2 py-0.5 rounded-md",
                                changeType === "positive" && "text-green-600 dark:text-green-500/70 bg-green-50 dark:bg-green-950/15",
                                changeType === "negative" && "text-red-600 dark:text-red-500/70 bg-red-50 dark:bg-red-950/15",
                                changeType === "neutral" && "text-muted-foreground bg-muted/50"
                            )}
                        >
                            {changeType === "positive" && <ArrowUpRight className="h-3.5 w-3.5" />}
                            {changeType === "negative" && <ArrowDownRight className="h-3.5 w-3.5" />}
                            {change}
                        </div>
                    )}
                    {subtitle && (
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                    )}
                </div>
            )}
        </div>
    )

    if (href) {
        return <Link href={href}>{cardContent}</Link>
    }

    return cardContent
}

export interface StatCardGridProps {
    children: React.ReactNode
    columns?: 2 | 3 | 4
    className?: string
}

export function StatCardGrid({ children, columns = 3, className }: StatCardGridProps) {
    return (
        <div
            className={cn(
                "grid gap-4 grid-cols-2", // 2 columns on mobile
                columns === 2 && "md:grid-cols-2",
                columns === 3 && "md:grid-cols-3",
                columns === 4 && "md:grid-cols-4",
                className
            )}
        >
            {children}
        </div>
    )
}
