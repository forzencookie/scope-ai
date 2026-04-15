"use client"

/**
 * AI Streaming: Agare -> Delagare (HB/KB)
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Visa delagare" -> partner overview -> user confirms all good -> Scooby wraps up
 * 2. WRITE: "Uppdatera agarandelar" -> confirmation -> done
 */

import { Users } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { InlineCardRenderer } from "@/components/ai/cards/inline"

// --- Scenario 1: Read -> user responds -> wrap up ---

const visaDelagare: SimScript = [
    { role: "user", content: "Visa vara delagare" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Sökte bland verktyg" },
            { type: "tool", name: "get_company_info", duration: 1200, resultLabel: "Hämtade delägarinfo" },
            {
                type: "stream",
                text: `Ert handelsbolag har **2 delagare**:

**Erik Svensson** — 60% ägarandel
- Eget kapital: **195 000 kr** · Uttag 2026: 110 000 kr

**Maria Johansson** — 40% ägarandel
- Eget kapital: **130 000 kr** · Uttag 2026: 45 000 kr

Totalt eget kapital: **325 000 kr**

Resultatet fordelas enligt ägarandelarna vid årets slut. Vill du uppdatera andelarna?`,
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
                text: `Perfekt! Allt ser korrekt ut. Resultatet for 2026 fordelas 60/40 mellan Erik och Maria som vanligt. Sag till om du behover andra nagot langre fram.`,
                speed: 12,
            },
        ],
    },
]

// --- Scenario 2: Write -> update ownership ---

const uppdateraAndelar: SimScript = [
    { role: "user", content: "Andra sa att Maria ager 50% istallet" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Sökte bland verktyg" },
            {
                type: "stream",
                text: `Jag andrar agarandelar: Erik **50%** och Maria **50%**. Det paverkar resultatfordelningen framat — befintligt eget kapital kvarstar som det ar.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Uppdatera agarandelar",
                            description: "Ny fordelning",
                            summary: [
                                { label: "Erik Svensson", value: "60% -> 50%" },
                                { label: "Maria Johansson", value: "40% -> 50%" },
                                { label: "Galler fran", value: "2026-04-07" },
                                { label: "Paverkar", value: "Resultatfordelning framat" },
                            ],
                            warnings: ["Agarandelar i HB/KB styr hur resultatet beskattas. Sakerstall att andringen speglar bolagsavtalet."],
                            action: { toolName: "update_ownership", params: {} },
                        }}
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
                    <InlineCardRenderer card={{ cardType: "partner", data: { id: "p1", name: "Erik Svensson", sharePercent: 50, equity: 195000, withdrawals: 110000 } }} />,
                    <InlineCardRenderer card={{ cardType: "partner", data: { id: "p2", name: "Maria Johansson", sharePercent: 50, equity: 130000, withdrawals: 45000 } }} />,
                ],
            },
        ],
    },
]

// --- Page ---

export default function DelagareStreamingPage() {
    return (
        <ScenarioPage
            title="Delagare"
            subtitle="Hur Scooby visar och uppdaterar delagare i HB/KB."
            backHref="/test-ui/streaming/agare"
            backLabel="Agare"
        >
            <Scenario title="Visa delagare" description="Las-scenario -> agaroversikt -> avslut" badges={["HB", "KB"]}>
                <SimulatedConversation script={visaDelagare} />
            </Scenario>

            <Scenario title="Uppdatera agarandelar" description="Skriv-scenario -> andra fordelning" badges={["HB", "KB"]}>
                <SimulatedConversation script={uppdateraAndelar} />
            </Scenario>
        </ScenarioPage>
    )
}
