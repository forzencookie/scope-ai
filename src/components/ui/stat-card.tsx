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
}: StatCardProps) {
    const cardContent = (
        <div
            className={cn(
                "rounded-lg p-4 transition-colors",
                variant === "bordered" && "border border-border/30",
                variant === "filled" && "bg-card border border-border/30",
                href && "hover:border-border cursor-pointer",
                className
            )}
        >
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-muted-foreground">{label}</p>
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
                {Icon && (
                    <div className="h-8 w-8 rounded-md flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={2.5} />
                    </div>
                )}
            </div>
            <p className="text-2xl font-semibold mt-1">{value}</p>
            {(subtitle || change) && (
                <div className="mt-1 flex items-center gap-1">
                    {change ? (
                        <div
                            className={cn(
                                "flex items-center gap-1 text-sm",
                                changeType === "positive" && "text-green-600",
                                changeType === "negative" && "text-red-600",
                                changeType === "neutral" && "text-muted-foreground"
                            )}
                        >
                            {changeType === "positive" && <ArrowUpRight className="h-3.5 w-3.5" />}
                            {changeType === "negative" && <ArrowDownRight className="h-3.5 w-3.5" />}
                            {change}
                        </div>
                    ) : (
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
                "grid gap-4",
                columns === 2 && "grid-cols-2",
                columns === 3 && "grid-cols-3",
                columns === 4 && "grid-cols-4",
                className
            )}
        >
            {children}
        </div>
    )
}
