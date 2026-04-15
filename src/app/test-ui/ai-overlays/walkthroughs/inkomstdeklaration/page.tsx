"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WalkthroughRenderer } from "@/components/ai/blocks/block-renderer"
import { ScoobyPresentation } from "@/components/ai/scooby-presentation"
import type { WalkthroughResponse, BlockProps } from "@/components/ai/blocks/types"

/**
 * Test page: INK2 (Inkomstdeklaration 2) as a walkthrough overlay
 *
 * Shows provenance: each tax adjustment line traces back to the actual
 * verifikationer (journal entries) in the bookkeeping. The user sees
 * exactly which transactions contributed to non-deductible expenses,
 * non-taxable income, and other adjustments.
 *
 * This is what Scooby renders when a user asks:
 * "Gör min inkomstdeklaration" or "Hur mycket bolagsskatt blir det?"
 */

function fmt(n: number): string {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr"
}

function pct(n: number): string {
    return (n * 100).toFixed(1) + "%"
}

// Source data types — verifikationer that produce each adjustment line
interface SourceVerifikation {
    verNr: string
    date: string
    description: string
    account: string
    amount: number
}

interface TaxAdjustment {
    label: string
    fieldCode: string
    amount: number
    sign: "+" | "−"
    sources: SourceVerifikation[]
    explanation: string
}

interface IncomeStatementSource {
    revenue: number
    costs: number
    result: number
    source: string // e.g. "Resultaträkning 2025-01-01 – 2025-12-31"
}

