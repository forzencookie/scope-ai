"use client"

/**
 * AI Streaming: Ägare → Delägare (HB/KB)
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Visa delägare" → partner overview → user confirms all good → Scooby wraps up
 * 2. WRITE: "Uppdatera ägarandelar" → confirmation → done
 */

import { Users } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ActionConfirmCard } from "@/components/ai/confirmations/action-confirm-card"
import { InfoCardRenderer } from "@/components/ai/cards/inline"

// --- Scenario 1: Read → user responds → wrap up ---

const visaDelagare: SimScript = [
    { role: "user", content: "Visa våra delägare" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "get_company_info", duration: 1200, resultLabel: "Hämtade delägarinfo" },
            {
                type: "stream",
                text: `Ert handelsbolag har **2 delägare**:

**Erik Svensson** — 60% ägarandel
- Eget kapital: **195 000 kr** · Uttag 2026: 110 000 kr

**Maria Johansson** — 40% ägarandel
- Eget kapital: **130 000 kr** · Uttag 2026: 45 000 kr

Totalt eget kapital: **325 000 kr**

Resultatet fördelas enligt ägarandelarna vid årets slut. Vill du uppdatera andelarna?`,
                speed: 11,
            },
        ],
    },
    { role: "user", content: "Nej, det ser bra ut", delay: 2000 },
    {
        role: "scooby",
        elements: [
            {
                type: "stream",
                text: `Perfekt! Allt ser korrekt ut. Resultatet för 2026 fördelas 60/40 mellan Erik och Maria som vanligt. Säg till om du behöver ändra något längre fram.`,
                speed: 12,
            },
        ],
    },
]

// --- Scenario 2: Write → update ownership ---

const uppdateraAndelar: SimScript = [
    { role: "user", content: "Ändra så att Maria äger 50% istället" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            {
                type: "stream",
                text: `Jag ändrar ägarandelar: Erik **50%** och Maria **50%**. Det påverkar resultatfördelningen framåt — befintligt eget kapital kvarstår som det är.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ActionConfirmCard
                        title="Uppdatera ägarandelar"
                        description="Ny fördelning"
                        properties={[
                            { label: "Erik Svensson", value: "60% → 50%" },
                            { label: "Maria Johansson", value: "40% → 50%" },
                            { label: "Gäller från", value: "2026-04-07" },
                            { label: "Påverkar", value: "Resultatfördelning framåt" },
                        ]}
                        confirmLabel="Uppdatera"
                        icon={Users}
                        accent="purple"
                        isDone
                        completedAction="updated"
                        completedTitle="Ägarandelar uppdaterade"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Erik och Maria äger nu 50% var. Framtida resultat fördelas lika.`,
                speed: 12,
            },
            {
                type: "card-list",
                delay: 200,
                items: [
                    <InfoCardRenderer card={{ cardType: "partner", data: { id: "p1", name: "Erik Svensson", sharePercent: 50, equity: 195000, withdrawals: 110000 } }} />,
                    <InfoCardRenderer card={{ cardType: "partner", data: { id: "p2", name: "Maria Johansson", sharePercent: 50, equity: 130000, withdrawals: 45000 } }} />,
                ],
            },
        ],
    },
]

// --- Page ---

export default function DelagareStreamingPage() {
    return (
        <ScenarioPage
            title="Delägare"
            subtitle="Hur Scooby visar och uppdaterar delägare i HB/KB."
            backHref="/test-ui/streaming/agare"
            backLabel="Ägare"
        >
            <Scenario title="Visa delägare" description="Läs-scenario → ägaröversikt → avslut" badges={["HB", "KB"]}>
                <SimulatedConversation script={visaDelagare} />
            </Scenario>

            <Scenario title="Uppdatera ägarandelar" description="Skriv-scenario → ändra fördelning" badges={["HB", "KB"]}>
                <SimulatedConversation script={uppdateraAndelar} />
            </Scenario>
        </ScenarioPage>
    )
}
