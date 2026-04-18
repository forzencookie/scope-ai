"use client"

import { useMemo } from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { ScoobyPresentation } from "@/components/ai/scooby-presentation"
import { WalkthroughRenderer } from "@/components/ai/blocks/block-renderer"
import type { WalkthroughResponse, BlockProps } from "@/components/ai/blocks/types"
import type { ScoobyHighlight } from "@/components/ai/scooby-presentation"

// =============================================================================
// Public types
// =============================================================================

export type WalkthroughType =
    | "k10"
    | "resultatrakning"
    | "balansrakning"
    | "momsdeklaration"
    | "egenavgifter"
    | "agi"

export interface WalkthroughSheetProps {
    type: WalkthroughType | null
    onClose: () => void
}

// =============================================================================
// Shared helpers
// =============================================================================

function fmt(n: number): string {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr"
}

function pct(n: number): string {
    return (n * 100).toFixed(2) + "%"
}

function pct1(n: number): string {
    return (n * 100).toFixed(1) + "%"
}

// =============================================================================
// K10 data
// =============================================================================

function buildK10(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const shareholder = {
        name: "Erik Svensson",
        personnummer: "850101-****",
        shareCount: 600,
        totalShares: 1000,
        shareClass: "Stamaktier A",
        acquisitionDate: "2024-01-15",
        acquisitionCost: 30000,
    }
    const salaryData = {
        year: 2025,
        employees: [
            { name: "Erik Svensson", totalSalary: 660000, source: "12 lönekörningar jan-dec 2025" },
            { name: "Anna Lindberg", totalSalary: 504000, source: "12 lönekörningar jan-dec 2025" },
            { name: "Maria Johansson", totalSalary: 456000, source: "12 lönekörningar jan-dec 2025" },
        ],
        totalSalaries: 1620000,
    }
    const dividendHistory = {
        previousYearSaved: 185000,
        previousYearSource: "K10 deklaration 2025, fält 3.18",
        upliftRate: 0.0641,
        upliftAmount: 11859,
    }
    const proposedDividend = 400000

    const ownershipPct = shareholder.shareCount / shareholder.totalShares
    const schablonbelopp = 204325
    const schablonForOwner = Math.round(schablonbelopp * ownershipPct)
    const ibb = 74300
    const salaryThreshold = 6 * ibb + Math.round(salaryData.totalSalaries * 0.05)
    const ownerSalary = salaryData.employees.find(e => e.name === shareholder.name)?.totalSalary ?? 0
    const qualifiesForSalaryBased = ownerSalary >= salaryThreshold
    const salaryBasedSpace = qualifiesForSalaryBased
        ? Math.round(salaryData.totalSalaries * 0.50 * ownershipPct)
        : 0
    const bestMethod = salaryBasedSpace > schablonForOwner ? "salary" : "schablon"
    const baseAmount = bestMethod === "salary" ? salaryBasedSpace : schablonForOwner
    const savedWithUplift = dividendHistory.previousYearSaved + dividendHistory.upliftAmount
    const totalBoundary = baseAmount + savedWithUplift
    const taxedAt20 = Math.min(proposedDividend, totalBoundary)
    const taxedAsIncome = Math.max(0, proposedDividend - totalBoundary)
    const tax20 = Math.round(taxedAt20 * 0.20)
    const taxIncome = Math.round(taxedAsIncome * 0.52)

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

    const response: WalkthroughResponse = {
        mode: "fixed",
        title: `K10 — Kvalificerade andelar ${salaryData.year + 1}`,
        subtitle: `${shareholder.name} · ${shareholder.shareCount}/${shareholder.totalShares} aktier (${pct1(ownershipPct)})`,
        blocks: [
            { type: "heading", props: { text: "Ägande", level: 2, subtitle: "Härlett från aktieboken" } },
            { type: "annotation", props: { text: `Källa: Aktiebok — förvärvad ${shareholder.acquisitionDate}`, variant: "muted" } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Delägare", value: shareholder.name },
                        { label: "Personnummer", value: shareholder.personnummer },
                        { label: "Aktier", value: `${shareholder.shareCount} av ${shareholder.totalShares} (${pct1(ownershipPct)})` },
                        { label: "Aktieslag", value: shareholder.shareClass },
                        { label: "Anskaffningsutgift (fält 1.3)", value: fmt(shareholder.acquisitionCost) },
                    ],
                },
            },
            { type: "heading", props: { text: "Gränsbelopp — beräkning", level: 2, subtitle: "IL 57 kap — 3:12-reglerna" } },
            { type: "heading", props: { text: "Alternativ 1: Schablonbelopp", level: 3 } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Schablonbelopp 2026 (2,75 × IBB)", value: fmt(schablonbelopp) },
                        { label: `Din andel (${pct1(ownershipPct)})`, value: fmt(schablonForOwner) },
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
            ...salaryProvenanceBlocks,
            ...(qualifiesForSalaryBased
                ? [{
                    type: "key-value" as const,
                    props: {
                        items: [
                            { label: "Total lönekostnad", value: fmt(salaryData.totalSalaries) },
                            { label: "50% av lönesumman", value: fmt(Math.round(salaryData.totalSalaries * 0.50)) },
                            { label: `Din andel (${pct1(ownershipPct)})`, value: fmt(salaryBasedSpace) },
                            { label: "Lönekrav (6 IBB + 5%)", value: fmt(salaryThreshold) },
                            { label: "Din lön", value: `${fmt(ownerSalary)} ✓` },
                        ],
                    },
                }]
                : [{
                    type: "info-card" as const,
                    props: {
                        title: "Lönebaserat ej tillgängligt",
                        content: `Du behöver ta ut minst ${fmt(salaryThreshold)} i lön för att använda lönebaserat utrymme. Din lön ${salaryData.year} var ${fmt(ownerSalary)}.`,
                        variant: "warning",
                    },
                }]
            ),
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
            { type: "heading", props: { text: "Sparat utdelningsutrymme", level: 2, subtitle: "Outnyttjat gränsbelopp från tidigare år" } },
            { type: "annotation", props: { text: `Källa: ${dividendHistory.previousYearSource}`, variant: "muted" } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Sparat från föregående år", value: fmt(dividendHistory.previousYearSaved) },
                        { label: `Uppräkning (SLR + 3% = ${pct1(dividendHistory.upliftRate)})`, value: `+ ${fmt(dividendHistory.upliftAmount)}` },
                        { label: "Sparat inkl. uppräkning", value: fmt(savedWithUplift) },
                    ],
                },
            },
            { type: "separator", props: { label: "Slutligt gränsbelopp" } },
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
            { type: "heading", props: { text: "Skatteuträkning på utdelning", level: 2, subtitle: `Föreslagen utdelning: ${fmt(proposedDividend)}` } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Utdelning till 20% kapitalskatt (fält 1.6)", value: fmt(taxedAt20) },
                        ...(taxedAsIncome > 0 ? [{ label: "Utdelning som tjänstebeskattas (fält 1.7)", value: fmt(taxedAsIncome) }] : []),
                        { label: "Skatt 20% på kapitaldel", value: fmt(tax20) },
                        ...(taxIncome > 0 ? [{ label: "Skatt ~52% på tjänstedel", value: fmt(taxIncome) }] : []),
                        { label: "Kvar efter skatt", value: fmt(proposedDividend - tax20 - taxIncome) },
                    ],
                },
            },
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

    return {
        presentation: {
            message: "Jag har beräknat gränsbeloppet baserat på aktiebok och löneregister. Utdelningen ryms inom gränsen.",
            highlights: [
                { label: "Gränsbelopp", value: fmt(totalBoundary), detail: "Max till 20% skatt" },
                { label: "Föreslagen utdelning", value: fmt(proposedDividend), detail: "Inom gränsbeloppet" },
                { label: "Total skatt", value: fmt(tax20 + taxIncome), detail: `${pct1((tax20 + taxIncome) / proposedDividend)} kapitalskatt` },
            ],
        },
        response,
    }
}

