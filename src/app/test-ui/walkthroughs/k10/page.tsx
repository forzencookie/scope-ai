"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WalkthroughRenderer } from "@/components/ai/blocks/block-renderer"
import { ScoobyPresentation } from "@/components/ai/scooby-presentation"
import type { WalkthroughResponse, BlockProps } from "@/components/ai/blocks/types"

/**
 * Test page: K10 (Kvalificerade andelar) as a walkthrough overlay
 *
 * Shows provenance: the boundary amount (gränsbelopp) is derived from
 * real data in the system — share register (aktiebok), salary data from
 * payroll runs, and prior year's saved dividend space. The user sees
 * exactly which source records produce each K10 field.
 *
 * This is what Scooby renders when a user asks:
 * "Hur mycket utdelning kan jag ta?" or "Gör min K10"
 */

function fmt(n: number): string {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr"
}

function pct(n: number): string {
    return (n * 100).toFixed(1) + "%"
}

// Source data types
interface ShareholderSource {
    name: string
    personnummer: string
    shareCount: number
    totalShares: number
    shareClass: string
    acquisitionDate: string
    acquisitionCost: number
}

interface SalarySource {
    year: number
    employees: Array<{
        name: string
        totalSalary: number
        source: string // e.g. "12 lönekörningar jan-dec 2025"
    }>
    totalSalaries: number
}

interface DividendSource {
    previousYearSaved: number
    previousYearSource: string // e.g. "K10 2024, fält 3.18"
    upliftRate: number // uppräkningsränta
    upliftAmount: number
}

