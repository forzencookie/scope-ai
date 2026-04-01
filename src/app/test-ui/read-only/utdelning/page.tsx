"use client"

/**
 * Test page: Utdelning (dividends)
 *
 * Page shows: stats + tax simulator + dividend history.
 * Simulator lets user pick an amount, see the tax split, then send to Scooby
 * who handles the formal planning (bolagsstämma, K10, etc).
 */

import { useState, useMemo } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    Download,
    FileText,
    CheckCircle2,
    Clock,
    X,
    BadgeDollarSign,
    BarChart3,
    PieChart,
    Calculator,
    Sparkles,
    Calendar,
    Banknote,
    Receipt,
    Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr"
}

// --- Mock data ---

const GRANSBELOPP = 183700
const GRANSBELOPP_KVAR = 83700
const UTDELAT_TOTALT = 100000

const HISTORY = [
    {
        id: "h1",
        year: 2025,
        date: "2025-06-15",
        amount: 100000,
        perShare: 100,
        taxRate: "20%",
        tax: 20000,
        net: 80000,
        status: "beslutad" as const,
        meetingDate: "2025-06-12",
    },
    {
        id: "h2",
        year: 2024,
        date: "2024-06-12",
        amount: 100000,
        perShare: 100,
        taxRate: "20%",
        tax: 20000,
        net: 80000,
        status: "bokford" as const,
        meetingDate: "2024-06-10",
    },
    {
        id: "h3",
        year: 2023,
        date: "2023-05-30",
        amount: 60000,
        perShare: 60,
        taxRate: "20%",
        tax: 12000,
        net: 48000,
        status: "bokford" as const,
        meetingDate: "2023-05-28",
    },
]

const STATUS_CONFIG = {
    planerad: {
        label: "Planerad",
        badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        icon: Clock,
    },
    beslutad: {
        label: "Beslutad",
        badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        icon: FileText,
    },
    bokford: {
        label: "Bokförd",
        badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        icon: CheckCircle2,
    },
} as const

type DividendStatus = keyof typeof STATUS_CONFIG

