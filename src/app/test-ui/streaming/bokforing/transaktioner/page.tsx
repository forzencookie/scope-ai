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
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { BatchConfirmationCard } from "@/components/ai/confirmations/batch-confirmation-card"
import { InlineCardRenderer } from "@/components/ai/cards/inline"

// ─── Interactive confirmation card — holds isDone state internally.
//     Transitions to post-confirm either on button click OR when the simulation
//     fires a named event via the SimEvent bus (triggerEvent prop). ───
function InteractiveConfirmationCard(
    props: Omit<ComponentProps<typeof ConfirmationCard>, "isDone" | "onConfirm"> & {
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
        <ConfirmationCard
            {...rest}
            isDone={isDone}
            completedAction={isDone ? rest.completedAction : undefined}
            completedTitle={isDone ? rest.completedTitle : undefined}
            onConfirm={() => setClickedDone(true)}
        />
    )
}

function InteractiveBatchConfirmationCard(
    props: Omit<ComponentProps<typeof BatchConfirmationCard>, "isDone" | "onConfirm"> & {
        triggerEvent?: string
    }
) {
    const { triggerEvent, ...rest } = props
    const [clickedDone, setClickedDone] = useState(false)
    const eventTriggered = useSimEvent(triggerEvent)
    const isDone = clickedDone || eventTriggered

    return (
        <BatchConfirmationCard
            {...rest}
            isDone={isDone}
            completedAction={isDone ? rest.completedAction : undefined}
            completedTitle={isDone ? rest.completedTitle : undefined}
            onConfirm={() => setClickedDone(true)}
        />
    )
}

// ─── Scenario 1: Read → then write ───

const visaTransaktioner: SimScript = [
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
                type: "card-list",
                delay: 200,
                items: [
                    <InlineCardRenderer card={{ cardType: "transaction", data: { id: "t1", description: "Kontorshyra april", amount: 8500, date: "2026-04-01", status: "Bokförd" } }} />,
                    <InlineCardRenderer card={{ cardType: "transaction", data: { id: "t2", description: "Svea Hosting — webbhotell", amount: 1499, date: "2026-03-28", status: "Bokförd" } }} />,
                    <InlineCardRenderer card={{ cardType: "transaction", data: { id: "t3", description: "Kjell & Company", amount: 2499, date: "2026-03-25", status: "Obokförd" } }} />,
                    <InlineCardRenderer card={{ cardType: "transaction", data: { id: "t4", description: "Postnord — Porto", amount: 89, date: "2026-03-22", status: "Bokförd" } }} />,
                    <InlineCardRenderer card={{ cardType: "transaction", data: { id: "t5", description: "Clas Ohlson — kontorsmaterial", amount: 349, date: "2026-03-20", status: "Obokförd" } }} />,
                ],
            },
            {
                type: "stream",
                text: `Förslag på de obokförda:\n- **Kjell & Company** → konto 5410, 25% moms\n- **Clas Ohlson** → konto 6110, 25% moms\n\nSkal jag köra dem?`,
                speed: 14,
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
                    <InteractiveBatchConfirmationCard
                        title="Bokför 2 transaktioner"
                        description="Kjell & Company · Clas Ohlson"
                        items={[
                            { id: "t1", label: "Kjell & Company", description: "5410 · 2 499 kr · 25% moms", status: "pending", checked: true },
                            { id: "t2", label: "Clas Ohlson", description: "6110 · 349 kr · 25% moms", status: "pending", checked: true },
                        ]}
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
                type: "card-list",
                delay: 200,
                items: [
                    <InlineCardRenderer card={{ cardType: "verification", isNew: true, data: { id: "v-49", verificationNumber: "A-49", date: "2026-03-25", description: "Kjell & Company förbrukningsinventarier", amount: 2499 } }} />,
                    <InlineCardRenderer card={{ cardType: "verification", isNew: true, data: { id: "v-50", verificationNumber: "A-50", date: "2026-03-20", description: "Clas Ohlson kontorsmaterial", amount: 349 } }} />,
                ],
            },
        ],
    },
]

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
            { type: "tool", name: "search_tools", duration: 500, resultLabel: "Sökte bland verktyg" },
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
                    <InteractiveConfirmationCard
                        confirmation={{
                            title: "Bokför kvitto",
                            description: "Kjell & Company — kontorsmaterial",
                            summary: [
                                { label: "Leverantör", value: "Kjell & Company" },
                                { label: "Belopp", value: "2 499 kr" },
                                { label: "Konto", value: "5410 Förbrukningsinventarier" },
                                { label: "Moms", value: "25% (499,80 kr)" },
                                { label: "Datum", value: "2026-03-25" },
                            ],
                            action: { toolName: "book_receipt_with_verification", params: {} },
                        }}
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
                    <InlineCardRenderer card={{ cardType: "verification", isNew: true, data: { id: "v-49", verificationNumber: "A-49", date: "2026-03-25", description: "Kjell & Company kontorsmaterial", amount: 2499 } }} />
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
                    <InteractiveBatchConfirmationCard
                        title="Bokför 3 transaktioner"
                        description="Verifikation A-49 till A-51"
                        icon={Receipt}
                        accent="blue"
                        completedAction="booked"
                        completedTitle="3 transaktioner bokförda"
                        items={[
                            { id: "t1", label: "Kjell & Company — Kontorsmaterial", description: "5410 · Moms 25% · 2026-03-25", status: "pending", checked: true },
                            { id: "t2", label: "Clas Ohlson — Förbrukningsinventarier", description: "5410 · Moms 25% · 2026-03-20", status: "pending", checked: true },
                            { id: "t3", label: "Spotify Business — Programvara", description: "5420 · Moms 25% · 2026-03-18", status: "pending", checked: true },
                        ]}
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
                type: "card-list",
                delay: 200,
                items: [
                    <InlineCardRenderer card={{ cardType: "verification", isNew: true, data: { id: "v-49", verificationNumber: "A-49", date: "2026-03-25", description: "Kjell & Company", amount: 2499 } }} />,
                    <InlineCardRenderer card={{ cardType: "verification", isNew: true, data: { id: "v-50", verificationNumber: "A-50", date: "2026-03-20", description: "Clas Ohlson", amount: 349 } }} />,
                    <InlineCardRenderer card={{ cardType: "verification", isNew: true, data: { id: "v-51", verificationNumber: "A-51", date: "2026-03-18", description: "Spotify Business", amount: 169 } }} />,
                ],
            },
        ],
    },
]

// ─── Page ───

export default function TransaktionerStreamingPage() {
    return (
        <ScenarioPage
            title="Transaktioner"
            subtitle="Hur Scooby visar, bokför och batch-hanterar transaktioner."
            backHref="/test-ui/streaming/bokforing"
            backLabel="Bokföring"
        >
            <Scenario title="Visa transaktioner" description="Läs-scenario → skrivscenario — hämtar data, sedan bokför" badges={["Alla"]}>
                <SimulatedConversation script={visaTransaktioner} />
            </Scenario>

            <Scenario title="Bokför kvitto" description="Skriv-scenario — single booking med bekräftelse" badges={["Alla"]}>
                <SimulatedConversation script={bokforKvitto} />
            </Scenario>

            <Scenario title="Batch-bokföring" description="Skriv-scenario — flera transaktioner på en gång" badges={["Alla"]}>
                <SimulatedConversation script={batchBokforing} />
            </Scenario>
        </ScenarioPage>
    )
}
