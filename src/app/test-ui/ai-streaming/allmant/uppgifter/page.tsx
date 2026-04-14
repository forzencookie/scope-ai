"use client"

import { ListChecks } from "lucide-react"
import { SimulatedConversation, Scenario, ScenarioPage, type SimScript } from "../../_shared/simulation"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { CardRenderer } from "@/components/ai/card-renderer"

const sparaPaminnelse: SimScript = [
    { role: "user", content: "Kom ihåg att fakturera Acme nästa tisdag" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 500 },
            {
                type: "stream",
                text: `Jag sparar en påminnelse åt dig.`,
                speed: 14,
            },
            {
                type: "card",
                delay: 200,
                content: (
                    <ConfirmationCard
                        confirmation={{
                            title: "Spara påminnelse",
                            description: "Fakturera Acme AB",
                            summary: [
                                { label: "Uppgift", value: "Fakturera Acme AB" },
                                { label: "Datum", value: "Tisdag 8 april 2026" },
                                { label: "Typ", value: "Påminnelse" },
                            ],
                            action: { toolName: "save_memory", params: {} },
                        }}
                        confirmLabel="Spara"
                        icon={ListChecks}
                        accent="blue"
                        isDone
                        onConfirm={() => {}}
                        onCancel={() => {}}
                    />
                ),
            },
            {
                type: "stream",
                text: `Noterat! Jag påminner dig tisdag 8 april om att fakturera Acme.`,
                speed: 12,
            },
        ],
    },
]

const visaUppgifter: SimScript = [
    { role: "user", content: "Vad har jag kvar att göra?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 800 },
            { type: "tool", name: "get_events", duration: 1200, resultLabel: "Hämtade händelser" },
            { type: "tool", name: "query_memories", duration: 900, resultLabel: "Kollade påminnelser" },
            {
                type: "stream",
                text: `Här är allt som behöver uppmärksamhet just nu:`,
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
                                title: "Att göra",
                                description: "7 saker som behöver uppmärksamhet",
                                events: [
                                    { id: "1", action: "error", entityType: "check", title: "3 obokförda transaktioner", description: "Från mars — blockerar månadsavslut", timestamp: null },
                                    { id: "2", action: "warning", entityType: "check", title: "Momsdeklaration Q1", description: "Deadline 12 maj — underlag behövs", timestamp: null },
                                    { id: "3", action: "pending", entityType: "check", title: "Fakturera Acme AB", description: "Din påminnelse — tisdag 8 april", timestamp: null },
                                    { id: "4", action: "pending", entityType: "check", title: "Löner april", description: "Kör senast 25 april", timestamp: null },
                                    { id: "5", action: "pending", entityType: "check", title: "AGI april", description: "Deadline 12 maj", timestamp: null },
                                    { id: "6", action: "pending", entityType: "check", title: "Avskrivningar mars", description: "2 083 kr — inte körd ännu", timestamp: null },
                                    { id: "7", action: "done", entityType: "check", title: "AGI mars", description: "Skickad 3 april", timestamp: null },
                                ],
                            },
                        }} />
                    </div>
                ),
            },
            {
                type: "stream",
                text: `De **3 obokförda transaktionerna** blockerar månadsstängning — vill du att jag bokför dem nu?`,
                speed: 11,
            },
        ],
    },
    { role: "user", content: "Ja, bokför dem", delay: 2000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "get_transactions", duration: 1100, resultLabel: "Hämtade 3 obokförda" },
            { type: "tool", name: "lookup_bas_account", duration: 800, resultLabel: "Matchade BAS-konton" },
            { type: "tool", name: "book_transaction", duration: 1800, resultLabel: "Bokförde 3 transaktioner" },
            {
                type: "stream",
                text: `Klart!\n- **A-47** till **A-49** skapade\n- Mars kan nu stängas\n\nKör månadsstängningen?`,
                speed: 11,
            },
        ],
    },
]

const onboarding: SimScript = [
    { role: "user", content: "Jag har precis startat mitt aktiebolag, hur kommer jag igång?" },
    {
        role: "scooby",
        elements: [
            { type: "thinking", duration: 1000 },
            { type: "tool", name: "get_knowledge", duration: 800, resultLabel: "Hämtade onboarding-guide" },
            {
                type: "stream",
                text: `Grattis! Här är vad som behövs för att komma igång:

### Steg 1 — Grunduppgifter

Det här behöver jag veta om ditt bolag för att kunna hjälpa dig:

- **Organisationsnummer** — hittar du på verksamt.se
- **Företagsnamn** — det registrerade namnet
- **Räkenskapsår** — vanligast är kalenderår (jan–dec)
- **Momsperiod** — kvartalsvis om omsättning under 40 mkr

### Steg 2 — Bankkoppling

Koppla ditt företagskonto så att transaktioner hämtas automatiskt. Jag matchar dem mot rätt konto och du godkänner.

### Steg 3 — Första bokföringarna

De vanligaste för ett nystartat bolag:

1. **Aktiekapitalet** — 25 000 kr insatt på företagskontot
2. **Startavgifter** — registrering hos Bolagsverket (2 200 kr)
3. **Eventuella inköp** — dator, möbler, programvara

### Steg 4 — Löpande

När grunderna är på plats tar jag hand om resten. Skicka kvitton, säg "bokför" — jag sköter kontoplanen, momsen och verifikationerna.

> *Första steget:* Berätta ditt organisationsnummer så kopplar jag upp allt.`,
                speed: 8,
            },
        ],
    },
    { role: "user", content: "Mitt orgnr är 559234-5678", delay: 3000 },
    {
        role: "scooby",
        elements: [
            { type: "tool", name: "lookup_company", duration: 1500, resultLabel: "Hämtade Nystart Tech AB" },
            {
                type: "stream",
                text: `Hittade det! **Nystart Tech AB** (559234-5678), registrerat 2026-03-15. Räkenskapsår jan–dec.

Jag har ställt in grunderna:
- **Kontoplan:** BAS 2026 (standard)
- **Momsperiod:** Kvartalsvis
- **Verifikationsserie:** A (löpande)

Nästa steg: Vill du bokföra aktiekapitalet (25 000 kr) direkt?`,
                speed: 10,
            },
        ],
    },
]

export default function UppgifterStreamingPage() {
    return (
        <ScenarioPage
            title="Uppgifter & Påminnelser"
            subtitle="Hur Scooby sparar påminnelser, visar uppgifter och guidar nya användare."
            backHref="/test-ui/ai-streaming/allmant"
            backLabel="Allmänt"
        >
            <Scenario title="Spara påminnelse" description="Skriv-scenario — Scooby sparar en uppgift" badges={["Alla"]}>
                <SimulatedConversation script={sparaPaminnelse} />
            </Scenario>

            <Scenario title="Visa uppgifter" description="Läs-scenario — statusöversikt + åtgärda direkt" badges={["Alla"]}>
                <SimulatedConversation script={visaUppgifter} />
            </Scenario>

            <Scenario title="Onboarding — ny användare" description="Guidning — strukturerad checklista för att komma igång" badges={["Alla"]}>
                <SimulatedConversation script={onboarding} />
            </Scenario>
        </ScenarioPage>
    )
}
