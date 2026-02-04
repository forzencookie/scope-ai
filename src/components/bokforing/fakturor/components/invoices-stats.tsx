import { ArrowDownLeft, ArrowUpRight, AlertTriangle } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"

export function InvoicesStats({
    incoming,
    outgoing,
    overdueCount,
    onViewOverdue,
}: {
    incoming: number
    outgoing: number
    overdueCount: number
    onViewOverdue?: () => void
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Incoming - Money to receive */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <ArrowDownLeft className="h-5 w-5 text-green-500" />
                <div>
                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(incoming)}</p>
                    <p className="text-xs text-muted-foreground">Att få</p>
                </div>
            </div>

            {/* Outgoing - Money to pay */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <ArrowUpRight className="h-5 w-5 text-red-500" />
                <div>
                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(outgoing)}</p>
                    <p className="text-xs text-muted-foreground">Att betala</p>
                </div>
            </div>

            {/* Overdue count */}
            <div
                onClick={overdueCount > 0 ? onViewOverdue : undefined}
                className={cn(
                    "flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50 transition-colors",
                    overdueCount > 0 && onViewOverdue && "cursor-pointer hover:bg-muted/50 hover:border-border/80"
                )}
            >
                <AlertTriangle className={cn(
                    "h-5 w-5",
                    overdueCount > 0 ? "text-amber-500" : "text-muted-foreground"
                )} />
                <div>
                    <p className="text-2xl font-bold tabular-nums">{overdueCount}</p>
                    <p className="text-xs text-muted-foreground">Förfallna</p>
                </div>
            </div>
        </div>
    )
}
