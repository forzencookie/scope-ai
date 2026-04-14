"use client"

/**
 * AI Streaming: Löner → Lönekörning
 *
 * Complete conversations with simulated streaming:
 * 1. WRITE: "Kör lönerna" (AB) — tool calls + summary + batch confirmation + AGI cascade
 * 2. WRITE: "Kör lönerna" (HB) — blocker → user provides info → Scooby completes
 * 3. READ: "Visa löneberäkning för Anna" — summary card with detail
 */

import Link from "next/link"
import { Coins, ChevronRight, Send, TrendingUp } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { CardRenderer } from "@/components/ai/card-renderer"
import { InlineCardRenderer } from "@/components/ai/cards/inline"

function WalkthroughOpenerCard({ title, subtitle, href }: { title: string; subtitle: string; href: string }) {
    return (
        <Link
            href={href}
            className="w-full max-w-md flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors group border border-border/60"
        >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-colors" />
        </Link>
    )
}

// --- Scenario 1: WRITE — AB payroll ---

const korLonerAB: SimScript = [
    { role: "user", content: "Kör lönerna för april" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Sökte bland verktyg" },
            { type: "tool", name: "calculate_salary", duration: 1800, resultLabel: "Beräknade löner" },
            { type: "tool", name: "run_payroll", duration: 2200, resultLabel: "Lönekörning klar" },
            {
                type: "stream",
                text: `**3 anställda** — april. Resultat:`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <div className="max-w-lg">
                        <CardRenderer display={{
                            type: "summary",
                            data: {
                                title: "Lönekörning april 2026",
                                items: [
                                    { label: "Bruttolöner", value: 125000 },
                                    { label: "Skatteavdrag", value: -40250 },
                                    { label: "Netto att betala", value: 84750, highlight: true },
                                    { label: "Arbetsgivaravgift (31.42%)", value: 39275 },
                                    { label: "Total kostnad", value: 164275 },
                                ],
                            },
                        }} />
                    </div>
                ),
            },
            {
                type: "card-list",
                delay: 200,
                items: [
                    <InlineCardRenderer card={{ cardType: "payroll", data: { id: "p1", employeeName: "Anna Lindberg", period: "April 2026", netAmount: 28392, status: "review" } }} />,
                    <InlineCardRenderer card={{ cardType: "payroll", data: { id: "p2", employeeName: "Johan Berg", period: "April 2026", netAmount: 31250, status: "review" } }} />,
                    <InlineCardRenderer card={{ cardType: "payroll", data: { id: "p3", employeeName: "Sara Ek", period: "April 2026", netAmount: 25108, status: "review" } }} />,
                ],
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Godkänn lönekörning",
                            description: "April 2026 — 3 anställda",
                            summary: [
                                { label: "Bruttolöner", value: "125 000 kr" },
                                { label: "Netto att betala", value: "84 750 kr" },
                                { label: "Arbetsgivaravgift", value: "39 275 kr" },
                                { label: "Utbetalningsdatum", value: "2026-04-25" },
                            ],
                            action: { toolName: "run_payroll", params: {} },
                        }}
                        confirmLabel="Godkänn & bokför"
                        icon={Coins}
                        accent="blue"
                        isDone
                        completedAction="booked"
                        completedTitle="Lönekörning april bokförd"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `**3 verifikationer** skapade (A-51–A-53). AGI april förberedd automatiskt — deadline 12 maj.`,
                speed: 11,
            },
            {
                type: "card-list",
                delay: 200,
                items: [
                    <InlineCardRenderer card={{ cardType: "payroll", data: { id: "p1", employeeName: "Anna Lindberg", period: "April 2026", netAmount: 28392, status: "paid" } }} />,
                    <InlineCardRenderer card={{ cardType: "payroll", data: { id: "p2", employeeName: "Johan Berg", period: "April 2026", netAmount: 31250, status: "paid" } }} />,
                    <InlineCardRenderer card={{ cardType: "payroll", data: { id: "p3", employeeName: "Sara Ek", period: "April 2026", netAmount: 25108, status: "paid" } }} />,
                ],
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Skicka AGI april",
                            description: "Arbetsgivardeklaration till Skatteverket",
                            summary: [
                                { label: "Period", value: "April 2026" },
                                { label: "Anställda", value: "3 st" },
                                { label: "Bruttolöner", value: "125 000 kr" },
                                { label: "Arbetsgivaravgift", value: "39 275 kr" },
                                { label: "Deadline", value: "12 maj 2026" },
                            ],
                            action: { toolName: "submit_agi", params: {} },
                        }}
                        confirmLabel="Skicka AGI"
                        icon={Send}
                        accent="blue"
                        isDone={false}
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
        ],
    },
]

// --- Scenario 2: WRITE — HB payroll with blocker → user resolves → completion ---

