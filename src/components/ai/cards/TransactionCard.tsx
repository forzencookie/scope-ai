import { CreditCard } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

export interface TransactionCardProps {
    transaction: {
        id?: string
        description?: string
        amount?: number
        date?: string
        account?: string
        type?: "income" | "expense"
    }
}

export function TransactionCard({ transaction }: TransactionCardProps) {
    const isIncome = transaction.type === "income" || (transaction.amount && transaction.amount > 0)
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isIncome ? "bg-green-500/10" : "bg-red-500/10"
                    )}>
                        <CreditCard className={cn("h-5 w-5", isIncome ? "text-green-600" : "text-red-600")} />
                    </div>
                    <div>
                        <h4 className="font-semibold">{transaction.description || "Ny transaktion"}</h4>
                        <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={cn("font-bold text-lg", isIncome ? "text-green-600" : "text-red-600")}>
                        {isIncome ? "+" : ""}{formatCurrency(transaction.amount || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">{transaction.account}</p>
                </div>
            </div>
        </div>
    )
}
