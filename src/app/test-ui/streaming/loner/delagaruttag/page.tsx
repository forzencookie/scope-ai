"use client"

import { useState, type ComponentProps } from "react"
import { Wallet, ArrowUpCircle } from "lucide-react"
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

const registreraUttag: SimScript = [
    { role: "user", content: "Jag vill ta ut 30 000 kr från företagskontot" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "get_company_info", duration: 1100, resultLabel: "Hämtade kontouppgifter" },
            {
                type: "stream",
                text: `Jag registrerar det som ett **privat uttag** — det minskar ditt eget kapital i bolaget. Bokföring sker på konto **2013** (Egna uttag).`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Registrera privat uttag"
                        description="Från företagskonto till privat"
                        properties={[
                            { label: "Delägare", value: "Erik Svensson" },
                            { label: "Belopp", value: "30 000 kr" },
                            { label: "Konto debet", value: "2013 Egna uttag" },
                            { label: "Konto kredit", value: "1930 Företagskonto" },
                            { label: "Datum", value: "2026-04-06" },
                            { label: "Saldo efter uttag", value: "145 200 kr" },
                        ]}
                        confirmLabel="Registrera uttag"
                        icon={Wallet}
                        accent="blue"
                        completedAction="booked"
                        completedTitle="Delägaruttag bokfört"
                        onCancel={() => {}}
                        triggerEvent="sim:registrera-uttag-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, registrera", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:registrera-uttag-confirm" },
            { type: "tool", name: "book_withdrawal", duration: 1400, resultLabel: "Uttag bokfört" },
            {
                type: "stream",
                text: `Verifikation **A-51** skapad. Ditt eget kapital har minskat med 30 000 kr.\n\n> I ett HB beskattas resultatet oavsett vad du tar ut — uttaget i sig är inte en skattepliktig händelse.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [{ icon: "verification", title: "Privat uttag Erik Svensson", description: "A-51", amount: 30000, timestamp: "2026-04-06", isNew: true }] }} />
                ),
            },
        ],
    },
]

function buildVisaUttagScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
    { role: "user", content: "Visa mina uttag i år" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "get_transactions", duration: 1400, resultLabel: "Hämtade uttag 2026" },
            {
                type: "stream",
                text: `Dina uttag och insättningar under **2026**:

- **15 jan** — Uttag −25 000 kr · saldo 230 000 kr
- **10 feb** — Insättning +50 000 kr · saldo 280 000 kr
- **1 mar** — Uttag −40 000 kr · saldo 240 000 kr
- **20 mar** — Uttag −15 000 kr · saldo 225 000 kr
- **6 apr** — Uttag −30 000 kr · saldo 195 000 kr

Totalt uttag **110 000 kr** · insättningar **50 000 kr** · netto **−60 000 kr**

Ditt eget kapital har minskat med 60 000 kr i år. Vill du se hur det påverkar balansräkningen?`,
                speed: 10,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Delägaruttag 2026"
                        subtitle="Netto −60 000 kr · Uttag 110 000 kr · Insättningar 50 000 kr"
                        icon={Wallet}
                        iconBg="bg-blue-500/10"
                        iconColor="text-blue-600 dark:text-blue-500"
                        onOpen={() => onOpen("delagaruttag")}
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, visa balansräkningen", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "get_balance_sheet", duration: 1200, resultLabel: "Hämtade balansräkning" },
            {
                type: "stream",
                text: `Ditt **eget kapital** i balansräkningen:

- Eget kapital vid årets ingång: **255 000 kr**
- Egna uttag: **−110 000 kr**
- Egna insättningar: **+50 000 kr**
- Årets resultat (hittills): **+142 000 kr**
- **Eget kapital nu: 337 000 kr**

Trots uttagen på 60 000 kr netto har ditt eget kapital ökat tack vare årets resultat. Du har en sund balans.`,
                speed: 10,
            },
        ],
    },
]}

const registreraInsattning: SimScript = [
    { role: "user", content: "Jag har satt in 20 000 kr av egna pengar på företagskontot" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            {
                type: "stream",
                text: `Jag registrerar det som en **privat insättning** — det ökar ditt eget kapital. Bokföring sker på konto **2018** (Egna insättningar).`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Registrera privat insättning"
                        description="Från privat till företagskonto"
                        properties={[
                            { label: "Delägare", value: "Erik Svensson" },
                            { label: "Belopp", value: "20 000 kr" },
                            { label: "Konto debet", value: "1930 Företagskonto" },
                            { label: "Konto kredit", value: "2018 Egna insättningar" },
                            { label: "Datum", value: "2026-04-06" },
                        ]}
                        confirmLabel="Registrera insättning"
                        icon={ArrowUpCircle}
                        accent="green"
                        completedAction="booked"
                        completedTitle="Delägarinsättning bokförd"
                        onCancel={() => {}}
                        triggerEvent="sim:registrera-insattning-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, registrera", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:registrera-insattning-confirm" },
            { type: "tool", name: "book_deposit", duration: 1200, resultLabel: "Insättning bokförd" },
            {
                type: "stream",
                text: `Verifikation **A-52** skapad. Ditt eget kapital har ökat med 20 000 kr.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [{ icon: "verification", title: "Privat insättning Erik Svensson", description: "A-52", amount: 20000, timestamp: "2026-04-06", isNew: true }] }} />
                ),
            },
        ],
    },
]

export default function DelagaruttagStreamingPage() {
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)
    const visaUttagScript = buildVisaUttagScript(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Delägaruttag"
            subtitle="Hur Scooby registrerar uttag och insättningar i HB/KB."
            backHref="/test-ui/streaming/loner"
            backLabel="Löner"
        >
            <Scenario title="Registrera uttag" description="Skriv-scenario — privat uttag från eget kapital" badges={["HB", "KB"]}>
                <SimulatedConversation script={registreraUttag} />
            </Scenario>

            <Scenario title="Visa uttag" description="Läs-scenario — årsöversikt + balansräkning" badges={["HB", "KB"]}>
                <SimulatedConversation script={visaUttagScript} />
            </Scenario>

            <Scenario title="Registrera insättning" description="Skriv-scenario — privat insättning (omvänt flöde)" badges={["HB", "KB"]}>
                <SimulatedConversation script={registreraInsattning} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
