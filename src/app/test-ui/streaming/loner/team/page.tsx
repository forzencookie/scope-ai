"use client"

/**
 * AI Streaming: Löner → Team
 *
 * Complete conversations with simulated streaming:
 * 1. WRITE: "Lägg till en anställd" — tool calls + confirmation + missing info follow-up
 * 2. READ: "Visa mitt team" — inline payroll cards
 * 3. WRITE: "Ändra Annas kommun" — tool call + confirmation
 */

import { UserPlus, Pencil } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ActionConfirmCard } from "@/components/ai/confirmations/action-confirm-card"
import { InfoCardRenderer } from "@/components/ai/cards/inline"

// --- Scenario 1: WRITE — Add employee ---

const laggTillAnstalld: SimScript = [
    { role: "user", content: "Lägg till Lisa Nilsson som ny anställd, lön 38 000 kr/mån, Stockholm" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            {
                type: "stream",
                text: `Skapar Lisa Nilsson.\n- Kommun: **Stockholm** — kommunalskatt 30.455%`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ActionConfirmCard
                        title="Lägg till anställd"
                        description="Lisa Nilsson — ny medarbetare"
                        properties={[
                            { label: "Namn", value: "Lisa Nilsson" },
                            { label: "Personnummer", value: "Behöver anges" },
                            { label: "Grundlön", value: "38 000 kr/mån" },
                            { label: "Kommun", value: "Stockholm (30.455%)" },
                            { label: "Skattetabell", value: "Kolumn 1" },
                            { label: "Anställningsdatum", value: "2026-04-07" },
                        ]}
                        confirmLabel="Lägg till"
                        icon={UserPlus}
                        accent="green"
                        isDone
                        completedAction="created"
                        completedTitle="Lisa Nilsson tillagd"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `**Personnummer saknas** — jag behöver det innan lönekörningen. Kan du ange det?`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InfoCardRenderer card={{ cardType: "payroll", data: { id: "e-lisa", employeeName: "Lisa Nilsson", period: "Sedan apr 2026", netAmount: 26427, status: "review" } }} />
                ),
            },
        ],
    },
    { role: "user", content: "Personnummer är 960315-2845", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "update_employee", duration: 600, resultLabel: "Lisa uppdaterad" },
            {
                type: "stream",
                text: `Personnummer sparat — Lisa är redo för lönekörning.`,
                speed: 12,
            },
        ],
    },
]

// --- Scenario 2: READ — Show team ---

const visaTeamet: SimScript = [
    { role: "user", content: "Visa mitt team" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            {
                type: "stream",
                text: `**4 anställda**:`,
                speed: 12,
            },
            {
                type: "card-list",
                delay: 200,
                items: [
                    <InfoCardRenderer card={{ cardType: "payroll", data: { id: "e1", employeeName: "Anna Lindberg", period: "Sedan jan 2024", netAmount: 28392, status: "paid" } }} />,
                    <InfoCardRenderer card={{ cardType: "payroll", data: { id: "e2", employeeName: "Johan Berg", period: "Sedan mar 2024", netAmount: 31250, status: "paid" } }} />,
                    <InfoCardRenderer card={{ cardType: "payroll", data: { id: "e3", employeeName: "Sara Ek", period: "Sedan aug 2025", netAmount: 25108, status: "paid" } }} />,
                    <InfoCardRenderer card={{ cardType: "payroll", data: { id: "e4", employeeName: "Lisa Nilsson", period: "Sedan apr 2026", netAmount: 26427, status: "review" } }} />,
                ],
            },
            {
                type: "stream",
                text: `Lisa markeras "Granskas" — personnummer saknas.\nÖvriga tre: lönen betald i mars.`,
                speed: 13,
            },
        ],
    },
]

// --- Scenario 3: WRITE — Update employee ---

const uppdateraAnstalld: SimScript = [
    { role: "user", content: "Ändra Annas kommun till Solna" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            {
                type: "stream",
                text: `Ändrar **Anna Lindberg**:\n- Från: Stockholm (30.455%)\n- Till: **Solna** (30.04%)\n- Effekt: nettolön +175 kr/mån`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ActionConfirmCard
                        title="Uppdatera anställd"
                        description="Anna Lindberg — kommun"
                        properties={[
                            { label: "Anställd", value: "Anna Lindberg" },
                            { label: "Tidigare kommun", value: "Stockholm (30.455%)" },
                            { label: "Ny kommun", value: "Solna (30.04%)" },
                            { label: "Effekt", value: "Nettolönen ökar ~175 kr/mån" },
                        ]}
                        confirmLabel="Uppdatera"
                        icon={Pencil}
                        accent="blue"
                        isDone
                        completedAction="updated"
                        completedTitle="Anna Lindberg uppdaterad"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Anna → Solna. Ny skattesats används vid nästa lönekörning.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InfoCardRenderer card={{ cardType: "payroll", data: { id: "e1", employeeName: "Anna Lindberg", period: "Sedan jan 2024", netAmount: 28567, status: "review" } }} />
                ),
            },
        ],
    },
]

// --- Page ---

export default function TeamStreamingPage() {
    return (
        <ScenarioPage
            title="Team"
            subtitle="Hur Scooby lägger till anställda, visar teamet och uppdaterar uppgifter."
            backHref="/test-ui/streaming/loner"
            backLabel="Löner"
        >
            <Scenario title="Lägg till anställd" description="Skriv-scenario — ny anställd med alla uppgifter" badges={["Alla"]}>
                <SimulatedConversation script={laggTillAnstalld} />
            </Scenario>

            <Scenario title="Visa teamet" description="Läs-scenario — lista alla anställda" badges={["Alla"]}>
                <SimulatedConversation script={visaTeamet} />
            </Scenario>

            <Scenario title="Uppdatera anställd" description="Skriv-scenario — ändra kommun/uppgifter" badges={["Alla"]}>
                <SimulatedConversation script={uppdateraAnstalld} />
            </Scenario>
        </ScenarioPage>
    )
}
