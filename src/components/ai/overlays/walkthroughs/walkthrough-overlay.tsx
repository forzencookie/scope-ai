"use client"

import { useMemo } from "react"
import { PageOverlay } from "@/components/shared/page-overlay"
import { WalkthroughRenderer } from "@/components/ai/overlays/blocks/block-renderer"
import { ScoobyPresentation } from "@/components/ai/scooby-presentation"
import type { WalkthroughResponse } from "@/components/ai/overlays/blocks/types"
import type { ScoobyHighlight } from "@/components/ai/scooby-presentation"

// ─── Walkthrough type ────────────────────────────────────────────────────────

export type WalkthroughType =
    | "k10"
    | "resultatrakning"
    | "balansrakning"
    | "momsdeklaration"
    | "egenavgifter"
    | "agi"
    | "transaktioner"
    | "fakturor"
    | "verifikationer"
    | "tillgangar"
    | "handelser"
    | "lonekorning"
    | "team"
    | "formaner"
    | "aktiebok"
    | "utdelning"
    | "delagare"
    | "delagaruttag"
    | "moten"
    | "medlemsregister"
    | "plan"
    | "kund"

// ─── Shared formatters ───────────────────────────────────────────────────────

function fmt(n: number): string {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr"
}

function pct(n: number): string {
    return (n * 100).toFixed(2) + "%"
}

// ─── K10 content ─────────────────────────────────────────────────────────────

function buildK10(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const shareCount = 600
    const totalShares = 1000
    const ownershipPct = shareCount / totalShares
    const schablonbelopp = 204325
    const schablonForOwner = Math.round(schablonbelopp * ownershipPct)
    const totalSalaries = 1620000
    const ibb = 74300
    const ownerSalary = 660000
    const salaryThreshold = 6 * ibb + Math.round(totalSalaries * 0.05)
    const qualifiesForSalaryBased = ownerSalary >= salaryThreshold
    const salaryBasedSpace = qualifiesForSalaryBased
        ? Math.round(totalSalaries * 0.50 * ownershipPct)
        : 0
    const bestMethod = salaryBasedSpace > schablonForOwner ? "salary" : "schablon"
    const baseAmount = bestMethod === "salary" ? salaryBasedSpace : schablonForOwner
    const previousYearSaved = 185000
    const upliftAmount = 11859
    const savedWithUplift = previousYearSaved + upliftAmount
    const totalBoundary = baseAmount + savedWithUplift
    const proposedDividend = 400000
    const taxedAt20 = Math.min(proposedDividend, totalBoundary)
    const taxedAsIncome = Math.max(0, proposedDividend - totalBoundary)
    const tax20 = Math.round(taxedAt20 * 0.20)
    const taxIncome = Math.round(taxedAsIncome * 0.52)

    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "K10 — Kvalificerade andelar 2026",
        subtitle: `Erik Svensson · ${shareCount}/${totalShares} aktier (${(ownershipPct * 100).toFixed(1)}%)`,
        blocks: [
            { type: "heading", props: { text: "Ägande", level: 2, subtitle: "Härlett från aktieboken" } },
            { type: "annotation", props: { text: "Källa: Aktiebok — förvärvad 2024-01-15", variant: "muted" } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Delägare", value: "Erik Svensson" },
                        { label: "Personnummer", value: "850101-****" },
                        { label: "Aktier", value: `${shareCount} av ${totalShares} (${(ownershipPct * 100).toFixed(1)}%)` },
                        { label: "Aktieslag", value: "Stamaktier A" },
                        { label: "Anskaffningsutgift (fält 1.3)", value: fmt(30000) },
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
                        { label: `Din andel (${(ownershipPct * 100).toFixed(1)}%)`, value: fmt(schablonForOwner) },
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
            {
                type: "collapsed-group",
                props: {
                    label: "Löneregister 2025 — 3 anställda",
                    count: 3,
                    defaultOpen: false,
                    children: [
                        {
                            type: "financial-table",
                            props: {
                                columns: [
                                    { label: "Anställd", icon: "user" },
                                    { label: "Total lön 2025", icon: "banknote" },
                                    { label: "Källa", icon: "file-text", color: "muted" as const },
                                ],
                                variant: "compact",
                                rows: [
                                    { Anställd: "Erik Svensson", "Total lön 2025": fmt(660000), Källa: "12 lönekörningar jan-dec 2025" },
                                    { Anställd: "Anna Lindberg", "Total lön 2025": fmt(504000), Källa: "12 lönekörningar jan-dec 2025" },
                                    { Anställd: "Maria Johansson", "Total lön 2025": fmt(456000), Källa: "12 lönekörningar jan-dec 2025" },
                                ],
                                totals: { Anställd: "Totalt", "Total lön 2025": fmt(totalSalaries), Källa: "" },
                            },
                        },
                    ],
                },
            },
            ...(qualifiesForSalaryBased ? [
                {
                    type: "key-value",
                    props: {
                        items: [
                            { label: "Total lönekostnad", value: fmt(totalSalaries) },
                            { label: "50% av lönesumman", value: fmt(Math.round(totalSalaries * 0.50)) },
                            { label: `Din andel (${(ownershipPct * 100).toFixed(1)}%)`, value: fmt(salaryBasedSpace) },
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
                        content: `Du behöver ta ut minst ${fmt(salaryThreshold)} i lön för att använda lönebaserat utrymme.`,
                        variant: "warning",
                    },
                },
            ]),
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
            { type: "annotation", props: { text: "Källa: K10 deklaration 2025, fält 3.18", variant: "muted" } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Sparat från föregående år", value: fmt(previousYearSaved) },
                        { label: "Uppräkning (SLR + 3% = 6.41%)", value: `+ ${fmt(upliftAmount)}` },
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
                        { label: "Aktiebok verifierad", status: "pass", detail: `${shareCount} aktier registrerade` },
                        { label: "Löneunderlag komplett", status: "pass", detail: "3 anställda, 2025" },
                        { label: "Sparat utrymme hämtat", status: "pass", detail: "K10 deklaration 2025, fält 3.18" },
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
                { label: "Total skatt", value: fmt(tax20 + taxIncome), detail: "20.0% kapitalskatt" },
            ],
        },
        response,
    }
}

// ─── Resultaträkning content ──────────────────────────────────────────────────

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
                        { label: "Benämning", icon: "tag", color: "muted" },
                        { label: "Belopp", icon: "banknote", color: "default" },
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

// ─── Balansräkning content ────────────────────────────────────────────────────

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

// ─── Momsdeklaration content ──────────────────────────────────────────────────

function buildMomsdeklaration(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Momsdeklaration Q1 2026",
        subtitle: "Redovisningsperiod jan–mar · Skatteverket",
        blocks: [
            {
                type: "heading",
                props: { text: `Momspliktig försäljning (Ruta 05)`, level: 2, subtitle: `Försäljning inom Sverige exklusive moms — ${fmt(150000)}` },
            },
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
            {
                type: "info-card",
                props: {
                    title: "Inlämning & betalning",
                    content: "Momsdeklarationen ska lämnas in senast den 12 maj 2026 (kvartalsmoms). Betalning sker till Skatteverkets bankgiro samma dag. Vid sen inlämning tillkommer förseningsavgift.",
                    variant: "info",
                },
            },
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

// ─── Egenavgifter content ─────────────────────────────────────────────────────

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
    const monthlyProfit = Math.round(annualProfit / 12)
    const effective = annualProfit > 0 ? avgifter / annualProfit : 0

    const componentRows = Object.entries(EGENAVGIFTER_RATES).map(([key, rate]) => ({
        Avgift: EGENAVGIFTER_LABELS[key],
        Sats: pct(rate),
        Belopp: fmt(Math.round(base * rate)),
    }))

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
            {
                type: "info-card",
                props: {
                    title: "F-skatt & betalning",
                    content: "Egenavgifter betalas via preliminär F-skatt den 12:e varje månad. Slutavräkning sker i samband med inkomstdeklarationen (NE-bilaga). Justera din preliminärdeklaration (SKV 4314) om vinsten avviker väsentligt.",
                    variant: "info",
                },
            },
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
                { label: "Totala egenavgifter", value: fmt(avgifter), detail: `${(effective * 100).toFixed(1)}% av vinsten` },
                { label: "Kvar efter avgifter", value: fmt(netto), detail: "Före inkomstskatt" },
                { label: "Månadsbelopp (F-skatt)", value: fmt(monthlyAvgifter), detail: "Betalas den 12:e" },
            ],
        },
        response,
    }
}

