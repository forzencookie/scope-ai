"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WalkthroughRenderer } from "@/components/ai/blocks/block-renderer"
import { ScoobyPresentation } from "@/components/ai/scooby-presentation"
import type { WalkthroughResponse } from "@/components/ai/blocks/types"

/**
 * Test page: Egenavgifter as a walkthrough overlay
 *
 * APPROVED UI — founder approved 2026-03-31.
 * When ready to ship:
 * 1. Build an AI tool that returns this WalkthroughResponse (use src/lib/egenavgifter.ts for calculation)
 * 2. Remove the egenavgifter page tab from src/data/app-navigation.ts
 * 3. Delete src/components/loner/egenavgifter/ (old page components)
 * 4. Delete src/app/test-ui/egenavgifter/ (old test page)
 * 5. Keep src/lib/egenavgifter.ts (shared calculation service)
 *
 * This is what Scooby would render when a user asks:
 * "Vad blir mina egenavgifter?" or "Hur såg förra månaden ut?"
 *
 * Uses the same block primitives as resultat/balansräkning walkthroughs.
 */

const RATES = {
    sjukforsakring: 0.0355,
    foraldraforsakring: 0.0260,
    alderspension: 0.1021,
    efterlevandepension: 0.0070,
    arbetsmarknadsavgift: 0.0266,
    arbetsskadeavgift: 0.0020,
    allmanLoneavgift: 0.1153,
}

const COMPONENT_LABELS: Record<string, string> = {
    sjukforsakring: "Sjukförsäkringsavgift",
    foraldraforsakring: "Föräldraförsäkringsavgift",
    alderspension: "Ålderspensionsavgift",
    efterlevandepension: "Efterlevandepensionsavgift",
    arbetsmarknadsavgift: "Arbetsmarknadsavgift",
    arbetsskadeavgift: "Arbetsskadeavgift",
    allmanLoneavgift: "Allmän löneavgift",
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]

function fmt(n: number): string {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr"
}

function pct(n: number): string {
    return (n * 100).toFixed(2) + "%"
}

