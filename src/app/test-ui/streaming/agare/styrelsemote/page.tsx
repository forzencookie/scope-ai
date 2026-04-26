"use client"

import { useState, type ComponentProps } from "react"
import { FileText, Gavel, Building2, User } from "lucide-react"
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

// ─── Scenario 1: Board approves annual report ─────────────────────────────────

function buildArsredovisningScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
    { role: "user", content: "Vi behöver hålla ett styrelsemöte för att anta årsredovisningen" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "get_income_statement", duration: 1400, resultLabel: "Hämtade årsredovisning 2025" },
            { type: "tool", name: "get_board_members", duration: 900, resultLabel: "Hämtade styrelsemedlemmar" },
            {
                type: "stream",
                text: `Styrelsen måste anta årsredovisningen **innan** bolagsstämman kan fastställa den. Jag förbereder ett styrelsemöte med en punkt på dagordningen:

1. Antagande av årsredovisning och revisionsberättelse för 2025

**Styrelse:** Anders Richnau (ordförande) + 1 ledamot

Protokollet signeras av ordföranden och visar att styrelsen godkänt rapporten. Sedan kan ni kalla till bolagsstämma.`,
                speed: 10,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Håll styrelsemöte"
                        description="Antagande av årsredovisning 2025"
                        properties={[
                            { label: "Typ", value: "Styrelsemöte" },
                            { label: "Datum", value: "2026-04-28" },
                            { label: "Ordförande", value: "Anders Richnau" },
                            { label: "Dagordning", value: "1 punkt — årsredovisning 2025" },
                            { label: "Dokument", value: "Styrelsemötesprotokoll (PDF)" },
                        ]}
                        confirmLabel="Schemalägg och generera protokoll"
                        icon={Gavel}
                        accent="indigo"
                        completedAction="created"
                        completedTitle="Styrelsemöte schemalagt"
                        onCancel={() => {}}
                        triggerEvent="sim:arsredovisning-styrelse-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, kör", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:arsredovisning-styrelse-confirm" },
            { type: "tool", name: "schedule_meeting", duration: 1000, resultLabel: "Styrelsemöte schemalagt" },
            {
                type: "stream",
                text: `Klart. Håll mötet, signera protokollet — sen kallar jag till bolagsstämma när du är redo.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <WalkthroughOpenerCard
                        title="Styrelsemötesprotokoll 2025"
                        subtitle="Antagande av årsredovisning · Redo för signering"
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

// ─── Scenario 2: Hire a CEO ───────────────────────────────────────────────────

const anstallVd: SimScript = [
    { role: "user", content: "Vi vill anställa en VD. Behöver vi ett styrelsemöte för det?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            {
                type: "stream",
                text: `Ja — VD utses av styrelsen, inte av ägarna på stämman. Det kräver ett **styrelsebeslut** och ett protokoll.

Beslutet ska ange:
- VD:ns namn och personnummer
- Lön och övriga villkor (kan hänvisa till separat avtal)
- Startdatum
- Om VD även är firmatecknare

Har ni redan ett kandidatnamn?`,
                speed: 11,
            },
        ],
    },
    { role: "user", content: "Ja, Sara Ek. Lön 65 000 kr/mån, börjar 1 juni", delay: 1800 },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            {
                type: "stream",
                text: `Förbereder styrelsebeslut om att utse Sara Ek till VD.`,
                speed: 14,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Styrelsebeslut — utse VD"
                        description="Sara Ek · Startdatum 1 juni 2026"
                        properties={[
                            { label: "Beslut", value: "Utse VD" },
                            { label: "Person", value: "Sara Ek" },
                            { label: "Lön", value: "65 000 kr/mån" },
                            { label: "Startdatum", value: "2026-06-01" },
                            { label: "Firmateckning", value: "Ensam (föreslås)" },
                            { label: "Dokument", value: "Styrelsemötesprotokoll (PDF)" },
                        ]}
                        confirmLabel="Fatta beslut + generera protokoll"
                        icon={User}
                        accent="emerald"
                        completedAction="created"
                        completedTitle="VD utsedd — protokoll genererat"
                        onCancel={() => {}}
                        triggerEvent="sim:utse-vd-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Perfekt, ja", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:utse-vd-confirm" },
            { type: "tool", name: "schedule_meeting", duration: 900, resultLabel: "Styrelsebeslut registrerat" },
            { type: "tool", name: "assign_board_member", duration: 800, resultLabel: "Sara Ek registrerad som VD" },
            {
                type: "stream",
                text: `Sara Ek registrerad som VD. Protokollet är klart — signeras av ordföranden. Glöm inte att anmäla ändringen till **Bolagsverket** (firmateckning uppdateras i registret).`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [{ icon: "employee", title: "Sara Ek", description: "VD · Startdatum 1 jun 2026 · Styrelsebeslut fattat", status: "Aktiv" }] }} />
                ),
            },
        ],
    },
]

// ─── Scenario 3: Sign a major contract ───────────────────────────────────────

const hyresavtal: SimScript = [
    { role: "user", content: "Vi ska skriva på ett hyresavtal för kontoret, 720 000 kr per år i 3 år. Behöver styrelsen godkänna det?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            {
                type: "stream",
                text: `Ja, ett åtagande på **2 160 000 kr** (3 år × 720 000 kr) är en väsentlig affärshändelse. Styrelsen bör fatta ett formellt beslut innan ni skriver under — annars riskerar firmatecknaren att binda bolaget utan mandat.

Styrelsebeslut ska ange:
- Hyresvärd och fastighet
- Hyresbelopp och hyresperiod
- Vem som ges mandat att underteckna avtalet`,
                speed: 10,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Styrelsebeslut — godkänn hyresavtal"
                        description="Kungsgatan 12 · 60 000 kr/mån · 3 år"
                        properties={[
                            { label: "Hyresvärd", value: "Fastighets AB Centrum" },
                            { label: "Fastighet", value: "Kungsgatan 12, Stockholm" },
                            { label: "Hyra", value: "60 000 kr/mån (exkl. moms)" },
                            { label: "Period", value: "3 år — 2026-06-01 till 2029-05-31" },
                            { label: "Totalt åtagande", value: "2 160 000 kr" },
                            { label: "Undertecknar", value: "Anders Richnau (firmatecknare)" },
                        ]}
                        confirmLabel="Fatta beslut + generera protokoll"
                        icon={Building2}
                        accent="blue"
                        completedAction="created"
                        completedTitle="Styrelsebeslut fattat"
                        onCancel={() => {}}
                        triggerEvent="sim:hyresavtal-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, godkänn det", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:hyresavtal-confirm" },
            { type: "tool", name: "schedule_meeting", duration: 900, resultLabel: "Styrelsebeslut registrerat" },
            {
                type: "stream",
                text: `Klart. Protokollet visar att styrelsen godkänt hyresavtalet och gett Anders Richnau mandat att underteckna. Spara protokollet tillsammans med det signerade avtalet.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [{ icon: "report", title: "Styrelsebeslut — hyresavtal", description: "Kungsgatan 12 · 3 år · Protokoll genererat", status: "Signering" }] }} />
                ),
            },
        ],
    },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StyrelsemoteStreamingPage() {
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)
    const arsredovisningScript = buildArsredovisningScript(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Styrelsemöte"
            subtitle="Hur Scooby hjälper styrelsen fatta beslut, generera protokoll och dokumentera åtgärder."
            backHref="/test-ui/streaming/agare"
            backLabel="Ägare"
        >
            <Scenario title="Anta årsredovisningen" description="Skriv-scenario — styrelsemöte som föregår bolagsstämman" badges={["AB"]}>
                <SimulatedConversation script={arsredovisningScript} />
            </Scenario>

            <Scenario title="Utse VD" description="Skriv-scenario — styrelsebeslut krävs, inte stämmobeslut" badges={["AB"]}>
                <SimulatedConversation script={anstallVd} />
            </Scenario>

            <Scenario title="Godkänn hyresavtal" description="Skriv-scenario — väsentligt åtagande kräver styrelsebeslut" badges={["AB"]}>
                <SimulatedConversation script={hyresavtal} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
