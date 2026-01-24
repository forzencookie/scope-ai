import { FileText, TrendingDown, AlertCircle } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"

interface ReceiptStats {
    total: number
    matchedCount: number
    unmatchedCount: number
    totalAmount: number
}

interface ReceiptsDashboardProps {
    stats: ReceiptStats
    onViewUnmatched: () => void
}

export function ReceiptsDashboard({ stats, onViewUnmatched }: ReceiptsDashboardProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Receipts */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Antal kvitton</p>
                </div>
            </div>

            {/* Total Amount */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(stats.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">Totalt belopp</p>
                </div>
            </div>

            {/* Unmatched / Pending */}
            <div 
                onClick={stats.unmatchedCount > 0 ? onViewUnmatched : undefined}
                className={cn(
                    "flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50 transition-colors",
                    stats.unmatchedCount > 0 && "cursor-pointer hover:bg-muted/50 hover:border-border/80"
                )}
            >
                <AlertCircle className={cn(
                    "h-5 w-5",
                    stats.unmatchedCount > 0 ? "text-amber-500" : "text-muted-foreground"
                )} />
                <div>
                    <p className="text-2xl font-bold tabular-nums">{stats.unmatchedCount}</p>
                    <p className="text-xs text-muted-foreground">Att hantera</p>
                </div>
            </div>
        </div>
    )
}
