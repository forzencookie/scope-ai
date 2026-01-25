"use client"

import { Package } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
// Import type from hook (or just use loose typing for props as extracted)
import { type useInventarier } from "@/hooks/use-inventarier"

type StatsType = ReturnType<typeof useInventarier>['stats']

interface InventarierStatsProps {
    stats: StatsType
}

export function InventarierStats({ stats }: InventarierStatsProps) {
    const totalValue = stats.totalInkopsvarde

    return (
        <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/40 dark:to-zinc-950/40 p-5">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Total Value Section */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Package className="h-7 w-7 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-sm text-muted-foreground">Totalt tillgångsvärde</p>
                        <p className="text-2xl sm:text-3xl font-bold tabular-nums">{formatCurrency(totalValue)}</p>
                        <p className="text-sm text-muted-foreground">
                            {stats.totalCount} tillgångar i {stats.kategorier} kategorier
                        </p>
                    </div>
                </div>

                {/* Category Breakdown */}
                {Object.keys(stats.breakdown).length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(stats.breakdown).map(([category, data]) => {
                            const Icon = data.icon
                            const percentage = totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0

                            return (
                                <div
                                    key={category}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-background border border-border/50 min-w-[140px]"
                                >
                                    <div className={cn(
                                        "h-9 w-9 rounded-lg flex items-center justify-center",
                                        "bg-muted"
                                    )}>
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{category}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{data.count} st</span>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs font-medium">{percentage}%</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Value Distribution Bar */}
            {Object.keys(stats.breakdown).length > 1 && (
                <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Värdefördelning</p>
                    <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                        {Object.entries(stats.breakdown).map(([category, data], index) => {
                            const percentage = totalValue > 0 ? (data.value / totalValue) * 100 : 0
                            const colors = [
                                'bg-slate-500',
                                'bg-blue-500',
                                'bg-emerald-500',
                                'bg-amber-500',
                                'bg-violet-500',
                            ]
                            return (
                                <div
                                    key={category}
                                    className={cn("h-full transition-all", colors[index % colors.length])}
                                    style={{ width: `${percentage}%` }}
                                    title={`${category}: ${formatCurrency(data.value)}`}
                                />
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
