"use client"

/**
 * AI Streaming: Agare -> Aktiebok (AB only)
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Visa aktieboken" -> shareholder table
 * 2. WRITE: "Registrera aktieoverlatelse" -> clarification + confirmation -> done
 */

import { BookMarked } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"

// --- Scenario 1: Read -> show share register ---

const visaAktiebok: SimScript = [
    { role: "user", content: "Visa aktieboken" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "search_tools", duration: 500 },
            { type: "tool", name: "get_company_info", duration: 1400 },
            {
                type: "stream",
                text: `**Aktiebok** for Scope Consulting AB (559123-4567):

| Aktieagare | Personnr/Orgnr | Aktier | Andel | Serie |
|---|---|---|---|---|
| Anders Richnau | 900101-1234 | 800 | 80% | A (10 roster/aktie) |
| Invest Partner AB | 559987-6543 | 200 | 20% | B (1 rost/aktie) |

**Totalt:** 1 000 aktier | **Kvotvarde:** 100 kr/aktie | **Aktiekapital:** 100 000 kr

Anders har **rostmajoritet** med 89% av rosterna (8 000 av 8 200 roster). Bolagsordningen tillater aktier i serie A och B.`,
                speed: 11,
            },
        ],
    },
]

// --- Scenario 2: Write -> share transfer with clarification ---

const aktieoverlatelse: SimScript = [
    { role: "user", content: "Anders saljer 100 B-aktier till Lisa Nilsson" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            { type: "tool", name: "search_tools", duration: 500 },
            { type: "tool", name: "get_company_info", duration: 1300 },
            {
                type: "stream",
                text: `Jag registrerar overlatelsen. Anders har idag **800 A-aktier** — han har inga B-aktier. Menade du A-aktier, eller ska jag kontrollera om det finns en omvandlingsklausul?

Jag antar att 100 **A-aktier** ska overlatas. Resultatet:

| Aktieagare | Fore | Efter |
|---|---|---|
| Anders Richnau | 800 A-aktier (80%) | 700 A-aktier (70%) |
| Invest Partner AB | 200 B-aktier (20%) | 200 B-aktier (20%) |
| Lisa Nilsson | — | 100 A-aktier (10%) |`,
                speed: 11,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Registrera aktieoverlatelse",
                            description: "100 A-aktier: Anders -> Lisa",
                            summary: [
                                { label: "Overlatare", value: "Anders Richnau" },
                                { label: "Forvarare", value: "Lisa Nilsson" },
                                { label: "Antal", value: "100 st A-aktier" },
                                { label: "Kvotvarde", value: "100 kr/aktie" },
                                { label: "Overlatelsedatum", value: "2026-04-07" },
                            ],
                            warnings: [
                                "Kontrollera om bolagsordningen har forkopsklausul — ovriga aktieagare kan ha ratt att kopa aktierna forst.",
                                "Overlatelsen ska anmalas till Bolagsverket om det ror kvalificerade innehav.",
                            ],
                            action: { toolName: "register_share_transfer", params: {} },
                        }}
                        confirmLabel="Registrera overlatelse"
                        icon={BookMarked}
                        accent="purple"
                        isDone
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, A-aktier stammer. Kor!", delay: 2500 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "register_share_transfer", duration: 1800 },
            {
                type: "stream",
                text: `Aktieoverlatelse registrerad! Aktieboken uppdaterad. Lisa Nilsson ager nu 100 A-aktier (10%).

Kom ihag att **K10-blanketterna** paverkas — Lisa behover en egen K10 om hon tar utdelning.`,
                speed: 11,
            },
        ],
    },
]

// --- Page ---

export default function AktiebokStreamingPage() {
    return (
        <ScenarioPage
            title="Aktiebok"
            subtitle="Hur Scooby visar aktieboken och registrerar overlatelser."
            backHref="/test-ui/ai-streaming/agare"
            backLabel="Agare"
        >
            <Scenario title="Visa aktieboken" description="Las-scenario -> aktieagarlista med serier" badges={["AB"]}>
                <SimulatedConversation script={visaAktiebok} />
            </Scenario>

            <Scenario title="Registrera aktieoverlatelse" description="Skriv-scenario -> overlatelse mellan aktieagare" badges={["AB"]}>
                <SimulatedConversation script={aktieoverlatelse} autoPlayDelay={2000} />
            </Scenario>
        </ScenarioPage>
    )
}
