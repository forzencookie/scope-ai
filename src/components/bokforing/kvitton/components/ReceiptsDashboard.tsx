import { Link2, FileText, CheckCircle2, Banknote, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
// Assuming types are present or I can infer them.
// I'll define an interface props.

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
        <div className="rounded-xl border bg-muted/20 p-5">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: AI Matching Progress */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <Link2 className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">AI-matchning</h3>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-muted-foreground">
                                {stats.matchedCount} av {stats.total} matchade
                            </span>
                            <span className="text-sm font-medium">
                                {stats.total > 0
                                    ? Math.round((stats.matchedCount / stats.total) * 100)
                                    : 0}%
                            </span>
                        </div>
                        <div className="h-3 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full bg-foreground/80 rounded-full transition-all duration-500"
                                style={{
                                    width: stats.total > 0
                                        ? `${(stats.matchedCount / stats.total) * 100}%`
                                        : '0%'
                                }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                            <span className="font-medium">
                                {formatCurrency(stats.totalAmount)} totalt
                            </span>
                            {stats.unmatchedCount > 0 && (
                                <button
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={onViewUnmatched}
                                >
                                    {stats.unmatchedCount} omatchade →
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Breakdown */}
                    <div className="flex items-center gap-4 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-foreground" />
                            <span className="text-sm">{stats.matchedCount} matchade</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-foreground/50" />
                            <span className="text-sm">{stats.unmatchedCount} omatchade</span>
                        </div>
                    </div>
                </div>

                {/* Right: Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 lg:w-auto lg:min-w-[280px]">
                    <div className="flex flex-col p-3.5 rounded-lg bg-background/60 border border-border/50">
                        <FileText className="h-4 w-4 text-muted-foreground mb-1.5" />
                        <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">Totalt</p>
                    </div>
                    <div className="flex flex-col p-3.5 rounded-lg bg-background/60 border border-border/50">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground mb-1.5" />
                        <p className="text-2xl font-bold tabular-nums">{stats.matchedCount}</p>
                        <p className="text-xs text-muted-foreground">Matchade</p>
                    </div>
                    <div className="flex flex-col p-3.5 rounded-lg bg-background/60 border border-border/50">
                        <Banknote className="h-4 w-4 text-muted-foreground mb-1.5" />
                        <p className="text-2xl font-bold tabular-nums">{formatCurrency(stats.totalAmount)}</p>
                        <p className="text-xs text-muted-foreground">Belopp</p>
                    </div>
                    <div className="flex flex-col p-3.5 rounded-lg bg-background/60 border border-border/50">
                        <Clock className="h-4 w-4 text-muted-foreground mb-1.5" />
                        <p className="text-2xl font-bold tabular-nums">{stats.unmatchedCount}</p>
                        <p className="text-xs text-muted-foreground">Omatchade</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
