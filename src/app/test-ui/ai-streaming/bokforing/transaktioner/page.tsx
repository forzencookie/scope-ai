"use client"

/**
 * AI Streaming: Bokföring → Transaktioner
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Visa mina transaktioner" → shows data → user asks to book → books them
 * 2. WRITE: "Bokför det här kvittot" → finds account → confirmation → done
 * 3. WRITE: "Bokför alla obokförda" → batch confirmation → all booked
 */

import { Receipt } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { AiProcessingState } from "@/components/shared/ai-processing-state"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { InlineCardRenderer } from "@/components/ai/cards/inline"

// ─── Scenario 1: Read → then write ───

const visaTransaktioner: SimScript = [
    { role: "user", content: "Visa mina senaste transaktioner" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "get_transactions", duration: 1400 },
            {
                type: "stream",
                text: `Här är dina **5 senaste transaktioner**. De flesta är bokförda, men du har **2 obokförda** som vi bör ta hand om.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <div className="space-y-1">
                        <InlineCardRenderer card={{ cardType: "transaction", data: { id: "t1", description: "Kontorshyra april", amount: 8500, date: "2026-04-01", status: "Bokförd" } }} />
                        <InlineCardRenderer card={{ cardType: "transaction", data: { id: "t2", description: "Svea Hosting — webbhotell", amount: 1499, date: "2026-03-28", status: "Bokförd" } }} />
                        <InlineCardRenderer card={{ cardType: "transaction", data: { id: "t3", description: "Kjell & Company", amount: 2499, date: "2026-03-25", status: "Obokförd" } }} />
                        <InlineCardRenderer card={{ cardType: "transaction", data: { id: "t4", description: "Postnord — Porto", amount: 89, date: "2026-03-22", status: "Bokförd" } }} />
                        <InlineCardRenderer card={{ cardType: "transaction", data: { id: "t5", description: "Clas Ohlson — kontorsmaterial", amount: 349, date: "2026-03-20", status: "Obokförd" } }} />
                    </div>
                ),
            },
            {
                type: "stream",
                text: `Vill du att jag bokför de **2 obokförda** transaktionerna?`,
                speed: 14,
            },
        ],
    },
    // User continues the conversation
    { role: "user", content: "Ja, bokför dem", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "lookup_bas_account", duration: 900 },
            { type: "tool", name: "book_transaction", duration: 1600 },
            {
                type: "stream",
                text: `Klart! Båda transaktionerna bokförda:

- **Kjell & Company** — 2 499 kr → Konto 5410 (Förbrukningsinventarier) → Verifikation **A-49**
- **Clas Ohlson** — 349 kr → Konto 6110 (Kontorsmaterial) → Verifikation **A-50**

Alla transaktioner är nu bokförda.`,
                speed: 10,
            },
        ],
    },
]

// ─── Scenario 2: Single booking with confirmation ───

const bokforKvitto: SimScript = [
    { role: "user", content: "Bokför det här kvittot från Kjell & Company på 2 499 kr" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 600 },
            { type: "tool", name: "search_tools", duration: 500 },
            { type: "tool", name: "lookup_bas_account", duration: 1100 },
            {
                type: "stream",
                text: `Jag har hittat rätt konto. **Kjell & Company** ser ut som kontorsmaterial, konto **5410**.\n\nHär är förslaget — stämmer det?`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
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
                        isDone
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Kvitto bokfört! Verifikation **A-49** skapad — 2 499 kr på konto 5410 med 25% ingående moms.`,
                speed: 12,
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
            { type: "tool", name: "get_transactions", duration: 1200 },
            { type: "tool", name: "lookup_bas_account", duration: 1500 },
            {
                type: "stream",
                text: `Jag hittade **3 obokförda transaktioner** och har matchat konton åt dem. Granska listan:`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <div className="max-w-lg">
                        <div className="w-full max-w-md space-y-1 py-1">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 bg-blue-500/10">
                                    <Receipt className="h-3.5 w-3.5 text-blue-600 dark:text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Bokför 3 transaktioner</p>
                                    <p className="text-xs text-muted-foreground">Verifikation A-49 till A-51</p>
                                </div>
                            </div>
                            <div className="divide-y divide-border/60">
                                {[
                                    { vendor: "Kjell & Company", desc: "Kontorsmaterial", amount: "2 499 kr", account: "5410", moms: "25%", date: "2026-03-25" },
                                    { vendor: "Clas Ohlson", desc: "Förbrukningsinventarier", amount: "349 kr", account: "5410", moms: "25%", date: "2026-03-20" },
                                    { vendor: "Spotify Business", desc: "Programvara", amount: "169 kr", account: "5420", moms: "25%", date: "2026-03-18" },
                                ].map((item, i) => (
                                    <div key={i} className="py-2.5 first:pt-0">
                                        <div className="flex items-baseline justify-between mb-1">
                                            <p className="text-sm font-medium">{item.vendor} — {item.desc}</p>
                                            <p className="text-sm font-semibold tabular-nums ml-4 shrink-0">{item.amount}</p>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>{item.account}</span><span>·</span>
                                            <span>Moms {item.moms}</span><span>·</span>
                                            <span>{item.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-baseline justify-between pt-2 border-t text-sm font-semibold">
                                <span>Totalt</span>
                                <span className="tabular-nums">3 017 kr</span>
                            </div>
                        </div>
                    </div>
                ),
            },
        ],
    },
    // User confirms
    { role: "user", content: "Ser bra ut, kör!", delay: 2500 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "book_transaction", duration: 2200 },
            {
                type: "stream",
                text: `Alla 3 bokförda! Verifikation **A-49** till **A-51** skapade. Totalt 3 017 kr bokfört på kontona 5410 och 5420.`,
                speed: 11,
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
            backHref="/test-ui/ai-streaming/bokforing"
            backLabel="Bokföring"
        >
            <Scenario title="Visa transaktioner" description="Läs-scenario → skrivscenario — hämtar data, sedan bokför" badges={["Alla"]}>
                <SimulatedConversation script={visaTransaktioner} />
            </Scenario>

            <Scenario title="Bokför kvitto" description="Skriv-scenario — single booking med bekräftelse" badges={["Alla"]}>
                <SimulatedConversation script={bokforKvitto} autoPlayDelay={2000} />
            </Scenario>

            <Scenario title="Batch-bokföring" description="Skriv-scenario — flera transaktioner på en gång" badges={["Alla"]}>
                <SimulatedConversation script={batchBokforing} autoPlayDelay={4000} />
            </Scenario>
        </ScenarioPage>
    )
}