// =============================================================================
// Resultaträkning data
// =============================================================================

function buildResultatrakning(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Resultaträkning",
        subtitle: "Rapport för Q1 2026",
        blocks: [
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Konto", icon: "file-text" },
                        { label: "Benämning", icon: "tag", color: "muted" as const },
                        { label: "Belopp", icon: "banknote", color: "default" as const },
                    ],
                    rows: [
                        { Konto: "3001", Benämning: "Försäljning tjänster (inom SE)", Belopp: "350 000 kr" },
                        { Konto: "3002", Benämning: "Försäljning varor (inom SE)", Belopp: "100 000 kr" },
                        { Konto: "5010", Benämning: "Lokalhyra", Belopp: "-60 000 kr" },
                        { Konto: "5420", Benämning: "Programvaror", Belopp: "-20 000 kr" },
                        { Konto: "7010", Benämning: "Löner", Belopp: "-130 000 kr" },
                    ],
                    totals: { Konto: "Resultat", Benämning: "", Belopp: "240 000 kr" },
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Bokför som PDF i Arkiv", variant: "default" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Här är resultaträkningen för Q1 2026. Intäkterna ökade 15% jämfört med förra kvartalet.",
            highlights: [
                { label: "Intäkter", value: "450 000 kr", detail: "+15% från Q4" },
                { label: "Kostnader", value: "210 000 kr", detail: "+2% från Q4" },
                { label: "Rörelseresultat", value: "240 000 kr", detail: "+29% från Q4" },
            ],
        },
        response,
    }
}