// ─── AGI content ──────────────────────────────────────────────────────────────

function buildAgi(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const employerFeeRate = 0.3142

    interface LineItem { löneart: string; amount: number; type: "earning" | "deduction" | "benefit" }
    interface Employee {
        name: string; personnummer: string; payrollRunId: string; payrollRunDate: string
        kommun: string; skattetabell: string; lineItems: LineItem[]
    }

    const employees: Employee[] = [
        {
            name: "Anna Lindberg", personnummer: "920315-****", payrollRunId: "LK-2026-03-01",
            payrollRunDate: "2026-03-25", kommun: "Stockholm", skattetabell: "32",
            lineItems: [
                { löneart: "Månadslön", amount: 42000, type: "earning" },
                { löneart: "Friskvårdsbidrag", amount: 500, type: "earning" },
                { löneart: "Sjukavdrag (2 dgr)", amount: 2800, type: "deduction" },
                { löneart: "Karensavdrag", amount: 1120, type: "deduction" },
                { löneart: "Preliminärskatt", amount: 12475, type: "deduction" },
            ],
        },
        {
            name: "Erik Svensson", personnummer: "850101-****", payrollRunId: "LK-2026-03-01",
            payrollRunDate: "2026-03-25", kommun: "Stockholm", skattetabell: "33",
            lineItems: [
                { löneart: "Månadslön", amount: 55000, type: "earning" },
                { löneart: "OB-tillägg kväll (8 tim)", amount: 1600, type: "earning" },
                { löneart: "Bilförmån", amount: 2400, type: "benefit" },
                { löneart: "Preliminärskatt", amount: 18590, type: "deduction" },
            ],
        },
        {
            name: "Maria Johansson", personnummer: "900515-****", payrollRunId: "LK-2026-03-01",
            payrollRunDate: "2026-03-25", kommun: "Göteborg", skattetabell: "33",
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
        const taxItem = emp.lineItems.find(i => i.löneart === "Preliminärskatt")
        const taxAmount = taxItem ? Math.abs(taxItem.amount) : 0
        return { ...emp, gross, benefits, taxAmount }
    })

    const totalGross = summaries.reduce((s, e) => s + e.gross, 0)
    const totalBenefits = summaries.reduce((s, e) => s + e.benefits, 0)
    const totalTax = summaries.reduce((s, e) => s + e.taxAmount, 0)
    const feeBasis = totalGross + totalBenefits
    const employerFees = Math.round(feeBasis * employerFeeRate)
    const totalToPay = totalTax + employerFees

    const feeComponents = [
        { name: "Sjukförsäkringsavgift", rate: 0.0355 },
        { name: "Föräldraförsäkringsavgift", rate: 0.0260 },
        { name: "Ålderspensionsavgift", rate: 0.1021 },
        { name: "Efterlevandepensionsavgift", rate: 0.0070 },
        { name: "Arbetsmarknadsavgift", rate: 0.0266 },
        { name: "Arbetsskadeavgift", rate: 0.0020 },
        { name: "Allmän löneavgift", rate: 0.1153 },
    ]

    const employeeBlocks = summaries.map((emp) => ({
        type: "collapsed-group" as const,
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
        title: "Arbetsgivardeklaration 2026-03",
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
                    rows: summaries.map((e) => ({
                        Anställd: e.name,
                        Bruttolön: fmt(e.gross),
                        Förmåner: fmt(e.benefits),
                        "Avdragen skatt": fmt(e.taxAmount),
                    })),
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
                                rows: feeComponents.map((c) => ({
                                    Avgift: c.name,
                                    Sats: pct(c.rate),
                                    Belopp: fmt(Math.round(feeBasis * c.rate)),
                                })),
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
            {
                type: "info-card",
                props: {
                    title: "Inlämning & betalning",
                    content: "AGI lämnas in senast den 12:e i månaden efter löneutbetalningen. Betalning av skatt och avgifter sker samma dag till Skatteverkets bankgiro. Vid sen inlämning tillkommer förseningsavgift (500 kr/mån).",
                    variant: "info",
                },
            },
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
                { label: "Totalt att betala", value: fmt(totalToPay), detail: "Skatt + avgifter till den 12:e" },
                { label: "Arbetsgivaravgifter", value: fmt(employerFees), detail: `${(employerFeeRate * 100).toFixed(2)}% av underlag` },
                { label: "Avdragen skatt", value: fmt(totalTax), detail: `${employees.length} individuppgifter` },
            ],
        },
        response,
    }
}

