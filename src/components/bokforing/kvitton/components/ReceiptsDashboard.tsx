import { FileText, TrendingDown, AlertCircle } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { formatCurrencyCompact } from "@/lib/formatters"
import { Skeleton } from "@/components/ui/skeleton"

interface ReceiptStats {
    total: number
    matchedCount: number
    unmatchedCount: number
    totalAmount: number
}

interface ReceiptsDashboardProps {
    stats: ReceiptStats
    onViewUnmatched: () => void
    isLoading?: boolean
}

export function ReceiptsDashboard({ stats, onViewUnmatched, isLoading }: ReceiptsDashboardProps) {
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
                    <FileText className="h-4 w-4 md:h-5 md:w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Antal kvitton</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate">{stats.total}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/40 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Totalt belopp</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate" title={formatCurrency(stats.totalAmount)}>
                        <span className="hidden sm:inline">{formatCurrency(stats.totalAmount)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(stats.totalAmount)}</span>
                    </p>
                </div>
            </div>

            <div
                onClick={stats.unmatchedCount > 0 ? onViewUnmatched : undefined}
                className={cn(
                    "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border overflow-hidden transition-colors bg-gradient-to-br",
                    stats.unmatchedCount > 0
                        ? "from-amber-50/40 to-zinc-50 dark:from-amber-950/20 dark:to-zinc-950/40 cursor-pointer"
                        : "from-slate-50 to-zinc-50 dark:from-slate-950/40 dark:to-zinc-950/40",
                    stats.unmatchedCount > 0 && "hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-950/60 dark:hover:to-orange-950/60"
                )}
            >
                <div className={cn(
                    "h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl flex items-center justify-center",
                    stats.unmatchedCount > 0 ? "bg-amber-50 dark:bg-amber-950" : "bg-slate-100 dark:bg-slate-800"
                )}>
                    <AlertCircle className={cn(
                        "h-4 w-4 md:h-5 md:w-5",
                        stats.unmatchedCount > 0 ? "text-amber-500 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"
                    )} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Att hantera</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate">{stats.unmatchedCount}</p>
                </div>
            </div>
        </div>
    )
}