// =============================================================================
// Balansräkning data
// =============================================================================

function buildBalansrakning(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Balansräkning",
        subtitle: "Rapport per 2026-03-31",
        blocks: [
            { type: "heading", props: { text: "Summering av Tillgångar", level: 2 } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Kassa och Bank", value: "650 000 kr" },
                        { label: "Kundfordringar", value: "100 000 kr" },
                        { label: "Inventarier", value: "100 000 kr" },
                    ],
                },
            },
            { type: "heading", props: { text: "Summering av Skulder och Eget Kapital", level: 2 } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Kortfristiga skulder", value: "150 000 kr" },
                        { label: "Långfristiga skulder", value: "200 000 kr" },
                        { label: "Aktiekapital", value: "25 000 kr" },
                        { label: "Balanserat resultat", value: "475 000 kr" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Bokför som PDF", variant: "default" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Här är balansräkningen per 2026-03-31. Skulder minskade 10% efter amortering.",
            highlights: [
                { label: "Tillgångar", value: "850 000 kr", detail: "Ingen märkbar förändring" },
                { label: "Skulder", value: "350 000 kr", detail: "-10% amortering lån" },
                { label: "Eget kapital", value: "500 000 kr", detail: "+14 000 kr (Q1 vinst)" },
            ],
        },
        response,
    }
}

// =============================================================================
// Momsdeklaration data
// =============================================================================

