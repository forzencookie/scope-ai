"use client"

/**
 * AI Streaming: Bokföring → Transaktioner
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Visa mina transaktioner" → shows data one by one → user asks to book → confirmation → done
 * 2. WRITE: "Bokför det här kvittot" → finds account → confirmation → done
 * 3. WRITE: "Bokför alla obokförda" → batch confirmation → all booked
 *
 * Design decisions:
 * - Transactions appear one by one (staggered) for realistic streaming feel
 * - Max ~5 shown inline, scrollable container with max-height
 * - For large result sets: show summary count + "visa alla" opens walkthrough
 * - Confirmation card always shown before any write action
 */

import { useState, type ComponentProps } from "react"
import { Receipt } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, useSimEvent, type SimScript } from "../../_shared/simulation"
import { ActionConfirmCard } from "@/components/ai/cards/action-cards/action-confirm-card"
import { BatchBookingCard } from "@/components/ai/cards/action-cards/batch-booking-card"
import { Block } from "@/components/ai/cards/rows/block"
import { WalkthroughOpenerCard } from "@/components/ai/cards/link-cards/walkthrough-opener-card"
import { WalkthroughOverlay, type WalkthroughType } from "@/components/ai/overlays/walkthroughs/walkthrough-overlay"

// ─── Interactive confirmation card — holds isDone state internally.
//     Transitions to post-confirm either on button click OR when the simulation
//     fires a named event via the SimEvent bus (triggerEvent prop). ───
function InteractiveActionConfirmCard(
    props: Omit<ComponentProps<typeof ActionConfirmCard>, "isDone" | "onConfirm"> & {
        triggerEvent?: string
    }
) {
    const { triggerEvent, ...rest } = props
    // Tracks manual confirm button clicks
    const [clickedDone, setClickedDone] = useState(false)
    // Tracks simulation fire-event via the bus (no window events)
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

function InteractiveBatchBookingCard(
    props: Omit<ComponentProps<typeof BatchBookingCard>, "isDone" | "onConfirm"> & {
        triggerEvent?: string
    }
) {
    const { triggerEvent, ...rest } = props
    const [clickedDone, setClickedDone] = useState(false)
    const eventTriggered = useSimEvent(triggerEvent)
    const isDone = clickedDone || eventTriggered

    return (
        <BatchBookingCard
            {...rest}
            isDone={isDone}
            completedAction={isDone ? rest.completedAction : undefined}
            completedTitle={isDone ? rest.completedTitle : undefined}
            onConfirm={() => setClickedDone(true)}
        />
    )
}

// ─── Scenario 1: Read → then write ───

function buildVisaTransaktionerScript(onOpen: (type: WalkthroughType) => void): SimScript { return [
    { role: "user", content: "Visa mina senaste transaktioner" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "get_transactions", duration: 1400, resultLabel: "Hämtade 5 transaktioner" },
            {
                type: "stream",
                text: `**5 senaste** — 3 bokförda, **2 obokförda**.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [
                        { icon: "transaction", title: "Kontorshyra april",             amount: 8500, timestamp: "2026-04-01", status: "Bokförd" },
                        { icon: "transaction", title: "Svea Hosting — webbhotell",     amount: 1499, timestamp: "2026-03-28", status: "Bokförd" },
                        { icon: "transaction", title: "Kjell & Company",               amount: 2499, timestamp: "2026-03-25", status: "Obokförd" },
                        { icon: "transaction", title: "Postnord — Porto",              amount: 89,   timestamp: "2026-03-22", status: "Bokförd" },
                        { icon: "transaction", title: "Clas Ohlson — kontorsmaterial", amount: 349,  timestamp: "2026-03-20", status: "Obokförd" },
                    ]}} />
                ),
            },
            {
                type: "stream",
                text: `Förslag på de obokförda:\n- **Kjell & Company** → konto 5410, 25% moms\n- **Clas Ohlson** → konto 6110, 25% moms\n\nSkal jag köra dem?`,
                speed: 14,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <WalkthroughOpenerCard
                        title="Transaktioner april 2026"
                        subtitle="8 transaktioner · 3 obokförda · Klicka för att se alla"
                        icon={Receipt}
                        iconBg="bg-blue-500/10"
                        iconColor="text-blue-600 dark:text-blue-500"
                        onOpen={() => onOpen("transaktioner" as WalkthroughType)}
                    />
                ),
            },
        ],
    },
    // User says yes — Scooby prepares confirmation, does NOT execute yet
    { role: "user", content: "Ja, bokför dem", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "lookup_bas_account", duration: 1100, resultLabel: "Matchade BAS-konton" },
            {
                type: "stream",
                text: `Matchade mot BAS-kontoplanen — granska innan jag bokför:`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveBatchBookingCard
                        title="Bokför 2 transaktioner"
                        description="Kjell & Company · Clas Ohlson"
                        items={[
                            { id: "t1", title: "Kjell & Company", subtitle: "5410 · Moms 25%", rightValue: "2 499 kr" },
                            { id: "t2", title: "Clas Ohlson", subtitle: "6110 · Moms 25%", rightValue: "349 kr" },
                        ]}
                        totalLabel="Totalt att bokföra"
                        totalAmount="2 848 kr"
                        confirmLabel="Bokför båda"
                        icon={Receipt}
                        accent="blue"
                        completedAction="booked"
                        completedTitle="2 transaktioner bokförda"
                        onCancel={() => {}}
                        triggerEvent="sim:visa-transaktioner-confirm"
                    />
                ),
            },
        ],
    },
    // User confirms on the card
    { role: "user", content: "Kör!", delay: 2200 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:visa-transaktioner-confirm" },
            { type: "tool", name: "book_transaction", duration: 1600, resultLabel: "Bokförde 2 transaktioner" },
            {
                type: "stream",
                text: `À jour — inga fler obokförda.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [
                        { icon: "verification", title: "Kjell & Company förbrukningsinventarier", description: "A-49", amount: 2499, timestamp: "2026-03-25" },
                        { icon: "verification", title: "Clas Ohlson kontorsmaterial",             description: "A-50", amount: 349,  timestamp: "2026-03-20" },
                    ]}} />
                ),
            },
        ],
    },
]}