// ─── Transaktioner content ────────────────────────────────────────────────────

function buildTransaktioner(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Transaktioner — April 2026",
        subtitle: "Senaste 8 transaktioner · 3 obokförda",
        blocks: [
            { type: "heading", props: { text: "Transaktioner april 2026", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Datum", icon: "calendar" },
                        { label: "Beskrivning", icon: "file-text" },
                        { label: "Belopp", icon: "banknote" },
                        { label: "Konto", icon: "hash", color: "muted" as const },
                        { label: "Ver.nr", icon: "receipt", color: "muted" as const },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Datum: "2026-04-01", Beskrivning: "Kontorshyra", Belopp: "-8 500 kr", Konto: "5010", "Ver.nr": "A-48", Status: "Bokförd" },
                        { Datum: "2026-04-03", Beskrivning: "Svea Hosting", Belopp: "-1 499 kr", Konto: "5420", "Ver.nr": "A-49", Status: "Bokförd" },
                        { Datum: "2026-04-07", Beskrivning: "Kjell & Company", Belopp: "-2 499 kr", Konto: "—", "Ver.nr": "—", Status: "Obokförd" },
                        { Datum: "2026-04-10", Beskrivning: "Kund: Acme Corp faktura", Belopp: "+62 500 kr", Konto: "3001", "Ver.nr": "A-50", Status: "Bokförd" },
                        { Datum: "2026-04-12", Beskrivning: "Spotify Business", Belopp: "-169 kr", Konto: "—", "Ver.nr": "—", Status: "Obokförd" },
                        { Datum: "2026-04-14", Beskrivning: "Kund: Beta AB faktura", Belopp: "+125 000 kr", Konto: "3001", "Ver.nr": "A-51", Status: "Bokförd" },
                        { Datum: "2026-04-18", Beskrivning: "Clas Ohlson — material", Belopp: "-349 kr", Konto: "—", "Ver.nr": "—", Status: "Obokförd" },
                        { Datum: "2026-04-20", Beskrivning: "SJ resor Q1", Belopp: "-3 200 kr", Konto: "5800", "Ver.nr": "A-52", Status: "Bokförd" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Bokför obokförda (3)", variant: "default", actionId: "book-unbooked" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Här är dina senaste transaktioner — 8 st, varav 3 obokförda.",
            highlights: [
                { label: "Intäkter", value: "185 000 kr", detail: "Denna månad" },
                { label: "Kostnader", value: "92 500 kr", detail: "Denna månad" },
                { label: "Obokförda", value: "3 st", detail: "Väntar på bokföring" },
            ],
        },
        response,
    }
}

// ─── Fakturor content ─────────────────────────────────────────────────────────

function buildFakturor(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Fakturor",
        subtitle: "Kundfakturor & leverantörsfakturor",
        blocks: [
            { type: "heading", props: { text: "Kundfakturor", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Fakturanr", icon: "receipt" },
                        { label: "Kund", icon: "user" },
                        { label: "Belopp", icon: "banknote" },
                        { label: "Förfallodatum", icon: "calendar" },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Fakturanr: "F-2026-01", Kund: "Acme Consulting AB", Belopp: "62 500 kr", Förfallodatum: "2026-04-15", Status: "Betald" },
                        { Fakturanr: "F-2026-02", Kund: "Beta AB", Belopp: "125 000 kr", Förfallodatum: "2026-04-30", Status: "Utestående" },
                        { Fakturanr: "F-2026-03", Kund: "Gamma Tech", Belopp: "37 500 kr", Förfallodatum: "2026-03-31", Status: "Förfallen" },
                        { Fakturanr: "F-2026-04", Kund: "Delta Partners", Belopp: "18 750 kr", Förfallodatum: "2026-05-15", Status: "Utestående" },
                        { Fakturanr: "F-2026-05", Kund: "Epsilon AB", Belopp: "56 250 kr", Förfallodatum: "2026-04-22", Status: "Betald" },
                    ],
                },
            },
            { type: "separator", props: { label: "Leverantörsfakturor" } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Fakturanr", icon: "receipt" },
                        { label: "Leverantör", icon: "user" },
                        { label: "Belopp", icon: "banknote" },
                        { label: "Förfallodatum", icon: "calendar" },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Fakturanr: "LF-2026-01", Leverantör: "Visma Software", Belopp: "12 800 kr", Förfallodatum: "2026-04-10", Status: "Betald" },
                        { Fakturanr: "LF-2026-02", Leverantör: "SJ AB", Belopp: "8 400 kr", Förfallodatum: "2026-04-20", Status: "Betald" },
                        { Fakturanr: "LF-2026-03", Leverantör: "Apple Store", Belopp: "25 000 kr", Förfallodatum: "2026-03-28", Status: "Förfallen" },
                        { Fakturanr: "LF-2026-04", Leverantör: "Office Depot", Belopp: "4 200 kr", Förfallodatum: "2026-05-01", Status: "Obetald" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Skapa faktura", variant: "default", actionId: "create-invoice" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Här är dina fakturor — 5 kundfakturor och 4 leverantörsfakturor. 2 förfallna.",
            highlights: [
                { label: "Utestående", value: "125 000 kr", detail: "Ej betalda kundfakturor" },
                { label: "Betalt", value: "340 000 kr", detail: "Denna månad" },
                { label: "Antal", value: "9 fakturor", detail: "5 kund · 4 leverantör" },
            ],
        },
        response,
    }
}

// ─── Verifikationer content ───────────────────────────────────────────────────

