"use client"

/**
 * AI Streaming: Löner → Team
 *
 * Complete conversations with simulated streaming:
 * 1. WRITE: "Lägg till en anställd" — pending confirmation → user confirms → follow-up for personnummer
 * 2. READ: "Visa mitt team" — inline payroll cards + opener
 * 3. WRITE: "Ändra Annas kommun" — pending confirmation → user confirms → done
 */

import { useState, type ComponentProps } from "react"
import { UserPlus, Pencil, Users } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, useSimEvent, type SimScript } from "../../_shared/simulation"
import { ActionConfirmCard } from "@/components/ai/chat-tools/action-cards/action-confirm-card"
import { InfoCardRenderer } from "@/components/ai/chat-tools/information-cards"
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
                    <InteractiveActionConfirmCard
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
                        completedAction="created"
                        completedTitle="Lisa Nilsson tillagd"
                        onCancel={() => {}}
                        triggerEvent="sim:lagg-till-anstalld-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, lägg till", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:lagg-till-anstalld-confirm" },
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

function buildVisaTeametScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
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
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Teamet"
                        subtitle="4 anställda · Lönekörning mars klar · 1 kräver granskning"
                        icon={Users}
                        iconBg="bg-blue-500/10"
                        iconColor="text-blue-600 dark:text-blue-500"
                        onOpen={() => onOpen("team")}
                    />
                ),
            },
        ],
    },
]}

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
                    <InteractiveActionConfirmCard
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
                        completedAction="updated"
                        completedTitle="Anna Lindberg uppdaterad"
                        onCancel={() => {}}
                        triggerEvent="sim:uppdatera-anstalld-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, uppdatera", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:uppdatera-anstalld-confirm" },
            { type: "tool", name: "update_employee", duration: 900, resultLabel: "Anna uppdaterad" },
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
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)
    const visaTeametScript = buildVisaTeametScript(setOpenWalkthrough)

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
                <SimulatedConversation script={visaTeametScript} />
            </Scenario>

            <Scenario title="Uppdatera anställd" description="Skriv-scenario — ändra kommun/uppgifter" badges={["Alla"]}>
                <SimulatedConversation script={uppdateraAnstalld} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
