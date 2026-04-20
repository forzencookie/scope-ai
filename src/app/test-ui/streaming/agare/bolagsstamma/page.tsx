"use client"

import { useState, type ComponentProps } from "react"
import { Landmark, FileText } from "lucide-react"
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

function buildForberedProtokollScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
    { role: "user", content: "Förbered bolagsstämmoprotokoll för ordinarie stämma 2026" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 900 },
            { type: "tool", name: "get_company_info", duration: 1100, resultLabel: "Hämtade företagsuppgifter" },
            { type: "tool", name: "get_income_statement", duration: 1400, resultLabel: "Hämtade årsredovisning 2025" },
            {
                type: "stream",
                text: `Jag förbereder ett stämmoprotokoll för **ordinarie bolagsstämma 2026**. Baserat på årsredovisningen 2025 inkluderar jag standardpunkterna:

1. Val av ordförande och justerare
2. Godkännande av dagordning
3. Framläggande av årsredovisning
4. Fastställande av resultat- och balansräkning
5. Resultatdisposition
6. Ansvarsfrihet för styrelsen
7. Val av styrelse och revisor

Vill du lägga till ett **utdelningsbeslut** i punkt 5?`,
                speed: 10,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Generera stämmoprotokoll"
                        description="Ordinarie bolagsstämma 2026"
                        properties={[
                            { label: "Bolag", value: "Scope Consulting AB (559123-4567)" },
                            { label: "Räkenskapsår", value: "2025" },
                            { label: "Typ", value: "Ordinarie bolagsstämma" },
                            { label: "Punkter", value: "7 st (standard)" },
                            { label: "Format", value: "PDF + digital signering" },
                        ]}
                        confirmLabel="Generera protokoll"
                        icon={FileText}
                        accent="indigo"
                        completedAction="prepared"
                        completedTitle="Stämmoprotokoll genererat"
                        onCancel={() => {}}
                        triggerEvent="sim:forbered-protokoll-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, generera protokollet", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:forbered-protokoll-confirm" },
            {
                type: "stream",
                text: `PDF klar att granska. Behöver signeras av ordförande + justerare.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InfoCardRenderer card={{ cardType: "report", data: { id: "r1", reportType: "Stämmoprotokoll", title: "Ordinarie bolagsstämma 2026", period: "Räkenskapsår 2025" } }} />
                ),
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Bolagsstämmoprotokoll 2026"
                        subtitle="Ordinarie stämma · PDF genererad · Signering återstår"
                        icon={FileText}
                        iconBg="bg-indigo-500/10"
                        iconColor="text-indigo-600 dark:text-indigo-500"
                        onOpen={() => onOpen("moten")}
                    />
                ),
            },
        ],
    },
]}

const utdelningsbeslut: SimScript = [
    { role: "user", content: "Vi vill besluta om utdelning på 150 000 kr" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "calculate_tax", duration: 1800, resultLabel: "K10 beräknad" },
            {
                type: "stream",
                text: `K10-gränsbelopp: **187 550 kr** — 150 000 kr ryms, beskattas som kapital (20%).

- Beslutad utdelning: **150 000 kr**
- K10-gränsbelopp: **187 550 kr** — inom gräns ✓
- Skatt (20%): **30 000 kr**
- **Netto efter skatt: 120 000 kr**

Du har **37 550 kr kvar** av gränsbeloppet som kan sparas till nästa år.`,
                speed: 10,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Registrera utdelningsbeslut"
                        description="150 000 kr — inom K10-gränsbelopp"
                        properties={[
                            { label: "Utdelning", value: "150 000 kr" },
                            { label: "Skatt", value: "30 000 kr (20% kapital)" },
                            { label: "Netto", value: "120 000 kr" },
                            { label: "Typ", value: "Stämmobeslut" },
                            { label: "Bokföring", value: "Konto 2091 → 2898" },
                        ]}
                        confirmLabel="Registrera beslut"
                        icon={Landmark}
                        accent="purple"
                        completedAction="booked"
                        completedTitle="Utdelningsbeslut registrerat"
                        onCancel={() => {}}
                        triggerEvent="sim:utdelningsbeslut-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, registrera beslutet", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:utdelningsbeslut-confirm" },
            {
                type: "stream",
                text: `**150 000 kr** beslutad utdelning bokförd — 2091 → 2898. Utbetalning sker när du bekräftar separat.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <InfoCardRenderer card={{ cardType: "dividend", data: { id: "d1", name: "Anders Richnau", amount: 150000, year: 2025 } }} />
                ),
            },
        ],
    },
]

export default function BolagsstammaStreamingPage() {
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)
    const forberedProtokollScript = buildForberedProtokollScript(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Bolagsstämma"
            subtitle="Hur Scooby förbereder stämmoprotokoll och fattar beslut."
            backHref="/test-ui/streaming/agare"
            backLabel="Ägare"
        >
            <Scenario title="Förbered stämmoprotokoll" description="Skriv-scenario — generera dokument" badges={["AB"]}>
                <SimulatedConversation script={forberedProtokollScript} />
            </Scenario>

            <Scenario title="Utdelningsbeslut på stämman" description="Skriv-scenario — beslut kopplat till K10-gränsbelopp" badges={["AB"]}>
                <SimulatedConversation script={utdelningsbeslut} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
