"use client"

/**
 * AI Streaming: Loner -> Lonekörning
 *
 * Complete conversations with simulated streaming:
 * 1. WRITE: "Kor lonerna" (AB) — tool calls + summary + batch confirmation + AGI cascade
 * 2. WRITE: "Kor lonerna" (HB) — blocker → user provides info → Scooby completes
 * 3. READ: "Visa loneberakning for Anna" — summary card with detail
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
    { role: "user", content: "Kor lonerna for april" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            { type: "tool", name: "search_tools", duration: 500 },
            { type: "tool", name: "calculate_salary", duration: 1800 },
            { type: "tool", name: "run_payroll", duration: 2200 },
            {
                type: "stream",
                text: `Jag har beraknat loner for **3 anstallda** i april. Har ar resultatet:`,
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
                                title: "Lonekörning april 2026",
                                items: [
                                    { label: "Bruttoloner", value: 125000 },
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
                type: "card",
                delay: 200,
                content: (
                    <div className="space-y-1">
                        <InlineCardRenderer card={{ cardType: "payroll", data: { id: "p1", employeeName: "Anna Lindberg", period: "April 2026", netAmount: 28392, status: "review" } }} />
                        <InlineCardRenderer card={{ cardType: "payroll", data: { id: "p2", employeeName: "Johan Berg", period: "April 2026", netAmount: 31250, status: "review" } }} />
                        <InlineCardRenderer card={{ cardType: "payroll", data: { id: "p3", employeeName: "Sara Ek", period: "April 2026", netAmount: 25108, status: "review" } }} />
                    </div>
                ),
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Godkann lonekörning",
                            description: "April 2026 — 3 anstallda",
                            summary: [
                                { label: "Bruttoloner", value: "125 000 kr" },
                                { label: "Netto att betala", value: "84 750 kr" },
                                { label: "Arbetsgivaravgift", value: "39 275 kr" },
                                { label: "Utbetalningsdatum", value: "2026-04-25" },
                            ],
                            action: { toolName: "run_payroll", params: {} },
                        }}
                        confirmLabel="Godkann & bokfor"
                        icon={Coins}
                        accent="blue"
                        isDone
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Loner godkanda! **3 verifikationer** skapade (A-51 till A-53).\n\n**Cascade:** AGI april forberedd automatiskt — arbetsgivardeklaration klar att skicka till Skatteverket senast 12 maj.`,
                speed: 11,
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
                                { label: "Anstallda", value: "3 st" },
                                { label: "Bruttoloner", value: "125 000 kr" },
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
    { role: "user", content: "Kor lonerna for mars" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "search_tools", duration: 500 },
            { type: "tool", name: "calculate_salary", duration: 1500 },
            {
                type: "stream",
                text: `Jag kan inte kora lonerna annu — det saknas information:`,
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
                                title: "Saknad information for lonekörning",
                                description: "2 saker att losa",
                                events: [
                                    { id: "a", action: "error", entityType: "check", title: "Erik Svensson — kommun saknas", description: "Skattesats kan inte beraknas utan kommun", timestamp: null },
                                    { id: "b", action: "warning", entityType: "check", title: "Friskvardsbidrag — belopp ej satt", description: "Policy finns men beloppet ar tomt", timestamp: null },
                                ],
                            },
                        }} />
                    </div>
                ),
            },
            {
                type: "stream",
                text: `Kan du ange vilken **kommun** Erik ar skriven i? Da kan jag berakna ratt skattesats.`,
                speed: 13,
            },
        ],
    },
    { role: "user", content: "Erik bor i Goteborg", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "lookup_municipality_tax", duration: 800 },
            { type: "tool", name: "update_employee", duration: 600 },
            { type: "tool", name: "calculate_salary", duration: 1800 },
            {
                type: "stream",
                text: `Tack! Goteborgs kommun har kommunalskatt **32.32%**. Erik ar uppdaterad.\n\nFriskvardsbidragspolicyn later jag vara tills vidare — det blockerar inte lonekörningen.\n\nHar ar resultatet for mars:`,
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
                                title: "Lonekörning mars 2026",
                                items: [
                                    { label: "Bruttoloner", value: 95000 },
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
                text: `Vill du godkanna lonekörningen?`,
                speed: 12,
            },
        ],
    },
    { role: "user", content: "Ja, godkann", delay: 1800 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "run_payroll", duration: 2000 },
            {
                type: "stream",
                text: `Lonekörning mars godkand! **2 verifikationer** skapade (A-47, A-48). Utbetalning satt till 25 mars.`,
                speed: 11,
            },
        ],
    },
]

// --- Scenario 3: READ — Salary calculation detail ---

const visaLoneberakning: SimScript = [
    { role: "user", content: "Visa loneberakning for Anna Lindberg" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "calculate_salary", duration: 1400 },
            {
                type: "stream",
                text: `Har ar loneberakningen for **Anna Lindberg** i april:`,
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
                                title: "Loneberakning — Anna Lindberg, april 2026",
                                items: [
                                    { label: "Grundlon", value: 42000 },
                                    { label: "Kommunalskatt (32.41%)", value: -13612 },
                                    { label: "Nettolon", value: 28388, highlight: true },
                                    { label: "Friskvardsbidrag", value: 5000 },
                                    { label: "Arbetsgivaravgift (31.42%)", value: 13196 },
                                    { label: "Semestertillagg (12%)", value: 5040 },
                                ],
                            },
                        }} />
                    </div>
                ),
            },
            {
                type: "stream",
                text: `Allt ser korrekt ut. Vill du godkanna eller andra nagot?`,
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
                text: `Perfekt! Annas loneberakning ar klar for godkannande nar du kor lonerna. Sag till om du vill se nagon annans berakning.`,
                speed: 12,
            },
        ],
    },
]

// --- Page ---

export default function LonekorningStreamingPage() {
    return (
        <ScenarioPage
            title="Lonekörning"
            subtitle="Hur Scooby kor loner, beraknar skatt och hanterar AGI-cascade."
            backHref="/test-ui/ai-streaming/loner"
            backLabel="Loner"
        >
            <Scenario title="Kor lonerna (AB)" description="Skriv-scenario — full lonekörning med AGI-cascade" badges={["AB"]}>
                <SimulatedConversation script={korLonerAB} />
            </Scenario>

            <Scenario title="Kor lonerna (HB)" description="Skriv-scenario — blockerande saknad data, user resolves" badges={["HB"]}>
                <SimulatedConversation script={korLonerHB} autoPlayDelay={2000} />
            </Scenario>

            <Scenario title="Visa loneberakning" description="Las-scenario — detaljerad berakning med summakort" badges={["Alla"]}>
                <SimulatedConversation script={visaLoneberakning} autoPlayDelay={4000} />
            </Scenario>
        </ScenarioPage>
    )
}
