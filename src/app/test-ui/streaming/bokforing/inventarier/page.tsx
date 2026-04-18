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
import { ActionConfirmCard } from "@/components/ai/confirmations/action-confirm-card"
import { InlineCardRenderer } from "@/components/ai/cards/inline"

// ─── Scenario 1: READ — visa inventarier, user asks to run depreciation ───

const visaInventarier: SimScript = [
    { role: "user", content: "Vad har jag för inventarier?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            { type: "tool", name: "get_transactions", duration: 1400, resultLabel: "Hämtade 3 inventarier" },
            {
                type: "stream",
                text: `**3 inventarier** — bokfört värde totalt **142 500 kr**.\n\n- MacBook Pro 16" — anskaffning 32 000 kr · bokfört **24 000 kr** · 889 kr/mån\n- Kontorsmöbler — anskaffning 45 000 kr · bokfört **37 500 kr** · 625 kr/mån\n- Projektorbild — anskaffning 18 000 kr · bokfört **12 000 kr** · 500 kr/mån\n\n- Ackumulerade avskrivningar: **52 500 kr**\n- Nästa avskrivning: april\n\nKör nu, eller registrera ny inventarie?`,
                speed: 10,
            },
        ],
    },
    { role: "user", content: "Kör avskrivningen för april", delay: 2500 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "calculate_depreciation", duration: 1200, resultLabel: "Beräknade avskrivningar" },
            {
                type: "stream",
                text: `April — **3 inventarier**, totalt **2 014 kr**.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ActionConfirmCard
                        title="Bokför avskrivning"
                        description="Periodisk avskrivning april 2026"
                        properties={[
                            { label: "Inventarier", value: "3 st" },
                            { label: "Månatlig avskrivning", value: "2 014 kr" },
                            { label: "Konto debet", value: "7832 Avskrivningar inventarier" },
                            { label: "Konto kredit", value: "1229 Ack. avskrivningar" },
                            { label: "Restvärde efter", value: "140 486 kr" },
                        ]}
                        confirmLabel="Bokför avskrivning"
                        icon={TrendingDown}
                        accent="indigo"
                        isDone
                        completedAction="booked"
                        completedTitle="Avskrivning bokförd"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Verifikation **A-54** skapad — 2 014 kr → debet 7832, kredit 1229.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InlineCardRenderer card={{ cardType: "verification", data: { id: "v-54", verificationNumber: "A-54", date: "2026-04-30", description: "Avskrivning april 2026", amount: 2014 } }} />
                ),
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
            { type: "tool", name: "lookup_bas_account", duration: 1100, resultLabel: "Hittade konto 1220" },
            {
                type: "stream",
                text: `Kontorsmöbler — avskrivs **5 år** (60 mån), huvudregeln.\n\n- Konto: **1220** Inventarier\n- Avskrivning: **7832**\n- Månatlig: **142 kr**`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ActionConfirmCard
                        title="Registrera inventarie"
                        description="Kontorsstol — IKEA"
                        properties={[
                            { label: "Benämning", value: "Kontorsstol IKEA" },
                            { label: "Anskaffningsvärde", value: "8 500 kr" },
                            { label: "Konto", value: "1220 Inventarier" },
                            { label: "Avskrivningstid", value: "5 år (60 månader)" },
                            { label: "Månatlig avskrivning", value: "142 kr" },
                            { label: "Inköpsdatum", value: "2026-04-06" },
                        ]}
                        confirmLabel="Registrera"
                        icon={Package}
                        accent="indigo"
                        isDone
                        completedAction="created"
                        completedTitle="Inventarie registrerad"
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `**Kontorsstol IKEA** tillagd — avskrivning 142 kr/mån. Verifikation **A-55** skapad.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InlineCardRenderer card={{ cardType: "asset", data: { id: "ast-new", name: "Kontorsstol IKEA", acquisitionValue: 8500, bookValue: 8500, depreciationPerMonth: 142 } }} />
                ),
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
            { type: "tool", name: "get_transactions", duration: 1300, resultLabel: "Hämtade 3 inventarier" },
            {
                type: "stream",
                text: `Mars — **3 inventarier**, totalt **2 083 kr**.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ActionConfirmCard
                        title="Bokför avskrivning"
                        description="Periodisk avskrivning mars 2026"
                        properties={[
                            { label: "Inventarier", value: "3 st" },
                            { label: "Månatlig avskrivning", value: "2 083 kr" },
                            { label: "Konto debet", value: "7832 Avskrivningar inventarier" },
                            { label: "Konto kredit", value: "1229 Ack. avskrivningar" },
                            { label: "Restvärde efter", value: "142 500 kr" },
                        ]}
                        confirmLabel="Bokför avskrivning"
                        icon={TrendingDown}
                        accent="indigo"
                        isDone
                        completedAction="booked"
                        completedTitle="Avskrivning mars bokförd"
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
            { type: "tool", name: "book_depreciation", duration: 1800, resultLabel: "Bokförde avskrivning" },
            {
                type: "stream",
                text: `Verifikation **A-49** skapad — 2 083 kr → debet 7832, kredit 1229. Alla 3 inventarier uppdaterade.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InlineCardRenderer card={{ cardType: "verification", data: { id: "v-49", verificationNumber: "A-49", date: "2026-03-31", description: "Avskrivning mars 2026", amount: 2083 } }} />
                ),
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
            backHref="/test-ui/streaming/bokforing"
            backLabel="Bokföring"
        >
            <Scenario title="Visa inventarier" description="Läs-scenario — inventarielista + avskrivning" badges={["Alla"]}>
                <SimulatedConversation script={visaInventarier} />
            </Scenario>

            <Scenario title="Registrera inventarie" description="Skriv-scenario — ny inventarie med avskrivningsplan" badges={["Alla"]}>
                <SimulatedConversation script={registreraInventarie} />
            </Scenario>

            <Scenario title="Kör avskrivning" description="Skriv-scenario — periodisk avskrivning med bekräftelse" badges={["Alla"]}>
                <SimulatedConversation script={korAvskrivning} />
            </Scenario>
        </ScenarioPage>
    )
}