const korLonerHB: SimScript = [
    { role: "user", content: "Kör lönerna för mars" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Sökte bland verktyg" },
            { type: "tool", name: "calculate_salary", duration: 1500, resultLabel: "Hittade blockerare" },
            {
                type: "stream",
                text: `Kan inte köra ännu — saknas info:`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <div className="max-w-lg">
                        <CardRenderer display={{
                            type: "activityfeed",
                            data: {
                                title: "Saknad information för lönekörning",
                                description: "2 saker att lösa",
                                events: [
                                    { id: "a", action: "error", entityType: "check", title: "Erik Svensson — kommun saknas", description: "Skattesats kan inte beräknas utan kommun", timestamp: null },
                                    { id: "b", action: "warning", entityType: "check", title: "Friskvårdsbidrag — belopp ej satt", description: "Policy finns men beloppet är tomt", timestamp: null },
                                ],
                            },
                        }} />
                    </div>
                ),
            },
            {
                type: "stream",
                text: `Kan du ange vilken **kommun** Erik är skriven i? Då kan jag beräkna rätt skattesats.`,
                speed: 13,
            },
        ],
    },
    { role: "user", content: "Erik bor i Göteborg", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "lookup_municipality_tax", duration: 800, resultLabel: "Göteborg — 32.32%" },
            { type: "tool", name: "update_employee", duration: 600, resultLabel: "Erik uppdaterad" },
            { type: "tool", name: "calculate_salary", duration: 1800, resultLabel: "Beräknade löner" },
            {
                type: "stream",
                text: `Göteborgs kommunalskatt: **32.32%** — Erik uppdaterad.\nFriskvårdsbidrag låter jag vara — blockerar ej körningen.\n\nMars:`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <div className="max-w-lg">
                        <CardRenderer display={{
                            type: "summary",
                            data: {
                                title: "Lönekörning mars 2026",
                                items: [
                                    { label: "Bruttolöner", value: 95000 },
                                    { label: "Skatteavdrag", value: -30736 },
                                    { label: "Netto att betala", value: 64264, highlight: true },
                                    { label: "Arbetsgivaravgift (31.42%)", value: 29849 },
                                ],
                            },
                        }} />
                    </div>
                ),
            },
            {
                type: "stream",
                text: `Vill du godkänna lönekörningen?`,
                speed: 12,
            },
        ],
    },
    { role: "user", content: "Ja, godkänn", delay: 1800 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "run_payroll", duration: 2000, resultLabel: "Lönekörning klar" },
            {
                type: "stream",
                text: `Klart!\n- **A-47, A-48** skapade\n- Utbetalning: 25 mars`,
                speed: 11,
            },
        ],
    },
]

// --- Scenario 3: READ — Salary calculation detail ---

const visaLoneberakning: SimScript = [
    { role: "user", content: "Visa löneberäkning för Anna Lindberg" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "calculate_salary", duration: 1400, resultLabel: "Beräknade Annas lön" },
            {
                type: "stream",
                text: `**Anna Lindberg** — april:`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <div className="max-w-lg">
                        <CardRenderer display={{
                            type: "summary",
                            data: {
                                title: "Löneberäkning — Anna Lindberg, april 2026",
                                items: [
                                    { label: "Grundlön", value: 42000 },
                                    { label: "Kommunalskatt (32.41%)", value: -13612 },
                                    { label: "Nettolön", value: 28388, highlight: true },
                                    { label: "Friskvårdsbidrag", value: 5000 },
                                    { label: "Arbetsgivaravgift (31.42%)", value: 13196 },
                                    { label: "Semestertillägg (12%)", value: 5040 },
                                ],
                            },
                        }} />
                    </div>
                ),
            },
            {
                type: "stream",
                text: `Allt ser korrekt ut. Vill du godkänna eller ändra något?`,
                speed: 13,
            },
        ],
    },
    { role: "user", content: "Ser bra ut, tack!", delay: 1800 },
    {
        role: "scooby",
        elements: [
            {
                type: "stream",
                text: `Annas beräkning klar — godkänns vid lönekörning.\nVill du se någon annans?`,
                speed: 12,
            },
        ],
    },
]

// --- Page ---

export default function LonekorningStreamingPage() {
    return (
        <ScenarioPage
            title="Lönekörning"
            subtitle="Hur Scooby kör löner, beräknar skatt och hanterar AGI-cascade."
            backHref="/test-ui/ai-streaming/loner"
            backLabel="Löner"
        >
            <Scenario title="Kör lönerna (AB)" description="Skriv-scenario — full lönekörning med AGI-cascade" badges={["AB"]}>
                <SimulatedConversation script={korLonerAB} />
            </Scenario>

            <Scenario title="Kör lönerna (HB)" description="Skriv-scenario — blockerande saknad data, user resolves" badges={["HB"]}>
                <SimulatedConversation script={korLonerHB} />
            </Scenario>

            <Scenario title="Visa löneberäkning" description="Läs-scenario — detaljerad beräkning med summakort" badges={["Alla"]}>
                <SimulatedConversation script={visaLoneberakning} />
            </Scenario>
        </ScenarioPage>
    )
}