function buildWalkthrough(
    shareholder: ShareholderSource,
    salaryData: SalarySource,
    dividendHistory: DividendSource,
    proposedDividend: number,
): WalkthroughResponse {
    const ownershipPct = shareholder.shareCount / shareholder.totalShares

    // Gränsbelopp calculation (3:12-reglerna)
    // Schablonbelopp 2026: 204 325 kr (2.75 IBB)
    const schablonbelopp = 204325
    const schablonForOwner = Math.round(schablonbelopp * ownershipPct)

    // Lönebaserat utrymme (50% av löner om ägaren tar minst 681 600 kr / 6 IBB + 5%)
    const ibb = 74300 // Inkomstbasbelopp 2026
    const salaryThreshold = 6 * ibb + Math.round(salaryData.totalSalaries * 0.05)
    const ownerSalary = salaryData.employees.find(e => e.name === shareholder.name)?.totalSalary ?? 0
    const qualifiesForSalaryBased = ownerSalary >= salaryThreshold
    const salaryBasedSpace = qualifiesForSalaryBased
        ? Math.round(salaryData.totalSalaries * 0.50 * ownershipPct)
        : 0

    // Best of schablon or salary-based
    const bestMethod = salaryBasedSpace > schablonForOwner ? "salary" : "schablon"
    const baseAmount = bestMethod === "salary" ? salaryBasedSpace : schablonForOwner

    // Sparat utdelningsutrymme + uppräkning
    const savedWithUplift = dividendHistory.previousYearSaved + dividendHistory.upliftAmount

    // Total gränsbelopp
    const totalBoundary = baseAmount + savedWithUplift

    // Tax split
    const taxedAt20 = Math.min(proposedDividend, totalBoundary)
    const taxedAsIncome = Math.max(0, proposedDividend - totalBoundary)
    const tax20 = Math.round(taxedAt20 * 0.20)
    const taxIncome = Math.round(taxedAsIncome * 0.52) // approx marginalskatt

    // Provenance blocks for salary data — collapsed since it's supporting detail
    const salaryProvenanceBlocks: BlockProps[] = [
        {
            type: "collapsed-group",
            props: {
                label: `Löneregister ${salaryData.year} — ${salaryData.employees.length} anställda`,
                count: salaryData.employees.length,
                defaultOpen: false,
                children: [
                    {
                        type: "financial-table",
                        props: {
                            columns: [
                                { label: "Anställd", icon: "user" },
                                { label: "Total lön " + salaryData.year, icon: "banknote" },
                                { label: "Källa", icon: "file-text", color: "muted" as const },
                            ],
                            variant: "compact",
                            rows: salaryData.employees.map((e) => ({
                                Anställd: e.name,
                                [`Total lön ${salaryData.year}`]: fmt(e.totalSalary),
                                Källa: e.source,
                            })),
                            totals: {
                                Anställd: "Totalt",
                                [`Total lön ${salaryData.year}`]: fmt(salaryData.totalSalaries),
                                Källa: "",
                            },
                        },
                    },
                ],
            },
        },
    ]

    return {
        mode: "fixed",
        title: `K10 — Kvalificerade andelar ${salaryData.year + 1}`,
        subtitle: `${shareholder.name} · ${shareholder.shareCount}/${shareholder.totalShares} aktier (${pct(ownershipPct)})`,
        blocks: [
            // === AKTIEBOK — source for ownership ===
            {
                type: "heading",
                props: {
                    text: "Ägande",
                    level: 2,
                    subtitle: "Härlett från aktieboken",
                },
            },
            {
                type: "annotation",
                props: {
                    text: `Källa: Aktiebok — förvärvad ${shareholder.acquisitionDate}`,
                    variant: "muted",
                },
            },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Delägare", value: shareholder.name },
                        { label: "Personnummer", value: shareholder.personnummer },
                        { label: "Aktier", value: `${shareholder.shareCount} av ${shareholder.totalShares} (${pct(ownershipPct)})` },
                        { label: "Aktieslag", value: shareholder.shareClass },
                        { label: "Anskaffningsutgift (fält 1.3)", value: fmt(shareholder.acquisitionCost) },
                    ],
                },
            },

            // === GRÄNSBELOPP CALCULATION ===
            {
                type: "heading",
                props: {
                    text: "Gränsbelopp — beräkning",
                    level: 2,
                    subtitle: "IL 57 kap — 3:12-reglerna",
                },
            },

            // Schablon vs lönebaserat
            {
                type: "heading",
                props: {
                    text: "Alternativ 1: Schablonbelopp",
                    level: 3,
                },
            },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Schablonbelopp 2026 (2,75 × IBB)", value: fmt(schablonbelopp) },
                        { label: `Din andel (${pct(ownershipPct)})`, value: fmt(schablonForOwner) },
                    ],
                },
            },

            {
                type: "heading",
                props: {
                    text: "Alternativ 2: Lönebaserat utrymme",
                    level: 3,
                    subtitle: qualifiesForSalaryBased
                        ? `Uppfyllt — din lön ${fmt(ownerSalary)} ≥ ${fmt(salaryThreshold)}`
                        : `Ej uppfyllt — din lön ${fmt(ownerSalary)} < ${fmt(salaryThreshold)}`,
                },
            },

            // Show WHERE the salary data comes from
            ...salaryProvenanceBlocks,

            ...(qualifiesForSalaryBased ? [
                {
                    type: "key-value",
                    props: {
                        items: [
                            { label: "Total lönekostnad", value: fmt(salaryData.totalSalaries) },
                            { label: "50% av lönesumman", value: fmt(Math.round(salaryData.totalSalaries * 0.50)) },
                            { label: `Din andel (${pct(ownershipPct)})`, value: fmt(salaryBasedSpace) },
                            { label: "Lönekrav (6 IBB + 5%)", value: fmt(salaryThreshold) },
                            { label: "Din lön", value: `${fmt(ownerSalary)} ✓` },
                        ],
                    },
                },
            ] : [
                {
                    type: "info-card",
                    props: {
                        title: "Lönebaserat ej tillgängligt",
                        content: `Du behöver ta ut minst ${fmt(salaryThreshold)} i lön (6 IBB + 5% av lönesumman) för att använda lönebaserat utrymme. Din lön ${salaryData.year} var ${fmt(ownerSalary)}.`,
                        variant: "warning",
                    },
                },
            ]),

            // Which method wins
            {
                type: "info-card",
                props: {
                    title: bestMethod === "salary" ? "Lönebaserat utrymme ger mest" : "Schablonbeloppet ger mest",
                    content: bestMethod === "salary"
                        ? `Lönebaserat (${fmt(salaryBasedSpace)}) > Schablon (${fmt(schablonForOwner)}). Lönebaserat utrymme väljs automatiskt.`
                        : `Schablon (${fmt(schablonForOwner)}) ≥ Lönebaserat (${fmt(salaryBasedSpace)}). Schablonbeloppet väljs automatiskt.`,
                    variant: "success",
                },
            },

            // Sparat utdelningsutrymme
            {
                type: "heading",
                props: {
                    text: "Sparat utdelningsutrymme",
                    level: 2,
                    subtitle: "Outnyttjat gränsbelopp från tidigare år",
                },
            },
            {
                type: "annotation",
                props: {
                    text: `Källa: ${dividendHistory.previousYearSource}`,
                    variant: "muted",
                },
            },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Sparat från föregående år", value: fmt(dividendHistory.previousYearSaved) },
                        { label: `Uppräkning (SLR + 3% = ${pct(dividendHistory.upliftRate)})`, value: `+ ${fmt(dividendHistory.upliftAmount)}` },
                        { label: "Sparat inkl. uppräkning", value: fmt(savedWithUplift) },
                    ],
                },
            },

            // Final gränsbelopp
            {
                type: "separator",
                props: { label: "Slutligt gränsbelopp" },
            },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: bestMethod === "salary" ? "Lönebaserat utrymme" : "Schablonbelopp", value: fmt(baseAmount) },
                        { label: "Sparat utdelningsutrymme", value: `+ ${fmt(savedWithUplift)}` },
                        { label: "Årets gränsbelopp (fält 1.5)", value: fmt(totalBoundary) },
                    ],
                },
            },

            // === TAX SPLIT ===
            {
                type: "heading",
                props: {
                    text: "Skatteuträkning på utdelning",
                    level: 2,
                    subtitle: `Föreslagen utdelning: ${fmt(proposedDividend)}`,
                },
            },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Utdelning till 20% kapitalskatt (fält 1.6)", value: fmt(taxedAt20) },
                        ...(taxedAsIncome > 0 ? [
                            { label: "Utdelning som tjänstebeskattas (fält 1.7)", value: fmt(taxedAsIncome) },
                        ] : []),
                        { label: "Skatt 20% på kapitaldel", value: fmt(tax20) },
                        ...(taxIncome > 0 ? [
                            { label: "Skatt ~52% på tjänstedel", value: fmt(taxIncome) },
                        ] : []),
                        { label: "Kvar efter skatt", value: fmt(proposedDividend - tax20 - taxIncome) },
                    ],
                },
            },

            // Validation
            {
                type: "status-check",
                props: {
                    items: [
                        { label: "Aktiebok verifierad", status: "pass", detail: `${shareholder.shareCount} aktier registrerade` },
                        { label: "Löneunderlag komplett", status: "pass", detail: `${salaryData.employees.length} anställda, ${salaryData.year}` },
                        { label: "Sparat utrymme hämtat", status: "pass", detail: dividendHistory.previousYearSource },
                        {
                            label: "Utdelning inom gränsbelopp",
                            status: proposedDividend <= totalBoundary ? "pass" : "warning",
                            detail: proposedDividend <= totalBoundary
                                ? `${fmt(proposedDividend)} ≤ ${fmt(totalBoundary)}`
                                : `${fmt(taxedAsIncome)} överstiger — beskattas som tjänst`,
                        },
                    ],
                },
            },

            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Exportera K10 (SRU)", variant: "default", actionId: "export-k10" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }
}