function buildMomsdeklaration(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Momsdeklaration Q1 2026",
        subtitle: "Redovisningsperiod jan–mar · Skatteverket",
        blocks: [
            { type: "heading", props: { text: "Momspliktig försäljning (Ruta 05)", level: 2, subtitle: `Försäljning inom Sverige exklusive moms — ${fmt(150000)}` } },
            {
                type: "collapsed-group",
                props: {
                    label: "Kundfakturor — konto 3001",
                    count: 2,
                    defaultOpen: false,
                    children: [
                        {
                            type: "financial-table",
                            props: {
                                columns: [
                                    { label: "Verifikation", icon: "hash", width: 0.6 },
                                    { label: "Kund", icon: "user", width: 1.2 },
                                    { label: "Datum", icon: "calendar", color: "muted" as const, width: 0.8 },
                                    { label: "Belopp (exkl. moms)", icon: "banknote", width: 1 },
                                ],
                                variant: "compact",
                                rows: [
                                    { Verifikation: "A03", Kund: "Acme Corp", Datum: "2026-01-15", "Belopp (exkl. moms)": fmt(50000) },
                                    { Verifikation: "A09", Kund: "Beta AB", Datum: "2026-02-20", "Belopp (exkl. moms)": fmt(100000) },
                                ],
                                totals: { Verifikation: "", Kund: "Ruta 05", Datum: "", "Belopp (exkl. moms)": fmt(150000) },
                            },
                        },
                    ],
                },
            },
            { type: "heading", props: { text: "Utgående moms 25% (Ruta 10)", level: 2, subtitle: "Moms att betala på din försäljning" } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Momspliktig försäljning (Ruta 05)", value: fmt(150000) },
                        { label: "Momssats", value: "25%" },
                        { label: "Utgående moms (Ruta 10)", value: fmt(37500) },
                    ],
                },
            },
            { type: "heading", props: { text: "Ingående moms (Ruta 48)", level: 2, subtitle: `Moms att dra av från dina inköp — ${fmt(12500)}` } },
            {
                type: "collapsed-group",
                props: {
                    label: "Leverantörsfakturor — konto 2641",
                    count: 3,
                    defaultOpen: false,
                    children: [
                        {
                            type: "financial-table",
                            props: {
                                columns: [
                                    { label: "Verifikation", icon: "hash", width: 0.6 },
                                    { label: "Leverantör", icon: "user", width: 1.2 },
                                    { label: "Beskrivning", icon: "file-text", color: "muted" as const, width: 1.2 },
                                    { label: "Moms", icon: "banknote", color: "green" as const, width: 0.8 },
                                ],
                                variant: "compact",
                                rows: [
                                    { Verifikation: "A05", Leverantör: "Apple Store", Beskrivning: "MacBook Pro", Moms: fmt(5000) },
                                    { Verifikation: "A11", Leverantör: "Office Depot", Beskrivning: "Kontorsmaterial", Moms: fmt(1500) },
                                    { Verifikation: "A14", Leverantör: "SJ", Beskrivning: "Tjänsteresor Q1", Moms: fmt(6000) },
                                ],
                                totals: { Verifikation: "", Leverantör: "Ruta 48", Beskrivning: "", Moms: fmt(12500) },
                            },
                        },
                    ],
                },
            },
            { type: "separator", props: { label: "Slutberäkning" } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Utgående moms (Ruta 10)", value: fmt(37500) },
                        { label: "Ingående moms (Ruta 48)", value: `−${fmt(12500)}` },
                        { label: "Moms att betala (Ruta 49)", value: fmt(25000) },
                    ],
                },
            },
            {
                type: "status-check",
                props: {
                    items: [
                        { label: "Försäljning stämd mot konto 3001", status: "pass", detail: "2 fakturor, totalt 150 000 kr" },
                        { label: "Ingående moms stämd mot konto 2641", status: "pass", detail: "3 verifikationer, totalt 12 500 kr" },
                        { label: "Momsavstämning balanserar", status: "pass", detail: "Utgående − ingående = 25 000 kr" },
                        { label: "Klart för inlämning", status: "pass", detail: "Alla rutor ifyllda" },
                    ],
                },
            },
            { type: "info-card", props: { title: "Inlämning & betalning", content: "Momsdeklarationen ska lämnas in senast den 12 maj 2026 (kvartalsmoms). Betalning sker till Skatteverkets bankgiro samma dag. Vid sen inlämning tillkommer förseningsavgift.", variant: "info" } },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Godkänn & skicka", variant: "default", actionId: "submit-moms" },
                        { label: "Exportera XML", variant: "outline", actionId: "export-moms-xml" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Momsdeklarationen för Q1 är klar. Alla belopp härledda från bokföringens verifikationer.",
            highlights: [
                { label: "Utgående moms", value: "37 500 kr", detail: "25% på 150 000 kr" },
                { label: "Ingående moms", value: "12 500 kr", detail: "3 leverantörsfakturor" },
                { label: "Att betala", value: "25 000 kr", detail: "Senast 12 maj 2026" },
            ],
        },
        response,
    }
}

// =============================================================================
// Egenavgifter data
// =============================================================================

const EGENAVGIFTER_RATES = {
    sjukforsakring: 0.0355,
    foraldraforsakring: 0.0260,
    alderspension: 0.1021,
    efterlevandepension: 0.0070,
    arbetsmarknadsavgift: 0.0266,
    arbetsskadeavgift: 0.0020,
    allmanLoneavgift: 0.1153,
}

const EGENAVGIFTER_LABELS: Record<string, string> = {
    sjukforsakring: "Sjukförsäkringsavgift",
    foraldraforsakring: "Föräldraförsäkringsavgift",
    alderspension: "Ålderspensionsavgift",
    efterlevandepension: "Efterlevandepensionsavgift",
    arbetsmarknadsavgift: "Arbetsmarknadsavgift",
    arbetsskadeavgift: "Arbetsskadeavgift",
    allmanLoneavgift: "Allmän löneavgift",
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]

