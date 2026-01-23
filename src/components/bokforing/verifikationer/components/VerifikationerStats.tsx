import { FileCheck, Banknote, Link2, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { VerificationStats } from "../types"

interface VerifikationerStatsProps {
    stats: VerificationStats
}

export function VerifikationerStats({ stats }: VerifikationerStatsProps) {
    return (
        <div className="flex flex-wrap items-center gap-4 py-3 px-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm"><span className="font-semibold tabular-nums">{stats.total}</span> verifikationer</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold tabular-nums">{formatCurrency(stats.totalAmount)}</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm"><span className="font-semibold tabular-nums">{stats.withTransaction}</span> kopplade</span>
            </div>
            {stats.missingUnderlag > 0 && (
                <>
                    <div className="h-4 w-px bg-border hidden sm:block" />
                    <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium">{stats.missingUnderlag} saknar underlag</span>
                    </div>
                </>
            )}
        </div>
    )
}
