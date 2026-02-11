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
} from "lucide-react"
import { cn } from "@/lib/utils"
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

function formatSEK(amount: number): string {
    return amount.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + ' kr'
}

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

    const { getPeriod, toggleCheck, getVerificationStats } = useMonthClosing()

    const fetchSummaries = useCallback(async () => {
        try {
            const res = await fetch(`/api/manadsavslut?year=${year}`)
            if (!res.ok) return
            const data = await res.json()
            if (data.summaries?.length) setSummaries(data.summaries)
        } catch {
            // Grid stays with defaults
        }
    }, [year])

    useEffect(() => {
        setSummaries(buildDefaultSummaries(year))
        fetchSummaries()
    }, [year, fetchSummaries])

    const currentMonth = now.getFullYear() === year ? now.getMonth() + 1 : 0

    // Selected month data
    const selectedSummary = summaries.find(s => s.month === selectedMonth) || summaries[0]
    const period = getPeriod(year, selectedMonth)
    const checks = period.checks
    const stats = getVerificationStats(year, selectedMonth)
    const checksCompleted = [
        checks.bankReconciled,
        checks.vatReported,
        checks.declarationsDone,
        checks.allCategorized,
    ].filter(Boolean).length
    const allChecked = checksCompleted === 4
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

                    const p = getPeriod(year, summary.month)
                    const c = p.checks
                    const done = [c.bankReconciled, c.vatReported, c.declarationsDone, c.allCategorized].filter(Boolean).length
                    const allDone = done === 4

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
                                // Current month → blue filled
                                isCurrent ? "bg-blue-500" :
                                // All 4 checks done + past → dimmed/subtle green
                                allDone && isPast ? "bg-green-400/40 dark:bg-green-500/30" :
                                // All 4 checks done → solid green
                                allDone ? "bg-green-500" :
                                // Some checks done (in progress) → yellow
                                done > 0 ? "bg-yellow-400" :
                                // Future / no checks → white border, no fill
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
                                {allChecked ? "KLAR" : `${checksCompleted}/4`}
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
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-2.5 rounded-md bg-green-50 dark:bg-green-950/30">
                                    <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 mb-0.5">
                                        <TrendingUp className="h-3 w-3" />
                                        Intäkter
                                    </div>
                                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                                        {formatSEK(selectedSummary.revenue)}
                                    </p>
                                </div>
                                <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-950/30">
                                    <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mb-0.5">
                                        <TrendingDown className="h-3 w-3" />
                                        Kostnader
                                    </div>
                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                        {formatSEK(selectedSummary.expenses)}
                                    </p>
                                </div>
                                <div className="p-2.5 rounded-md bg-muted/30">
                                    <div className="text-xs text-muted-foreground mb-0.5">Resultat</div>
                                    <p className={cn(
                                        "text-sm font-semibold",
                                        selectedSummary.result >= 0 ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )}>
                                        {formatSEK(selectedSummary.result)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Open full review */}
                        <div className="pt-2 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2"
                                onClick={() => setDialogMonth(selectedMonth)}
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Öppna fullständig månadsöversikt
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Checklist card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileCheck className="h-4 w-4" />
                            Avstämningskoll
                        </CardTitle>
                        <CardDescription>Åtgärder innan stängning</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id={`grid-bank-${selectedMonth}`}
                                checked={checks.bankReconciled}
                                onCheckedChange={() => toggleCheck(year, selectedMonth, 'bankReconciled')}
                            />
                            <div className="grid gap-1 leading-none">
                                <Label htmlFor={`grid-bank-${selectedMonth}`} className="font-medium cursor-pointer text-sm">
                                    Avstämning Bankkonto (1930)
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Kontrollera att bokfört saldo stämmer med kontoutdraget.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id={`grid-vat-${selectedMonth}`}
                                checked={checks.vatReported}
                                onCheckedChange={() => toggleCheck(year, selectedMonth, 'vatReported')}
                            />
                            <div className="grid gap-1 leading-none">
                                <Label htmlFor={`grid-vat-${selectedMonth}`} className="font-medium cursor-pointer text-sm">
                                    Momsredovisning
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Momsrapport skapad och kontrollerad (Konto 2650).
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id={`grid-decl-${selectedMonth}`}
                                checked={checks.declarationsDone}
                                onCheckedChange={() => toggleCheck(year, selectedMonth, 'declarationsDone')}
                            />
                            <div className="grid gap-1 leading-none">
                                <Label htmlFor={`grid-decl-${selectedMonth}`} className="font-medium cursor-pointer text-sm">
                                    Arbetsgivardeklaration
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Löner och avgifter bokförda och rapporterade.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <Checkbox
                                id={`grid-cat-${selectedMonth}`}
                                checked={checks.allCategorized}
                                onCheckedChange={() => toggleCheck(year, selectedMonth, 'allCategorized')}
                            />
                            <div className="grid gap-1 leading-none">
                                <Label htmlFor={`grid-cat-${selectedMonth}`} className="font-medium cursor-pointer text-sm">
                                    Inget okategoriserat
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Inga transaktioner på OBS-kontot.
                                </p>
                            </div>
                        </div>
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
