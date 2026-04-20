"use client"

import { useState, type ComponentProps } from "react"
import { UserPlus } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, useSimEvent, type SimScript } from "../../_shared/simulation"
import { ActionConfirmCard } from "@/components/ai/chat-tools/action-cards/action-confirm-card"
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

function buildVisaMedlemmarScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
    { role: "user", content: "Visa våra medlemmar" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
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
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Medlemsregister"
                        subtitle="12 aktiva medlemmar · 1 obetald årsavgift"
                        icon={UserPlus}
                        iconBg="bg-green-500/10"
                        iconColor="text-green-600 dark:text-green-500"
                        onOpen={() => onOpen("medlemsregister")}
                    />
                ),
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
]}

const laggTillMedlem: SimScript = [
    { role: "user", content: "Lägg till Sofia Andersson som ny medlem" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            {
                type: "stream",
                text: `Jag lägger till Sofia Andersson i medlemsregistret. Årsavgiften är **500 kr** enligt stadgarna.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Lägg till medlem"
                        description="Sofia Andersson"
                        properties={[
                            { label: "Namn", value: "Sofia Andersson" },
                            { label: "Inträdesdatum", value: "2026-04-07" },
                            { label: "Årsavgift", value: "500 kr" },
                            { label: "Status", value: "Ej betald (ny)" },
                        ]}
                        confirmLabel="Lägg till"
                        icon={UserPlus}
                        accent="green"
                        completedAction="created"
                        completedTitle="Sofia Andersson registrerad"
                        onCancel={() => {}}
                        triggerEvent="sim:lagg-till-medlem-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, lägg till", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:lagg-till-medlem-confirm" },
            {
                type: "stream",
                text: `Föreningen har nu **13 aktiva medlemmar**.`,
                speed: 12,
            },
        ],
    },
]

export default function MedlemsregisterStreamingPage() {
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)
    const visaMedlemmarScript = buildVisaMedlemmarScript(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Medlemsregister"
            subtitle="Hur Scooby hanterar medlemsregistret i en förening."
            backHref="/test-ui/streaming/agare"
            backLabel="Ägare"
        >
            <Scenario title="Visa medlemslistan" description="Läs-scenario — register över aktiva medlemmar" badges={["Förening"]}>
                <SimulatedConversation script={visaMedlemmarScript} />
            </Scenario>

            <Scenario title="Lägg till medlem" description="Skriv-scenario — ny medlem i registret" badges={["Förening"]}>
                <SimulatedConversation script={laggTillMedlem} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