function buildVerifikationer(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Verifikationer — Mars 2026",
        subtitle: "51 verifikationer · A-serie",
        blocks: [
            { type: "heading", props: { text: "Verifikationer mars 2026", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Ver.nr", icon: "receipt" },
                        { label: "Datum", icon: "calendar" },
                        { label: "Beskrivning", icon: "file-text" },
                        { label: "Debet", icon: "banknote" },
                        { label: "Kredit", icon: "banknote", color: "muted" as const },
                    ],
                    rows: [
                        { "Ver.nr": "A-42", Datum: "2026-03-01", Beskrivning: "Kontorshyra mars", Debet: "8 500 kr", Kredit: "8 500 kr" },
                        { "Ver.nr": "A-43", Datum: "2026-03-05", Beskrivning: "Svea Hosting", Debet: "1 874 kr", Kredit: "1 874 kr" },
                        { "Ver.nr": "A-44", Datum: "2026-03-08", Beskrivning: "Löneutbetalning mars", Debet: "135 000 kr", Kredit: "135 000 kr" },
                        { "Ver.nr": "A-45", Datum: "2026-03-10", Beskrivning: "Kund Acme Corp", Debet: "62 500 kr", Kredit: "62 500 kr" },
                        { "Ver.nr": "A-46", Datum: "2026-03-15", Beskrivning: "Arbetsgivaravgift", Debet: "42 418 kr", Kredit: "42 418 kr" },
                        { "Ver.nr": "A-47", Datum: "2026-03-18", Beskrivning: "Spotify Business", Debet: "211 kr", Kredit: "211 kr" },
                        { "Ver.nr": "A-48", Datum: "2026-03-20", Beskrivning: "Apple MacBook Pro", Debet: "31 250 kr", Kredit: "31 250 kr" },
                        { "Ver.nr": "A-49", Datum: "2026-03-22", Beskrivning: "Kund Beta AB", Debet: "125 000 kr", Kredit: "125 000 kr" },
                        { "Ver.nr": "A-50", Datum: "2026-03-25", Beskrivning: "SJ tjänsteresor", Debet: "4 000 kr", Kredit: "4 000 kr" },
                        { "Ver.nr": "A-51", Datum: "2026-03-31", Beskrivning: "Periodavstämning", Debet: "1 200 kr", Kredit: "1 200 kr" },
                    ],
                },
            },
            {
                type: "status-check",
                props: {
                    items: [
                        { label: "Balanserar", status: "pass", detail: "Debet = Kredit för alla verifikationer" },
                        { label: "Nummersekvens", status: "pass", detail: "A-42 till A-51 utan luckor" },
                        { label: "Momsavstämning", status: "pass", detail: "Alla momskonton balanserade" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Här är verifikationslistan för mars — 51 st, alla balanserade.",
            highlights: [
                { label: "Totalt", value: "51 ver.", detail: "A-01 till A-51" },
                { label: "Denna månad", value: "12 ver.", detail: "Mars 2026" },
                { label: "Obalanserade", value: "0 st", detail: "Allt stämmer" },
            ],
        },
        response,
    }
}

// ─── Tillgångar content ───────────────────────────────────────────────────────

function buildTillgangar(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Inventarier & Tillgångar",
        subtitle: "Avskrivningsplan 2026",
        blocks: [
            { type: "heading", props: { text: "Inventarier", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Benämning", icon: "tag" },
                        { label: "Anskaffningsvärde", icon: "banknote" },
                        { label: "Bokfört värde", icon: "banknote", color: "muted" as const },
                        { label: "Avskrivning/mån", icon: "trending-up", color: "muted" as const },
                        { label: "Restvärde", icon: "banknote", color: "muted" as const },
                    ],
                    rows: [
                        { Benämning: "MacBook Pro (2024)", Anskaffningsvärde: "31 250 kr", "Bokfört värde": "18 750 kr", "Avskrivning/mån": "521 kr", Restvärde: "0 kr" },
                        { Benämning: "Dell-skärmar ×2", Anskaffningsvärde: "12 000 kr", "Bokfört värde": "8 000 kr", "Avskrivning/mån": "333 kr", Restvärde: "2 000 kr" },
                        { Benämning: "Kontorsmöbler", Anskaffningsvärde: "45 000 kr", "Bokfört värde": "36 000 kr", "Avskrivning/mån": "750 kr", Restvärde: "9 000 kr" },
                        { Benämning: "iPhone 15 Pro", Anskaffningsvärde: "14 990 kr", "Bokfört värde": "8 745 kr", "Avskrivning/mån": "416 kr", Restvärde: "0 kr" },
                    ],
                    totals: { Benämning: "Totalt", Anskaffningsvärde: "103 240 kr", "Bokfört värde": "71 495 kr", "Avskrivning/mån": "2 020 kr", Restvärde: "11 000 kr" },
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Här är dina inventarier — 4 st med ett totalt bokfört värde på 71 495 kr.",
            highlights: [
                { label: "Antal inventarier", value: "4 st", detail: "Aktiva" },
                { label: "Bokfört värde", value: "71 495 kr", detail: "Per idag" },
                { label: "Årets avskrivningar", value: "24 000 kr", detail: "2026 hittills" },
            ],
        },
        response,
    }
}

// ─── Händelser content ────────────────────────────────────────────────────────

function buildHandelser(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Händelser & Deadlines",
        subtitle: "Bokslut, stängda perioder, kommande deadlines",
        blocks: [
            { type: "heading", props: { text: "Senaste händelser", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Datum", icon: "calendar" },
                        { label: "Händelse", icon: "file-text" },
                        { label: "Typ", icon: "tag", color: "muted" as const },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Datum: "2026-04-12", Händelse: "AGI mars — skickad", Typ: "Deklaration", Status: "Klar" },
                        { Datum: "2026-04-10", Händelse: "Månadsavslut mars", Typ: "Bokslut", Status: "Klar" },
                        { Datum: "2026-04-05", Händelse: "Momsdeklaration Q1", Typ: "Deklaration", Status: "Öppen" },
                        { Datum: "2026-03-31", Händelse: "Periodstängning mars", Typ: "Period", Status: "Stängd" },
                        { Datum: "2026-03-25", Händelse: "Löneutbetalning mars", Typ: "Lön", Status: "Klar" },
                        { Datum: "2026-02-28", Händelse: "Periodstängning feb", Typ: "Period", Status: "Stängd" },
                    ],
                },
            },
            { type: "heading", props: { text: "Kommande deadlines", level: 2 } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "12 maj 2026", value: "Momsdeklaration Q1 — 25 000 kr att betala" },
                        { label: "12 maj 2026", value: "AGI april — löneutbetalning april" },
                        { label: "2 juni 2026", value: "Bolagsstämma — kallelsetid 4–6 veckor" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Här är händelseloggen — 3 öppna uppgifter och 2 kommande deadlines.",
            highlights: [
                { label: "Öppna uppgifter", value: "3 st", detail: "Kräver åtgärd" },
                { label: "Kommande deadlines", value: "2 st", detail: "Nästa 30 dagarna" },
                { label: "Stängda perioder", value: "6 st", detail: "Jan–Jun 2025" },
            ],
        },
        response,
    }
}

