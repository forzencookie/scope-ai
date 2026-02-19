"use client"

import { Users, Banknote, Wallet, Building2 } from "lucide-react"
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
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* Employee Count */}
            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/40 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Antal anställda</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate">{stats.employeeCount}</p>
                </div>
            </div>

            {/* Total Gross */}
            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-green-50/40 to-zinc-50 dark:from-green-950/20 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
                    <Banknote className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Totalt brutto</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate" title={formatCurrency(stats.totalGross)}>
                        <span className="hidden sm:inline">{formatCurrency(stats.totalGross)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(stats.totalGross)}</span>
                    </p>
                </div>
            </div>

            {/* Total Tax */}
            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-red-50/40 to-zinc-50 dark:from-red-950/20 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-red-50 dark:bg-red-950 flex items-center justify-center">
                    <Wallet className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Skatt att betala</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate" title={formatCurrency(stats.totalTax)}>
                        <span className="hidden sm:inline">{formatCurrency(stats.totalTax)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(stats.totalTax)}</span>
                    </p>
                </div>
            </div>

            {/* Employer Contributions */}
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
        </div>
    )
}
