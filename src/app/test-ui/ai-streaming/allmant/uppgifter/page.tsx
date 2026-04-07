"use client"

/**
 * AI Streaming: Allmänt → Uppgifter & Påminnelser
 *
 * Shows how Scooby handles:
 * - Saving reminders/tasks (confirmation card)
 * - Showing pending tasks (status checklist)
 * - Onboarding (structured checklist + guidance)
 *
 * Scenarios:
 * 1. "Kom ihåg att fakturera Acme" — task save confirmation
 * 2. "Vad har jag kvar att göra?" — status checklist
 * 3. "Jag har precis startat mitt företag" — onboarding guidance
 */

import Link from "next/link"
import { ArrowLeft, ListChecks, Rocket } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AiProcessingState } from "@/components/shared/ai-processing-state"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { CardRenderer } from "@/components/ai/card-renderer"

function UserMessage({ children }: { children: string }) {
    return (
        <div className="flex justify-end">
            <div className="px-3.5 py-2 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground text-sm max-w-[85%]">{children}</div>
        </div>
    )
}

function ScoobyMessage({ children }: { children: React.ReactNode }) {
    return <div className="space-y-3 max-w-[90%]">{children}</div>
}

function Markdown({ text }: { text: string }) {
    return (
        <div className="prose prose-sm dark:prose-invert prose-p:my-1.5 prose-li:my-0.5 prose-headings:mb-2 prose-headings:mt-4 max-w-none text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
    )
}

function Scenario({ title, description, badges, children }: { title: string; description: string; badges?: string[]; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="text-sm font-semibold">{title}</h3>
                <span className="text-xs text-muted-foreground">{description}</span>
                {badges?.map(b => <span key={b} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{b}</span>)}
            </div>
            <div className="rounded-xl border bg-card p-5 space-y-5">{children}</div>
        </div>
    )
}

export default function UppgifterStreamingPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
                <div>
                    <Link href="/test-ui/ai-streaming/allmant" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Allmänt
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Uppgifter & Påminnelser</h1>
                    <p className="text-sm text-muted-foreground mt-1">Hur Scooby sparar påminnelser, visar uppgifter och guidar nya användare.</p>
                </div>

                {/* Scenario 1: Save reminder */}
                <Scenario title="Spara påminnelse" description="Skriv-scenario — Scooby sparar en uppgift" badges={["Alla"]}>
                    <UserMessage>Kom ihåg att fakturera Acme nästa tisdag</UserMessage>
                    <ScoobyMessage>
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

                        <Markdown text={`Noterat ✅ Jag påminner dig tisdag 8 april om att fakturera Acme.`} />
                    </ScoobyMessage>
                </Scenario>

                {/* Scenario 2: Show pending tasks */}
                <Scenario title="Visa uppgifter" description="Läs-scenario — statusöversikt av allt som behöver göras" badges={["Alla"]}>
                    <UserMessage>Vad har jag kvar att göra?</UserMessage>
                    <ScoobyMessage>
                        <AiProcessingState toolName="get_events" completed />
                        <AiProcessingState toolName="query_memories" completed />

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

                        <Markdown text={`De **3 obokförda transaktionerna** blockerar månadsstängning — vill du att jag bokför dem nu?`} />
                    </ScoobyMessage>
                </Scenario>

                {/* Scenario 3: Onboarding */}
                <Scenario title="Onboarding — ny användare" description="Guidning — strukturerad checklista för att komma igång" badges={["Alla"]}>
                    <UserMessage>Jag har precis startat mitt aktiebolag, hur kommer jag igång?</UserMessage>
                    <ScoobyMessage>
                        <Markdown text={`Grattis till det nya bolaget! 🎉 Här är vad du behöver göra för att komma igång med bokföringen:

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

> 💡 *Första steget:* Berätta ditt organisationsnummer så kopplar jag upp allt.`} />
                    </ScoobyMessage>
                </Scenario>
            </div>
        </div>
    )
}