// ─── Lönekörning content ──────────────────────────────────────────────────────

function buildLonekorning(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Lönekörning — Mars 2026",
        subtitle: "3 anställda · LK-2026-03-01",
        blocks: [
            { type: "heading", props: { text: "Lönekörning LK-2026-03-01", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Anställd", icon: "user" },
                        { label: "Bruttolön", icon: "banknote" },
                        { label: "Nettolön", icon: "banknote", color: "muted" as const },
                        { label: "Arbetsgivaravgift", icon: "receipt", color: "muted" as const },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Anställd: "Anna Lindberg", Bruttolön: "42 000 kr", Nettolön: "29 525 kr", Arbetsgivaravgift: "13 191 kr", Status: "Godkänd" },
                        { Anställd: "Erik Svensson", Bruttolön: "55 000 kr", Nettolön: "36 410 kr", Arbetsgivaravgift: "17 281 kr", Status: "Godkänd" },
                        { Anställd: "Maria Johansson", Bruttolön: "38 000 kr", Nettolön: "25 446 kr", Arbetsgivaravgift: "11 946 kr", Status: "Godkänd" },
                    ],
                    totals: { Anställd: "Totalt", Bruttolön: "135 000 kr", Nettolön: "91 381 kr", Arbetsgivaravgift: "42 418 kr", Status: "" },
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Exportera lönebesked", variant: "default", actionId: "export-payslips" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Lönekörning mars är klar — 3 anställda, total lönekostnad 177 418 kr inkl. arbetsgivaravgift.",
            highlights: [
                { label: "Total lönekostnad", value: "177 418 kr", detail: "Inkl. arbetsgivaravgift" },
                { label: "Antal löner", value: "3 st", detail: "Utbetalade mars" },
                { label: "Status", value: "Godkänd", detail: "Klart för utbetalning" },
            ],
        },
        response,
    }
}

// ─── Team content ─────────────────────────────────────────────────────────────

function buildTeam(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Team — Anställda",
        subtitle: "3 aktiva anställda · April 2026",
        blocks: [
            { type: "heading", props: { text: "Anställda", level: 2 } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Namn", value: "Anna Lindberg" },
                        { label: "Roll", value: "Produktchef" },
                        { label: "Månads­lön", value: "42 000 kr" },
                        { label: "Kommun", value: "Stockholm" },
                        { label: "Status", value: "Aktiv" },
                    ],
                },
            },
            { type: "separator", props: {} },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Namn", value: "Erik Svensson" },
                        { label: "Roll", value: "VD / Grundare" },
                        { label: "Månads­lön", value: "55 000 kr" },
                        { label: "Kommun", value: "Stockholm" },
                        { label: "Status", value: "Aktiv" },
                    ],
                },
            },
            { type: "separator", props: {} },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Namn", value: "Maria Johansson" },
                        { label: "Roll", value: "Säljare" },
                        { label: "Månads­lön", value: "38 000 kr" },
                        { label: "Kommun", value: "Göteborg" },
                        { label: "Status", value: "Aktiv" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Lägg till anställd", variant: "default", actionId: "add-employee" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Ditt team har 3 aktiva anställda med en total månadslönekostnad på 135 000 kr.",
            highlights: [
                { label: "Aktiva anställda", value: "3 st", detail: "Tillsvidare" },
                { label: "Total månads­lön", value: "135 000 kr", detail: "Bruttolön" },
                { label: "Kostnad/anst.", value: "45 000 kr", detail: "Snitt inkl. avgifter" },
            ],
        },
        response,
    }
}

// ─── Förmåner content ─────────────────────────────────────────────────────────

function buildFormaner(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Förmåner",
        subtitle: "4 aktiva förmåner · 2026",
        blocks: [
            { type: "heading", props: { text: "Förmåner per anställd", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Förmån", icon: "gift" },
                        { label: "Anställd", icon: "user" },
                        { label: "Belopp/år", icon: "banknote" },
                        { label: "Skattepliktig", icon: "tag", color: "muted" as const },
                        { label: "Startdatum", icon: "calendar", color: "muted" as const },
                    ],
                    rows: [
                        { Förmån: "Friskvårdsbidrag", Anställd: "Anna Lindberg", "Belopp/år": "5 000 kr", Skattepliktig: "Nej", Startdatum: "2024-01-01" },
                        { Förmån: "Friskvårdsbidrag", Anställd: "Erik Svensson", "Belopp/år": "5 000 kr", Skattepliktig: "Nej", Startdatum: "2024-01-01" },
                        { Förmån: "Bilförmån", Anställd: "Erik Svensson", "Belopp/år": "28 800 kr", Skattepliktig: "Ja", Startdatum: "2025-03-01" },
                        { Förmån: "Friskvårdsbidrag", Anställd: "Maria Johansson", "Belopp/år": "5 000 kr", Skattepliktig: "Nej", Startdatum: "2024-06-01" },
                    ],
                    totals: { Förmån: "Totalt", Anställd: "", "Belopp/år": "43 800 kr", Skattepliktig: "", Startdatum: "" },
                },
            },
            {
                type: "info-card",
                props: {
                    title: "Friskvårdsbidrag 2026",
                    content: "Skattefritt friskvårdsbidrag är max 5 000 kr per anställd och år (IL 11 kap 28§). Bilförmån beräknas enligt Skatteverkets fordonslista.",
                    variant: "info",
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Ditt team har 4 aktiva förmåner med ett totalt värde på 43 800 kr per år.",
            highlights: [
                { label: "Aktiva förmåner", value: "4 st", detail: "Pågående" },
                { label: "Totalt värde", value: "43 800 kr/år", detail: "Alla anställda" },
                { label: "Skattepliktiga", value: "1 st", detail: "Bilförmån" },
            ],
        },
        response,
    }
}

// ─── Aktiebok content ─────────────────────────────────────────────────────────

