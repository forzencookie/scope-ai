"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ChevronDown, Lock, LockOpen, FileText, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthlySummary {
    month: number
    year: number
    period: string
    label: string
    verificationCount: number
    revenue: number
    expenses: number
    result: number
    status: 'open' | 'closed'
}

interface ManadsavslutViewProps {
    year: number
}

function formatSEK(amount: number): string {
    return amount.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + ' kr'
}

export function ManadsavslutView({ year }: ManadsavslutViewProps) {
    const [summaries, setSummaries] = useState<MonthlySummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedMonth, setExpandedMonth] = useState<number | null>(null)
    const [actionInProgress, setActionInProgress] = useState<number | null>(null)

    const fetchSummaries = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/manadsavslut?year=${year}`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setSummaries(data.summaries || [])
        } catch (error) {
            console.error('Failed to fetch månadsavslut:', error)
        } finally {
            setIsLoading(false)
        }
    }, [year])

    useEffect(() => {
        fetchSummaries()
    }, [fetchSummaries])

    const handleToggleMonth = async (month: number, action: 'close' | 'reopen') => {
        setActionInProgress(month)
        try {
            const res = await fetch('/api/manadsavslut', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year, month, action }),
            })
            if (!res.ok) throw new Error('Failed to update')
            await fetchSummaries()
        } catch (error) {
            console.error('Failed to toggle month:', error)
        } finally {
            setActionInProgress(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Laddar månadsavslut...
            </div>
        )
    }

    // Determine current month for highlighting
    const now = new Date()
    const currentMonth = now.getFullYear() === year ? now.getMonth() + 1 : 0

    // Running totals
    let accRevenue = 0
    let accExpenses = 0

    return (
        <div className="space-y-2">
            {summaries.map((summary) => {
                accRevenue += summary.revenue
                accExpenses += summary.expenses
                const isExpanded = expandedMonth === summary.month
                const isCurrent = summary.month === currentMonth
                const isFuture = summary.month > currentMonth && year === now.getFullYear()
                const hasData = summary.verificationCount > 0
                const isClosed = summary.status === 'closed'
                const isProcessing = actionInProgress === summary.month

                return (
                    <Card
                        key={summary.month}
                        className={cn(
                            "overflow-hidden transition-all",
                            isCurrent && "ring-1 ring-primary/30",
                            isFuture && "opacity-50",
                        )}
                    >
                        {/* Row header */}
                        <button
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                            onClick={() => setExpandedMonth(isExpanded ? null : summary.month)}
                        >
                            <ChevronDown className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                                isExpanded && "rotate-180"
                            )} />

                            {/* Status icon */}
                            {isClosed ? (
                                <Lock className="h-4 w-4 text-green-600 shrink-0" />
                            ) : (
                                <LockOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}

                            {/* Month label */}
                            <span className={cn(
                                "font-medium text-sm min-w-[140px]",
                                isCurrent && "text-primary font-semibold"
                            )}>
                                {summary.label}
                                {isCurrent && (
                                    <Badge variant="outline" className="ml-2 text-[10px] py-0">nu</Badge>
                                )}
                            </span>

                            {/* Stats in the row */}
                            <div className="flex items-center gap-6 ml-auto text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>{summary.verificationCount}</span>
                                </div>
                                {hasData && (
                                    <>
                                        <div className="flex items-center gap-1.5 text-green-600">
                                            <TrendingUp className="h-3.5 w-3.5" />
                                            <span>{formatSEK(summary.revenue)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-red-500">
                                            <TrendingDown className="h-3.5 w-3.5" />
                                            <span>{formatSEK(summary.expenses)}</span>
                                        </div>
                                    </>
                                )}
                                <Badge
                                    variant={isClosed ? "default" : "secondary"}
                                    className={cn(
                                        "text-[10px]",
                                        isClosed && "bg-green-100 text-green-800 hover:bg-green-100"
                                    )}
                                >
                                    {isClosed ? 'Stängd' : 'Öppen'}
                                </Badge>
                            </div>
                        </button>

                        {/* Expanded detail */}
                        {isExpanded && (
                            <div className="border-t px-4 py-4 bg-muted/10">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Verifikationer</p>
                                        <p className="text-lg font-semibold">{summary.verificationCount}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Intäkter</p>
                                        <p className="text-lg font-semibold text-green-600">{formatSEK(summary.revenue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Kostnader</p>
                                        <p className="text-lg font-semibold text-red-500">{formatSEK(summary.expenses)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Periodens resultat</p>
                                        <p className={cn(
                                            "text-lg font-semibold",
                                            summary.result >= 0 ? "text-green-600" : "text-red-500"
                                        )}>
                                            {formatSEK(summary.result)}
                                        </p>
                                    </div>
                                </div>

                                {/* Accumulated totals */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3 mb-4">
                                    <span>Ackumulerat t.o.m. {summary.label.split(' ')[0].toLowerCase()}:</span>
                                    <span className="text-green-600">Intäkter {formatSEK(accRevenue)}</span>
                                    <span className="text-red-500">Kostnader {formatSEK(accExpenses)}</span>
                                    <span className={cn(
                                        "font-medium",
                                        (accRevenue - accExpenses) >= 0 ? "text-green-600" : "text-red-500"
                                    )}>
                                        Resultat {formatSEK(accRevenue - accExpenses)}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {!isClosed && hasData && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleToggleMonth(summary.month, 'close')}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                            ) : (
                                                <Lock className="h-4 w-4 mr-1" />
                                            )}
                                            Stäng period
                                        </Button>
                                    )}
                                    {isClosed && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleToggleMonth(summary.month, 'reopen')}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                            ) : (
                                                <LockOpen className="h-4 w-4 mr-1" />
                                            )}
                                            Öppna period
                                        </Button>
                                    )}
                                    {!hasData && !isFuture && (
                                        <p className="text-xs text-muted-foreground italic">
                                            Inga verifikationer för denna period.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                )
            })}
        </div>
    )
}
