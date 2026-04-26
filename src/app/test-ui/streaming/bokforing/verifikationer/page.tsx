"use client"

/**
 * AI Streaming: Bokföring → Verifikationer
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Visa verifikationer för mars" → tool call + inline cards + opener + user drills into one
 * 2. WRITE: "Makulera verifikation A-42" → pending confirmation → user confirms → done
 */

import { useState, type ComponentProps } from "react"
import { AlertTriangle, FileText } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, useSimEvent, type SimScript } from "../../_shared/simulation"
import { ActionConfirmCard } from "@/components/ai/cards/action-cards/action-confirm-card"
import { Block } from "@/components/ai/cards/rows/block"
import { WalkthroughOpenerCard } from "@/components/ai/cards/link-cards/walkthrough-opener-card"
import { WalkthroughOverlay, type WalkthroughType } from "@/components/ai/overlays/walkthroughs/walkthrough-overlay"

function InteractiveActionConfirmCard(
    props: Omit<ComponentProps<typeof ActionConfirmCard>, "isDone" | "onConfirm"> & { triggerEvent?: string }
) {
    const { triggerEvent, ...rest } = props
    const [clickedDone, setClickedDone] = useState(false)
    const eventTriggered = useSimEvent(triggerEvent)
    const isDone = clickedDone || eventTriggered
    return (
        <ActionConfirmCard
            {...rest}
            isDone={isDone}
            completedAction={isDone ? rest.completedAction : undefined}
            completedTitle={isDone ? rest.completedTitle : undefined}
            onConfirm={() => setClickedDone(true)}
        />
    )
}

// ─── Scenario 1: READ — visa verifikationer, user asks for detail ───

function buildVisaVerifikationerScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
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
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [
                        { icon: "verification", title: "Kontorshyra april", description: "A-47", amount: 8500, timestamp: "2026-03-28" },
                        { icon: "verification", title: "Kjell & Company",   description: "A-46", amount: 2499, timestamp: "2026-03-25" },
                        { icon: "verification", title: "Postnord — Porto",  description: "A-45", amount: 89,   timestamp: "2026-03-22" },
                        { icon: "verification", title: "Spotify Business",  description: "A-44", amount: 169,  timestamp: "2026-03-18" },
                    ]}} />
                ),
            },
            {
                type: "stream",
                text: `Vill du se hela listan, eller kolla en specifik?`,
                speed: 14,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Verifikationer mars 2026"
                        subtitle="12 verifikationer · A-36 till A-47 · Alla balanserar"
                        icon={FileText}
                        iconBg="bg-blue-500/10"
                        iconColor="text-blue-600 dark:text-blue-500"
                        onOpen={() => onOpen("verifikationer")}
                    />
                ),
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
]}

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
                    <InteractiveActionConfirmCard
                        title="Makulera verifikation"
                        description="Rättelsepost nollställer A-42"
                        properties={[
                            { label: "Original", value: "A-42 — Clas Ohlson (1 250 kr)" },
                            { label: "Rättelsepost", value: "A-48 (ny verifikation)" },
                            { label: "Effekt", value: "Debet och kredit reverseras" },
                            { label: "Period", value: "Mars 2026 (öppen)" },
                        ]}
                        confirmLabel="Makulera"
                        icon={AlertTriangle}
                        accent="amber"
                        completedAction="deleted"
                        completedTitle="Verifikation A-42 makulerad"
                        onCancel={() => {}}
                        triggerEvent="sim:makulera-verifikation-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, makulera", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:makulera-verifikation-confirm" },
            { type: "tool", name: "void_verification", duration: 1400, resultLabel: "A-42 makulerad" },
            {
                type: "stream",
                text: `**A-42** makulerad — rättelsepost **A-48** skapad. Kedjan intakt, BFL-kravet uppfyllt.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [{ icon: "verification", title: "Rättelsepost — makulering A-42", description: "A-48", amount: 1250, timestamp: "2026-03-28" }] }} />
                ),
            },
        ],
    },
]

// ─── Page ───

export default function VerifikationerStreamingPage() {
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)
    const visaVerifikationerScript = buildVisaVerifikationerScript(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Verifikationer"
            subtitle="Hur Scooby visar och makulerar verifikationer."
            backHref="/test-ui/streaming/bokforing"
            backLabel="Bokföring"
        >
            <Scenario title="Visa verifikationer" description="Läs-scenario — verifikationslista + detaljvy" badges={["Alla"]}>
                <SimulatedConversation script={visaVerifikationerScript} />
            </Scenario>

            <Scenario title="Makulera verifikation" description="Skriv-scenario — rättelsepost (inte radering)" badges={["Alla"]}>
                <SimulatedConversation script={makuleraVerifikation} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
