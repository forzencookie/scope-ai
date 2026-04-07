"use client"

/**
 * AI Streaming: Händelser → Händelser & Månadsavslut
 *
 * Complete conversations with simulated streaming:
 * 1. READ: "Vad behöver jag göra?" — status checklist card
 * 2. WRITE: "Kör månadsavslut" — tool calls + checklist + confirmations
 * 3. READ: "Vilka deadlines har jag?" — upcoming deadlines overview
 */

import { CalendarCheck } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { CardRenderer } from "@/components/ai/card-renderer"

// ─── Scenario 1: READ — "Vad behöver jag göra?" ───

const vadBehovs: SimScript = [
    { role: "user", content: "Vad behöver jag göra den här månaden?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "get_events", duration: 1200 },
            { type: "tool", name: "get_upcoming_deadlines", duration: 900 },
            {
                type: "stream",
                text: `Här är en översikt av vad som behöver göras i **april 2026**:`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <div className="max-w-lg">
                        <CardRenderer display={{
                            type: "activityfeed",
                            data: {
                                title: "Att göra — april 2026",
                                description: "5 punkter kvar",
                                events: [
                                    { id: "1", action: "error", entityType: "check", title: "3 obokförda transaktioner", description: "Från mars — behöver bokföras innan periodslutet", timestamp: null },
                                    { id: "2", action: "warning", entityType: "check", title: "Momsdeklaration Q1", description: "Deadline 12 maj — underlag behöver förberedas", timestamp: null },
                                    { id: "3", action: "pending", entityType: "check", title: "Löner april", description: "Ska köras senast 25 april", timestamp: null },
                                    { id: "4", action: "pending", entityType: "check", title: "Avskrivningar mars", description: "Inte körda ännu — 2 083 kr", timestamp: null },
                                    { id: "5", action: "done", entityType: "check", title: "AGI mars inrapporterad", description: "Skickad 2026-04-03", timestamp: null },
                                ],
                            },
                        }} />
                    </div>
                ),
            },
            {
                type: "stream",
                text: `De **3 obokförda transaktionerna** är mest brådskande — vill du att jag bokför dem nu?`,
                speed: 14,
            },
        ],
    },
    // User follows up
    { role: "user", content: "Ja, bokför dem", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "get_transactions", duration: 1100 },
            { type: "tool", name: "lookup_bas_account", duration: 900 },
            { type: "tool", name: "book_transaction", duration: 1800 },
            {
                type: "stream",
                text: `Alla 3 bokförda:

- **Kjell & Company** — 2 499 kr → Konto 5410 → Verifikation **A-49**
- **Clas Ohlson** — 349 kr → Konto 6110 → Verifikation **A-50**
- **Spotify Business** — 169 kr → Konto 5420 → Verifikation **A-51**

Det var allt som var obokfört. Nu kan vi gå vidare med månadsavslutet när du är redo.`,
                speed: 11,
            },
        ],
    },
]

// ─── Scenario 2: WRITE — "Kör månadsavslut" ───