export default function TestK10WalkthroughPage() {
    const walkthrough = useMemo(() => buildWalkthrough(
        // Shareholder — from aktiebok
        {
            name: "Erik Svensson",
            personnummer: "850101-****",
            shareCount: 600,
            totalShares: 1000,
            shareClass: "Stamaktier A",
            acquisitionDate: "2024-01-15",
            acquisitionCost: 30000,
        },
        // Salary data — from lönekörningar
        {
            year: 2025,
            employees: [
                { name: "Erik Svensson", totalSalary: 660000, source: "12 lönekörningar jan-dec 2025" },
                { name: "Anna Lindberg", totalSalary: 504000, source: "12 lönekörningar jan-dec 2025" },
                { name: "Maria Johansson", totalSalary: 456000, source: "12 lönekörningar jan-dec 2025" },
            ],
            totalSalaries: 1620000,
        },
        // Dividend history — from prior K10
        {
            previousYearSaved: 185000,
            previousYearSource: "K10 deklaration 2025, fält 3.18",
            upliftRate: 0.0641,
            upliftAmount: 11859,
        },
        // Proposed dividend
        400000,
    ), [])

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 pt-6 space-y-4">
                <Link
                    href="/test-ui/walkthroughs"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Walkthroughs & Overlays
                </Link>

                <ScoobyPresentation
                    message="Jag har beräknat gränsbeloppet baserat på aktiebok och löneregister. Utdelningen ryms inom gränsen."
                    highlights={[
                        { label: "Gränsbelopp", value: "619 054 kr", detail: "Max till 20% skatt" },
                        { label: "Föreslagen utdelning", value: "400 000 kr", detail: "Inom gränsbeloppet" },
                        { label: "Total skatt", value: "80 000 kr", detail: "20.0% kapitalskatt" },
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
