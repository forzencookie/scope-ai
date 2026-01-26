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

// ============================================================================
// Dynamic Tasks Widget - Shows actionable tasks from real data
// ============================================================================

import { useDynamicTasks, type DynamicGoal } from "@/hooks"
import { CheckCircle2, Circle, ChevronRight } from "lucide-react"
import Link from "next/link"

interface DynamicTasksWidgetProps {
    /** Which category to show, or all if not specified */
    category?: 'bokforing' | 'rapporter' | 'loner' | 'agare'
    /** Max goals to show */
    maxGoals?: number
    className?: string
}

export function DynamicTasksWidget({
    category,
    maxGoals = 3,
    className
}: DynamicTasksWidgetProps) {
    const { goals, isLoading } = useDynamicTasks()

    const filteredGoals = category 
        ? goals.filter(g => g.category === category)
        : goals

    const displayGoals = filteredGoals.slice(0, maxGoals)

    if (isLoading) {
        return (
            <Card className={cn("h-full", className)}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Uppgifter</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground text-center py-4">Laddar...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={cn("h-full", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Att göra</CardTitle>
                <CardDescription className="text-xs">
                    Baserat på din bokföring
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
                {displayGoals.map((goal) => (
                    <GoalSection key={goal.id} goal={goal} />
                ))}
                {displayGoals.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Inga uppgifter just nu! 🎉
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

function GoalSection({ goal }: { goal: DynamicGoal }) {
    const completedCount = goal.tasks.filter(t => t.completed).length
    const totalCount = goal.tasks.length
    const allCompleted = completedCount === totalCount

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">{goal.name}</h4>
                <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    allCompleted 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                )}>
                    {completedCount}/{totalCount}
                </span>
            </div>
            <div className="space-y-1">
                {goal.tasks.map((task) => (
                    <Link
                        key={task.id}
                        href={task.href || '#'}
                        className={cn(
                            "flex items-center gap-2 p-2 rounded-md text-sm transition-colors",
                            "hover:bg-muted/80",
                            task.completed && "text-muted-foreground"
                        )}
                    >
                        {task.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={cn("flex-1 truncate", task.completed && "line-through")}>
                            {task.title}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                ))}
            </div>
        </div>
    )
}
