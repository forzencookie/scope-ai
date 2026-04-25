"use client"

/**
 * AI Streaming: Bokföring → Inventarier
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Visa mina inventarier" → list + opener → user asks to run depreciation → pending confirmation → confirm → done
 * 2. WRITE: "Registrera ny inventarie" → pending confirmation → user confirms → done
 * 3. WRITE: "Kör avskrivning" → pending confirmation → user confirms → done
 */

import { useState, type ComponentProps } from "react"
import { Package, TrendingDown } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, useSimEvent, type SimScript } from "../../_shared/simulation"
import { ActionConfirmCard } from "@/components/ai/chat-tools/action-cards/action-confirm-card"
import { Block } from "@/components/ai/chat-tools/rows/block"
import { WalkthroughOpenerCard } from "@/components/ai/chat-tools/link-cards/walkthrough-opener-card"
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

// ─── Scenario 1: READ — visa inventarier, user asks to run depreciation ───

function buildVisaInventarierScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
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
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Inventarier"
                        subtitle="3 inventarier · Bokfört värde 142 500 kr · Nästa avskrivning apr"
                        icon={Package}
                        iconBg="bg-indigo-500/10"
                        iconColor="text-indigo-600 dark:text-indigo-500"
                        onOpen={() => onOpen("tillgangar")}
                    />
                ),
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
                    <InteractiveActionConfirmCard
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
                        completedAction="booked"
                        completedTitle="Avskrivning bokförd"
                        onCancel={() => {}}
                        triggerEvent="sim:visa-inventarier-avskrivning-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, bokför", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:visa-inventarier-avskrivning-confirm" },
            { type: "tool", name: "book_depreciation", duration: 1400, resultLabel: "Avskrivning bokförd" },
            {
                type: "stream",
                text: `Verifikation **A-54** skapad — 2 014 kr → debet 7832, kredit 1229.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [{ icon: "verification", title: "Avskrivning april 2026", description: "A-54", amount: 2014, timestamp: "2026-04-30", isNew: true }] }} />
                ),
            },
        ],
    },
]}

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
                    <InteractiveActionConfirmCard
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
                        completedAction="created"
                        completedTitle="Inventarie registrerad"
                        onCancel={() => {}}
                        triggerEvent="sim:registrera-inventarie-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, registrera", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:registrera-inventarie-confirm" },
            {
                type: "stream",
                text: `**Kontorsstol IKEA** tillagd — avskrivning 142 kr/mån. Verifikation **A-55** skapad.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [{ icon: "asset", title: "Kontorsstol IKEA", description: "142 kr/mån · 60 mån", amount: 8500, isNew: true }] }} />
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
                    <InteractiveActionConfirmCard
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
                        completedAction="booked"
                        completedTitle="Avskrivning mars bokförd"
                        onCancel={() => {}}
                        triggerEvent="sim:kor-avskrivning-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ser bra ut, bokför", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:kor-avskrivning-confirm" },
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
                    <Block block={{ rows: [{ icon: "verification", title: "Avskrivning mars 2026", description: "A-49", amount: 2083, timestamp: "2026-03-31", isNew: true }] }} />
                ),
            },
        ],
    },
]

// ─── Page ───

export default function InventarierStreamingPage() {
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)
    const visaInventarierScript = buildVisaInventarierScript(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Inventarier"
            subtitle="Hur Scooby registrerar och avskriver inventarier."
            backHref="/test-ui/streaming/bokforing"
            backLabel="Bokföring"
        >
            <Scenario title="Visa inventarier" description="Läs-scenario — inventarielista + avskrivning" badges={["Alla"]}>
                <SimulatedConversation script={visaInventarierScript} />
            </Scenario>

            <Scenario title="Registrera inventarie" description="Skriv-scenario — ny inventarie med avskrivningsplan" badges={["Alla"]}>
                <SimulatedConversation script={registreraInventarie} />
            </Scenario>

            <Scenario title="Kör avskrivning" description="Skriv-scenario — periodisk avskrivning med bekräftelse" badges={["Alla"]}>
                <SimulatedConversation script={korAvskrivning} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