function buildWalkthrough(
    incomeStatement: IncomeStatementSource,
    adjustments: TaxAdjustment[],
    periodiseringsfonder: { opening: number; allocation: number; reversal: number },
    corporateTaxRate: number,
): WalkthroughResponse {
    // Calculate taxable result
    const adjustmentTotal = adjustments.reduce((s, a) =>
        a.sign === "+" ? s + a.amount : s - a.amount, 0)

    const periodFondNet = periodiseringsfonder.reversal - periodiseringsfonder.allocation
    const taxableResult = incomeStatement.result + adjustmentTotal + periodFondNet
    const corporateTax = Math.round(Math.max(0, taxableResult) * corporateTaxRate)

    // Build provenance blocks for each adjustment — collapsed to reduce scrolling
    const adjustmentBlocks: BlockProps[] = adjustments.map((adj) => ({
        type: "collapsed-group",
        props: {
            label: `${adj.label} (fält ${adj.fieldCode}) — ${adj.sign}${fmt(adj.amount)}`,
            count: adj.sources.length,
            defaultOpen: false,
            children: [
                {
                    type: "annotation",
                    props: {
                        text: adj.explanation,
                        variant: "muted",
                    },
                },
                {
                    type: "financial-table",
                    props: {
                        columns: [
                            { label: "Ver.nr", icon: "hash", width: 0.5 },
                            { label: "Datum", icon: "calendar", color: "muted" as const, width: 0.7 },
                            { label: "Beskrivning", icon: "file-text", width: 1.8 },
                            { label: "Konto", icon: "book", color: "muted" as const, width: 0.5 },
                            { label: "Belopp", icon: "banknote", color: adj.sign === "+" ? "red" as const : "green" as const, width: 0.8 },
                        ],
                        variant: "compact",
                        rows: adj.sources.map((v) => ({
                            "Ver.nr": v.verNr,
                            Datum: v.date,
                            Beskrivning: v.description,
                            Konto: v.account,
                            Belopp: fmt(v.amount),
                        })),
                        rowMeta: adj.sources.map((v) => ({
                            href: `/dashboard/bokforing?verifikation=${v.verNr}`,
                        })),
                        totals: {
                            "Ver.nr": "",
                            Datum: "",
                            Beskrivning: "Summa",
                            Konto: "",
                            Belopp: `${adj.sign}${fmt(adj.amount)}`,
                        },
                    },
                },
            ],
        },
    }))

    return {
        mode: "fixed",
        title: "Inkomstdeklaration 2 — 2025",
        subtitle: "INK2 · Aktiebolag · Skatteverket",
        blocks: [
            // === BOKFÖRT RESULTAT — source from resultaträkning ===
            {
                type: "heading",
                props: {
                    text: "Bokfört resultat (fält 3.1)",
                    level: 2,
                    subtitle: "Utgångspunkt — resultaträkningen",
                },
            },
            {
                type: "annotation",
                props: {
                    text: `Källa: ${incomeStatement.source}`,
                    variant: "muted",
                },
            },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Intäkter", value: fmt(incomeStatement.revenue) },
                        { label: "Kostnader", value: `−${fmt(incomeStatement.costs)}` },
                        { label: "Bokfört resultat", value: fmt(incomeStatement.result) },
                    ],
                },
            },

            // === SKATTEMÄSSIGA JUSTERINGAR ===
            {
                type: "heading",
                props: {
                    text: "Skattemässiga justeringar",
                    level: 2,
                    subtitle: "Poster som justerar det bokförda resultatet skatterättsligt",
                },
            },

            // Each adjustment with provenance
            ...adjustmentBlocks,

            // === PERIODISERINGSFONDER ===
            {
                type: "heading",
                props: {
                    text: "Periodiseringsfonder",
                    level: 2,
                    subtitle: "IL 30 kap — max 25% av överskott, återförs inom 6 år",
                },
            },
            {
                type: "annotation",
                props: {
                    text: "Källa: Periodiseringsfondregister i bokföringen (konto 2150)",
                    variant: "muted",
                },
            },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Ingående periodiseringsfonder", value: fmt(periodiseringsfonder.opening) },
                        { label: "Årets avsättning (fält 4.11)", value: `−${fmt(periodiseringsfonder.allocation)}` },
                        { label: "Återföring (fält 4.12)", value: `+${fmt(periodiseringsfonder.reversal)}` },
                        { label: "Nettopåverkan på skattemässigt resultat", value: periodFondNet >= 0 ? `+${fmt(periodFondNet)}` : `−${fmt(Math.abs(periodFondNet))}` },
                    ],
                },
            },

            // Schablonintäkt on periodiseringsfonder
            {
                type: "info-card",
                props: {
                    title: "Schablonintäkt periodiseringsfonder",
                    content: `Statslåneräntan (SLR) 30 nov 2024 var 2,10%. Schablonintäkt: ${fmt(periodiseringsfonder.opening)} × 2,10% = ${fmt(Math.round(periodiseringsfonder.opening * 0.021))}. Ingår i skatteberäkningen (fält 4.6).`,
                    variant: "info",
                },
            },

            // === FINAL CALCULATION ===
            {
                type: "separator",
                props: { label: "Skatteberäkning" },
            },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Bokfört resultat (fält 3.1)", value: fmt(incomeStatement.result) },
                        ...adjustments.map((a) => ({
                            label: `${a.label} (fält ${a.fieldCode})`,
                            value: `${a.sign}${fmt(a.amount)}`,
                        })),
                        { label: "Periodiseringsfonder (netto)", value: periodFondNet >= 0 ? `+${fmt(periodFondNet)}` : `−${fmt(Math.abs(periodFondNet))}` },
                        { label: "Schablonintäkt per.fonder (fält 4.6)", value: `+${fmt(Math.round(periodiseringsfonder.opening * 0.021))}` },
                        { label: "Skattepliktigt överskott", value: fmt(taxableResult) },
                        { label: `Bolagsskatt (${pct(corporateTaxRate)})`, value: fmt(corporateTax) },
                    ],
                },
            },

            // Validation
            {
                type: "status-check",
                props: {
                    items: [
                        { label: "Resultaträkning stämd", status: "pass", detail: incomeStatement.source },
                        { label: "Ej avdragsgilla poster kontrollerade", status: "pass", detail: `${adjustments.reduce((s, a) => s + a.sources.length, 0)} verifikationer granskade` },
                        { label: "Periodiseringsfonder inom gräns", status: "pass", detail: `Avsättning ${fmt(periodiseringsfonder.allocation)} ≤ 25% av överskott` },
                        { label: "Klart för SRU-export", status: "pass", detail: "Alla obligatoriska fält ifyllda" },
                    ],
                },
            },

            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Exportera SRU-fil", variant: "default", actionId: "export-ink2-sru" },
                        { label: "Visa fullständig INK2", variant: "outline", actionId: "view-full-ink2" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestINK2WalkthroughPage() {
    const walkthrough = useMemo(() => buildWalkthrough(
        // Income statement source
        {
            revenue: 1850000,
            costs: 1230000,
            result: 620000,
            source: "Resultaträkning 2025-01-01 – 2025-12-31",
        },
        // Tax adjustments with provenance
        [
            {
                label: "Ej avdragsgilla kostnader",
                fieldCode: "4.3",
                amount: 42500,
                sign: "+",
                explanation: "Kostnader som redovisats i bokföringen men inte är skattemässigt avdragsgilla",
                sources: [
                    { verNr: "A12", date: "2025-02-14", description: "Representation lunch (> 300 kr/person)", account: "6072", amount: 4200 },
                    { verNr: "A23", date: "2025-04-30", description: "Förseningsavgift Skatteverket", account: "6990", amount: 1250 },
                    { verNr: "A31", date: "2025-06-15", description: "Gåva till välgörenhet", account: "6993", amount: 15000 },
                    { verNr: "A38", date: "2025-09-22", description: "Representation middag (> 300 kr/person)", account: "6072", amount: 7050 },
                    { verNr: "A44", date: "2025-11-30", description: "Böter parkeringsöverträdelse", account: "6991", amount: 15000 },
                ],
            },
            {
                label: "Ej skattepliktiga intäkter",
                fieldCode: "4.5",
                amount: 8000,
                sign: "−",
                explanation: "Intäkter som redovisats i bokföringen men inte ska beskattas",
                sources: [
                    { verNr: "A29", date: "2025-05-20", description: "Utdelning från dotterbolag (näringsbetingade andelar)", account: "8012", amount: 8000 },
                ],
            },
        ],
        // Periodiseringsfonder
        {
            opening: 155000,
            allocation: 120000,
            reversal: 45000,
        },
        // Corporate tax rate
        0.206,
    ), [])

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link
                    href="/test-ui/ai-overlays"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Walkthroughs & Overlays
                </Link>

                <ScoobyPresentation
                    message="Inkomstdeklarationen är klar. Alla justeringar härledda från bokföringens verifikationer."
                    highlights={[
                        { label: "Bokfört resultat", value: "620 000 kr", detail: "Före skattemässiga justeringar" },
                        { label: "Skattepliktigt resultat", value: "582 755 kr", detail: "Efter justeringar" },
                        { label: "Bolagsskatt", value: "120 048 kr", detail: "20.6% av överskott" },
                    ]}
                />
            </div>

            <WalkthroughRenderer
                response={walkthrough}
                onClose={() => {}}
                embedded
            />
        </div>
    )
}
