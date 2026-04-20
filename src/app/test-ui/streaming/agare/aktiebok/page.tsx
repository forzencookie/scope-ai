"use client"

/**
 * AI Streaming: Ägare → Aktiebok (AB only)
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Visa aktieboken" → shareholder table → opener card
 * 2. WRITE: "Registrera aktieöverlåtelse" → clarification + pending confirmation → user confirms → done
 */

import { useState, type ComponentProps } from "react"
import { BookMarked } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, useSimEvent, type SimScript } from "../../_shared/simulation"
import { ActionConfirmCard } from "@/components/ai/chat-tools/action-cards/action-confirm-card"
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

// --- Scenario 1: Read → show share register ---

function buildVisaAktiebokScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
    { role: "user", content: "Visa aktieboken" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "get_company_info", duration: 1400, resultLabel: "Hämtade aktieboken" },
            {
                type: "stream",
                text: `**Aktiebok** — Scope Consulting AB (559123-4567):

**Anders Richnau** (900101-1234)
- Aktier: **800 st A-aktier** (80%) · 10 röster/aktie

**Invest Partner AB** (559987-6543)
- Aktier: **200 st B-aktier** (20%) · 1 röst/aktie

Totalt **1 000 aktier** · kvotvärde 100 kr · aktiekapital **100 000 kr**

Anders har **röstmajoritet** med 89% av rösterna (8 000 av 8 200 röster).`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Aktiebok — Scope Consulting AB"
                        subtitle="1 000 aktier · 2 aktieägare · A- och B-aktier"
                        icon={BookMarked}
                        iconBg="bg-purple-500/10"
                        iconColor="text-purple-600 dark:text-purple-500"
                        onOpen={() => onOpen("aktiebok")}
                    />
                ),
            },
        ],
    },
]}

// --- Scenario 2: Write → share transfer with clarification ---

const aktieoverlatelse: SimScript = [
    { role: "user", content: "Anders säljer 100 B-aktier till Lisa Nilsson" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            { type: "tool", name: "get_company_info", duration: 1300, resultLabel: "Hämtade aktieboken" },
            {
                type: "stream",
                text: `Jag registrerar överlåtelsen. Anders har idag **800 A-aktier** — han har inga B-aktier. Menade du A-aktier, eller ska jag kontrollera om det finns en omvandlingsklausul?

Jag antar att 100 **A-aktier** ska överlåtas. Resultat efter överlåtelse:

- **Anders Richnau:** 800 → **700 A-aktier** (70%)
- **Invest Partner AB:** 200 B-aktier — oförändrat (20%)
- **Lisa Nilsson:** ny — **100 A-aktier** (10%)`,
                speed: 11,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Registrera aktieöverlåtelse"
                        description="100 A-aktier: Anders → Lisa"
                        properties={[
                            { label: "Överlåtare", value: "Anders Richnau" },
                            { label: "Förvärvare", value: "Lisa Nilsson" },
                            { label: "Antal", value: "100 st A-aktier" },
                            { label: "Kvotvärde", value: "100 kr/aktie" },
                            { label: "Överlåtelsedatum", value: "2026-04-07" },
                        ]}
                        confirmLabel="Registrera överlåtelse"
                        icon={BookMarked}
                        accent="purple"
                        completedAction="updated"
                        completedTitle="Aktiebok uppdaterad"
                        onCancel={() => {}}
                        triggerEvent="sim:aktieoverlatelse-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, A-aktier stämmer. Kör!", delay: 2500 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:aktieoverlatelse-confirm" },
            { type: "tool", name: "register_share_transfer", duration: 1800, resultLabel: "Aktieboken uppdaterad" },
            {
                type: "stream",
                text: `Lisa Nilsson: **100 A-aktier** (10%). K10 påverkas — Lisa behöver en egen K10 vid utdelning.`,
                speed: 11,
            },
            {
                type: "card-list",
                delay: 200,
                items: [
                    <InfoCardRenderer card={{ cardType: "partner", data: { id: "sh1", name: "Anders Richnau — 700 A-aktier (70%)", sharePercent: 70 } }} />,
                    <InfoCardRenderer card={{ cardType: "partner", data: { id: "sh2", name: "Lisa Nilsson — 100 A-aktier (10%)", sharePercent: 10 } }} />,
                ],
            },
        ],
    },
]

// --- Page ---

export default function AktiebokStreamingPage() {
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)
    const visaAktiebokScript = buildVisaAktiebokScript(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Aktiebok"
            subtitle="Hur Scooby visar aktieboken och registrerar överlåtelser."
            backHref="/test-ui/streaming/agare"
            backLabel="Ägare"
        >
            <Scenario title="Visa aktieboken" description="Läs-scenario → aktieägarlista med serier" badges={["AB"]}>
                <SimulatedConversation script={visaAktiebokScript} />
            </Scenario>

            <Scenario title="Registrera aktieöverlåtelse" description="Skriv-scenario → överlåtelse mellan aktieägare" badges={["AB"]}>
                <SimulatedConversation script={aktieoverlatelse} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
