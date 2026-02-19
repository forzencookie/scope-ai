import { ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { formatCurrencyCompact } from "@/lib/formatters"
import { Skeleton } from "@/components/ui/skeleton"

interface TransactionsStatsProps {
    totalCount: number
    income: number
    expenses: number
    isLoading?: boolean
}

export function TransactionsStats({ totalCount, income, expenses, isLoading }: TransactionsStatsProps) {
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
            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/40 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <ArrowRightLeft className="h-4 w-4 md:h-5 md:w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Antal betalningar</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate">{totalCount}</p>
                </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-green-50/40 to-zinc-50 dark:from-green-950/20 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Pengar in</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate" title={formatCurrency(income)}>
                        <span className="hidden sm:inline">{formatCurrency(income)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(income)}</span>
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border bg-gradient-to-br from-red-50/40 to-zinc-50 dark:from-red-950/20 dark:to-zinc-950/40 overflow-hidden">
                <div className="h-9 w-9 md:h-11 md:w-11 shrink-0 rounded-xl bg-red-50 dark:bg-red-950 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">Pengar ut</p>
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate" title={formatCurrency(expenses)}>
                        <span className="hidden sm:inline">{formatCurrency(expenses)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(expenses)}</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