export default function TestUtdelningPage() {
    const [showAvi, setShowAvi] = useState<string | null>(null)
    const [planAmount, setPlanAmount] = useState(60000)
    const selectedDividend = HISTORY.find((h) => h.id === showAvi)

    const taxCalc = useMemo(() => {
        const within = Math.min(planAmount, GRANSBELOPP_KVAR)
        const above = Math.max(0, planAmount - GRANSBELOPP_KVAR)
        const taxWithin = Math.round(within * 0.20)
        const taxAbove = Math.round(above * 0.52)
        const totalTax = taxWithin + taxAbove
        const net = planAmount - totalTax
        const effectiveRate = planAmount > 0 ? totalTax / planAmount : 0
        return { within, above, taxWithin, taxAbove, totalTax, net, effectiveRate }
    }, [planAmount])

    const barPct = Math.min(100, (planAmount / GRANSBELOPP_KVAR) * 100)

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <Link
                    href="/test-ui"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Alla test-sidor
                </Link>

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Utdelning</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Historik och status för bolagets utdelningar.
                    </p>
                </div>

                {/* Stats — 3 cards */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        {
                            label: "Utdelat totalt",
                            value: fmt(UTDELAT_TOTALT),
                            icon: BadgeDollarSign,
                            iconBg: "bg-rose-50 dark:bg-rose-950",
                            iconColor: "text-rose-600 dark:text-rose-400",
                            gradient: "from-rose-50/60 to-zinc-50 dark:from-rose-950/30 dark:to-zinc-950/40",
                        },
                        {
                            label: "Kvar av gränsbelopp",
                            value: fmt(GRANSBELOPP_KVAR),
                            icon: BarChart3,
                            iconBg: "bg-emerald-50 dark:bg-emerald-950",
                            iconColor: "text-emerald-600 dark:text-emerald-400",
                            gradient: "from-emerald-50/60 to-zinc-50 dark:from-emerald-950/30 dark:to-zinc-950/40",
                        },
                        {
                            label: "Gränsbelopp 2025",
                            value: fmt(GRANSBELOPP),
                            icon: PieChart,
                            iconBg: "bg-violet-50 dark:bg-violet-950",
                            iconColor: "text-violet-600 dark:text-violet-400",
                            gradient: "from-violet-50/60 to-zinc-50 dark:from-violet-950/30 dark:to-zinc-950/40",
                        },
                    ].map((s) => {
                        const Icon = s.icon
                        return (
                            <div
                                key={s.label}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-br overflow-hidden",
                                    s.gradient
                                )}
                            >
                                <div
                                    className={cn(
                                        "h-9 w-9 shrink-0 rounded-xl flex items-center justify-center",
                                        s.iconBg
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4", s.iconColor)} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                                    <p className="text-lg font-bold tabular-nums truncate">{s.value}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Tax simulator — single card */}
                <div className="rounded-xl border-2 border-dashed border-border bg-card p-5 space-y-5">
                    <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold">Simulera utdelning</h2>
                    </div>

                    {/* Slider */}
                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                            <label className="text-xs text-muted-foreground">Belopp</label>
                            <span className="text-2xl font-bold tabular-nums">{fmt(planAmount)}</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={500000}
                            step={5000}
                            value={planAmount}
                            onChange={(e) => setPlanAmount(Number(e.target.value))}
                            className="w-full"
                        />

                        {/* Gränsbelopp bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Gränsbelopp</span>
                                <span className="tabular-nums">
                                    {fmt(Math.min(planAmount, GRANSBELOPP_KVAR))} / {fmt(GRANSBELOPP_KVAR)}
                                </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-300",
                                        barPct > 100 ? "bg-red-500" : "bg-emerald-500"
                                    )}
                                    style={{ width: `${Math.min(barPct, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tax breakdown — inline key-value */}
                    <div className="space-y-0 text-sm">
                        <div className="flex justify-between py-1.5 border-b border-dashed border-border/40">
                            <span className="text-muted-foreground">Inom gränsbelopp (20%)</span>
                            <span className="tabular-nums">{fmt(taxCalc.within)}</span>
                        </div>
                        {taxCalc.above > 0 && (
                            <div className="flex justify-between py-1.5 border-b border-dashed border-border/40">
                                <span className="text-muted-foreground">Över gränsbelopp (52%)</span>
                                <span className="tabular-nums text-red-500 dark:text-red-400/80">{fmt(taxCalc.above)}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-1.5 border-b border-dashed border-border/40">
                            <span className="text-muted-foreground">Total skatt</span>
                            <span className="tabular-nums text-red-500 dark:text-red-400/80">
                                – {fmt(taxCalc.totalTax)}
                                {planAmount > 0 && (
                                    <span className="text-muted-foreground ml-1">
                                        ({(taxCalc.effectiveRate * 100).toFixed(0)}%)
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between py-1.5">
                            <span className="font-semibold">Du får ut</span>
                            <span className="font-semibold tabular-nums text-emerald-500 dark:text-emerald-400/80">
                                {fmt(taxCalc.net)}
                            </span>
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        disabled={planAmount <= 0}
                        className="w-full h-9 rounded-lg bg-foreground text-background text-xs font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-30"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Planera utdelning med Scooby
                    </button>
                </div>

                {/* History table */}
                <div className="space-y-3">
                    <h2 className="text-base font-semibold">Utdelningshistorik</h2>

                    <div className="text-sm space-y-0.5">
                        {/* Header */}
                        <div className="flex bg-muted/40 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex-1 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />År</div>
                            <div className="w-28 text-right flex items-center justify-end gap-1.5"><Banknote className="h-3.5 w-3.5" />Brutto</div>
                            <div className="w-28 text-right hidden sm:flex items-center justify-end gap-1.5"><Receipt className="h-3.5 w-3.5" />Skatt</div>
                            <div className="w-28 text-right flex items-center justify-end gap-1.5"><Banknote className="h-3.5 w-3.5" />Netto</div>
                            <div className="w-24 text-right flex items-center justify-end gap-1.5"><Activity className="h-3.5 w-3.5" />Status</div>
                            <div className="w-20" />
                        </div>

                        {/* Rows */}
                        {HISTORY.map((h) => {
                            const status = STATUS_CONFIG[h.status as DividendStatus]
                            return (
                                <div
                                    key={h.id}
                                    className="flex items-center px-4 py-2.5 rounded-lg transition-colors hover:bg-muted/30"
                                >
                                    <div className="flex-1">
                                        <span className="font-medium">{h.year}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            {h.date}
                                        </span>
                                    </div>
                                    <div className="w-28 text-right tabular-nums">{fmt(h.amount)}</div>
                                    <div className="w-28 text-right tabular-nums text-red-500 dark:text-red-400/80 hidden sm:block">
                                        – {fmt(h.tax)}
                                    </div>
                                    <div className="w-28 text-right tabular-nums text-emerald-500 dark:text-emerald-400/80">
                                        + {fmt(h.net)}
                                    </div>
                                    <div className="w-24 flex justify-end">
                                        <span
                                            className={cn(
                                                "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                status.badge
                                            )}
                                        >
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="w-20 flex justify-end">
                                        <button
                                            onClick={() => setShowAvi(h.id)}
                                            className="h-7 px-2.5 rounded-md border border-border/60 text-[10px] font-medium flex items-center gap-1 hover:bg-muted/30 transition-colors"
                                        >
                                            <FileText className="h-3 w-3" />
                                            Avi
                                        </button>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Total */}
                        <div className="flex px-4 py-2.5 border-t font-semibold mt-1">
                            <div className="flex-1">Totalt</div>
                            <div className="w-28 text-right tabular-nums">
                                {fmt(HISTORY.reduce((s, h) => s + h.amount, 0))}
                            </div>
                            <div className="w-28 text-right tabular-nums text-red-500 dark:text-red-400/80 hidden sm:block">
                                – {fmt(HISTORY.reduce((s, h) => s + h.tax, 0))}
                            </div>
                            <div className="w-28 text-right tabular-nums text-emerald-500 dark:text-emerald-400/80">
                                + {fmt(HISTORY.reduce((s, h) => s + h.net, 0))}
                            </div>
                            <div className="w-24" />
                            <div className="w-20" />
                        </div>
                    </div>
                </div>

                {/* Utdelningsavi modal */}
                {selectedDividend && (
                    <div
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                        onClick={() => setShowAvi(null)}
                    >
                        <div
                            className="bg-background border border-border rounded-2xl p-6 max-w-sm w-full m-4 space-y-5 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                        <BadgeDollarSign className="h-4 w-4 text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Utdelningsavi</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Räkenskapsår {selectedDividend.year}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAvi(null)}
                                    className="h-6 w-6 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="space-y-0">
                                {[
                                    { label: "Stämmobeslut", value: selectedDividend.meetingDate },
                                    { label: "Bruttoutdelning", value: fmt(selectedDividend.amount) },
                                    {
                                        label: `Skatt (${selectedDividend.taxRate})`,
                                        value: "– " + fmt(selectedDividend.tax),
                                        color: "text-red-500",
                                    },
                                    {
                                        label: "Nettoutdelning",
                                        value: fmt(selectedDividend.net),
                                        bold: true,
                                    },
                                    { label: "Per aktie", value: selectedDividend.perShare + " kr" },
                                ].map((row) => (
                                    <div
                                        key={row.label}
                                        className="flex justify-between py-2 border-b border-dashed border-border/40 last:border-0"
                                    >
                                        <span className="text-sm text-muted-foreground">{row.label}</span>
                                        <span
                                            className={cn(
                                                "text-sm tabular-nums",
                                                "color" in row && row.color,
                                                "bold" in row && row.bold && "font-semibold"
                                            )}
                                        >
                                            {row.value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => setShowAvi(null)}
                                    className="flex-1 h-9 rounded-lg border border-border/60 text-xs hover:bg-muted/30 transition-colors"
                                >
                                    Stäng
                                </button>
                                <button className="flex-1 h-9 rounded-lg bg-foreground text-background text-xs font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity">
                                    <Download className="h-3.5 w-3.5" />
                                    Ladda ner PDF
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
