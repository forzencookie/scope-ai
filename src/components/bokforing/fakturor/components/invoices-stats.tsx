import { ArrowDownLeft, ArrowUpRight, AlertTriangle } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { formatCurrencyCompact } from "@/lib/formatters"
import { Skeleton } from "@/components/ui/skeleton"

export function InvoicesStats({
    incoming,
    outgoing,
    overdueCount,
    onViewOverdue,
    isLoading,
}: {
    incoming: number
    outgoing: number
    overdueCount: number
    onViewOverdue?: () => void
    isLoading?: boolean
}) {
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
            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-green-50/40 to-zinc-50 dark:from-green-950/20 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
                    <ArrowDownLeft className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Att få</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate" title={formatCurrency(incoming)}>
                        <span className="hidden sm:inline">{formatCurrency(incoming)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(incoming)}</span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-red-50/40 to-zinc-50 dark:from-red-950/20 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-red-50 dark:bg-red-950 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Att betala</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate" title={formatCurrency(outgoing)}>
                        <span className="hidden sm:inline">{formatCurrency(outgoing)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(outgoing)}</span>
                    </p>
                </div>
            </div>

            <div
                onClick={overdueCount > 0 ? onViewOverdue : undefined}
                className={cn(
                    "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border overflow-hidden transition-colors bg-gradient-to-br",
                    overdueCount > 0
                        ? "from-amber-50/40 to-zinc-50 dark:from-amber-950/20 dark:to-zinc-950/40 cursor-pointer"
                        : "from-slate-50 to-zinc-50 dark:from-slate-950/40 dark:to-zinc-950/40",
                    overdueCount > 0 && onViewOverdue && "hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-950/60 dark:hover:to-orange-950/60"
                )}
            >
                <div className={cn(
                    "h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl flex items-center justify-center",
                    overdueCount > 0 ? "bg-amber-50 dark:bg-amber-950" : "bg-slate-100 dark:bg-slate-800"
                )}>
                    <AlertTriangle className={cn(
                        "h-4 w-4 md:h-5 md:w-5",
                        overdueCount > 0 ? "text-amber-500 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"
                    )} />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Förfallna</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate">{overdueCount}</p>
                </div>
            </div>
        </div>
    )
}
