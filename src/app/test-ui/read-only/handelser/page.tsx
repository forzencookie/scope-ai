"use client"

/**
 * Test page: Händelser (Events)
 *
 * Data display: deadlines list + 12-month grid with detail panel.
 * Deadline statuses: overdue (red), soon (yellow), upcoming (grey).
 * Month statuses: open, in-progress (yellow), closed (green), current (blue).
 */

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    CalendarCheck,
    TrendingUp,
    TrendingDown,
    FileCheck,
    Check,
    X,
    MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })
}

// ---------------------------------------------------------------------------
// Deadlines
// ---------------------------------------------------------------------------

type DeadlineStatus = "overdue" | "soon" | "upcoming"

const DEADLINES = [
    { id: "d1", title: "Momsdeklaration mars", daysUntil: -2, status: "overdue" as DeadlineStatus },
    { id: "d2", title: "AGI mars", daysUntil: 5, status: "soon" as DeadlineStatus },
    { id: "d3", title: "Arbetsgivaravgift mars", daysUntil: 10, status: "soon" as DeadlineStatus },
    { id: "d4", title: "Momsdeklaration april", daysUntil: 30, status: "upcoming" as DeadlineStatus },
    { id: "d5", title: "Årsredovisning 2025", daysUntil: 85, status: "upcoming" as DeadlineStatus },
]

const DEADLINE_DOT: Record<DeadlineStatus, string> = {
    overdue: "bg-red-500",
    soon: "bg-yellow-500",
    upcoming: "bg-muted-foreground/30",
}

function formatDaysUntil(days: number): string {
    if (days < 0) return `${Math.abs(days)} dagar sedan`
    if (days === 0) return "idag"
    if (days === 1) return "imorgon"
    return `om ${days} dagar`
}

// ---------------------------------------------------------------------------
// Månadsavslut data
// ---------------------------------------------------------------------------

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]
const MONTHS_FULL = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"]

type MonthStatus = "closed" | "in-progress" | "current" | "open" | "future"

interface MonthSummary {
    month: number
    status: MonthStatus
    verifications: number
    discrepancies: number
    revenue: number
    expenses: number
    result: number
    checksCompleted: number
    checksTotal: number
}

const MONTH_DATA: MonthSummary[] = [
    { month: 1, status: "closed", verifications: 34, discrepancies: 0, revenue: 145000, expenses: 89000, result: 56000, checksCompleted: 6, checksTotal: 6 },
    { month: 2, status: "closed", verifications: 28, discrepancies: 0, revenue: 132000, expenses: 78000, result: 54000, checksCompleted: 6, checksTotal: 6 },
    { month: 3, status: "in-progress", verifications: 41, discrepancies: 2, revenue: 168000, expenses: 95000, result: 73000, checksCompleted: 3, checksTotal: 6 },
    { month: 4, status: "current", verifications: 12, discrepancies: 0, revenue: 52000, expenses: 31000, result: 21000, checksCompleted: 0, checksTotal: 6 },
    { month: 5, status: "future", verifications: 0, discrepancies: 0, revenue: 0, expenses: 0, result: 0, checksCompleted: 0, checksTotal: 6 },
    { month: 6, status: "future", verifications: 0, discrepancies: 0, revenue: 0, expenses: 0, result: 0, checksCompleted: 0, checksTotal: 6 },
    { month: 7, status: "future", verifications: 0, discrepancies: 0, revenue: 0, expenses: 0, result: 0, checksCompleted: 0, checksTotal: 6 },
    { month: 8, status: "future", verifications: 0, discrepancies: 0, revenue: 0, expenses: 0, result: 0, checksCompleted: 0, checksTotal: 6 },
    { month: 9, status: "future", verifications: 0, discrepancies: 0, revenue: 0, expenses: 0, result: 0, checksCompleted: 0, checksTotal: 6 },
    { month: 10, status: "future", verifications: 0, discrepancies: 0, revenue: 0, expenses: 0, result: 0, checksCompleted: 0, checksTotal: 6 },
    { month: 11, status: "future", verifications: 0, discrepancies: 0, revenue: 0, expenses: 0, result: 0, checksCompleted: 0, checksTotal: 6 },
    { month: 12, status: "future", verifications: 0, discrepancies: 0, revenue: 0, expenses: 0, result: 0, checksCompleted: 0, checksTotal: 6 },
]

const MONTH_DOT: Record<MonthStatus, string> = {
    closed: "bg-emerald-500",
    "in-progress": "bg-yellow-400",
    current: "bg-blue-500",
    open: "bg-white dark:bg-gray-400",
    future: "border-2 border-gray-300 dark:border-gray-500",
}

interface CheckItem {
    id: string
    label: string
    description: string
    type: "auto" | "manual"
    value: boolean
}

const CHECKS_MARCH: CheckItem[] = [
    { id: "c1", label: "Alla transaktioner bokförda", description: "2 obokförda transaktioner kvar", type: "auto", value: false },
    { id: "c2", label: "Debet = kredit", description: "Alla verifikationer balanserar", type: "auto", value: true },
    { id: "c3", label: "Moms avstämd", description: "Momsskuld stämmer med deklaration", type: "auto", value: true },
    { id: "c4", label: "Bank avstämd", description: "Banksaldo stämmer med konto 1930", type: "manual", value: false },
    { id: "c5", label: "Löner utbetalda", description: "Mars-löner skickade och bokförda", type: "auto", value: true },
    { id: "c6", label: "Periodiseringar kontrollerade", description: "Förutbetalda intäkter/kostnader", type: "manual", value: false },
]

