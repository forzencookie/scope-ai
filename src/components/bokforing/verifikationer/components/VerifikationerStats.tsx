import { FileCheck, Banknote, Link2, AlertTriangle } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { VerificationStats } from "../types"

interface VerifikationerStatsProps {
    stats: VerificationStats
}

export function VerifikationerStats({ stats }: VerifikationerStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <FileCheck className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Antal verifikationer</p>
                </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <Banknote className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(stats.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">Omslutning</p>
                </div>
            </div>

            <div className={cn(
                "flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50 transition-colors",
                stats.missingUnderlag > 0 && "border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20"
            )}>
                {stats.missingUnderlag > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                    <Link2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
                <div>
                    {stats.missingUnderlag > 0 ? (
                        <>
                            <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-500">{stats.missingUnderlag}</p>
                            <p className="text-xs text-amber-600/80 dark:text-amber-500/70">Saknar underlag</p>
                        </>
                    ) : (
                        <>
                            <p className="text-2xl font-bold tabular-nums">{stats.withTransaction}</p>
                            <p className="text-xs text-muted-foreground">Kopplade</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
