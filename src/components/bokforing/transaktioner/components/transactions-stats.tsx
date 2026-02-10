import { ArrowRightLeft, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useTextMode } from "@/providers/text-mode-provider"

interface TransactionsStatsProps {
    totalCount: number
    income: number
    expenses: number
    booked: number
}

export function TransactionsStats({ totalCount, income, expenses, booked }: TransactionsStatsProps) {
    const { text } = useTextMode()
    const allBooked = totalCount > 0 && booked === totalCount

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
                <ArrowRightLeft className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold tabular-nums">{totalCount}</p>
                    <p className="text-xs text-muted-foreground truncate">Antal betalningar</p>
                </div>
            </div>
            <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold tabular-nums">{formatCurrency(income)}</p>
                    <p className="text-xs text-muted-foreground truncate">Pengar in</p>
                </div>
            </div>
            <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold tabular-nums">{formatCurrency(expenses)}</p>
                    <p className="text-xs text-muted-foreground truncate">Pengar ut</p>
                </div>
            </div>
            <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
                <CheckCircle2 className={`h-5 w-5 shrink-0 ${allBooked ? "text-green-600 dark:text-green-400" : "text-amber-500 dark:text-amber-400"}`} />
                <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold tabular-nums">{booked}/{totalCount}</p>
                    <p className="text-xs text-muted-foreground truncate">Allt i ordning</p>
                </div>
            </div>
        </div>
    )
}
