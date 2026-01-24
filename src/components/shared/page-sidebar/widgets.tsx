"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, formatNumber } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

// ============================================================================
// Activity Feed - Shows recent items/events
// ============================================================================

export interface ActivityItem {
    id: string
    title: string
    subtitle?: string
    timestamp: string
    icon?: LucideIcon
    iconColor?: string
    badge?: ReactNode
    onClick?: () => void
}

interface ActivityFeedProps {
    title: string
    description?: string
    items: ActivityItem[]
    emptyMessage?: string
    maxItems?: number
    className?: string
}

export function ActivityFeed({
    title,
    description,
    items,
    emptyMessage = "Inga aktiviteter",
    maxItems = 5,
    className
}: ActivityFeedProps) {
    const displayItems = items.slice(0, maxItems)

    return (
        <Card className={cn("h-full", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{title}</CardTitle>
                {description && (
                    <CardDescription className="text-xs">{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="pt-0">
                {displayItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
                ) : (
                    <div className="space-y-2">
                        {displayItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "flex items-start gap-3 p-2 rounded-lg bg-muted/50",
                                        item.onClick && "cursor-pointer hover:bg-muted transition-colors"
                                    )}
                                    onClick={item.onClick}
                                >
                                    {Icon && (
                                        <div className={cn("mt-0.5 shrink-0", item.iconColor || "text-muted-foreground")}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{item.title}</p>
                                        {item.subtitle && (
                                            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {item.badge}
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {item.timestamp}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// ============================================================================
// Quick Stats - Compact metric display for sidebars
// ============================================================================

export interface QuickStat {
    label: string
    value: string | number
    change?: string
    changeType?: "positive" | "negative" | "neutral"
    icon?: LucideIcon
}

interface QuickStatsProps {
    title: string
    stats: QuickStat[]
    className?: string
}

export function QuickStats({ title, stats, className }: QuickStatsProps) {
    return (
        <Card className={cn("", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                    {stats.map((stat, idx) => {
                        const Icon = stat.icon
                        return (
                            <div key={idx} className="p-2 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-1.5 mb-1">
                                    {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                                    <span className="text-xs text-muted-foreground truncate">{stat.label}</span>
                                </div>
                                <p className="text-lg font-semibold tabular-nums">
                                    {typeof stat.value === "number" ? formatNumber(stat.value) : stat.value}
                                </p>
                                {stat.change && (
                                    <p className={cn(
                                        "text-xs",
                                        stat.changeType === "positive" && "text-green-600 dark:text-green-400",
                                        stat.changeType === "negative" && "text-red-600 dark:text-red-400",
                                        stat.changeType === "neutral" && "text-muted-foreground"
                                    )}>
                                        {stat.change}
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================================================
// Deadline Timeline - Shows upcoming dates
// ============================================================================

export interface DeadlineItem {
    id: string
    title: string
    date: string
    daysUntil: number
    status?: "upcoming" | "due-soon" | "overdue" | "completed"
    icon?: LucideIcon
}

interface DeadlineTimelineProps {
    title: string
    items: DeadlineItem[]
    emptyMessage?: string
    className?: string
}

export function DeadlineTimeline({
    title,
    items,
    emptyMessage = "Inga deadlines",
    className
}: DeadlineTimelineProps) {
    const getStatusColor = (status: DeadlineItem["status"], daysUntil: number) => {
        if (status === "completed") return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/50"
        if (status === "overdue" || daysUntil < 0) return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50"
        if (status === "due-soon" || daysUntil <= 7) return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50"
        return "text-muted-foreground bg-muted/50"
    }

    const getDaysLabel = (days: number) => {
        if (days < 0) return `${Math.abs(days)} dagar sedan`
        if (days === 0) return "Idag"
        if (days === 1) return "Imorgon"
        return `${days} dagar`
    }

    return (
        <Card className={cn("", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
                ) : (
                    <div className="space-y-2">
                        {items.map((item) => {
                            const Icon = item.icon
                            const statusColor = getStatusColor(item.status, item.daysUntil)
                            return (
                                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                                    {Icon && (
                                        <div className="shrink-0 text-muted-foreground">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">{item.date}</p>
                                    </div>
                                    <span className={cn(
                                        "text-xs font-medium px-2 py-0.5 rounded shrink-0",
                                        statusColor
                                    )}>
                                        {getDaysLabel(item.daysUntil)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
