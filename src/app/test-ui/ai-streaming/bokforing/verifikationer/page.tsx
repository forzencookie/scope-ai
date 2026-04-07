"use client"

/**
 * AI Streaming: Bokföring → Verifikationer
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Visa verifikationer för mars" → tool call + inline cards + user drills into one
 * 2. WRITE: "Makulera verifikation A-42" → tool calls + confirmation (amber) → done
 */

import { AlertTriangle } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { InlineCardRenderer } from "@/components/ai/cards/inline"

// ─── Scenario 1: READ — visa verifikationer, user asks for detail ───

const visaVerifikationer: SimScript = [
    { role: "user", content: "Visa verifikationer för mars" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "get_verifications", duration: 1400 },
            {
                type: "stream",
                text: `Mars hade **12 verifikationer** (A-36 till A-47). Alla balanserar. Här är de senaste:`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <div className="space-y-1">
                        <InlineCardRenderer card={{ cardType: "verification", data: { id: "v1", verificationNumber: "A-47", date: "2026-03-28", description: "Kontorshyra april", amount: 8500 } }} />
                        <InlineCardRenderer card={{ cardType: "verification", data: { id: "v2", verificationNumber: "A-46", date: "2026-03-25", description: "Kjell & Company", amount: 2499 } }} />
                        <InlineCardRenderer card={{ cardType: "verification", data: { id: "v3", verificationNumber: "A-45", date: "2026-03-22", description: "Postnord — Porto", amount: 89 } }} />
                        <InlineCardRenderer card={{ cardType: "verification", data: { id: "v4", verificationNumber: "A-44", date: "2026-03-18", description: "Spotify Business", amount: 169 } }} />
                    </div>
                ),
            },
            {
                type: "stream",
                text: `Vill du se hela listan, eller ska jag kolla en specifik verifikation?`,
                speed: 14,
            },
        ],
    },
    { role: "user", content: "Visa detaljer för A-46", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "get_verification_detail", duration: 900 },
            {
                type: "stream",
                text: `Verifikation **A-46** — Kjell & Company, bokförd 2026-03-25:\n\n| Konto | Beskrivning | Debet | Kredit |\n|---|---|---|---|\n| 5410 | Förbrukningsinventarier | 1 999,20 kr | — |\n| 2640 | Ingående moms | 499,80 kr | — |\n| 1930 | Företagskonto | — | 2 499 kr |\n\nSumma debet = Summa kredit = **2 499 kr**. Allt balanserar.`,
                speed: 10,
            },
        ],
    },
]

// ─── Scenario 2: WRITE — makulera verifikation (amber) ───

const makuleraVerifikation: SimScript = [
    { role: "user", content: "Makulera verifikation A-42, den var felaktigt bokförd" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "get_verifications", duration: 1200 },
            {
                type: "stream",
                text: `Jag hittar verifikation **A-42** — Clas Ohlson, **1 250 kr** bokförd på konto **5410** (2026-03-15). Perioden mars är fortfarande öppen, så makulering är möjlig.\n\nJag skapar en **rättelsepost** som nollställer originalet — verifikationskedjan behålls intakt.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Makulera verifikation",
                            description: "Rättelsepost nollställer A-42",
                            summary: [
                                { label: "Original", value: "A-42 — Clas Ohlson (1 250 kr)" },
                                { label: "Rättelsepost", value: "A-48 (ny verifikation)" },
                                { label: "Effekt", value: "Debet och kredit reverseras" },
                                { label: "Period", value: "Mars 2026 (öppen)" },
                            ],
                            warnings: ["En rättelsepost skapas som nollställer originalet — verifikationskedjan behålls intakt."],
                            action: { toolName: "reverse_verification", params: {} },
                        }}
                        confirmLabel="Makulera"
                        icon={AlertTriangle}
                        accent="amber"
                        isDone
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Verifikation **A-42** makulerad! Rättelsepost **A-48** skapad.\n\nOriginalet finns kvar i verifikationskedjan men är nollställt. BFL-kravet på löpande numrering uppfyllt.`,
                speed: 11,
            },
        ],
    },
]

// ─── Page ───

export default function VerifikationerStreamingPage() {
    return (
        <ScenarioPage
            title="Verifikationer"
            subtitle="Hur Scooby visar och makulerar verifikationer."
            backHref="/test-ui/ai-streaming/bokforing"
            backLabel="Bokföring"
        >
            <Scenario title="Visa verifikationer" description="Läs-scenario — verifikationslista + detaljvy" badges={["Alla"]}>
                <SimulatedConversation script={visaVerifikationer} />
            </Scenario>

            <Scenario title="Makulera verifikation" description="Skriv-scenario — rättelsepost (inte radering)" badges={["Alla"]}>
                <SimulatedConversation script={makuleraVerifikation} autoPlayDelay={2000} />
            </Scenario>
        </ScenarioPage>
    )
}
