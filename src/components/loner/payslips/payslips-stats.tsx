"use client"

import { Banknote, Building2, HandCoins } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { formatCurrencyCompact } from "@/lib/formatters"
import { Skeleton } from "@/components/ui/skeleton"

interface PayslipsStatsProps {
    stats: {
        currentPeriod: string
        employeeCount: number
        totalGross: number
        totalTax: number
        totalEmployerContributions: number
    }
    isLoading?: boolean
}

export function PayslipsStats({ stats, isLoading }: PayslipsStatsProps) {
    const totalNet = stats.totalGross - stats.totalTax

    if (isLoading) {
        return (
            <div className="grid grid-cols-3 gap-3 md:gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border overflow-hidden">
                        <Skeleton className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
            {/* Bruttolön */}
            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-green-50/40 to-zinc-50 dark:from-green-950/20 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
                    <Banknote className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Bruttolön</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate" title={formatCurrency(stats.totalGross)}>
                        <span className="hidden sm:inline">{formatCurrency(stats.totalGross)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(stats.totalGross)}</span>
                    </p>
                </div>
            </div>

            {/* Arbetsgivaravgifter */}
            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-amber-50/40 to-zinc-50 dark:from-amber-950/20 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                    <Building2 className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Arbetsgivaravgifter</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate" title={formatCurrency(stats.totalEmployerContributions)}>
                        <span className="hidden sm:inline">{formatCurrency(stats.totalEmployerContributions)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(stats.totalEmployerContributions)}</span>
                    </p>
                </div>
            </div>

            {/* Nettolön */}
            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-blue-50/40 to-zinc-50 dark:from-blue-950/20 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                    <HandCoins className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Nettolön</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate" title={formatCurrency(totalNet)}>
                        <span className="hidden sm:inline">{formatCurrency(totalNet)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(totalNet)}</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
