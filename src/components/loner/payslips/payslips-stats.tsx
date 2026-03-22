"use client"

import { Banknote, Building2, HandCoins, CalendarDays } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { formatCurrencyCompact } from "@/lib/formatters"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PayslipsStatsProps {
    stats: {
        currentPeriod: string
        employeeCount: number
        totalGross: number
        totalTax: number
        totalEmployerContributions: number
    }
    periodStatus?: "Utkast" | "Granskas" | "Skickad"
    isLoading?: boolean
    actionButton?: React.ReactNode
}

const statusConfig = {
    "Utkast": {
        label: "Utkast",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
        dotClass: "bg-amber-500",
    },
    "Granskas": {
        label: "Granskas",
        badgeClass: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
        dotClass: "bg-blue-500",
    },
    "Skickad": {
        label: "Skickad",
        badgeClass: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800",
        dotClass: "bg-green-500",
    },
}

export function PayslipsStats({ stats, periodStatus = "Utkast", isLoading, actionButton }: PayslipsStatsProps) {
    const totalNet = stats.totalGross - stats.totalTax
    const config = statusConfig[periodStatus]

    if (isLoading) {
        return (
            <div className="space-y-4">
                {/* Banner skeleton */}
                <div className="rounded-xl border p-5">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-48" />
                        </div>
                        <Skeleton className="h-10 w-36" />
                    </div>
                </div>
                {/* Metric cards skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl border p-5 space-y-3">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Period Status Banner */}
            <div className="rounded-xl border bg-gradient-to-r from-muted/50 to-muted/20 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <CalendarDays className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Löneperiod</p>
                            <div className="flex items-center gap-3 mt-0.5">
                                <h2 className="text-2xl font-bold tracking-tight">{stats.currentPeriod}</h2>
                                <Badge
                                    variant="outline"
                                    className={cn("text-sm px-3 py-0.5 font-semibold", config.badgeClass)}
                                >
                                    <span className={cn("h-2 w-2 rounded-full mr-1.5 animate-pulse", config.dotClass)} />
                                    {config.label}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {stats.employeeCount} anställd{stats.employeeCount !== 1 ? "a" : ""}
                            </p>
                        </div>
                    </div>
                    {actionButton && (
                        <div className="shrink-0">
                            {actionButton}
                        </div>
                    )}
                </div>
            </div>

            {/* Key Numbers — 3 large metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Bruttolön */}
                <div className="rounded-xl border bg-gradient-to-br from-green-50/60 to-background dark:from-green-950/30 dark:to-background p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                            <Banknote className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Bruttolön</p>
                    </div>
                    <p
                        className="text-3xl font-bold tabular-nums text-green-700 dark:text-green-400 truncate"
                        title={formatCurrency(stats.totalGross)}
                    >
                        <span className="hidden sm:inline">{formatCurrency(stats.totalGross)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(stats.totalGross)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Total bruttolön denna period</p>
                </div>

                {/* Arbetsgivaravgifter */}
                <div className="rounded-xl border bg-gradient-to-br from-amber-50/60 to-background dark:from-amber-950/30 dark:to-background p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Arbetsgivaravgifter</p>
                    </div>
                    <p
                        className="text-3xl font-bold tabular-nums text-amber-700 dark:text-amber-400 truncate"
                        title={formatCurrency(stats.totalEmployerContributions)}
                    >
                        <span className="hidden sm:inline">{formatCurrency(stats.totalEmployerContributions)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(stats.totalEmployerContributions)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">31,42% av bruttolön</p>
                </div>

                {/* Nettolön */}
                <div className="rounded-xl border bg-gradient-to-br from-blue-50/60 to-background dark:from-blue-950/30 dark:to-background p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                            <HandCoins className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Nettolön</p>
                    </div>
                    <p
                        className="text-3xl font-bold tabular-nums text-blue-700 dark:text-blue-400 truncate"
                        title={formatCurrency(totalNet)}
                    >
                        <span className="hidden sm:inline">{formatCurrency(totalNet)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(totalNet)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Utbetalas till anställda</p>
                </div>
            </div>
        </div>
    )
}
