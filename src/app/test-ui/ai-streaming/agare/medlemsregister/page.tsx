"use client"

/**
 * AI Streaming: Ägare → Medlemsregister (Förening only)
 *
 * Scenarios:
 * 1. READ: "Visa medlemslistan" — table overview
 * 2. WRITE: "Lägg till en ny medlem" — confirmation
 */

import Link from "next/link"
import { ArrowLeft, UserPlus } from "lucide-react"
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

export default function MedlemsregisterStreamingPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
                <div>
                    <Link href="/test-ui/ai-streaming/agare" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Ägare
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Medlemsregister</h1>
                    <p className="text-sm text-muted-foreground mt-1">Hur Scooby hanterar medlemsregistret i en förening.</p>
                </div>

                {/* Scenario 1: READ */}
                <Scenario title="Visa medlemslistan" description="Läs-scenario — register över aktiva medlemmar" badges={["Förening"]}>
                    <UserMessage>Visa våra medlemmar</UserMessage>
                    <ScoobyMessage>
                        <AiProcessingState toolName="search_tools" completed />

                        <Markdown text={`Föreningen har **12 aktiva medlemmar**. Här är en sammanfattning:

| Namn | Inträde | Medlemsavgift | Status |
|---|---|---|---|
| Anna Karlsson | 2023-01 | 500 kr | ✅ Betald |
| Per Olsson | 2023-03 | 500 kr | ✅ Betald |
| Karin Ström | 2024-01 | 500 kr | ⚠️ Ej betald |
| Lars Bergqvist | 2024-06 | 500 kr | ✅ Betald |
| *...8 till* | | | |

**1 medlem** har inte betalat årsavgiften ännu (Karin Ström). Vill du att jag skickar en påminnelse?`} />
                    </ScoobyMessage>
                </Scenario>

                {/* Scenario 2: WRITE */}
                <Scenario title="Lägg till medlem" description="Skriv-scenario — ny medlem i registret" badges={["Förening"]}>
                    <UserMessage>Lägg till Sofia Andersson som ny medlem</UserMessage>
                    <ScoobyMessage>
                        <AiProcessingState toolName="search_tools" completed />

                        <Markdown text={`Jag lägger till Sofia Andersson i medlemsregistret. Årsavgiften är **500 kr** enligt stadgarna.`} />

                        <ConfirmationCard
                            confirmation={{
                                title: "Lägg till medlem",
                                description: "Sofia Andersson",
                                summary: [
                                    { label: "Namn", value: "Sofia Andersson" },
                                    { label: "Inträdesdatum", value: "2026-04-06" },
                                    { label: "Årsavgift", value: "500 kr" },
                                    { label: "Status", value: "Ej betald (ny)" },
                                ],
                                action: { toolName: "add_member", params: {} },
                            }}
                            confirmLabel="Lägg till"
                            icon={UserPlus}
                            accent="green"
                            isDone
                            onConfirm={() => {}}
                            onCancel={() => {}}
                        />

                        <Markdown text={`Medlem tillagd ✅ Sofia Andersson registrerad. Föreningen har nu **13 aktiva medlemmar**.`} />
                    </ScoobyMessage>
                </Scenario>
            </div>
        </div>
    )
}
