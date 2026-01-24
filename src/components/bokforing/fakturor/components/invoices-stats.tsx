import { ArrowDownLeft, ArrowUpRight, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export function InvoicesStats({
    incoming,
    outgoing,
    overdueCount,
}: {
    incoming: number
    outgoing: number
    overdueCount: number
}) {
    return (
        <div className="flex flex-wrap items-center gap-4 md:gap-6 py-3 px-4 bg-muted/30 rounded-lg border border-border/40">
            {/* Incoming */}
            <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-green-500/10 flex items-center justify-center shrink-0">
                    <ArrowDownLeft className="h-3.5 w-3.5 text-green-500" />
                </div>
                <div>
                    <span className="text-xs text-muted-foreground">Att få</span>
                    <p className="text-sm font-semibold tabular-nums">{formatCurrency(incoming)}</p>
                </div>
            </div>

            <div className="hidden sm:block h-8 w-px bg-border/60" />

            {/* Outgoing */}
            <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-red-500/10 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                </div>
                <div>
                    <span className="text-xs text-muted-foreground">Att betala</span>
                    <p className="text-sm font-semibold tabular-nums">{formatCurrency(outgoing)}</p>
                </div>
            </div>

            {/* Overdue warning - only show if there are overdue invoices */}
            {overdueCount > 0 && (
                <>
                    <div className="h-8 w-px bg-border/60" />
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground">Förfallna</span>
                            <p className="text-sm font-semibold">{overdueCount} st</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
