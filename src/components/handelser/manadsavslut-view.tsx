"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    TrendingUp,
    TrendingDown,
    FileCheck,
    ExternalLink,
    Check,
    X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatSEK, formatSEKCompact } from "@/lib/formatters"
import { useMonthClosing } from "@/hooks/use-month-closing"
import { MonthReviewDialog } from "./month-review-dialog"

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

const MONTH_NAMES_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
]

const MONTH_NAMES_SV = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
]

// Build default 12-month grid (used when API hasn't loaded or fails)
function buildDefaultSummaries(year: number): MonthlySummary[] {
    return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        year,
        period: `${year}-${String(i + 1).padStart(2, '0')}`,
        label: `${MONTH_NAMES_SHORT[i]} ${year}`,
        verificationCount: 0,
        revenue: 0,
        expenses: 0,
        result: 0,
        status: 'open' as const,
    }))
}

export function ManadsavslutView({ year }: ManadsavslutViewProps) {
    const [summaries, setSummaries] = useState<MonthlySummary[]>(() => buildDefaultSummaries(year))
    // Default selection = current month (or January for past/future years)
    const now = new Date()
    const defaultMonth = now.getFullYear() === year ? now.getMonth() + 1 : 1
    const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth)
    const [dialogMonth, setDialogMonth] = useState<number | null>(null)

    const { toggleCheck, getVerificationStats, getResolvedChecks, getCheckProgress, updatePendingCounts } = useMonthClosing()

    const fetchMonthData = useCallback(async () => {
        try {
            const res = await fetch(`/api/manadsavslut?year=${year}`)
            if (!res.ok) return
            const data = await res.json()
            if (data.summaries?.length) setSummaries(data.summaries)
            if (data.pendingTransactions) updatePendingCounts(data.pendingTransactions)
        } catch {
            // Grid stays with defaults
        }
    }, [year, updatePendingCounts])

    useEffect(() => {
        setSummaries(buildDefaultSummaries(year))
        fetchMonthData()
    }, [year, fetchMonthData])

    const currentMonth = now.getFullYear() === year ? now.getMonth() + 1 : 0

    // Selected month data — dynamic checks
    const selectedSummary = summaries.find(s => s.month === selectedMonth) || summaries[0]
    const stats = getVerificationStats(year, selectedMonth)
    const resolvedChecks = getResolvedChecks(year, selectedMonth)
    const progress = getCheckProgress(resolvedChecks)
    const allChecked = progress.completed === progress.total && progress.total > 0
    const isFutureSelected = selectedMonth > currentMonth && year === now.getFullYear()

    return (
        <>
            {/* 12-month grid timeline */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {summaries.map((summary) => {
                    const isCurrent = summary.month === currentMonth
                    const isFuture = summary.month > currentMonth && year === now.getFullYear()
                    const isPast = !isCurrent && !isFuture
                    const isSelected = summary.month === selectedMonth

                    const rc = getResolvedChecks(year, summary.month)
                    const p = getCheckProgress(rc)
                    const manualCompleted = rc.filter(c => c.type === 'manual' && c.value).length
                    const allDone = p.completed === p.total && p.total > 0
                    const hasProgress = manualCompleted > 0

                    return (
                        <button
                            key={summary.month}
                            onClick={() => setSelectedMonth(summary.month)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg border transition-all",
                                isSelected
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "bg-card hover:bg-muted/50",
                                isCurrent && !isSelected && "border-blue-300 dark:border-blue-700",
                                isFuture && "opacity-50",
                            )}
                        >
                            <span className="text-sm font-medium">
                                {MONTH_NAMES_SHORT[summary.month - 1]}
                            </span>
                            <div className={cn(
                                "h-3 w-3 rounded-full",
                                isCurrent ? "bg-blue-500" :
                                allDone && isPast ? "bg-green-400/40 dark:bg-green-500/30" :
                                allDone ? "bg-green-500" :
                                hasProgress ? "bg-yellow-400" :
                                isPast ? "bg-white dark:bg-gray-400" :
                                "border-2 border-gray-300 dark:border-gray-500"
                            )} />
                            {summary.verificationCount > 0 && (
                                <span className="text-[10px] text-muted-foreground">{summary.verificationCount}</span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Detail panel — always visible for selected month */}
            <div className="grid gap-4 md:grid-cols-2 mt-4">
                {/* Left: Summary card */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    {MONTH_NAMES_SV[selectedMonth - 1]} {year}
                                    {selectedMonth === currentMonth && (
                                        <Badge variant="outline" className="text-[10px] py-0">nu</Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {isFutureSelected
                                        ? "Perioden har inte börjat ännu"
                                        : allChecked
                                            ? "Alla avstämningar klara"
                                            : "Perioden är öppen för bokföring"
                                    }
                                </CardDescription>
                            </div>
                            <Badge
                                variant={allChecked ? "default" : "secondary"}
                                className={cn(
                                    "text-xs px-2 py-0.5",
                                    allChecked && "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300"
                                )}
                            >
                                {allChecked ? "KLAR" : `${progress.completed}/${progress.total}`}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Financial stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-muted/30 rounded-md">
                                <p className="text-xs text-muted-foreground">Verifikationer</p>
                                <p className="text-xl font-bold">{stats.verificationCount}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-md">
                                <p className="text-xs text-muted-foreground">Avvikelser</p>
                                <p className={cn(
                                    "text-xl font-bold",
                                    stats.discrepancyCount === 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    {stats.discrepancyCount}
                                </p>
                            </div>
                        </div>

                        {selectedSummary && (selectedSummary.revenue > 0 || selectedSummary.expenses > 0) && (
                            <div className="grid grid-cols-3 gap-2 min-w-0">
                                <div className="p-2 rounded-md bg-green-50 dark:bg-green-950/30 overflow-hidden">
                                    <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 mb-0.5">
                                        <TrendingUp className="h-3 w-3 shrink-0" />
                                        <span className="truncate">Intäkter</span>
                                    </div>
                                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 truncate" title={formatSEK(selectedSummary.revenue)}>
                                        <span className="hidden sm:inline">{formatSEK(selectedSummary.revenue)}</span>
                                        <span className="sm:hidden">{formatSEKCompact(selectedSummary.revenue)}</span>
                                    </p>
                                </div>
                                <div className="p-2 rounded-md bg-red-50 dark:bg-red-950/30 overflow-hidden">
                                    <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mb-0.5">
                                        <TrendingDown className="h-3 w-3 shrink-0" />
                                        <span className="truncate">Kostnader</span>
                                    </div>
                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 truncate" title={formatSEK(selectedSummary.expenses)}>
                                        <span className="hidden sm:inline">{formatSEK(selectedSummary.expenses)}</span>
                                        <span className="sm:hidden">{formatSEKCompact(selectedSummary.expenses)}</span>
                                    </p>
                                </div>
                                <div className="p-2 rounded-md bg-muted/30 overflow-hidden">
                                    <div className="text-xs text-muted-foreground mb-0.5 truncate">Resultat</div>
                                    <p className={cn(
                                        "text-sm font-semibold truncate",
                                        selectedSummary.result >= 0 ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )} title={formatSEK(selectedSummary.result)}>
                                        <span className="hidden sm:inline">{formatSEK(selectedSummary.result)}</span>
                                        <span className="sm:hidden">{formatSEKCompact(selectedSummary.result)}</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Open full review */}
                        <div className="pt-2 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 overflow-hidden"
                                onClick={() => setDialogMonth(selectedMonth)}
                            >
                                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">Öppna fullständig månadsöversikt</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Dynamic Checklist card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileCheck className="h-4 w-4" />
                            Avstämningskoll
                        </CardTitle>
                        <CardDescription>Åtgärder innan stängning</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {resolvedChecks.length === 0 && (
                            <p className="text-sm text-muted-foreground">Inga kontroller att visa.</p>
                        )}
                        {resolvedChecks.map((check) => (
                            <div key={check.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                {check.type === 'manual' ? (
                                    <Checkbox
                                        id={`grid-${check.id}-${selectedMonth}`}
                                        checked={check.value}
                                        onCheckedChange={() => toggleCheck(year, selectedMonth, check.id)}
                                    />
                                ) : (
                                    <div className={cn(
                                        "mt-0.5 h-4 w-4 rounded-[3px] border flex items-center justify-center shrink-0",
                                        check.value
                                            ? "border-green-500 bg-green-50 dark:bg-green-950/40"
                                            : "border-red-400 bg-red-50 dark:bg-red-950/40"
                                    )}>
                                        {check.value
                                            ? <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                            : <X className="h-3 w-3 text-red-500 dark:text-red-400" />
                                        }
                                    </div>
                                )}
                                <div className="grid gap-1 leading-none">
                                    <Label
                                        htmlFor={check.type === 'manual' ? `grid-${check.id}-${selectedMonth}` : undefined}
                                        className={cn(
                                            "font-medium text-sm",
                                            check.type === 'manual' && "cursor-pointer"
                                        )}
                                    >
                                        {check.label}
                                        {check.type === 'auto' && (
                                            <Badge variant="outline" className="ml-2 text-[9px] py-0 px-1 font-normal">AUTO</Badge>
                                        )}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {check.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Full Month Review Dialog */}
            <MonthReviewDialog
                open={dialogMonth !== null}
                onOpenChange={(open) => {
                    if (!open) setDialogMonth(null)
                }}
                year={year}
                month={dialogMonth ?? 1}
                onMonthChange={(newMonth) => setDialogMonth(newMonth)}
            />
        </>
    )
}