function buildEgenavgifter(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const annualProfit = 480000
    const fullRate = Object.values(EGENAVGIFTER_RATES).reduce((sum, r) => sum + r, 0)
    const base = annualProfit * 0.75
    const avgifter = Math.round(base * fullRate)
    const netto = annualProfit - avgifter
    const monthlyAvgifter = Math.round(avgifter / 12)
    const effective = annualProfit > 0 ? avgifter / annualProfit : 0

    const componentRows = Object.entries(EGENAVGIFTER_RATES).map(([key, rate]) => ({
        Avgift: EGENAVGIFTER_LABELS[key],
        Sats: pct(rate),
        Belopp: fmt(Math.round(base * rate)),
    }))

    const monthlyProfit = Math.round(annualProfit / 12)
    const monthlyRows = MONTHS.map((m) => ({
        Månad: m,
        Vinst: fmt(monthlyProfit),
        Egenavgifter: fmt(monthlyAvgifter),
        Netto: fmt(monthlyProfit - monthlyAvgifter),
    }))

    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Egenavgifter 2026",
        subtitle: `Beräkning baserad på årsvinst ${fmt(annualProfit)} · Enskild firma`,
        blocks: [
            { type: "heading", props: { text: "Beräkningsunderlag", level: 2, subtitle: "IL 16 kap 29§ — 25% schablonavdrag" } },
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
                                totals: { Avgift: "Totalt", Sats: pct(fullRate), Belopp: fmt(avgifter) },
                            },
                        },
                    ],
                },
            },
            { type: "heading", props: { text: "Månadsvis översikt", level: 2 } },
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
                    totals: { Månad: "Totalt", Vinst: fmt(annualProfit), Egenavgifter: fmt(avgifter), Netto: fmt(netto) },
                },
            },
            { type: "info-card", props: { title: "F-skatt & betalning", content: "Egenavgifter betalas via preliminär F-skatt den 12:e varje månad. Slutavräkning sker i samband med inkomstdeklarationen (NE-bilaga). Justera din preliminärdeklaration (SKV 4314) om vinsten avviker väsentligt.", variant: "info" } },
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

    return {
        presentation: {
            message: "Här är beräkningen av dina egenavgifter baserat på årsvinsten. F-skatten betalas den 12:e varje månad.",
            highlights: [
                { label: "Totala egenavgifter", value: fmt(avgifter), detail: pct(effective) + " av vinsten" },
                { label: "Kvar efter avgifter", value: fmt(netto), detail: "Före inkomstskatt" },
                { label: "Månadsbelopp (F-skatt)", value: fmt(monthlyAvgifter), detail: "Betalas den 12:e" },
            ],
        },
        response,
    }
}

// =============================================================================
// AGI data
// =============================================================================