function buildAktiebok(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Aktiebok & Styrning",
        subtitle: "Acme Tech AB · Org.nr 556901-2345",
        blocks: [
            { type: "heading", props: { text: "Aktiebok", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Ägare", icon: "user" },
                        { label: "Personnr", icon: "hash", color: "muted" as const },
                        { label: "Antal aktier", icon: "banknote" },
                        { label: "Andel %", icon: "percent" },
                        { label: "Röster", icon: "tag", color: "muted" as const },
                        { label: "Aktienummer", icon: "hash", color: "muted" as const },
                    ],
                    rows: [
                        { Ägare: "Erik Svensson", Personnr: "850101-****", "Antal aktier": "600", "Andel %": "60,0%", Röster: "600", Aktienummer: "1–600" },
                        { Ägare: "Anna Lindberg", Personnr: "920315-****", "Antal aktier": "400", "Andel %": "40,0%", Röster: "400", Aktienummer: "601–1000" },
                    ],
                    totals: { Ägare: "Totalt", Personnr: "", "Antal aktier": "1 000", "Andel %": "100%", Röster: "1 000", Aktienummer: "" },
                },
            },
            { type: "heading", props: { text: "Aktiehistorik", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Datum", icon: "calendar" },
                        { label: "Händelse", icon: "file-text" },
                        { label: "Aktier", icon: "banknote" },
                        { label: "Ägare", icon: "user" },
                        { label: "Belopp/aktie", icon: "banknote", color: "muted" as const },
                    ],
                    rows: [
                        { Datum: "2022-01-10", Händelse: "Bolagsbildning", Aktier: "1 000", Ägare: "Erik Svensson", "Belopp/aktie": "100 kr" },
                        { Datum: "2023-06-15", Händelse: "Överlåtelse", Aktier: "400", Ägare: "Anna Lindberg", "Belopp/aktie": "150 kr" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Exportera aktiebok", variant: "default", actionId: "export-share-register" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Aktieboken visar 1 000 aktier fördelade på 2 ägare med ett aktiekapital på 100 000 kr.",
            highlights: [
                { label: "Antal aktier", value: "1 000 st", detail: "Stamaktier A" },
                { label: "Antal ägare", value: "2 st", detail: "Aktiva delägare" },
                { label: "Aktiekapital", value: "100 000 kr", detail: "Registrerat" },
            ],
        },
        response,
    }
}

// ─── Utdelning content ────────────────────────────────────────────────────────

function buildUtdelning(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Utdelning 2026",
        subtitle: "Gränsbelopp och skatteberäkning",
        blocks: [
            { type: "heading", props: { text: "Utdelning per ägare", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Ägare", icon: "user" },
                        { label: "Andel", icon: "percent" },
                        { label: "Belopp", icon: "banknote" },
                        { label: "Skatt 20%", icon: "receipt", color: "muted" as const },
                        { label: "Netto", icon: "banknote", color: "muted" as const },
                    ],
                    rows: [
                        { Ägare: "Erik Svensson", Andel: "60%", Belopp: "240 000 kr", "Skatt 20%": "48 000 kr", Netto: "192 000 kr" },
                        { Ägare: "Anna Lindberg", Andel: "40%", Belopp: "160 000 kr", "Skatt 20%": "32 000 kr", Netto: "128 000 kr" },
                    ],
                    totals: { Ägare: "Totalt", Andel: "100%", Belopp: "400 000 kr", "Skatt 20%": "80 000 kr", Netto: "320 000 kr" },
                },
            },
            { type: "annotation", props: { text: "Försiktighetsregeln: Bolagets egna kapital 500 000 kr. Utdelning 400 000 kr. Kontrollera med revisor.", variant: "muted" } },
            {
                type: "info-card",
                props: {
                    title: "Utdelning inom gränsbelopp",
                    content: "400 000 kr ≤ 619 054 kr — hela utdelningen beskattas med 20% kapitalskatt.",
                    variant: "success",
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Exportera utdelningsdokument", variant: "default", actionId: "export-dividend" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Föreslagen utdelning 400 000 kr ryms inom gränsbeloppet på 619 054 kr — beskattas med 20%.",
            highlights: [
                { label: "Gränsbelopp", value: "619 054 kr", detail: "Totalt utrymme" },
                { label: "Beslutad utdelning", value: "400 000 kr", detail: "Förslag bolagsstämma" },
                { label: "Återstående", value: "219 054 kr", detail: "Kan sparas till nästa år" },
            ],
        },
        response,
    }
}

// ─── Delägare content ─────────────────────────────────────────────────────────

function buildDelagare(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Delägare",
        subtitle: "Handelsbolag / Kommanditbolag",
        blocks: [
            { type: "heading", props: { text: "Delägare", level: 2 } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Namn", value: "Erik Svensson" },
                        { label: "Personnr", value: "850101-****" },
                        { label: "Andel", value: "50%" },
                        { label: "Typ", value: "Komplementär" },
                        { label: "Kapitalkonto", value: "280 000 kr" },
                        { label: "Status", value: "Aktiv" },
                    ],
                },
            },
            { type: "separator", props: {} },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Namn", value: "Anna Lindberg" },
                        { label: "Personnr", value: "920315-****" },
                        { label: "Andel", value: "50%" },
                        { label: "Typ", value: "Komplementär" },
                        { label: "Kapitalkonto", value: "170 000 kr" },
                        { label: "Status", value: "Aktiv" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Bolaget har 2 delägare med ett totalt kapitalkonto på 450 000 kr.",
            highlights: [
                { label: "Antal delägare", value: "2 st", detail: "Komplementärer" },
                { label: "Totalt kapital", value: "450 000 kr", detail: "Kapitalkonton" },
                { label: "Vinstandel max", value: "50%", detail: "Per delägare" },
            ],
        },
        response,
    }
}

// ─── Delägaruttag content ─────────────────────────────────────────────────────

