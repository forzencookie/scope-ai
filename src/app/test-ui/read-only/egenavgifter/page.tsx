"use client"

/**
 * Test page: Egenavgifter (Self-employment taxes)
 *
 * Data display: calculator with settings + result breakdown + monthly trend.
 * EF (enskild firma) only. Shows how egenavgifter are computed from annual profit.
 */

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    Calculator,
    TrendingUp,
    Percent,
} from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })
}

const AVGIFTER = [
    { name: "Sjukförsäkringsavgift", rate: 3.64 },
    { name: "Föräldraförsäkringsavgift", rate: 2.60 },
    { name: "Ålderspensionsavgift", rate: 10.21 },
    { name: "Efterlevandepensionsavgift", rate: 0.60 },
    { name: "Arbetsmarknadsavgift", rate: 2.64 },
    { name: "Arbetsskadeavgift", rate: 0.20 },
    { name: "Allmän löneavgift", rate: 11.62 },
]

const TOTAL_RATE = AVGIFTER.reduce((s, a) => s + a.rate, 0)

export default function TestEgenavgifterPage() {
    const [annualProfit, setAnnualProfit] = useState(485000)
    const [isReduced, setIsReduced] = useState(false)
    const [includeKarens, setIncludeKarens] = useState(true)

    const effectiveRate = isReduced ? TOTAL_RATE * 0.75 : TOTAL_RATE
    const karensReduction = includeKarens ? annualProfit * 0.0036 : 0
    const totalAvgifter = Math.round(annualProfit * (effectiveRate / 100) - karensReduction)
    const monthlyAmount = Math.round(totalAvgifter / 12)

    const months = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <Link href="/test-ui/read-only" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Read Only UIs
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Egenavgifter</h1>
                    <p className="text-sm text-muted-foreground mt-1">Beräkna egenavgifter och sociala avgifter för enskild firma.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Settings */}
                    <div className="rounded-xl border p-5 space-y-4">
                        <h3 className="text-sm font-semibold">Inställningar</h3>

                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Beräknat årsresultat</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={annualProfit}
                                    onChange={(e) => setAnnualProfit(Number(e.target.value))}
                                    className="w-full h-9 rounded-md border bg-background px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kr</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={isReduced} onChange={(e) => setIsReduced(e.target.checked)} className="rounded" />
                                <span className="text-sm">Nedsatt avgift (under 26 eller över 65)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={includeKarens} onChange={(e) => setIncludeKarens(e.target.checked)} className="rounded" />
                                <span className="text-sm">Karensavdrag (7 dagar)</span>
                            </label>
                        </div>
                    </div>

                    {/* Result */}
                    <div className="rounded-xl border p-5 space-y-4">
                        <h3 className="text-sm font-semibold">Resultat</h3>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: "Totalt / år", value: fmt(totalAvgifter) + " kr", icon: Calculator, color: "text-blue-600 dark:text-blue-400" },
                                { label: "Per månad", value: fmt(monthlyAmount) + " kr", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
                                { label: "Avgiftssats", value: effectiveRate.toFixed(2) + "%", icon: Percent, color: "text-amber-600 dark:text-amber-400" },
                            ].map((item) => {
                                const Icon = item.icon
                                return (
                                    <div key={item.label} className="text-center">
                                        <Icon className={cn("h-4 w-4 mx-auto mb-1", item.color)} />
                                        <p className="text-lg font-bold tabular-nums">{item.value}</p>
                                        <p className="text-[10px] text-muted-foreground">{item.label}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="rounded-xl border p-5 space-y-3">
                    <h3 className="text-sm font-semibold">Specifikation</h3>
                    <div className="space-y-1">
                        {AVGIFTER.map((a) => {
                            const amount = Math.round(annualProfit * (a.rate / 100) * (isReduced ? 0.75 : 1))
                            return (
                                <div key={a.name} className="flex items-center justify-between py-1.5 text-sm">
                                    <span className="text-muted-foreground">{a.name}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-muted-foreground tabular-nums">{a.rate}%</span>
                                        <span className="tabular-nums font-medium w-24 text-right">{fmt(amount)} kr</span>
                                    </div>
                                </div>
                            )
                        })}
                        {includeKarens && (
                            <div className="flex items-center justify-between py-1.5 text-sm border-t">
                                <span className="text-muted-foreground">Karensavdrag</span>
                                <span className="tabular-nums font-medium w-24 text-right text-emerald-600 dark:text-emerald-400">-{fmt(Math.round(karensReduction))} kr</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between py-2 text-sm font-semibold border-t">
                            <span>Totala egenavgifter</span>
                            <span className="tabular-nums">{fmt(totalAvgifter)} kr</span>
                        </div>
                    </div>
                </div>

                {/* Monthly trend */}
                <div className="rounded-xl border p-5 space-y-3">
                    <h3 className="text-sm font-semibold">Månadstrend</h3>
                    <div className="flex items-end gap-1.5 h-24">
                        {months.map((m, i) => {
                            const isPast = i < 3
                            return (
                                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className={cn("w-full rounded-sm", isPast ? "bg-blue-500/70" : "bg-muted")}
                                        style={{ height: `${isPast ? 100 : 40}%` }}
                                    />
                                    <span className="text-[9px] text-muted-foreground">{m}</span>
                                </div>
                            )
                        })}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Bokfört jan–mar · Beräknat apr–dec</p>
                </div>
            </div>
        </div>
    )
}
