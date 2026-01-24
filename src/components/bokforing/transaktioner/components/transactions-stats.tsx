import { ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
// We need to import text mode context in the parent, or pass strings. PASS STRINGS/DATA.
// Wait, I can use the hook inside if "use client".
import { useTextMode } from "@/providers/text-mode-provider"

interface TransactionsStatsProps {
    totalCount: number
    income: number
    expenses: number
}

export function TransactionsStats({ totalCount, income, expenses }: TransactionsStatsProps) {
    const { text } = useTextMode()

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
                <ArrowRightLeft className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold tabular-nums">{totalCount}</p>
                    <p className="text-xs text-muted-foreground truncate">{text.stats.totalTransactions}</p>
                </div>
            </div>
            <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold tabular-nums">{formatCurrency(income)}</p>
                    <p className="text-xs text-muted-foreground truncate">{text.stats.income}</p>
                </div>
            </div>
            <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold tabular-nums">{formatCurrency(expenses)}</p>
                    <p className="text-xs text-muted-foreground truncate">{text.stats.expenses}</p>
                </div>
            </div>
        </div>
    )
}
