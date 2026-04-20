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
import { ActionConfirmCard } from "@/components/ai/chat-tools/action-cards/action-confirm-card"
import { CardRenderer } from "@/components/ai/card-renderer"

// ─── Scenario 1: READ — "Vad behöver jag göra?" ───

const vadBehovs: SimScript = [
    { role: "user", content: "Vad behöver jag göra den här månaden?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "get_events", duration: 1200, resultLabel: "Hämtade händelser" },
            { type: "tool", name: "get_upcoming_deadlines", duration: 900, resultLabel: "Kollade deadlines" },
            {
                type: "stream",
                text: `**April 2026** — att göra:`,
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
            { type: "tool", name: "get_transactions", duration: 1100, resultLabel: "Hämtade 3 obokförda" },
            { type: "tool", name: "lookup_bas_account", duration: 900, resultLabel: "Matchade BAS-konton" },
            { type: "tool", name: "book_transaction", duration: 1800, resultLabel: "Bokförde 3 transaktioner" },
            {
                type: "stream",
                text: `Klart!\n\n- **Kjell & Company** → 5410 → **A-49**\n- **Clas Ohlson** → 6110 → **A-50**\n- **Spotify Business** → 5420 → **A-51**\n\nInget kvar obokfört — redo för månadsavslut.`,
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
            { type: "tool", name: "get_transactions", duration: 1300, resultLabel: "Kontrollerade transaktioner" },
            { type: "tool", name: "get_verifications", duration: 1100, resultLabel: "Kontrollerade verifikationer" },
            { type: "tool", name: "get_balance_sheet", duration: 1500, resultLabel: "Kontrollerade balansräkning" },
            {
                type: "stream",
                text: `Granskat mars — **4 punkter** att åtgärda:`,
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
                    <ActionConfirmCard
                        title="Periodisera försäkring"
                        description="Fördela 12 000 kr över 12 månader"
                        properties={[
                            { label: "Belopp/mån", value: "1 000 kr" },
                            { label: "Konto debet", value: "6310 Försäkringar" },
                            { label: "Konto kredit", value: "1790 Förutbet. kostnader" },
                            { label: "Period", value: "Mars 2026" },
                        ]}
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
            { type: "tool", name: "create_verification", duration: 1600, resultLabel: "Periodisering bokförd" },
            {
                type: "stream",
                text: `Klart!\n- Verifikation **A-50** skapad — 1 000 kr: 1790 → 6310\n- Mars redo att stängas\n- OBS: momsdifferens 340 kr kvar att granska manuellt\n\nStäng perioden?`,
                speed: 11,
            },
        ],
    },
    { role: "user", content: "Ja, stäng mars", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "close_period", duration: 1200, resultLabel: "Mars stängd" },
            {
                type: "stream",
                text: `**Mars 2026 stängd.**\nInga bokföringar möjliga utan att öppna perioden igen.`,
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
            { type: "stream", text: `Kollar dina kommande deadlines...`, speed: 20 },
            { type: "tool", name: "get_upcoming_deadlines", duration: 800, resultLabel: "Hämtade 5 deadlines" },
            {
                type: "stream",
                text: `Dina **5 kommande deadlines**:

- **12 apr** — AGI april (arbetsgivardeklaration) · Inte påbörjad
- **25 apr** — Löner april · Inte påbörjad
- **12 maj** — Momsdeklaration Q1 · Underlag behövs
- **30 jun** — Inkomstdeklaration 2025 · Inte påbörjad
- **30 jun** — Årsredovisning 2025 · Inte påbörjad

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
            { type: "tool", name: "get_payroll_data", duration: 1300, resultLabel: "Hämtade lönedata" },
            { type: "tool", name: "calculate_employer_contributions", duration: 1500, resultLabel: "AGI förberedd" },
            {
                type: "stream",
                text: `AGI april 2026 — förberedd:

- Bruttolöner: **45 000 kr**
- Arbetsgivaravgifter (31,42%): **14 139 kr**
- Avdragen skatt: **10 350 kr**
- **Totalt att betala: 24 489 kr**

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
            backHref="/test-ui/streaming/handelser"
            backLabel="Händelser"
        >
            <Scenario title="Vad behöver jag göra?" description="Läs-scenario — statusöversikt med checklista" badges={["Alla"]}>
                <SimulatedConversation script={vadBehovs} />
            </Scenario>

            <Scenario title="Kör månadsavslut" description="Skriv-scenario — steg-för-steg checklist med bekräftelser" badges={["Alla"]}>
                <SimulatedConversation script={manadsavslut} />
            </Scenario>

            <Scenario title="Kommande deadlines" description="Läs-scenario — tidslinje med viktiga datum" badges={["Alla"]}>
                <SimulatedConversation script={deadlines} />
            </Scenario>
        </ScenarioPage>
    )
}
