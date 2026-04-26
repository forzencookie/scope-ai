"use client"

import { useState, type ComponentProps } from "react"
import { Gift, Car } from "lucide-react"
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

const tilldelaFriskvard: SimScript = [
    { role: "user", content: "Ge Anna Lindberg friskvårdsbidrag på 5 000 kr per år" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            {
                type: "stream",
                text: `Friskvårdsbidrag upp till **5 000 kr** är skattefritt för den anställde. Det bokförs som personalvårdskostnad på konto **7690**.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Tilldela friskvårdsbidrag"
                        description="Anna Lindberg — 5 000 kr/år"
                        properties={[
                            { label: "Anställd", value: "Anna Lindberg" },
                            { label: "Förmån", value: "Friskvårdsbidrag" },
                            { label: "Belopp", value: "5 000 kr/år" },
                            { label: "Skatteeffekt", value: "Skattefritt (≤ 5 000 kr)" },
                            { label: "Konto", value: "7690 Personalvård" },
                        ]}
                        confirmLabel="Tilldela"
                        icon={Gift}
                        accent="green"
                        completedAction="created"
                        completedTitle="Förmån tilldelad"
                        onCancel={() => {}}
                        triggerEvent="sim:tilldela-friskvard-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, tilldela", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:tilldela-friskvard-confirm" },
            { type: "tool", name: "assign_benefit", duration: 900, resultLabel: "Friskvård tilldelad" },
            {
                type: "stream",
                text: `Anna kan nu nyttja upp till 5 000 kr per år.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [{ icon: "benefit", title: "Anna Lindberg", description: "Friskvårdsbidrag · Skattefritt", amount: 5000, status: "OK" }] }} />
                ),
            },
        ],
    },
]

function buildVisaFormanerScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
    { role: "user", content: "Vilka förmåner har vi i företaget?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            {
                type: "stream",
                text: `Ni har **3 aktiva förmåner** i företaget:

- **Anna Lindberg** — Friskvårdsbidrag 5 000 kr/år · Skattefritt
- **Johan Berg** — Friskvårdsbidrag 5 000 kr/år · Skattefritt
- **Johan Berg** — Tjänstebil (Volvo XC40) · Förmånsvärde **4 200 kr/mån**

Johans tjänstebil beskattas som förmån — **4 200 kr/mån** läggs på hans bruttolön vid lönekörning.

Vill du lägga till eller ändra en förmån?`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Förmåner"
                        subtitle="3 aktiva förmåner · Friskvård + Tjänstebil (Volvo XC40)"
                        icon={Gift}
                        iconBg="bg-green-500/10"
                        iconColor="text-green-600 dark:text-green-500"
                        onOpen={() => onOpen("formaner")}
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ge Sara friskvårdsbidrag också, 5 000 kr", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "assign_benefit", duration: 800, resultLabel: "Friskvård tillagd för Sara" },
            {
                type: "stream",
                text: `Klart! Sara Ek har nu friskvårdsbidrag på **5 000 kr/år**. Skattefritt för henne, bokförs på 7690 Personalvård.`,
                speed: 12,
            },
        ],
    },
]}

const tjanstebil: SimScript = [
    { role: "user", content: "Ge Sara en tjänstebil, det är en Tesla Model 3" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            {
                type: "stream",
                text: `Tesla Model 3 har ett förmånsvärde baserat på Skatteverkets beräkning. Jag behöver nybilspriset och om den är miljöbil (nedsättning).

**Tesla Model 3** (nybilspris ~480 000 kr, miljöbil) ger ett förmånsvärde på ca **3 800 kr/mån** efter miljöbilsnedsättning.

Förmånsvärdet beskattas som lön — Saras nettolön minskar.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Lägg till tjänstebil"
                        description="Sara Ek — Tesla Model 3"
                        properties={[
                            { label: "Anställd", value: "Sara Ek" },
                            { label: "Bil", value: "Tesla Model 3" },
                            { label: "Nybilspris", value: "480 000 kr" },
                            { label: "Miljöbil", value: "Ja (nedsättning 40%)" },
                            { label: "Förmånsvärde", value: "3 800 kr/mån" },
                            { label: "Skatteeffekt", value: "Nettolön −1 200 kr/mån" },
                        ]}
                        confirmLabel="Lägg till"
                        icon={Car}
                        accent="blue"
                        completedAction="created"
                        completedTitle="Tjänstebil tillagd"
                        onCancel={() => {}}
                        triggerEvent="sim:tjanstebil-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, lägg till", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:tjanstebil-confirm" },
            { type: "tool", name: "assign_benefit", duration: 1100, resultLabel: "Tjänstebil tillagd" },
            {
                type: "stream",
                text: `Tesla Model 3 registrerad för Sara Ek. Förmånsvärdet (3 800 kr/mån) räknas in automatiskt vid nästa lönekörning.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [{ icon: "benefit", title: "Sara Ek", description: "Tjänstebil Tesla Model 3 · Förmånsvärde", amount: 3800, status: "Förmånsvärde" }] }} />
                ),
            },
        ],
    },
]

export default function FormanerStreamingPage() {
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)
    const visaFormanerScript = buildVisaFormanerScript(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Förmåner"
            subtitle="Hur Scooby tilldelar och visar förmåner som friskvård och tjänstebil."
            backHref="/test-ui/streaming/loner"
            backLabel="Löner"
        >
            <Scenario title="Tilldela friskvårdsbidrag" description="Skriv-scenario — enkel förmån utan förmånsvärde" badges={["Alla"]}>
                <SimulatedConversation script={tilldelaFriskvard} />
            </Scenario>

            <Scenario title="Visa förmåner" description="Läs-scenario — översikt + lägga till ny" badges={["Alla"]}>
                <SimulatedConversation script={visaFormanerScript} />
            </Scenario>

            <Scenario title="Lägg till tjänstebil" description="Skriv-scenario — förmån med förmånsvärde och skatteeffekt" badges={["Alla"]}>
                <SimulatedConversation script={tjanstebil} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
