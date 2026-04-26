"use client"

/**
 * AI Streaming: Ägare → Delägare (HB/KB)
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Visa delägare" → partner overview + opener → user confirms all good → Scooby wraps up
 * 2. WRITE: "Uppdatera ägarandelar" → pending confirmation → user confirms → done
 */

import { useState, type ComponentProps } from "react"
import { Users } from "lucide-react"
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

// --- Scenario 1: Read → user responds → wrap up ---

function buildVisaDelagareScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
    { role: "user", content: "Visa våra delägare" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "get_company_info", duration: 1200, resultLabel: "Hämtade delägarinfo" },
            {
                type: "stream",
                text: `Ert handelsbolag har **2 delägare**:

**Erik Svensson** — 60% ägarandel
- Eget kapital: **195 000 kr** · Uttag 2026: 110 000 kr

**Maria Johansson** — 40% ägarandel
- Eget kapital: **130 000 kr** · Uttag 2026: 45 000 kr

Totalt eget kapital: **325 000 kr**

Resultatet fördelas enligt ägarandelarna vid årets slut. Vill du uppdatera andelarna?`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Delägare — Handelsbolaget"
                        subtitle="2 delägare · Erik 60% · Maria 40% · Eget kapital 325 000 kr"
                        icon={Users}
                        iconBg="bg-purple-500/10"
                        iconColor="text-purple-600 dark:text-purple-500"
                        onOpen={() => onOpen("delagare")}
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Nej, det ser bra ut", delay: 2000 },
    {
        role: "scooby",
        elements: [
            {
                type: "stream",
                text: `Perfekt! Allt ser korrekt ut. Resultatet för 2026 fördelas 60/40 mellan Erik och Maria som vanligt. Säg till om du behöver ändra något längre fram.`,
                speed: 12,
            },
        ],
    },
]}

// --- Scenario 2: Write → update ownership ---

const uppdateraAndelar: SimScript = [
    { role: "user", content: "Ändra så att Maria äger 50% istället" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            {
                type: "stream",
                text: `Jag ändrar ägarandelar: Erik **50%** och Maria **50%**. Det påverkar resultatfördelningen framåt — befintligt eget kapital kvarstår som det är.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Uppdatera ägarandelar"
                        description="Ny fördelning"
                        properties={[
                            { label: "Erik Svensson", value: "60% → 50%" },
                            { label: "Maria Johansson", value: "40% → 50%" },
                            { label: "Gäller från", value: "2026-04-07" },
                            { label: "Påverkar", value: "Resultatfördelning framåt" },
                        ]}
                        confirmLabel="Uppdatera"
                        icon={Users}
                        accent="purple"
                        completedAction="updated"
                        completedTitle="Ägarandelar uppdaterade"
                        onCancel={() => {}}
                        triggerEvent="sim:uppdatera-andelar-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, uppdatera", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:uppdatera-andelar-confirm" },
            {
                type: "stream",
                text: `Erik och Maria äger nu 50% var. Framtida resultat fördelas lika.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [
                        { icon: "partner", title: "Erik Svensson",    description: "EK 195 000 kr · Uttag 110 000 kr", status: "50%" },
                        { icon: "partner", title: "Maria Johansson",  description: "EK 130 000 kr · Uttag 45 000 kr",  status: "50%" },
                    ]}} />
                ),
            },
        ],
    },
]

// --- Page ---

export default function DelagareStreamingPage() {
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)
    const visaDelagareScript = buildVisaDelagareScript(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Delägare"
            subtitle="Hur Scooby visar och uppdaterar delägare i HB/KB."
            backHref="/test-ui/streaming/agare"
            backLabel="Ägare"
        >
            <Scenario title="Visa delägare" description="Läs-scenario → ägaröversikt → avslut" badges={["HB", "KB"]}>
                <SimulatedConversation script={visaDelagareScript} />
            </Scenario>

            <Scenario title="Uppdatera ägarandelar" description="Skriv-scenario → ändra fördelning" badges={["HB", "KB"]}>
                <SimulatedConversation script={uppdateraAndelar} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
