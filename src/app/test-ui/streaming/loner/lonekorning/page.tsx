"use client"

/**
 * AI Streaming: Löner → Lönekörning
 *
 * Complete conversations with simulated streaming:
 * 1. WRITE: "Kör lönerna" (AB) — calculate → summary → pending confirmation → user confirms → run + AGI cascade
 * 2. WRITE: "Kör lönerna" (HB) — blocker → user provides info → Scooby completes
 * 3. READ: "Visa löneberäkning för Anna" — summary card with detail
 */

import { useState, type ComponentProps } from "react"
import { Coins, Send, TrendingUp } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, useSimEvent, type SimScript } from "../../_shared/simulation"
import { ActionConfirmCard } from "@/components/ai/chat-tools/action-cards/action-confirm-card"
import { CardRenderer } from "@/components/ai/card-renderer"
import { InfoCardRenderer } from "@/components/ai/chat-tools/information-cards"
import { WalkthroughOpenerCard } from "@/components/ai/chat-tools/link-cards/walkthrough-opener-card"
import { WalkthroughOverlay, type WalkthroughType } from "@/components/ai/overlays/walkthroughs/walkthrough-overlay"

function InteractiveActionConfirmCard(
    props: Omit<ComponentProps<typeof ActionConfirmCard>, "isDone" | "onConfirm"> & { triggerEvent?: string }
) {
    const { triggerEvent, ...rest } = props
    const [clickedDone, setClickedDone] = useState(false)
    const eventTriggered = useSimEvent(triggerEvent)
    const isDone = clickedDone || eventTriggered
    return (
        <ActionConfirmCard
            {...rest}
            isDone={isDone}
            completedAction={isDone ? rest.completedAction : undefined}
            completedTitle={isDone ? rest.completedTitle : undefined}
            onConfirm={() => setClickedDone(true)}
        />
    )
}

// --- Script builders ---

function buildKorLonerABScript(onOpen: (type: WalkthroughType) => void): SimScript {
    return [
        { role: "user", content: "Kör lönerna för april" },
        {
            role: "scooby",
            elements: [
                { type: "thinking", duration: 900 },
                { type: "tool", name: "calculate_salary", duration: 1800, resultLabel: "Beräknade löner" },
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
                        <InfoCardRenderer card={{ cardType: "payroll", data: { id: "p1", employeeName: "Anna Lindberg", period: "April 2026", netAmount: 28392, status: "review" } }} />,
                        <InfoCardRenderer card={{ cardType: "payroll", data: { id: "p2", employeeName: "Johan Berg", period: "April 2026", netAmount: 31250, status: "review" } }} />,
                        <InfoCardRenderer card={{ cardType: "payroll", data: { id: "p3", employeeName: "Sara Ek", period: "April 2026", netAmount: 25108, status: "review" } }} />,
                    ],
                },
                {
                    type: "card",
                    delay: 300,
                    content: (
                        <InteractiveActionConfirmCard
                            title="Godkänn lönekörning"
                            description="April 2026 — 3 anställda"
                            properties={[
                                { label: "Bruttolöner", value: "125 000 kr" },
                                { label: "Netto att betala", value: "84 750 kr" },
                                { label: "Arbetsgivaravgift", value: "39 275 kr" },
                                { label: "Utbetalningsdatum", value: "2026-04-25" },
                            ]}
                            confirmLabel="Godkänn & bokför"
                            icon={Coins}
                            accent="blue"
                            completedAction="booked"
                            completedTitle="Lönekörning april bokförd"
                            onCancel={() => {}}
                            triggerEvent="sim:lonekörning-ab-confirm"
                        />
                    ),
                },
            ],
        },
        { role: "user", content: "Ja, godkänn & bokför!", delay: 2500 },
        {
            role: "scooby",
            elements: [
                { type: "fire-event", eventName: "sim:lonekörning-ab-confirm" },
                { type: "tool", name: "run_payroll", duration: 2200, resultLabel: "Lönekörning klar" },
                {
                    type: "stream",
                    text: `**3 verifikationer** skapade (A-51–A-53). AGI april förberedd automatiskt — deadline 12 maj.`,
                    speed: 11,
                },
                {
                    type: "card-list",
                    delay: 200,
                    items: [
                        <InfoCardRenderer card={{ cardType: "payroll", data: { id: "p1", employeeName: "Anna Lindberg", period: "April 2026", netAmount: 28392, status: "paid" } }} />,
                        <InfoCardRenderer card={{ cardType: "payroll", data: { id: "p2", employeeName: "Johan Berg", period: "April 2026", netAmount: 31250, status: "paid" } }} />,
                        <InfoCardRenderer card={{ cardType: "payroll", data: { id: "p3", employeeName: "Sara Ek", period: "April 2026", netAmount: 25108, status: "paid" } }} />,
                    ],
                },
                {
                    type: "card",
                    delay: 300,
                    content: (
                        <ActionConfirmCard
                            title="Skicka AGI april"
                            description="Arbetsgivardeklaration till Skatteverket"
                            properties={[
                                { label: "Period", value: "April 2026" },
                                { label: "Anställda", value: "3 st" },
                                { label: "Bruttolöner", value: "125 000 kr" },
                                { label: "Arbetsgivaravgift", value: "39 275 kr" },
                                { label: "Deadline", value: "12 maj 2026" },
                            ]}
                            confirmLabel="Skicka AGI"
                            icon={Send}
                            accent="blue"
                            isDone={false}
                            onConfirm={() => {}}
                            onCancel={() => {}}
                        />
                    ),
                },
                {
                    type: "card",
                    delay: 300,
                    content: (
                        <WalkthroughOpenerCard
                            title="Arbetsgivardeklaration april 2026"
                            subtitle="3 anställda · Bruttolöner 125 000 kr · Avgifter 39 275 kr"
                            icon={TrendingUp}
                            iconBg="bg-emerald-500/10"
                            iconColor="text-emerald-600 dark:text-emerald-500"
                            onOpen={() => onOpen("agi")}
                        />
                    ),
                },
            ],
        },
    ]
}

const korLonerHB: SimScript = [
    { role: "user", content: "Kör lönerna för mars" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
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
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)

    const korLonerABScript = buildKorLonerABScript(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Lönekörning"
            subtitle="Hur Scooby kör löner, beräknar skatt och hanterar AGI-cascade."
            backHref="/test-ui/streaming/loner"
            backLabel="Löner"
        >
            <Scenario title="Kör lönerna (AB)" description="Skriv-scenario — full lönekörning med AGI-cascade" badges={["AB"]}>
                <SimulatedConversation script={korLonerABScript} />
            </Scenario>

            <Scenario title="Kör lönerna (HB)" description="Skriv-scenario — blockerande saknad data, user resolves" badges={["HB"]}>
                <SimulatedConversation script={korLonerHB} />
            </Scenario>

            <Scenario title="Visa löneberäkning" description="Läs-scenario — detaljerad beräkning med summakort" badges={["Alla"]}>
                <SimulatedConversation script={visaLoneberakning} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