function buildAgi(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const employerFeeRate = 0.3142
    const period = "2026-03"

    interface LineItem { löneart: string; amount: number; type: "earning" | "deduction" | "benefit" }
    interface Employee { name: string; personnummer: string; payrollRunId: string; payrollRunDate: string; kommun: string; skattetabell: string; lineItems: LineItem[] }

    const employees: Employee[] = [
        {
            name: "Anna Lindberg",
            personnummer: "920315-****",
            payrollRunId: "LK-2026-03-01",
            payrollRunDate: "2026-03-25",
            kommun: "Stockholm",
            skattetabell: "32",
            lineItems: [
                { löneart: "Månadslön", amount: 42000, type: "earning" },
                { löneart: "Friskvårdsbidrag", amount: 500, type: "earning" },
                { löneart: "Sjukavdrag (2 dgr)", amount: 2800, type: "deduction" },
                { löneart: "Karensavdrag", amount: 1120, type: "deduction" },
                { löneart: "Preliminärskatt", amount: 12475, type: "deduction" },
            ],
        },
        {
            name: "Erik Svensson",
            personnummer: "850101-****",
            payrollRunId: "LK-2026-03-01",
            payrollRunDate: "2026-03-25",
            kommun: "Stockholm",
            skattetabell: "33",
            lineItems: [
                { löneart: "Månadslön", amount: 55000, type: "earning" },
                { löneart: "OB-tillägg kväll (8 tim)", amount: 1600, type: "earning" },
                { löneart: "Bilförmån", amount: 2400, type: "benefit" },
                { löneart: "Preliminärskatt", amount: 18590, type: "deduction" },
            ],
        },
        {
            name: "Maria Johansson",
            personnummer: "900515-****",
            payrollRunId: "LK-2026-03-01",
            payrollRunDate: "2026-03-25",
            kommun: "Göteborg",
            skattetabell: "33",
            lineItems: [
                { löneart: "Månadslön", amount: 38000, type: "earning" },
                { löneart: "Semestertillägg", amount: 760, type: "earning" },
                { löneart: "Preliminärskatt", amount: 12554, type: "deduction" },
            ],
        },
    ]

    const summaries = employees.map((emp) => {
        const gross = emp.lineItems.filter(i => i.type === "earning").reduce((s, i) => s + i.amount, 0)
        const benefits = emp.lineItems.filter(i => i.type === "benefit").reduce((s, i) => s + i.amount, 0)
        const deductions = emp.lineItems.filter(i => i.type === "deduction").reduce((s, i) => s + i.amount, 0)
        const taxItem = emp.lineItems.find(i => i.löneart === "Preliminärskatt")
        const taxAmount = taxItem ? Math.abs(taxItem.amount) : Math.round((gross + benefits - deductions) * 0.32)
        return { ...emp, gross, benefits, deductions, taxAmount }
    })

    const totalGross = summaries.reduce((s, e) => s + e.gross, 0)
    const totalBenefits = summaries.reduce((s, e) => s + e.benefits, 0)
    const totalTax = summaries.reduce((s, e) => s + e.taxAmount, 0)
    const feeBasis = totalGross + totalBenefits
    const employerFees = Math.round(feeBasis * employerFeeRate)

    const feeComponents = [
        { name: "Sjukförsäkringsavgift", rate: 0.0355 },
        { name: "Föräldraförsäkringsavgift", rate: 0.0260 },
        { name: "Ålderspensionsavgift", rate: 0.1021 },
        { name: "Efterlevandepensionsavgift", rate: 0.0070 },
        { name: "Arbetsmarknadsavgift", rate: 0.0266 },
        { name: "Arbetsskadeavgift", rate: 0.0020 },
        { name: "Allmän löneavgift", rate: 0.1153 },
    ]

    const employeeBlocks: BlockProps[] = summaries.map((emp) => ({
        type: "collapsed-group",
        props: {
            label: `${emp.name} — ${emp.personnummer} · ${emp.kommun}`,
            count: emp.lineItems.filter(i => i.löneart !== "Preliminärskatt").length,
            defaultOpen: false,
            children: [
                { type: "annotation", props: { text: `Källa: Lönekörning ${emp.payrollRunId} (${emp.payrollRunDate})`, variant: "muted" } },
                {
                    type: "financial-table",
                    props: {
                        columns: [
                            { label: "Löneart", icon: "receipt" },
                            { label: "Typ", icon: "tag", color: "muted" as const },
                            { label: "Belopp", icon: "banknote" },
                        ],
                        variant: "compact",
                        rows: emp.lineItems
                            .filter(i => i.löneart !== "Preliminärskatt")
                            .map((item) => ({
                                Löneart: item.löneart,
                                Typ: item.type === "earning" ? "Lön" : item.type === "benefit" ? "Förmån" : "Avdrag",
                                Belopp: item.type === "deduction" ? `−${fmt(item.amount)}` : fmt(item.amount),
                            })),
                    },
                },
                {
                    type: "key-value",
                    props: {
                        items: [
                            { label: "Bruttolön (fält 011)", value: fmt(emp.gross) },
                            ...(emp.benefits > 0 ? [{ label: "Förmåner (fält 012)", value: fmt(emp.benefits) }] : []),
                            { label: `Preliminärskatt (${emp.kommun}, tabell ${emp.skattetabell})`, value: fmt(emp.taxAmount) },
                        ],
                    },
                },
            ],
        },
    }))

    const response: WalkthroughResponse = {
        mode: "fixed",
        title: `Arbetsgivardeklaration ${period}`,
        subtitle: `AGI individuppgift · ${employees.length} anställda · Skatteverket`,
        blocks: [
            { type: "heading", props: { text: "Individuppgifter", level: 2, subtitle: "Lönearter per anställd — härledda från lönekörningar" } },
            ...employeeBlocks,
            { type: "separator", props: { label: "Sammanställning" } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Anställd", icon: "user" },
                        { label: "Bruttolön", icon: "banknote" },
                        { label: "Förmåner", icon: "gift" },
                        { label: "Avdragen skatt", icon: "receipt", color: "red" as const },
                    ],
                    rows: summaries.map((e) => ({ Anställd: e.name, Bruttolön: fmt(e.gross), Förmåner: fmt(e.benefits), "Avdragen skatt": fmt(e.taxAmount) })),
                    totals: { Anställd: "Totalt", Bruttolön: fmt(totalGross), Förmåner: fmt(totalBenefits), "Avdragen skatt": fmt(totalTax) },
                },
            },
            { type: "heading", props: { text: "Avgiftsberäkning", level: 2, subtitle: "SFS 2000:980 — Socialavgiftslag" } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Kontant bruttolön (fält 011)", value: fmt(totalGross) },
                        { label: "Förmåner (fält 012)", value: fmt(totalBenefits) },
                        { label: "Underlag arbetsgivaravgifter (fält 499)", value: fmt(feeBasis) },
                        { label: "Arbetsgivaravgift (fält 487)", value: fmt(employerFees) },
                        { label: "Avdragen preliminärskatt (fält 001)", value: fmt(totalTax) },
                    ],
                },
            },
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
                                rows: feeComponents.map((c) => ({ Avgift: c.name, Sats: pct(c.rate), Belopp: fmt(Math.round(feeBasis * c.rate)) })),
                                totals: { Avgift: "Totalt", Sats: pct(employerFeeRate), Belopp: fmt(employerFees) },
                            },
                        },
                    ],
                },
            },
            {
                type: "status-check",
                props: {
                    items: [
                        { label: "Individuppgifter komplett", status: "pass", detail: `${employees.length} anställda med personnummer och skattetabell` },
                        { label: "Avgiftsunderlag stämmer", status: "pass", detail: `Summa lön (${fmt(totalGross)}) + förmåner (${fmt(totalBenefits)}) = ${fmt(feeBasis)}` },
                        { label: "Skatteavdrag rimligt", status: "pass", detail: "Alla anställda har avdragen skatt baserad på kommunal skattetabell" },
                        { label: "Klart för inlämning", status: "pass", detail: "XML kan genereras för e-filing" },
                    ],
                },
            },
            { type: "info-card", props: { title: "Inlämning & betalning", content: "AGI lämnas in senast den 12:e i månaden efter löneutbetalningen. Betalning av skatt och avgifter sker samma dag till Skatteverkets bankgiro. Vid sen inlämning tillkommer förseningsavgift (500 kr/mån).", variant: "info" } },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Skicka till Skatteverket", variant: "default", actionId: "submit-agi" },
                        { label: "Exportera XML", variant: "outline", actionId: "export-agi-xml" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Här är arbetsgivardeklarationen för mars. Individuppgifter härledda från lönekörningen.",
            highlights: [
                { label: "Totalt att betala", value: fmt(totalTax + employerFees), detail: "Skatt + avgifter till den 12:e" },
                { label: "Arbetsgivaravgifter", value: fmt(employerFees), detail: `${pct(employerFeeRate)} av underlag` },
                { label: "Avdragen skatt", value: fmt(totalTax), detail: `${employees.length} individuppgifter` },
            ],
        },
        response,
    }
}