const manadsavslut: SimScript = [
    { role: "user", content: "Kör månadsavslut för mars" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 1000 },
            { type: "tool", name: "get_transactions", duration: 1300 },
            { type: "tool", name: "get_verifications", duration: 1100 },
            { type: "tool", name: "get_balance_sheet", duration: 1500 },
            {
                type: "stream",
                text: `Jag har granskat mars och hittar **4 punkter** att åtgärda innan vi stänger perioden:`,
                speed: 12,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <div className="max-w-lg">
                        <CardRenderer display={{
                            type: "activityfeed",
                            data: {
                                title: "Månadsavslut mars 2026",
                                description: "4 punkter att granska",
                                events: [
                                    { id: "1", action: "done", entityType: "check", title: "Alla kvitton bokförda", description: null, timestamp: null },
                                    { id: "2", action: "warning", entityType: "check", title: "Momsavstämning", description: "Differens 340 kr mellan konto 2641 och beräknad moms", timestamp: null },
                                    { id: "3", action: "error", entityType: "check", title: "Periodisering försäkring", description: "9 månader kvar att periodisera av 12 000 kr", timestamp: null },
                                    { id: "4", action: "done", entityType: "check", title: "Avskrivningar körda", description: "2 083 kr bokfört", timestamp: null },
                                ],
                            },
                        }} />
                    </div>
                ),
            },
            {
                type: "stream",
                text: `Jag kan fixa **periodiseringen** åt dig (1 000 kr/mån). Momsavstämningen kräver manuell granskning.`,
                speed: 12,
            },
            {
                type: "card",
                delay: 300,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Periodisera försäkring",
                            description: "Fördela 12 000 kr över 12 månader",
                            summary: [
                                { label: "Belopp/mån", value: "1 000 kr" },
                                { label: "Konto debet", value: "6310 Försäkringar" },
                                { label: "Konto kredit", value: "1790 Förutbet. kostnader" },
                                { label: "Period", value: "Mars 2026" },
                            ],
                            action: { toolName: "create_verification", params: {} },
                        }}
                        confirmLabel="Periodisera"
                        icon={CalendarCheck}
                        accent="indigo"
                        isDone={false}
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
        ],
    },
    // User confirms periodization
    { role: "user", content: "Periodisera", delay: 2500 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "create_verification", duration: 1600 },
            {
                type: "stream",
                text: `Periodisering bokförd. Verifikation **A-50** skapad — 1 000 kr från konto 1790 till 6310.

Mars är nu redo att stängas — alla poster är i ordning förutom momsdifferensen (340 kr) som du bör granska manuellt. Vill du att jag stänger perioden?`,
                speed: 11,
            },
        ],
    },
    { role: "user", content: "Ja, stäng mars", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "close_period", duration: 1200 },
            {
                type: "stream",
                text: `Mars 2026 är nu stängd. Inga fler bokföringar kan göras i perioden utan att först öppna den igen. Bra jobbat!`,
                speed: 12,
            },
        ],
    },
]

// ─── Scenario 3: READ — Deadlines ───

const deadlines: SimScript = [
    { role: "user", content: "Vilka deadlines har jag?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 700 },
            { type: "tool", name: "get_upcoming_deadlines", duration: 800 },
            {
                type: "stream",
                text: `Här är dina **kommande deadlines**:

| Datum | Vad | Status |
|---|---|---|
| **12 apr** | AGI april (arbetsgivardeklaration) | Inte påbörjad |
| **25 apr** | Löner april | Inte påbörjad |
| **12 maj** | Momsdeklaration Q1 | Underlag behövs |
| **30 jun** | Inkomstdeklaration 2025 | Inte påbörjad |
| **30 jun** | Årsredovisning 2025 | Inte påbörjad |

**Närmast:** AGI april om 6 dagar. Vill du att jag förbereder den?`,
                speed: 11,
            },
        ],
    },
    // User follows up
    { role: "user", content: "Ja, förbered AGI", delay: 2200 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "get_payroll_data", duration: 1300 },
            { type: "tool", name: "calculate_employer_contributions", duration: 1500 },
            {
                type: "stream",
                text: `AGI för april 2026 förberedd:

| Post | Belopp |
|---|---|
| Bruttolöner | 45 000 kr |
| Arbetsgivaravgifter (31,42%) | 14 139 kr |
| Avdragen skatt | 10 350 kr |
| **Totalt att betala** | **24 489 kr** |

Underlaget är redo. Vill du att jag skickar in det till Skatteverket?`,
                speed: 11,
            },
        ],
    },
]

// ─── Page ───

export default function HandelserStreamingPage() {
    return (
        <ScenarioPage
            title="Händelser & Månadsavslut"
            subtitle="Hur Scooby hanterar uppgifter, status-checkar och månadsavslut."
            backHref="/test-ui/ai-streaming/handelser"
            backLabel="Händelser"
        >
            <Scenario title="Vad behöver jag göra?" description="Läs-scenario — statusöversikt med checklista" badges={["Alla"]}>
                <SimulatedConversation script={vadBehovs} />
            </Scenario>

            <Scenario title="Kör månadsavslut" description="Skriv-scenario — steg-för-steg checklist med bekräftelser" badges={["Alla"]}>
                <SimulatedConversation script={manadsavslut} autoPlayDelay={2000} />
            </Scenario>

            <Scenario title="Kommande deadlines" description="Läs-scenario — tidslinje med viktiga datum" badges={["Alla"]}>
                <SimulatedConversation script={deadlines} autoPlayDelay={4000} />
            </Scenario>
        </ScenarioPage>
    )
}
