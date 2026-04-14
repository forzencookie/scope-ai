"use client"

import { UserPlus } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"

const visaMedlemmar: SimScript = [
    { role: "user", content: "Visa våra medlemmar" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Sökte bland verktyg" },
            { type: "tool", name: "get_members", duration: 1300, resultLabel: "Hämtade 12 medlemmar" },
            {
                type: "stream",
                text: `Föreningen har **12 aktiva medlemmar**. Senaste fyra:

- Anna Karlsson — inträde 2023-01 · 500 kr · Betald
- Per Olsson — inträde 2023-03 · 500 kr · Betald
- **Karin Ström** — inträde 2024-01 · 500 kr · **Ej betald**
- Lars Bergqvist — inträde 2024-06 · 500 kr · Betald
- *…8 till*

**1 medlem** har inte betalat årsavgiften ännu (Karin Ström). Vill du att jag skickar en påminnelse?`,
                speed: 10,
            },
        ],
    },
    { role: "user", content: "Ja, skicka en påminnelse till Karin", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "send_reminder", duration: 900, resultLabel: "Påminnelse skickad" },
            {
                type: "stream",
                text: `Klart — Karin Ström får ett mejl om årsavgiften 500 kr.`,
                speed: 12,
            },
        ],
    },
]

const laggTillMedlem: SimScript = [
    { role: "user", content: "Lägg till Sofia Andersson som ny medlem" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Sökte bland verktyg" },
            {
                type: "stream",
                text: `Jag lägger till Sofia Andersson i medlemsregistret. Årsavgiften är **500 kr** enligt stadgarna.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Lägg till medlem",
                            description: "Sofia Andersson",
                            summary: [
                                { label: "Namn", value: "Sofia Andersson" },
                                { label: "Inträdesdatum", value: "2026-04-07" },
                                { label: "Årsavgift", value: "500 kr" },
                                { label: "Status", value: "Ej betald (ny)" },
                            ],
                            action: { toolName: "add_member", params: {} },
                        }}
                        confirmLabel="Lägg till"
                        icon={UserPlus}
                        accent="green"
                        isDone
                        completedAction="created"
                        completedTitle="Sofia Andersson registrerad"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Föreningen har nu **13 aktiva medlemmar**.`,
                speed: 12,
            },
        ],
    },
]

export default function MedlemsregisterStreamingPage() {
    return (
        <ScenarioPage
            title="Medlemsregister"
            subtitle="Hur Scooby hanterar medlemsregistret i en förening."
            backHref="/test-ui/ai-streaming/agare"
            backLabel="Ägare"
        >
            <Scenario title="Visa medlemslistan" description="Läs-scenario — register över aktiva medlemmar" badges={["Förening"]}>
                <SimulatedConversation script={visaMedlemmar} />
            </Scenario>

            <Scenario title="Lägg till medlem" description="Skriv-scenario — ny medlem i registret" badges={["Förening"]}>
                <SimulatedConversation script={laggTillMedlem} />
            </Scenario>
        </ScenarioPage>
    )
}