// =============================================================================
// Content lookup
// =============================================================================

type WalkthroughContent = {
    presentation: { message: string; highlights: ScoobyHighlight[] }
    response: WalkthroughResponse
}

const TITLES: Record<WalkthroughType, string> = {
    k10: "K10",
    resultatrakning: "Resultaträkning",
    balansrakning: "Balansräkning",
    momsdeklaration: "Momsdeklaration",
    egenavgifter: "Egenavgifter",
    agi: "Arbetsgivardeklaration",
}

function getWalkthroughContent(type: WalkthroughType): WalkthroughContent {
    switch (type) {
        case "k10": return buildK10()
        case "resultatrakning": return buildResultatrakning()
        case "balansrakning": return buildBalansrakning()
        case "momsdeklaration": return buildMomsdeklaration()
        case "egenavgifter": return buildEgenavgifter()
        case "agi": return buildAgi()
    }
}

// =============================================================================
// Component
// =============================================================================

export function WalkthroughSheet({ type, onClose }: WalkthroughSheetProps) {
    const content = useMemo(() => (type ? getWalkthroughContent(type) : null), [type])

    return (
        <Sheet open={type !== null} onOpenChange={(open) => { if (!open) onClose() }}>
            <SheetContent
                side="right"
                className="w-[90vw] max-w-4xl p-0 flex flex-col overflow-hidden"
            >
                <SheetHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
                    <SheetTitle>{type ? TITLES[type] : ""}</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    {content && (
                        <>
                            <div className="px-6 pt-5 pb-4">
                                <ScoobyPresentation
                                    message={content.presentation.message}
                                    highlights={content.presentation.highlights}
                                />
                            </div>
                            <WalkthroughRenderer
                                response={content.response}
                                onClose={onClose}
                                embedded
                            />
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
