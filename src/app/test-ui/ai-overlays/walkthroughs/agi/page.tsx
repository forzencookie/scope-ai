"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { WalkthroughRenderer } from "@/components/ai/blocks/block-renderer"
import { ScoobyPresentation } from "@/components/ai/scooby-presentation"
import type { WalkthroughResponse, BlockProps } from "@/components/ai/blocks/types"

/**
 * Test page: AGI (Arbetsgivardeklaration) as a walkthrough overlay
 *
 * Shows provenance: each employee's individual salary components (lönearter),
 * the lönekörning they came from, and how they roll up into the AGI totals.
 * This builds trust — the user sees exactly which payroll runs and salary
 * line items produced each number on the declaration.
 *
 * Pattern: same as momsdeklaration — declaration fields trace back to source events.
 */

function fmt(n: number): string {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr"
}

function pct(n: number): string {
    return (n * 100).toFixed(2) + "%"
}

// Source data — what exists in the system (lönekörningar, lönebesked)
interface PayrollLineItem {
    löneart: string
    amount: number
    type: "earning" | "deduction" | "benefit"
}

interface EmployeePayroll {
    name: string
    personnummer: string
    payrollRunId: string
    payrollRunDate: string
    kommun: string
    skattetabell: string
    lineItems: PayrollLineItem[]
}

function buildWalkthrough(employees: EmployeePayroll[], period: string): WalkthroughResponse {
    const employerFeeRate = 0.3142

    // Derive AGI fields from source payroll data
    const employeeSummaries = employees.map((emp) => {
        const gross = emp.lineItems.filter(i => i.type === "earning").reduce((s, i) => s + i.amount, 0)
        const benefits = emp.lineItems.filter(i => i.type === "benefit").reduce((s, i) => s + i.amount, 0)
        const deductions = emp.lineItems.filter(i => i.type === "deduction").reduce((s, i) => s + i.amount, 0)
        const taxBase = gross + benefits - deductions
        // Tax from skattetabell (simplified — real tool uses municipality tax tables)
        const tax = emp.lineItems.find(i => i.löneart === "Preliminärskatt")
        const taxAmount = tax ? Math.abs(tax.amount) : Math.round(taxBase * 0.32)
        return { ...emp, gross, benefits, deductions, taxAmount }
    })

    const totalGross = employeeSummaries.reduce((s, e) => s + e.gross, 0)
    const totalBenefits = employeeSummaries.reduce((s, e) => s + e.benefits, 0)
    const totalTax = employeeSummaries.reduce((s, e) => s + e.taxAmount, 0)
    const feeBasis = totalGross + totalBenefits
    const employerFees = Math.round(feeBasis * employerFeeRate)
    const totalToPay = totalTax + employerFees

    // Fee components
    const feeComponents = [
        { name: "Sjukförsäkringsavgift", rate: 0.0355 },
        { name: "Föräldraförsäkringsavgift", rate: 0.0260 },
        { name: "Ålderspensionsavgift", rate: 0.1021 },
        { name: "Efterlevandepensionsavgift", rate: 0.0070 },
        { name: "Arbetsmarknadsavgift", rate: 0.0266 },
        { name: "Arbetsskadeavgift", rate: 0.0020 },
        { name: "Allmän löneavgift", rate: 0.1153 },
    ]

    // Build per-employee provenance blocks — each in a collapsed group
    const lineItemCount = (emp: typeof employeeSummaries[0]) =>
        emp.lineItems.filter(i => i.löneart !== "Preliminärskatt").length

    const employeeBlocks: BlockProps[] = employeeSummaries.map((emp) => ({
        type: "collapsed-group",
        props: {
            label: `${emp.name} — ${emp.personnummer} · ${emp.kommun}`,
            count: lineItemCount(emp),
            defaultOpen: false,
            children: [
                {
                    type: "annotation",
                    props: {
                        text: `Källa: Lönekörning ${emp.payrollRunId} (${emp.payrollRunDate})`,
                        variant: "muted",
                    },
                },
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

    return {
        mode: "fixed",
        title: `Arbetsgivardeklaration ${period}`,
        subtitle: `AGI individuppgift · ${employees.length} anställda · Skatteverket`,
        blocks: [
            // === PER-EMPLOYEE PROVENANCE ===
            {
                type: "heading",
                props: {
                    text: "Individuppgifter",
                    level: 2,
                    subtitle: "Lönearter per anställd — härledda från lönekörningar",
                },
            },

            // Each employee with their source line items
            ...employeeBlocks,

            // === SUMMARY TABLE ===
            {
                type: "separator",
                props: { label: "Sammanställning" },
            },
            {
                type: "financial-table",
                props: {
                    columns: [
                        { label: "Anställd", icon: "user" },
                        { label: "Bruttolön", icon: "banknote" },
                        { label: "Förmåner", icon: "gift" },
                        { label: "Avdragen skatt", icon: "receipt", color: "red" as const },
                    ],
                    rows: employeeSummaries.map((e) => ({
                        Anställd: e.name,
                        Bruttolön: fmt(e.gross),
                        Förmåner: fmt(e.benefits),
                        "Avdragen skatt": fmt(e.taxAmount),
                    })),
                    totals: {
                        Anställd: "Totalt",
                        Bruttolön: fmt(totalGross),
                        Förmåner: fmt(totalBenefits),
                        "Avdragen skatt": fmt(totalTax),
                    },
                },
            },

            // === AVGIFTSBERÄKNING ===
            {
                type: "heading",
                props: {
                    text: "Avgiftsberäkning",
                    level: 2,
                    subtitle: "SFS 2000:980 — Socialavgiftslag",
                },
            },
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
                                totals: {
                                    Avgift: "Totalt",
                                    Sats: pct(employerFeeRate),
                                    Belopp: fmt(employerFees),
                                },
                            },
                        },
                    ],
                },
            },

            // Validation
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
}

// Mock payroll data — realistic Swedish lönekörning
const MOCK_EMPLOYEES: EmployeePayroll[] = [
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

export default function TestAGIWalkthroughPage() {
    const walkthrough = useMemo(() => buildWalkthrough(MOCK_EMPLOYEES, "2026-03"), [])

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
                    message="Här är arbetsgivardeklarationen för mars. Individuppgifter härledda från lönekörningen."
                    highlights={[
                        { label: "Totalt att betala", value: "87 831 kr", detail: "Skatt + avgifter till den 12:e" },
                        { label: "Arbetsgivaravgifter", value: "44 212 kr", detail: "31.42% av underlag" },
                        { label: "Avdragen skatt", value: "43 619 kr", detail: "3 individuppgifter" },
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
