import { FileCheck, Banknote, Link2, AlertTriangle } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { formatCurrencyCompact } from "@/lib/formatters"
import { VerificationStats } from "../types"
import { Skeleton } from "@/components/ui/skeleton"

interface VerifikationerStatsProps {
    stats: VerificationStats
    isLoading?: boolean
}

export function VerifikationerStats({ stats, isLoading }: VerifikationerStatsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-3 gap-4">
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
        <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/40 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <FileCheck className="h-4 w-4 md:h-5 md:w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Antal verifikationer</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate">{stats.total}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/40 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Banknote className="h-4 w-4 md:h-5 md:w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Omslutning</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate" title={formatCurrency(stats.totalAmount)}>
                        <span className="hidden sm:inline">{formatCurrency(stats.totalAmount)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(stats.totalAmount)}</span>
                    </p>
                </div>
            </div>

            <div className={cn(
                "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border overflow-hidden bg-gradient-to-br",
                stats.missingUnderlag > 0
                    ? "from-amber-50/40 to-zinc-50 dark:from-amber-950/20 dark:to-zinc-950/40"
                    : "from-green-50/40 to-zinc-50 dark:from-green-950/20 dark:to-zinc-950/40"
            )}>
                <div className={cn(
                    "h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl flex items-center justify-center",
                    stats.missingUnderlag > 0 ? "bg-amber-50 dark:bg-amber-950" : "bg-green-50 dark:bg-green-950"
                )}>
                    {stats.missingUnderlag > 0 ? (
                        <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-amber-500 dark:text-amber-400" />
                    ) : (
                        <Link2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                    )}
                </div>
                <div className="min-w-0">
                    {stats.missingUnderlag > 0 ? (
                        <>
                            <p className="text-xs text-amber-600/80 dark:text-amber-500/70 truncate">Saknar underlag</p>
                            <p className="text-xl md:text-2xl font-bold tabular-nums truncate text-amber-600 dark:text-amber-500">{stats.missingUnderlag}</p>
                        </>
                    ) : (
                        <>
                            <p className="text-xs text-muted-foreground truncate">Kopplade</p>
                            <p className="text-xl md:text-2xl font-bold tabular-nums truncate">{stats.withTransaction}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