// ─── Scenario 2: Single booking with confirmation ───

const bokforKvitto: SimScript = [
    {
        role: "user",
        content: "Bokför det här kvittot från Kjell & Company på 2 499 kr",
        attachment: { name: "kvitto_kjell.jpg", type: "image/jpeg" },
    },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            { type: "tool", name: "lookup_bas_account", duration: 1100, resultLabel: "Hittade konto 5410" },
            {
                type: "stream",
                text: `Fixar — **Kjell & Company**.\n\n- Konto: **5410** Förbrukningsinventarier\n- Moms: 25% (499,80 kr ingående)\n\nStämmer, eller vill du ändra?`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveActionConfirmCard
                        title="Bokför kvitto"
                        description="Kjell & Company — kontorsmaterial"
                        properties={[
                            { label: "Leverantör", value: "Kjell & Company" },
                            { label: "Belopp", value: "2 499 kr" },
                            { label: "Konto", value: "5410 Förbrukningsinventarier" },
                            { label: "Moms", value: "25% (499,80 kr)" },
                            { label: "Datum", value: "2026-03-25" },
                        ]}
                        confirmLabel="Bokför"
                        icon={Receipt}
                        accent="blue"
                        completedAction="booked"
                        completedTitle="Kvitto bokfört"
                        onCancel={() => {}}
                        triggerEvent="sim:bokfor-kvitto-confirm"
                    />
                ),
            },
        ],
    },
    { role: "user", content: "Ja, stämmer — bokför!", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:bokfor-kvitto-confirm" },
            { type: "tool", name: "book_receipt_with_verification", duration: 1400, resultLabel: "Kvitto bokfört" },
            {
                type: "stream",
                text: `Klart — verifikation skapad.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <Block block={{ rows: [{ icon: "verification", title: "Kjell & Company kontorsmaterial", description: "A-49", amount: 2499, timestamp: "2026-03-25" }] }} />
                ),
            },
        ],
    },
]

// ─── Scenario 3: Batch booking ───

const batchBokforing: SimScript = [
    { role: "user", content: "Bokför alla obokförda transaktioner" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "get_transactions", duration: 1200, resultLabel: "Hämtade 3 obokförda" },
            { type: "tool", name: "lookup_bas_account", duration: 1500, resultLabel: "Matchade BAS-konton" },
            {
                type: "stream",
                text: `**3 obokförda** — matchade mot BAS-kontoplanen:\n\n- Kjell & Company → **5410**\n- Clas Ohlson → **5410**\n- Spotify Business → **5420**\n\nGranska och bekräfta:`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <InteractiveBatchBookingCard
                        title="Bokför 3 transaktioner"
                        description="Verifikation A-49 till A-51"
                        icon={Receipt}
                        accent="blue"
                        completedAction="booked"
                        completedTitle="3 transaktioner bokförda"
                        items={[
                            { id: "t1", title: "Kjell & Company — Kontorsmaterial", subtitle: "5410 · Moms 25% · 2026-03-25", rightValue: "2 499 kr" },
                            { id: "t2", title: "Clas Ohlson — Förbrukningsinventarier", subtitle: "5410 · Moms 25% · 2026-03-20", rightValue: "349 kr" },
                            { id: "t3", title: "Spotify Business — Programvara", subtitle: "5420 · Moms 25% · 2026-03-18", rightValue: "169 kr" },
                        ]}
                        totalLabel="Totalt belopp"
                        totalAmount="3 017 kr"
                        confirmLabel="Bokför alla"
                        triggerEvent="sim:batch-bokforing-confirm"
                        onCancel={() => {}}
                    />
                ),
            },
        ],
    },
    // User confirms
    { role: "user", content: "Ser bra ut, kör!", delay: 2500 },
    {
        role: "scooby",
        elements: [
            { type: "fire-event", eventName: "sim:batch-bokforing-confirm" },
            { type: "tool", name: "book_transaction", duration: 2200, resultLabel: "Bokförde 3 transaktioner" },
            {
                type: "stream",
                text: `Klart!\n\n- **A-49** till **A-51** skapade\n- Totalt: 3 017 kr\n- Konto 5410 + 5420\n\nÀ jour.`,
                speed: 11,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <Block block={{ rows: [
                        { icon: "verification", title: "Kjell & Company",  description: "A-49", amount: 2499, timestamp: "2026-03-25" },
                        { icon: "verification", title: "Clas Ohlson",      description: "A-50", amount: 349,  timestamp: "2026-03-20" },
                        { icon: "verification", title: "Spotify Business", description: "A-51", amount: 169,  timestamp: "2026-03-18" },
                    ]}} />
                ),
            },
        ],
    },
]

// ─── Page ───

export default function TransaktionerStreamingPage() {
    const [openWalkthrough, setOpenWalkthrough] = useState<WalkthroughType | null>(null)

    const visaTransaktionerScript = buildVisaTransaktionerScript(setOpenWalkthrough)

    return (
        <ScenarioPage
            title="Transaktioner"
            subtitle="Hur Scooby visar, bokför och batch-hanterar transaktioner."
            backHref="/test-ui/streaming/bokforing"
            backLabel="Bokföring"
        >
            <Scenario title="Visa transaktioner" description="Läs-scenario → skrivscenario — hämtar data, sedan bokför" badges={["Alla"]}>
                <SimulatedConversation script={visaTransaktionerScript} />
            </Scenario>

            <Scenario title="Bokför kvitto" description="Skriv-scenario — single booking med bekräftelse" badges={["Alla"]}>
                <SimulatedConversation script={bokforKvitto} />
            </Scenario>

            <Scenario title="Batch-bokföring" description="Skriv-scenario — flera transaktioner på en gång" badges={["Alla"]}>
                <SimulatedConversation script={batchBokforing} />
            </Scenario>

            <WalkthroughOverlay type={openWalkthrough} onClose={() => setOpenWalkthrough(null)} />
        </ScenarioPage>
    )
}
