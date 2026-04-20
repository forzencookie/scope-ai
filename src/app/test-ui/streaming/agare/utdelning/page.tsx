"use client"

/**
 * AI Streaming: Ägare → Utdelning (AB only)
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Hur mycket kan jag ta ut i utdelning?" → K10 reference + calculation
 * 2. WRITE: "Betala ut utdelning" → confirmation with tax breakdown + booking
 */

import { useState, type ComponentProps } from "react"
import { Banknote, PieChart } from "lucide-react"
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

function buildBeraknaUtdelningScript(onOpen: (type: WalkthroughType) => void): SimScript {
    return [
        { role: "user", content: "Hur mycket kan jag ta ut i utdelning?" },
        {
            role: "scooby",
            elements: [
                { type: "thinking", duration: 1000 },
                { type: "tool", name: "calculate_tax", duration: 2200, resultLabel: "K10 beräknad" },
                { type: "tool", name: "get_income_statement", duration: 1400, resultLabel: "Hämtade bolagets resultat" },
                {
                    type: "stream",
                    text: `K10-beräkning **2025** + bolagets finansiella ställning:`,
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
                                    title: "Utdelningsberäkning 2025",
                                    items: [
                                        { label: "K10-gränsbelopp", value: 187550 },
                                        { label: "Redan uttagen utdelning", value: 0 },
                                        { label: "Tillgängligt utrymme", value: 187550, highlight: true },
                                        { label: "Skatt vid max (20%)", value: 37510 },
                                        { label: "Netto vid max", value: 150040 },
                                    ],
                                },
                            }} />
                        </div>
                    ),
                },
                {
                    type: "stream",
                    text: `Du kan ta ut upp till **187 550 kr** med 20% kapitalskatt. Allt över beskattas som **tjänsteinkomst** (~50% marginalskatt).

**Scenariojämförelse:**

- **100 000 kr** → skatt 20 000 kr · netto 80 000 kr (kapital 20%)
- **150 000 kr** → skatt 30 000 kr · netto 120 000 kr (kapital 20%)
- **187 550 kr** → skatt 37 510 kr · netto 150 040 kr (kapital 20%) ← max
- **250 000 kr** → skatt 68 735 kr · netto 181 265 kr (blandad skatt)

Jag rekommenderar **187 550 kr** — det maximerar kapitalinkomst. Vill du registrera ett beslut?`,
                    speed: 11,
                },
                {
                    type: "card",
                    delay: 200,
                    content: (
                        <WalkthroughOpenerCard
                            title="K10-beräkning 2025"
                            subtitle="Gränsbelopp 187 550 kr — Utdelningsutrymme 187 550 kr"
                            icon={PieChart}
                            iconBg="bg-purple-500/10"
                            iconColor="text-purple-600 dark:text-purple-500"
                            onOpen={() => onOpen("k10")}
                        />
                    ),
                },
            ],
        },
        { role: "user", content: "Ja, registrera beslut på 187 550 kr", delay: 2500 },
        {
            role: "scooby",
            elements: [
                { type: "tool", name: "register_dividend_decision", duration: 1600, resultLabel: "Beslut registrerat" },
                { type: "tool", name: "book_transaction", duration: 1200, resultLabel: "Bokfört" },
                {
                    type: "stream",
                    text: `Klart!\n\n- **187 550 kr** beslutad utdelning\n- Verifikation **A-55** skapad\n- 2091 → 2898\n\nSäg till vid utbetalning — jag hanterar skatteavdraget.`,
                    speed: 11,
                },
            ],
        },
    ]
}

const betalaUtdelning: SimScript = [
    { role: "user", content: "Betala ut utdelning på 150 000 kr" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "calculate_tax", duration: 1800, resultLabel: "Beräknade skatt" },
            {
                type: "stream",
                text: `**150 000 kr** — inom K10-gränsbeloppet.\n- Bolaget drar 30% preliminärskatt vid utbetalning\n- Du betalar 20% slutskatt vid deklaration`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Betala ut utdelning"
                        description="150 000 kr till Anders Richnau"
                        properties={[
                            { label: "Mottagare", value: "Anders Richnau (80%)" },
                            { label: "Bruttobelopp", value: "150 000 kr" },
                            { label: "Preliminärskatt (30%)", value: "−45 000 kr" },
                            { label: "Utbetalning", value: "105 000 kr" },
                            { label: "Konto debet", value: "2898 Outtagen utdelning" },
                            { label: "Konto kredit", value: "1930 Företagskonto" },
                        ]}
                        confirmLabel="Betala ut"
                        icon={Banknote}
                        accent="green"
                        completedAction="booked"
                        completedTitle="Utdelning utbetald"
                        onCancel={() => {}}
                        triggerEvent="sim:betala-utdelning-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Betala ut", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:betala-utdelning-confirm" },
            { type: "tool", name: "pay_dividend", duration: 2000, resultLabel: "Utbetalning gjord" },
            { type: "tool", name: "book_transaction", duration: 1400, resultLabel: "Bokfört" },
            {
                type: "stream",
                text: `**105 000 kr** betalat till Anders Richnau. Verifikation **A-54** skapad.\n- Preliminärskatt 45 000 kr → konto 2710\n- Slutskatt: 20% = 30 000 kr — 15 000 kr återfås vid deklaration`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InfoCardRenderer card={{ cardType: "dividend", data: { id: "d-54", name: "Anders Richnau", amount: 150000, year: 2025 } }} />
                ),
            },
        ],
    },
]

// --- Page ---

export default function UtdelningStreamingPage() {
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)

    const beraknaScript = buildBeraknaUtdelningScript(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Utdelning"
            subtitle="Hur Scooby beräknar och betalar ut utdelning med K10-koppling."
            backHref="/test-ui/streaming/agare"
            backLabel="Ägare"
        >
            <Scenario title="Beräkna maximal utdelning" description="Läs-scenario → K10-gränsbelopp + skatteoptimering" badges={["AB"]}>
                <SimulatedConversation script={beraknaScript} />
            </Scenario>

            <Scenario title="Betala ut utdelning" description="Skriv-scenario → utbetalning med bokföring + skatteavdrag" badges={["AB"]}>
                <SimulatedConversation script={betalaUtdelning} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