function buildDelagaruttag(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Delägaruttag & Insättningar",
        subtitle: "Uttag och insättningar per delägare · 2026",
        blocks: [
            { type: "heading", props: { text: "Transaktioner 2026", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Delägare", icon: "user" },
                        { label: "Datum", icon: "calendar" },
                        { label: "Typ", icon: "tag" },
                        { label: "Belopp", icon: "banknote" },
                        { label: "Konto", icon: "hash", color: "muted" as const },
                    ],
                    rows: [
                        { Delägare: "Erik Svensson", Datum: "2026-01-31", Typ: "Uttag", Belopp: "-20 000 kr", Konto: "2010" },
                        { Delägare: "Anna Lindberg", Datum: "2026-01-31", Typ: "Uttag", Belopp: "-15 000 kr", Konto: "2020" },
                        { Delägare: "Erik Svensson", Datum: "2026-02-28", Typ: "Uttag", Belopp: "-25 000 kr", Konto: "2010" },
                        { Delägare: "Anna Lindberg", Datum: "2026-02-28", Typ: "Insättning", Belopp: "+30 000 kr", Konto: "2020" },
                        { Delägare: "Erik Svensson", Datum: "2026-03-31", Typ: "Uttag", Belopp: "-25 000 kr", Konto: "2010" },
                    ],
                    totals: { Delägare: "Totalt", Datum: "", Typ: "", Belopp: "-55 000 kr", Konto: "" },
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Totalt 85 000 kr i uttag och 30 000 kr insättningar hittills 2026.",
            highlights: [
                { label: "Total uttag", value: "85 000 kr", detail: "2026 hittills" },
                { label: "Total insättning", value: "30 000 kr", detail: "2026 hittills" },
                { label: "Netto", value: "-55 000 kr", detail: "Per idag" },
            ],
        },
        response,
    }
}

// ─── Möten content ────────────────────────────────────────────────────────────

function buildMoten(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Möten & Beslut",
        subtitle: "Bolagsstämmor och styrelsemöten 2026",
        blocks: [
            { type: "heading", props: { text: "Genomförda möten", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Datum", icon: "calendar" },
                        { label: "Typ", icon: "tag" },
                        { label: "Deltagare", icon: "user" },
                        { label: "Status", icon: "tag", color: "muted" as const },
                    ],
                    rows: [
                        { Datum: "2026-04-15", Typ: "Ordinarie bolagsstämma", Deltagare: "Erik Svensson, Anna Lindberg", Status: "Genomfört" },
                        { Datum: "2026-03-10", Typ: "Styrelsemöte Q1", Deltagare: "Erik Svensson, Anna Lindberg", Status: "Genomfört" },
                        { Datum: "2026-02-05", Typ: "Extra bolagsstämma", Deltagare: "Erik Svensson", Status: "Genomfört" },
                        { Datum: "2026-01-15", Typ: "Styrelsemöte jan", Deltagare: "Erik Svensson, Anna Lindberg", Status: "Genomfört" },
                    ],
                },
            },
            { type: "heading", props: { text: "Planerade möten", level: 2 } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "2026-06-10", value: "Styrelsemöte Q2 — Agenda ej fastställd" },
                        { label: "2026-09-15", value: "Extra bolagsstämma — Utdelning" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Skapa protokoll", variant: "default", actionId: "create-minutes" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "4 genomförda möten och 2 planerade. Protokoll skapade för alla genomförda.",
            highlights: [
                { label: "Genomförda möten", value: "4 st", detail: "2026" },
                { label: "Kommande", value: "2 st", detail: "Planerade" },
                { label: "Protokoll", value: "4 st", detail: "PDF skapade" },
            ],
        },
        response,
    }
}

// ─── Medlemsregister content ──────────────────────────────────────────────────

function buildMedlemsregister(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Medlemsregister",
        subtitle: "Förening · 48 totalt registrerade",
        blocks: [
            { type: "heading", props: { text: "Aktiva medlemmar (urval)", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Namn", icon: "user" },
                        { label: "E-post", icon: "file-text", color: "muted" as const },
                        { label: "Startdatum", icon: "calendar", color: "muted" as const },
                        { label: "Årsavgift", icon: "banknote" },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Namn: "Anna Svensson", "E-post": "anna@example.com", Startdatum: "2022-01-01", Årsavgift: "500 kr", Status: "Aktiv" },
                        { Namn: "Erik Larsson", "E-post": "erik@example.com", Startdatum: "2021-06-15", Årsavgift: "500 kr", Status: "Aktiv" },
                        { Namn: "Maria Johansson", "E-post": "maria@example.com", Startdatum: "2023-03-01", Årsavgift: "500 kr", Status: "Aktiv" },
                        { Namn: "Lars Persson", "E-post": "lars@example.com", Startdatum: "2020-09-01", Årsavgift: "500 kr", Status: "Aktiv" },
                        { Namn: "Sara Nilsson", "E-post": "sara@example.com", Startdatum: "2024-01-15", Årsavgift: "500 kr", Status: "Väntande" },
                        { Namn: "Johan Berg", "E-post": "johan@example.com", Startdatum: "2019-04-01", Årsavgift: "500 kr", Status: "Inaktiv" },
                        { Namn: "Emma Carlsson", "E-post": "emma@example.com", Startdatum: "2023-11-01", Årsavgift: "500 kr", Status: "Aktiv" },
                        { Namn: "Mikael Holm", "E-post": "mikael@example.com", Startdatum: "2022-08-15", Årsavgift: "500 kr", Status: "Aktiv" },
                    ],
                },
            },
            {
                type: "info-card",
                props: {
                    title: "3 medlemmar med utestående avgift",
                    content: "Sara Nilsson (väntande), Erik Karlsson, Petra Lindström. Total utestående: 1 500 kr.",
                    variant: "warning",
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Exportera register", variant: "default", actionId: "export-members" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Föreningen har 48 registrerade medlemmar — 41 aktiva, 38 med betalda avgifter.",
            highlights: [
                { label: "Totalt", value: "48 st", detail: "Registrerade" },
                { label: "Aktiva", value: "41 st", detail: "Betalande" },
                { label: "Avgifter inbetalda", value: "38 st", detail: "Av 41 aktiva" },
            ],
        },
        response,
    }
}

// ─── Plan content ─────────────────────────────────────────────────────────────

