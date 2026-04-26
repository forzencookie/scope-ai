"use client"

import { useState, type ComponentProps } from "react"
import { Gift, Car, Route, Cookie } from "lucide-react"
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
                            { label: "Belopp", value: "5 000 kr / år" },
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

const milersattning: SimScript = [
    { role: "user", content: "Vi körde 150 km med privatbil på kundbesök i Göteborg" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            {
                type: "stream",
                text: `Milersättning för privat bil i tjänsten är **25 kr/km** skattefritt (2026). 150 km ger **3 750 kr**.

Bokförs som bilersättning på konto **7331**.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Bokför milersättning"
                        description="Kundbesök Göteborg — 150 km"
                        properties={[
                            { label: "Körda km", value: "150 km" },
                            { label: "Sats 2026", value: "25 kr/km (skattefritt)" },
                            { label: "Ersättning", value: "3 750 kr" },
                            { label: "Konto debet", value: "7331 Bilersättningar" },
                            { label: "Konto kredit", value: "1930 Företagskonto" },
                            { label: "Datum", value: "2026-04-26" },
                        ]}
                        confirmLabel="Bokför"
                        icon={Route}
                        accent="blue"
                        completedAction="booked"
                        completedTitle="Milersättning bokförd"
                        onCancel={() => {}}
                        triggerEvent="sim:milersattning-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:milersattning-confirm" },
            { type: "tool", name: "book_expense", duration: 800, resultLabel: "Milersättning bokförd" },
            {
                type: "stream",
                text: `3 750 kr bokfört på 7331 Bilersättningar. Spara körjournalen — Skatteverket kan begära den.`,
                speed: 12,
            },
        ],
    },
]

const julgava: SimScript = [
    { role: "user", content: "Vi vill ge alla 4 anställda en julklapp för 500 kr styck" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            {
                type: "stream",
                text: `Julgåvor upp till **550 kr/person** är skattefria. 500 kr per person är inom gränsen — helt OK.

Totalt 4 × 500 kr = **2 000 kr**. Bokförs på konto **7690 Personalvård**.

Obs: Gränsen är absolut — 551 kr gör hela beloppet skattepliktigt, inte bara de 1 kr över.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Bokför julgåvor"
                        description="4 anställda · 500 kr/person"
                        properties={[
                            { label: "Antal anställda", value: "4 st" },
                            { label: "Per person", value: "500 kr (limit 550 kr)" },
                            { label: "Totalt", value: "2 000 kr" },
                            { label: "Skatteeffekt", value: "Skattefritt — inom gränsen" },
                            { label: "Konto", value: "7690 Personalvård" },
                            { label: "Moms", value: "Ej avdragsgill på gåvor" },
                        ]}
                        confirmLabel="Bokför"
                        icon={Gift}
                        accent="green"
                        completedAction="booked"
                        completedTitle="Julgåvor bokförda"
                        onCancel={() => {}}
                        triggerEvent="sim:julgava-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Perfekt, bokför", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:julgava-confirm" },
            { type: "tool", name: "book_expense", duration: 800, resultLabel: "Julgåvor bokförda" },
            {
                type: "stream",
                text: `2 000 kr bokfört på 7690 Personalvård. Alla 4 anställda är under gränsen — inga skattekonsekvenser.`,
                speed: 12,
            },
        ],
    },
]

const personalvard: SimScript = [
    { role: "user", content: "Vi köpte fika till kontoret för 890 kr" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 500 },
            {
                type: "stream",
                text: `Fika och personalvård på kontoret är **skattefritt** utan beloppsgräns — så länge det är tillgängligt för alla anställda på arbetsplatsen.

890 kr bokförs på konto **7690 Personalvård**. Momsen (178 kr) är avdragsgill.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Bokför personalvård"
                        description="Fika till kontoret"
                        properties={[
                            { label: "Beskrivning", value: "Fika — kontoret" },
                            { label: "Belopp exkl. moms", value: "712 kr" },
                            { label: "Moms (25%)", value: "178 kr" },
                            { label: "Totalt", value: "890 kr" },
                            { label: "Skatteeffekt", value: "Skattefritt personalvård" },
                            { label: "Konto", value: "7690 Personalvård" },
                        ]}
                        confirmLabel="Bokför"
                        icon={Cookie}
                        accent="green"
                        completedAction="booked"
                        completedTitle="Personalvård bokförd"
                        onCancel={() => {}}
                        triggerEvent="sim:fika-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Tack, bokför", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:fika-confirm" },
            { type: "tool", name: "book_expense", duration: 700, resultLabel: "Personalvård bokförd" },
            {
                type: "stream",
                text: `890 kr bokfört på 7690 Personalvård. Ingående moms 178 kr registrerad på konto 2641.`,
                speed: 12,
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
            subtitle="Hur Scooby tilldelar och bokför förmåner — friskvård, tjänstebil, milersättning, julgåvor och personalvård."
            backHref="/test-ui/streaming/loner"
            backLabel="Löner"
        >
            <Scenario title="Tilldela friskvårdsbidrag" description="Skriv-scenario — enkel förmån utan förmånsvärde" badges={["Alla"]}>
                <SimulatedConversation script={tilldelaFriskvard} />
            </Scenario>

            <Scenario title="Visa förmåner" description="Läs-scenario — översikt + lägga till ny" badges={["Alla"]}>
                <SimulatedConversation script={visaFormanerScript} />
            </Scenario>

            <Scenario title="Lägg till tjänstebil" description="Skriv-scenario — förmån med förmånsvärde och skatteeffekt" badges={["AB", "HB"]}>
                <SimulatedConversation script={tjanstebil} />
            </Scenario>

            <Scenario title="Milersättning" description="Skriv-scenario — privat bil i tjänsten, 25 kr/km" badges={["Alla"]}>
                <SimulatedConversation script={milersattning} />
            </Scenario>

            <Scenario title="Julgåvor" description="Skriv-scenario — gåvor under 550 kr/person är skattefria" badges={["Alla"]}>
                <SimulatedConversation script={julgava} />
            </Scenario>

            <Scenario title="Personalvård / Fika" description="Skriv-scenario — obegränsat skattefritt för hela kontoret" badges={["Alla"]}>
                <SimulatedConversation script={personalvard} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
