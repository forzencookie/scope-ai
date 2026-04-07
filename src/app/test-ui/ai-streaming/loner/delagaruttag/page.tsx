"use client"

/**
 * AI Streaming: Löner → Delägaruttag (HB/KB only)
 *
 * Scenarios:
 * 1. WRITE: "Jag vill ta ut 30 000 kr" — confirmation with account mapping
 * 2. READ: "Visa mina uttag i år" — overview with table
 * 3. WRITE: "Registrera privat insättning" — confirmation (reverse flow)
 */

import Link from "next/link"
import { ArrowLeft, Wallet, ArrowUpCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AiProcessingState } from "@/components/shared/ai-processing-state"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"

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

export default function DelagaruttagStreamingPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
                <div>
                    <Link href="/test-ui/ai-streaming/loner" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Löner
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Delägaruttag</h1>
                    <p className="text-sm text-muted-foreground mt-1">Hur Scooby registrerar uttag och insättningar i HB/KB.</p>
                </div>

                {/* Scenario 1: WRITE — Register withdrawal */}
                <Scenario title="Registrera uttag" description="Skriv-scenario — privat uttag från eget kapital" badges={["HB", "KB"]}>
                    <UserMessage>Jag vill ta ut 30 000 kr från företagskontot</UserMessage>
                    <ScoobyMessage>
                        <AiProcessingState toolName="search_tools" completed />
                        <AiProcessingState toolName="get_company_info" completed />

                        <Markdown text={`Jag registrerar det som ett **privat uttag** — det minskar ditt eget kapital i bolaget. Bokföring sker på konto **2013** (Egna uttag).`} />

                        <ConfirmationCard
                            confirmation={{
                                title: "Registrera privat uttag",
                                description: "Från företagskonto till privat",
                                summary: [
                                    { label: "Delägare", value: "Erik Svensson" },
                                    { label: "Belopp", value: "30 000 kr" },
                                    { label: "Konto debet", value: "2013 Egna uttag" },
                                    { label: "Konto kredit", value: "1930 Företagskonto" },
                                    { label: "Datum", value: "2026-04-06" },
                                    { label: "Saldo efter uttag", value: "145 200 kr" },
                                ],
                                action: { toolName: "book_partner_withdrawal", params: {} },
                            }}
                            confirmLabel="Registrera uttag"
                            icon={Wallet}
                            accent="blue"
                            isDone
                            onConfirm={() => {}}
                            onCancel={() => {}}
                        />

                        <Markdown text={`Uttag registrerat ✅ Verifikation **A-51**. Ditt eget kapital har minskat med 30 000 kr.

> 💡 *Kom ihåg:* I ett HB beskattas resultatet oavsett vad du tar ut — uttaget i sig är inte en skattepliktig händelse.`} />
                    </ScoobyMessage>
                </Scenario>

                {/* Scenario 2: READ — Show withdrawals */}
                <Scenario title="Visa uttag" description="Läs-scenario — årsöversikt av alla uttag och insättningar" badges={["HB", "KB"]}>
                    <UserMessage>Visa mina uttag i år</UserMessage>
                    <ScoobyMessage>
                        <AiProcessingState toolName="search_tools" completed />
                        <AiProcessingState toolName="get_transactions" completed />

                        <Markdown text={`Här är dina uttag och insättningar under **2026**:

| Datum | Typ | Belopp | Saldo efter |
|---|---|---|---|
| 2026-01-15 | Uttag | −25 000 kr | 230 000 kr |
| 2026-02-10 | Insättning | +50 000 kr | 280 000 kr |
| 2026-03-01 | Uttag | −40 000 kr | 240 000 kr |
| 2026-03-20 | Uttag | −15 000 kr | 225 000 kr |
| 2026-04-06 | Uttag | −30 000 kr | 195 000 kr |

**Totalt uttag:** 110 000 kr | **Insättningar:** 50 000 kr | **Netto:** −60 000 kr

Ditt eget kapital har minskat med 60 000 kr i år. Vill du se hur det påverkar balansräkningen?`} />
                    </ScoobyMessage>
                </Scenario>

                {/* Scenario 3: WRITE — Private deposit */}
                <Scenario title="Registrera insättning" description="Skriv-scenario — privat insättning (omvänt flöde)" badges={["HB", "KB"]}>
                    <UserMessage>Jag har satt in 20 000 kr av egna pengar på företagskontot</UserMessage>
                    <ScoobyMessage>
                        <AiProcessingState toolName="search_tools" completed />

                        <Markdown text={`Jag registrerar det som en **privat insättning** — det ökar ditt eget kapital. Bokföring sker på konto **2018** (Egna insättningar).`} />

                        <ConfirmationCard
                            confirmation={{
                                title: "Registrera privat insättning",
                                description: "Från privat till företagskonto",
                                summary: [
                                    { label: "Delägare", value: "Erik Svensson" },
                                    { label: "Belopp", value: "20 000 kr" },
                                    { label: "Konto debet", value: "1930 Företagskonto" },
                                    { label: "Konto kredit", value: "2018 Egna insättningar" },
                                    { label: "Datum", value: "2026-04-06" },
                                ],
                                action: { toolName: "book_partner_deposit", params: {} },
                            }}
                            confirmLabel="Registrera insättning"
                            icon={ArrowUpCircle}
                            accent="green"
                            isDone
                            onConfirm={() => {}}
                            onCancel={() => {}}
                        />

                        <Markdown text={`Insättning registrerad ✅ Verifikation **A-52**. Ditt eget kapital har ökat med 20 000 kr.`} />
                    </ScoobyMessage>
                </Scenario>
            </div>
        </div>
    )
}
