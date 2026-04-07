"use client"

/**
 * AI Streaming: Bokföring → Inventarier
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Visa mina inventarier" → tool calls + markdown table + user asks to run depreciation
 * 2. WRITE: "Registrera ny inventarie" → tool calls + confirmation → done
 * 3. WRITE: "Kör avskrivning" → tool calls + confirmation → done
 */

import { Package, TrendingDown } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"

// ─── Scenario 1: READ — visa inventarier, user asks to run depreciation ───

const visaInventarier: SimScript = [
    { role: "user", content: "Vad har jag för inventarier?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            { type: "tool", name: "search_tools", duration: 500 },
            { type: "tool", name: "get_transactions", duration: 1400 },
            {
                type: "stream",
                text: `Du har **3 inventarier** med ett totalt bokfört värde på **142 500 kr**:\n\n| Inventarie | Anskaffning | Bokfört värde | Avskrivning/mån |\n|---|---|---|---|\n| MacBook Pro 16" | 32 000 kr | 24 000 kr | 889 kr |\n| Kontorsmöbler | 45 000 kr | 37 500 kr | 625 kr |\n| Projektorbild | 18 000 kr | 12 000 kr | 500 kr |\n\n**Ackumulerade avskrivningar:** 52 500 kr. Nästa avskrivning körs i april.\n\nSka jag köra avskrivningen nu, eller vill du registrera en ny inventarie?`,
                speed: 10,
            },
        ],
    },
    { role: "user", content: "Kör avskrivningen för april", delay: 2500 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "calculate_depreciation", duration: 1200 },
            {
                type: "stream",
                text: `Beräknat avskrivning för **3 inventarier** i april. Totalt **2 014 kr**.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Bokför avskrivning",
                            description: "Periodisk avskrivning april 2026",
                            summary: [
                                { label: "Inventarier", value: "3 st" },
                                { label: "Månatlig avskrivning", value: "2 014 kr" },
                                { label: "Konto debet", value: "7832 Avskrivningar inventarier" },
                                { label: "Konto kredit", value: "1229 Ack. avskrivningar" },
                                { label: "Restvärde efter", value: "140 486 kr" },
                            ],
                            action: { toolName: "book_depreciation", params: {} },
                        }}
                        confirmLabel="Bokför avskrivning"
                        icon={TrendingDown}
                        accent="indigo"
                        isDone
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Avskrivning bokförd! Verifikation **A-54** skapad — 2 014 kr debet 7832, kredit 1229.`,
                speed: 11,
            },
        ],
    },
]

// ─── Scenario 2: WRITE — registrera ny inventarie ───

const registreraInventarie: SimScript = [
    { role: "user", content: "Registrera en ny stol från IKEA för 8 500 kr" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "search_tools", duration: 500 },
            { type: "tool", name: "lookup_bas_account", duration: 1100 },
            {
                type: "stream",
                text: `Kontorsmöbler avskrivs över **5 år** (60 månader) enligt huvudregeln. Konto **1220** (Inventarier) med avskrivning på **7832** (Avskrivningar inventarier).`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Registrera inventarie",
                            description: "Kontorsstol — IKEA",
                            summary: [
                                { label: "Benämning", value: "Kontorsstol IKEA" },
                                { label: "Anskaffningsvärde", value: "8 500 kr" },
                                { label: "Konto", value: "1220 Inventarier" },
                                { label: "Avskrivningstid", value: "5 år (60 månader)" },
                                { label: "Månatlig avskrivning", value: "142 kr" },
                                { label: "Inköpsdatum", value: "2026-04-06" },
                            ],
                            action: { toolName: "create_asset", params: {} },
                        }}
                        confirmLabel="Registrera"
                        icon={Package}
                        accent="indigo"
                        isDone
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Inventarie registrerad! **Kontorsstol IKEA** tillagd med avskrivning 142 kr/månad. Verifikation **A-55** skapad — 8 500 kr debet 1220, kredit 1930.`,
                speed: 11,
            },
        ],
    },
]

// ─── Scenario 3: WRITE — kör periodisk avskrivning ───

const korAvskrivning: SimScript = [
    { role: "user", content: "Kör avskrivning för mars" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "search_tools", duration: 500 },
            { type: "tool", name: "get_transactions", duration: 1300 },
            {
                type: "stream",
                text: `Jag har beräknat avskrivning för **3 inventarier** i mars. Totalt **2 083 kr**.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Bokför avskrivning",
                            description: "Periodisk avskrivning mars 2026",
                            summary: [
                                { label: "Inventarier", value: "3 st" },
                                { label: "Månatlig avskrivning", value: "2 083 kr" },
                                { label: "Konto debet", value: "7832 Avskrivningar inventarier" },
                                { label: "Konto kredit", value: "1229 Ack. avskrivningar" },
                                { label: "Restvärde efter", value: "142 500 kr" },
                            ],
                            action: { toolName: "book_depreciation", params: {} },
                        }}
                        confirmLabel="Bokför avskrivning"
                        icon={TrendingDown}
                        accent="indigo"
                        isDone
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ser bra ut, bokför", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "book_depreciation", duration: 1800 },
            {
                type: "stream",
                text: `Avskrivning bokförd! Verifikation **A-49** skapad — 2 083 kr debet 7832, kredit 1229. Alla 3 inventarier uppdaterade med nya restvärden.`,
                speed: 11,
            },
        ],
    },
]

// ─── Page ───

export default function InventarierStreamingPage() {
    return (
        <ScenarioPage
            title="Inventarier"
            subtitle="Hur Scooby registrerar och avskriver inventarier."
            backHref="/test-ui/ai-streaming/bokforing"
            backLabel="Bokföring"
        >
            <Scenario title="Visa inventarier" description="Läs-scenario — inventarielista + avskrivning" badges={["Alla"]}>
                <SimulatedConversation script={visaInventarier} />
            </Scenario>

            <Scenario title="Registrera inventarie" description="Skriv-scenario — ny inventarie med avskrivningsplan" badges={["Alla"]}>
                <SimulatedConversation script={registreraInventarie} autoPlayDelay={2000} />
            </Scenario>

            <Scenario title="Kör avskrivning" description="Skriv-scenario — periodisk avskrivning med bekräftelse" badges={["Alla"]}>
                <SimulatedConversation script={korAvskrivning} autoPlayDelay={4000} />
            </Scenario>
        </ScenarioPage>
    )
}
