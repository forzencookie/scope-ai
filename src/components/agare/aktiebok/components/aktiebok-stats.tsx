import { FileText, Vote, Users } from "lucide-react"
import { cn, formatNumber } from "@/lib/utils"
// Need to import ShareholderDisplay, stats...
import { AktiebokStats as AktiebokStatsType, ShareholderDisplay } from "../types"

interface AktiebokStatsProps {
    stats: AktiebokStatsType
    shareholders: ShareholderDisplay[]
}

export function AktiebokStats({ stats, shareholders }: AktiebokStatsProps) {
    return (
        <div className="rounded-xl border bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-violet-950/30 p-5">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Ownership Ring Visualization */}
                <div className="flex items-center gap-6">
                    <div className="relative h-28 w-28 shrink-0">
                        {/* SVG Donut Chart */}
                        <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
                            {shareholders.slice(0, 5).map((s, i) => {
                                const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#94a3b8']
                                const prevPercent = shareholders.slice(0, i).reduce((sum, prev) => sum + prev.ownershipPercentage, 0)
                                return (
                                    <circle
                                        key={s.id}
                                        cx="18"
                                        cy="18"
                                        r="15.915"
                                        fill="transparent"
                                        stroke={colors[i]}
                                        strokeWidth="3"
                                        strokeDasharray={`${s.ownershipPercentage} ${100 - s.ownershipPercentage}`}
                                        strokeDashoffset={`-${prevPercent}`}
                                        className="transition-all duration-500"
                                    />
                                )
                            })}
                            <circle
                                cx="18"
                                cy="18"
                                r="12"
                                fill="currentColor"
                                className="text-background"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold">{stats.shareholderCount}</span>
                            <span className="text-xs text-muted-foreground">ägare</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col gap-1.5">
                        {shareholders.slice(0, 4).map((s, i) => {
                            const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500']
                            return (
                                <div key={s.id} className="flex items-center gap-2">
                                    <div className={cn("h-2.5 w-2.5 rounded-full", colors[i])} />
                                    <span className="text-sm truncate max-w-[120px]">{s.name}</span>
                                    <span className="text-sm font-medium tabular-nums">{s.ownershipPercentage}%</span>
                                </div>
                            )
                        })}
                        {shareholders.length > 4 && (
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                                <span className="text-sm text-muted-foreground">+{shareholders.length - 4} till</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Key Metrics */}
                <div className="flex-1 grid grid-cols-3 gap-4">
                    <div className="flex flex-col justify-center p-4 rounded-lg bg-background/60 border border-border/50">
                        <FileText className="h-5 w-5 text-indigo-500 mb-2" />
                        <p className="text-2xl font-bold tabular-nums">{formatNumber(stats.totalShares)}</p>
                        <p className="text-xs text-muted-foreground">Totalt aktier</p>
                    </div>
                    <div className="flex flex-col justify-center p-4 rounded-lg bg-background/60 border border-border/50">
                        <Vote className="h-5 w-5 text-violet-500 mb-2" />
                        <p className="text-2xl font-bold tabular-nums">{formatNumber(stats.totalVotes)}</p>
                        <p className="text-xs text-muted-foreground">Totalt röster</p>
                    </div>
                    <div className="flex flex-col justify-center p-4 rounded-lg bg-background/60 border border-border/50">
                        <Users className="h-5 w-5 text-purple-500 mb-2" />
                        <p className="text-2xl font-bold tabular-nums">{formatNumber(stats.shareholderCount)}</p>
                        <p className="text-xs text-muted-foreground">Aktieägare</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
