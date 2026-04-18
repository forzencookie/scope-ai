"use client"

/**
 * AI Streaming: Ägare → Aktiebok (AB only)
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Visa aktieboken" → shareholder table
 * 2. WRITE: "Registrera aktieöverlåtelse" → clarification + confirmation → done
 */

import { BookMarked } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ActionConfirmCard } from "@/components/ai/confirmations/action-confirm-card"
import { InlineCardRenderer } from "@/components/ai/cards/inline"

// --- Scenario 1: Read → show share register ---

const visaAktiebok: SimScript = [
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
        ],
    },
]

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
                    <ActionConfirmCard
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
                        isDone
                        completedAction="updated"
                        completedTitle="Aktiebok uppdaterad"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, A-aktier stämmer. Kör!", delay: 2500 },
    {
        role: "scooby",
        elements: [
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
                    <InlineCardRenderer card={{ cardType: "partner", data: { id: "sh1", name: "Anders Richnau — 700 A-aktier (70%)", sharePercent: 70 } }} />,
                    <InlineCardRenderer card={{ cardType: "partner", data: { id: "sh2", name: "Lisa Nilsson — 100 A-aktier (10%)", sharePercent: 10 } }} />,
                ],
            },
        ],
    },
]

// --- Page ---

export default function AktiebokStreamingPage() {
    return (
        <ScenarioPage
            title="Aktiebok"
            subtitle="Hur Scooby visar aktieboken och registrerar överlåtelser."
            backHref="/test-ui/streaming/agare"
            backLabel="Ägare"
        >
            <Scenario title="Visa aktieboken" description="Läs-scenario → aktieägarlista med serier" badges={["AB"]}>
                <SimulatedConversation script={visaAktiebok} />
            </Scenario>

            <Scenario title="Registrera aktieöverlåtelse" description="Skriv-scenario → överlåtelse mellan aktieägare" badges={["AB"]}>
                <SimulatedConversation script={aktieoverlatelse} />
            </Scenario>
        </ScenarioPage>
    )
}
