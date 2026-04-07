"use client"

/**
 * AI Streaming: Loner -> Team
 *
 * Complete conversations with simulated streaming:
 * 1. WRITE: "Lagg till en anstalld" — tool calls + confirmation + missing info follow-up
 * 2. READ: "Visa mitt team" — inline payroll cards
 * 3. WRITE: "Andra Annas kommun" — tool call + confirmation
 */

import { UserPlus, Pencil } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { InlineCardRenderer } from "@/components/ai/cards/inline"

// --- Scenario 1: WRITE — Add employee ---

const laggTillAnstalld: SimScript = [
    { role: "user", content: "Lagg till Lisa Nilsson som ny anstalld, lon 38 000 kr/man, Stockholm" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "search_tools", duration: 500 },
            {
                type: "stream",
                text: `Jag skapar en ny anstalld. Jag hamtar skattesats for **Stockholms kommun** (kommunalskatt 30.455%).`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Lagg till anstalld",
                            description: "Lisa Nilsson — ny medarbetare",
                            summary: [
                                { label: "Namn", value: "Lisa Nilsson" },
                                { label: "Personnummer", value: "Behover anges" },
                                { label: "Grundlon", value: "38 000 kr/man" },
                                { label: "Kommun", value: "Stockholm (30.455%)" },
                                { label: "Skattetabell", value: "Kolumn 1" },
                                { label: "Anstallningsdatum", value: "2026-04-06" },
                            ],
                            action: { toolName: "create_employee", params: {} },
                        }}
                        confirmLabel="Lagg till"
                        icon={UserPlus}
                        accent="green"
                        isDone
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Lisa Nilsson tillagd!\n\n**Personnummer saknas** — jag behover det innan lonekörningen. Kan du ange det?`,
                speed: 12,
            },
        ],
    },
    { role: "user", content: "Personnummer ar 960315-2845", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "update_employee", duration: 600 },
            {
                type: "stream",
                text: `Personnummer registrerat for Lisa Nilsson. Hon ar nu redo for lonekörning.`,
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
            { type: "tool", name: "search_tools", duration: 400 },
            {
                type: "stream",
                text: `Du har **4 anstallda** i teamet:`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <div className="space-y-1">
                        <InlineCardRenderer card={{ cardType: "payroll", data: { id: "e1", employeeName: "Anna Lindberg", period: "Sedan jan 2024", netAmount: 28392, status: "paid" } }} />
                        <InlineCardRenderer card={{ cardType: "payroll", data: { id: "e2", employeeName: "Johan Berg", period: "Sedan mar 2024", netAmount: 31250, status: "paid" } }} />
                        <InlineCardRenderer card={{ cardType: "payroll", data: { id: "e3", employeeName: "Sara Ek", period: "Sedan aug 2025", netAmount: 25108, status: "paid" } }} />
                        <InlineCardRenderer card={{ cardType: "payroll", data: { id: "e4", employeeName: "Lisa Nilsson", period: "Sedan apr 2026", netAmount: 26427, status: "review" } }} />
                    </div>
                ),
            },
            {
                type: "stream",
                text: `Lisa Nilsson markeras som "Granskas" — personnummer saknas annu. Ovriga tre fick senaste lonen i mars.`,
                speed: 13,
            },
        ],
    },
]

// --- Scenario 3: WRITE — Update employee ---

const uppdateraAnstalld: SimScript = [
    { role: "user", content: "Andra Annas kommun till Solna" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            { type: "tool", name: "search_tools", duration: 400 },
            {
                type: "stream",
                text: `Jag andrar kommun for **Anna Lindberg** fran Stockholm till **Solna** (kommunalskatt 30.04%). Det paverkar framtida loneberakningar.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Uppdatera anstalld",
                            description: "Anna Lindberg — kommun",
                            summary: [
                                { label: "Anstalld", value: "Anna Lindberg" },
                                { label: "Tidigare kommun", value: "Stockholm (30.455%)" },
                                { label: "Ny kommun", value: "Solna (30.04%)" },
                                { label: "Effekt", value: "Nettolonen okar ~175 kr/man" },
                            ],
                            action: { toolName: "update_employee", params: {} },
                        }}
                        confirmLabel="Uppdatera"
                        icon={Pencil}
                        accent="blue"
                        isDone
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Uppdaterat! Anna Lindbergs kommun andrad till Solna. Nasta lonekörning anvander den nya skattesatsen.`,
                speed: 12,
            },
        ],
    },
]

// --- Page ---

export default function TeamStreamingPage() {
    return (
        <ScenarioPage
            title="Team"
            subtitle="Hur Scooby lagger till anstallda, visar teamet och uppdaterar uppgifter."
            backHref="/test-ui/ai-streaming/loner"
            backLabel="Loner"
        >
            <Scenario title="Lagg till anstalld" description="Skriv-scenario — ny anstalld med alla uppgifter" badges={["Alla"]}>
                <SimulatedConversation script={laggTillAnstalld} />
            </Scenario>

            <Scenario title="Visa teamet" description="Las-scenario — lista alla anstallda" badges={["Alla"]}>
                <SimulatedConversation script={visaTeamet} autoPlayDelay={2000} />
            </Scenario>

            <Scenario title="Uppdatera anstalld" description="Skriv-scenario — andra kommun/uppgifter" badges={["Alla"]}>
                <SimulatedConversation script={uppdateraAnstalld} autoPlayDelay={4000} />
            </Scenario>
        </ScenarioPage>
    )
}
