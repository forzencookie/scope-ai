import { CreditCard } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import type { Transaction } from "@/lib/ai-schema"

export interface TransactionCardProps {
    transaction: Transaction
}

export function TransactionCard({ transaction }: TransactionCardProps) {
    const isIncome = transaction.type === "income"
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isIncome ? "bg-green-500/10" : "bg-red-500/10"
                    )}>
                        <CreditCard className={cn("h-5 w-5", isIncome ? "text-green-600" : "text-red-600")} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm leading-tight">{transaction.description}</h4>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={cn("font-bold text-sm", isIncome ? "text-green-600" : "text-red-600")}>
                        {isIncome ? "+" : ""}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">{transaction.account}</p>
                </div>
            </div>
        </div>
    )
}