export default function TestHandelserPage() {
    const [selectedYear, setSelectedYear] = useState(2026)
    const [selectedMonth, setSelectedMonth] = useState(3) // March

    const selected = MONTH_DATA[selectedMonth - 1]
    const allChecked = selected.checksCompleted === selected.checksTotal && selected.checksTotal > 0
    const isFuture = selected.status === "future"

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <Link href="/test-ui/read-only" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Read Only UIs
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Händelser</h1>
                        <p className="text-sm text-muted-foreground mt-1">Månadsavslut, periodstängning och kommande deadlines.</p>
                    </div>
                    {/* Year slider */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedYear(y => y - 1)} className="h-7 w-7 rounded-md border flex items-center justify-center text-sm hover:bg-muted transition-colors">&lsaquo;</button>
                        <span className="text-sm font-semibold tabular-nums w-10 text-center">{selectedYear}</span>
                        <button onClick={() => setSelectedYear(y => y + 1)} className="h-7 w-7 rounded-md border flex items-center justify-center text-sm hover:bg-muted transition-colors">&rsaquo;</button>
                    </div>
                </div>

                {/* Deadlines */}
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kommande deadlines</h3>
                    <div className="rounded-xl border divide-y">
                        {DEADLINES.map((d) => (
                            <div key={d.id} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className={cn("h-2 w-2 rounded-full shrink-0", DEADLINE_DOT[d.status])} />
                                    <span className="text-sm">{d.title}</span>
                                </div>
                                <span className={cn(
                                    "text-xs tabular-nums",
                                    d.status === "overdue" ? "text-red-600 dark:text-red-400 font-medium" :
                                    d.status === "soon" ? "text-yellow-600 dark:text-yellow-400" :
                                    "text-muted-foreground"
                                )}>
                                    {formatDaysUntil(d.daysUntil)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-b-2 border-border/60" />

                {/* 12-month grid */}
                <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                    {MONTH_DATA.map((m) => {
                        const isSelected = m.month === selectedMonth
                        return (
                            <button
                                key={m.month}
                                onClick={() => setSelectedMonth(m.month)}
                                className={cn(
                                    "flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all",
                                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card hover:bg-muted/50",
                                    m.status === "current" && !isSelected && "border-blue-300 dark:border-blue-700",
                                    m.status === "future" && "opacity-50",
                                )}
                            >
                                <span className="text-xs font-medium">{MONTHS_SHORT[m.month - 1]}</span>
                                <div className={cn("h-3 w-3 rounded-full", MONTH_DOT[m.status])} />
                                {m.verifications > 0 && (
                                    <span className="text-[10px] text-muted-foreground">{m.verifications}</span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Detail panel */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Summary */}
                    <div className="rounded-xl border p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-base font-semibold">{MONTHS_FULL[selectedMonth - 1]} {selectedYear}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {isFuture ? "Perioden har inte börjat ännu" : allChecked ? "Alla avstämningar klara" : "Perioden är öppen för bokföring"}
                                </p>
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                                allChecked
                                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                            )}>
                                {allChecked ? "KLAR" : `${selected.checksCompleted}/${selected.checksTotal}`}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-muted/30">
                                <p className="text-[10px] text-muted-foreground">Verifikationer</p>
                                <p className="text-lg font-bold tabular-nums">{selected.verifications}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30">
                                <p className="text-[10px] text-muted-foreground">Avvikelser</p>
                                <p className={cn("text-lg font-bold tabular-nums", selected.discrepancies === 0 ? "text-emerald-600" : "text-red-600")}>
                                    {selected.discrepancies}
                                </p>
                            </div>
                        </div>

                        {(selected.revenue > 0 || selected.expenses > 0) && (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                                    <div className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 mb-0.5">
                                        <TrendingUp className="h-3 w-3 shrink-0" />
                                        Intäkter
                                    </div>
                                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">{fmt(selected.revenue)}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                                    <div className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 mb-0.5">
                                        <TrendingDown className="h-3 w-3 shrink-0" />
                                        Kostnader
                                    </div>
                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">{fmt(selected.expenses)}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-muted/30">
                                    <p className="text-[10px] text-muted-foreground mb-0.5">Resultat</p>
                                    <p className={cn("text-sm font-semibold tabular-nums", selected.result >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                                        {fmt(selected.result)}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 border-t">
                            <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                <MessageSquare className="h-3.5 w-3.5" />
                                Fråga Scooby om månaden
                            </button>
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="rounded-xl border p-5 space-y-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <FileCheck className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-semibold">Avstämningskoll</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">Åtgärder innan stängning</p>
                        </div>

                        <div className="space-y-2">
                            {CHECKS_MARCH.map((check) => (
                                <div key={check.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                    {check.type === "manual" ? (
                                        <div className={cn(
                                            "mt-0.5 h-4 w-4 rounded border-2 shrink-0",
                                            check.value ? "border-primary bg-primary" : "border-muted-foreground/30"
                                        )} />
                                    ) : (
                                        <div className={cn(
                                            "mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0",
                                            check.value
                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                                                : "border-red-400 bg-red-50 dark:bg-red-950/40"
                                        )}>
                                            {check.value
                                                ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                                : <X className="h-3 w-3 text-red-500 dark:text-red-400" />
                                            }
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium">
                                            {check.label}
                                            {check.type === "auto" && (
                                                <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground border rounded px-1 py-px">AUTO</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{check.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