function buildWalkthrough(annualProfit: number): WalkthroughResponse {
    const fullRate = Object.values(RATES).reduce((sum, r) => sum + r, 0)
    const base = annualProfit * 0.75
    const avgifter = Math.round(base * fullRate)
    const netto = annualProfit - avgifter
    const monthlyAvgifter = Math.round(avgifter / 12)
    const effective = annualProfit > 0 ? avgifter / annualProfit : 0

    const componentRows = Object.entries(RATES).map(([key, rate]) => ({
        Avgift: COMPONENT_LABELS[key],
        Sats: pct(rate),
        Belopp: fmt(Math.round(base * rate)),
    }))

    // Monthly data — even split for simplicity (real tool would use actual monthly profit)
    const monthlyProfit = Math.round(annualProfit / 12)
    const monthlyRows = MONTHS.map((m) => ({
        Månad: m,
        Vinst: fmt(monthlyProfit),
        Egenavgifter: fmt(monthlyAvgifter),
        Netto: fmt(monthlyProfit - monthlyAvgifter),
    }))

    return {
        mode: "fixed",
        title: "Egenavgifter 2026",
        subtitle: `Beräkning baserad på årsvinst ${fmt(annualProfit)} · Enskild firma`,
        blocks: [
            // Calculation breakdown
            {
                type: "heading",
                props: {
                    text: "Beräkningsunderlag",
                    level: 2,
                    subtitle: "IL 16 kap 29§ — 25% schablonavdrag",
                },
            },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Årsvinst (brutto)", value: fmt(annualProfit) },
                        { label: "Schablonavdrag (25%)", value: "– " + fmt(Math.round(annualProfit * 0.25)) },
                        { label: "Underlag för egenavgifter", value: fmt(Math.round(base)) },
                        { label: "Avgiftssats", value: pct(fullRate) },
                        { label: "Totala egenavgifter", value: fmt(avgifter) },
                    ],
                },
            },

            // Component breakdown
            {
                type: "collapsed-group",
                props: {
                    label: "Avgiftsspecifikation — 7 delkomponenter",
                    count: 7,
                    defaultOpen: false,
                    children: [
                        {
                            type: "financial-table",
                            props: {
                                columns: [
                                            { label: "Avgift", icon: "receipt" },
                                            { label: "Sats", icon: "percent", color: "muted" as const },
                                            { label: "Belopp", icon: "banknote", color: "red" as const },
                                        ],
                                variant: "compact",
                                rows: componentRows,
                                totals: {
                                    Avgift: "Totalt",
                                    Sats: pct(fullRate),
                                    Belopp: fmt(avgifter),
                                },
                            },
                        },
                    ],
                },
            },

            // Monthly overview
            {
                type: "heading",
                props: {
                    text: "Månadsvis översikt",
                    level: 2,
                },
            },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Månad", icon: "calendar" },
                        { label: "Vinst", icon: "banknote" },
                        { label: "Egenavgifter", icon: "receipt", color: "red" as const },
                        { label: "Netto", icon: "trending-up", color: "green" as const },
                    ],
                    rows: monthlyRows,
                    totals: {
                        Månad: "Totalt",
                        Vinst: fmt(annualProfit),
                        Egenavgifter: fmt(avgifter),
                        Netto: fmt(netto),
                    },
                },
            },

            // Info
            {
                type: "info-card",
                props: {
                    title: "F-skatt & betalning",
                    content: "Egenavgifter betalas via preliminär F-skatt den 12:e varje månad. Slutavräkning sker i samband med inkomstdeklarationen (NE-bilaga). Justera din preliminärdeklaration (SKV 4314) om vinsten avviker väsentligt.",
                    variant: "info",
                },
            },

            // Action bar
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Bokför egenavgifter", variant: "default", actionId: "book-egenavgifter" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestEgenavgifterWalkthroughPage() {
    const [profit, setProfit] = useState(480000)
    const walkthrough = useMemo(() => buildWalkthrough(profit), [profit])

    // Compute highlight values for ScoobyPresentation
    const fullRate = Object.values(RATES).reduce((sum, r) => sum + r, 0)
    const base = profit * 0.75
    const avgifter = Math.round(base * fullRate)
    const netto = profit - avgifter
    const monthlyAvgifter = Math.round(avgifter / 12)
    const effective = profit > 0 ? avgifter / profit : 0

    return (
        <div className="min-h-screen bg-background">
            {/* Test controls — not part of the walkthrough */}
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                    <Link
                        href="/test-ui/walkthroughs"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Walkthroughs & Overlays
                    </Link>
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-muted-foreground">Årsvinst:</label>
                        <input
                            type="range"
                            min={0}
                            max={2000000}
                            step={10000}
                            value={profit}
                            onChange={(e) => setProfit(Number(e.target.value))}
                            className="w-40 accent-blue-500"
                        />
                        <span className="text-xs font-mono tabular-nums w-24 text-right">
                            {fmt(profit)}
                        </span>
                    </div>
                </div>

                <ScoobyPresentation
                    message="Här är beräkningen av dina egenavgifter baserat på årsvinsten. F-skatten betalas den 12:e varje månad."
                    highlights={[
                        { label: "Totala egenavgifter", value: fmt(avgifter), detail: pct(effective) + " av vinsten" },
                        { label: "Kvar efter avgifter", value: fmt(netto), detail: "Före inkomstskatt" },
                        { label: "Månadsbelopp (F-skatt)", value: fmt(monthlyAvgifter), detail: "Betalas den 12:e" },
                    ]}
                />
            </div>

            {/* Walkthrough rendered exactly as Scooby would show it */}
            <WalkthroughRenderer
                response={walkthrough}
                onClose={() => {}}
                embedded
            />
        </div>
    )
}