function buildPlan(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Q2 2026 — Tillväxtplan",
        subtitle: "Skapad av Scooby · 2026-04-01",
        blocks: [
            { type: "heading", props: { text: "Q2 2026 — Tillväxtplan", level: 2 } },
            { type: "annotation", props: { text: "Skapad 2026-04-01 · Senast uppdaterad 2026-04-18", variant: "muted" } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Mål", value: "Öka MRR med 40% och anställa en säljare" },
                        { label: "Tidsperiod", value: "April–Juni 2026" },
                        { label: "Ansvarig", value: "Erik Svensson" },
                    ],
                },
            },
            { type: "heading", props: { text: "Uppgifter", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Status", icon: "tag" },
                        { label: "Uppgift", icon: "file-text" },
                        { label: "Deadline", icon: "calendar", color: "muted" as const },
                    ],
                    rows: [
                        { Status: "✓", Uppgift: "Stäng bokslut Q1", Deadline: "2026-04-15" },
                        { Status: "✓", Uppgift: "Skicka momsdeklaration Q1", Deadline: "2026-05-12" },
                        { Status: "✓", Uppgift: "Betala AGI mars", Deadline: "2026-04-12" },
                        { Status: "○", Uppgift: "Publicera ny prissättning", Deadline: "2026-04-30" },
                        { Status: "○", Uppgift: "Rekrytera säljare", Deadline: "2026-05-15" },
                        { Status: "○", Uppgift: "Bolagsstämma — utdelningsbeslut", Deadline: "2026-05-20" },
                        { Status: "○", Uppgift: "Planera sommarstängt (jul)", Deadline: "2026-05-31" },
                        { Status: "○", Uppgift: "Utvärdera nya kunder Q2", Deadline: "2026-06-30" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Uppdatera plan", variant: "default", actionId: "update-plan" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Din Q2-plan har 8 uppgifter — 3 klara, 5 kvar.",
            highlights: [
                { label: "Uppgifter totalt", value: "8 st", detail: "Q2 2026" },
                { label: "Klara", value: "3 st", detail: "Slutförda" },
                { label: "Kvar", value: "5 st", detail: "Att göra" },
            ],
        },
        response,
    }
}

// ─── Kund content ─────────────────────────────────────────────────────────────

function buildKund(): { presentation: { message: string; highlights: ScoobyHighlight[] }; response: WalkthroughResponse } {
    const response: WalkthroughResponse = {
        mode: "fixed",
        title: "Acme Consulting AB",
        subtitle: "Kund · Org.nr 556789-1234",
        blocks: [
            { type: "heading", props: { text: "Kunduppgifter", level: 2 } },
            {
                type: "key-value",
                props: {
                    items: [
                        { label: "Företagsnamn", value: "Acme Consulting AB" },
                        { label: "Org.nr", value: "556789-1234" },
                        { label: "Kontaktperson", value: "Johan Persson" },
                        { label: "E-post", value: "johan.persson@acme.se" },
                        { label: "Telefon", value: "+46 70 123 45 67" },
                        { label: "Adress", value: "Storgatan 12 · 111 23 Stockholm" },
                        { label: "Kund sedan", value: "2024-01-15" },
                    ],
                },
            },
            { type: "separator", props: {} },
            { type: "heading", props: { text: "Fakturor", level: 2 } },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Fakturanr", icon: "receipt" },
                        { label: "Datum", icon: "calendar" },
                        { label: "Belopp", icon: "banknote" },
                        { label: "Förfallodatum", icon: "calendar", color: "muted" as const },
                        { label: "Status", icon: "tag" },
                    ],
                    rows: [
                        { Fakturanr: "F-2026-02", Datum: "2026-04-01", Belopp: "62 500 kr", Förfallodatum: "2026-04-30", Status: "Utestående" },
                        { Fakturanr: "F-2026-01", Datum: "2026-01-15", Belopp: "62 500 kr", Förfallodatum: "2026-02-15", Status: "Betald" },
                        { Fakturanr: "F-2025-08", Datum: "2025-08-01", Belopp: "75 000 kr", Förfallodatum: "2025-09-01", Status: "Betald" },
                        { Fakturanr: "F-2025-03", Datum: "2025-03-15", Belopp: "107 250 kr", Förfallodatum: "2025-04-15", Status: "Betald" },
                    ],
                },
            },
            {
                type: "action-bar",
                props: {
                    actions: [
                        { label: "Skapa faktura", variant: "default", actionId: "create-invoice" },
                        { label: "Stäng", variant: "outline" },
                    ],
                },
            },
        ],
    }

    return {
        presentation: {
            message: "Acme Consulting AB — aktiv kund sedan 2024. 4 fakturor totalt, 1 utestående.",
            highlights: [
                { label: "Fakturor totalt", value: "4 st", detail: "Sedan 2024" },
                { label: "Utestående", value: "62 500 kr", detail: "Förfaller 30 apr" },
                { label: "Betalt totalt", value: "244 750 kr", detail: "All tid" },
            ],
        },
        response,
    }
}

// ─── Content registry ─────────────────────────────────────────────────────────

type WalkthroughContent = {
    presentation: { message: string; highlights: ScoobyHighlight[] }
    response: WalkthroughResponse
}

function getWalkthroughContent(type: WalkthroughType): WalkthroughContent {
    switch (type) {
        case "k10": return buildK10()
        case "resultatrakning": return buildResultatrakning()
        case "balansrakning": return buildBalansrakning()
        case "momsdeklaration": return buildMomsdeklaration()
        case "egenavgifter": return buildEgenavgifter()
        case "agi": return buildAgi()
        case "transaktioner": return buildTransaktioner()
        case "fakturor": return buildFakturor()
        case "verifikationer": return buildVerifikationer()
        case "tillgangar": return buildTillgangar()
        case "handelser": return buildHandelser()
        case "lonekorning": return buildLonekorning()
        case "team": return buildTeam()
        case "formaner": return buildFormaner()
        case "aktiebok": return buildAktiebok()
        case "utdelning": return buildUtdelning()
        case "delagare": return buildDelagare()
        case "delagaruttag": return buildDelagaruttag()
        case "moten": return buildMoten()
        case "medlemsregister": return buildMedlemsregister()
        case "plan": return buildPlan()
        case "kund": return buildKund()
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface WalkthroughOverlayProps {
    type: WalkthroughType | null
    onClose: () => void
}

export function WalkthroughOverlay({ type, onClose }: WalkthroughOverlayProps) {
    const content = useMemo(() => (type ? getWalkthroughContent(type) : null), [type])

    return (
        <PageOverlay
            isOpen={type !== null}
            onClose={onClose}
            title={content?.response.title ?? ""}
            subtitle={content?.response.subtitle}
            fullContent
        >
            {content && (
                <>
                    <div className="px-6 pt-4 pb-4">
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
        </PageOverlay>
    )
}
