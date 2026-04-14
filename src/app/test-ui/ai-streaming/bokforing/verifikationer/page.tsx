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
            { type: "tool", name: "get_verifications", duration: 1400, resultLabel: "Hämtade 12 verifikationer" },
            {
                type: "stream",
                text: `Mars — **12 verifikationer** (A-36 till A-47). Alla balanserar.\n\nSenaste fyra:`,
                speed: 12,
            },
            {
                type: "card-list",
                delay: 200,
                items: [
                    <InlineCardRenderer card={{ cardType: "verification", data: { id: "v1", verificationNumber: "A-47", date: "2026-03-28", description: "Kontorshyra april", amount: 8500 } }} />,
                    <InlineCardRenderer card={{ cardType: "verification", data: { id: "v2", verificationNumber: "A-46", date: "2026-03-25", description: "Kjell & Company", amount: 2499 } }} />,
                    <InlineCardRenderer card={{ cardType: "verification", data: { id: "v3", verificationNumber: "A-45", date: "2026-03-22", description: "Postnord — Porto", amount: 89 } }} />,
                    <InlineCardRenderer card={{ cardType: "verification", data: { id: "v4", verificationNumber: "A-44", date: "2026-03-18", description: "Spotify Business", amount: 169 } }} />,
                ],
            },
            {
                type: "stream",
                text: `Vill du se hela listan, eller kolla en specifik?`,
                speed: 14,
            },
        ],
    },
    { role: "user", content: "Visa detaljer för A-46", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "get_verification_detail", duration: 900, resultLabel: "Hämtade A-46" },
            {
                type: "stream",
                text: `**A-46** — Kjell & Company\n- Datum: 2026-03-25\n\n- **5410** Förbrukningsinventarier — debet 1 999,20 kr\n- **2640** Ingående moms — debet 499,80 kr\n- **1930** Företagskonto — kredit 2 499 kr\n\nDebet = Kredit = **2 499 kr** — balanserar.`,
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
            { type: "tool", name: "get_verifications", duration: 1200, resultLabel: "Hämtade A-42" },
            {
                type: "stream",
                text: `Hittade **A-42** — Clas Ohlson.\n\n- Belopp: **1 250 kr**\n- Konto: **5410**\n- Datum: 2026-03-15\n- Period: Mars — öppen, makulering möjlig\n\nSkapar en **rättelsepost** som nollställer originalet. Verifikationskedjan behålls intakt.`,
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
                text: `Klart!\n\n- **A-42** makulerad\n- **A-48** skapad (rättelsepost)\n- Originalet nollställt — kedjan intakt\n- BFL-kravet uppfyllt`,
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
                <SimulatedConversation script={makuleraVerifikation} />
            </Scenario>
        </ScenarioPage>
    )
}
