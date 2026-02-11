import { ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { formatCurrencyCompact } from "@/lib/formatters"

interface TransactionsStatsProps {
    totalCount: number
    income: number
    expenses: number
}

export function TransactionsStats({ totalCount, income, expenses }: TransactionsStatsProps) {
    return (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
                <ArrowRightLeft className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold tabular-nums">{totalCount}</p>
                    <p className="text-xs text-muted-foreground truncate">Antal betalningar</p>
                </div>
            </div>
            <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50 overflow-hidden">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate" title={formatCurrency(income)}>
                        <span className="hidden sm:inline">{formatCurrency(income)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(income)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">Pengar in</p>
                </div>
            </div>
            <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50 overflow-hidden">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold tabular-nums truncate" title={formatCurrency(expenses)}>
                        <span className="hidden sm:inline">{formatCurrency(expenses)}</span>
                        <span className="sm:hidden">{formatCurrencyCompact(expenses)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">Pengar ut</p>
                </div>
            </div>
        </div>
    )
}
