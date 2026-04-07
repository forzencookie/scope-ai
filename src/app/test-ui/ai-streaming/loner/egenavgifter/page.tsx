"use client"

/**
 * AI Streaming: Löner → Egenavgifter (EF only)
 *
 * Scenarios:
 * 1. READ: "Visa mina egenavgifter" — summary card + walkthrough opener
 * 2. WRITE: "Beräkna egenavgifter för 2026" — tool calls + detailed breakdown + walkthrough
 */

import Link from "next/link"
import { ArrowLeft, Calculator, ChevronRight } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AiProcessingState } from "@/components/shared/ai-processing-state"
import { CardRenderer } from "@/components/ai/card-renderer"
import { cn } from "@/lib/utils"

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

function WalkthroughOpenerCard({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <Link
            href="/test-ui/walkthroughs/egenavgifter"
            className="w-full max-w-md flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors group border border-border/60"
        >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 bg-amber-500/10">
                <Calculator className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-colors" />
        </Link>
    )
}

export default function EgenavgifterStreamingPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
                <div>
                    <Link href="/test-ui/ai-streaming/loner" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Löner
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Egenavgifter</h1>
                    <p className="text-sm text-muted-foreground mt-1">Hur Scooby beräknar och visar egenavgifter för enskild firma.</p>
                </div>

                {/* Scenario 1: READ — Current state */}
                <Scenario title="Visa egenavgifter" description="Läs-scenario — aktuell beräkning med summakort" badges={["EF"]}>
                    <UserMessage>Visa mina egenavgifter</UserMessage>
                    <ScoobyMessage>
                        <AiProcessingState toolName="search_tools" completed />
                        <AiProcessingState toolName="get_income_statement" completed />
                        <AiProcessingState toolName="calculate_tax" completed />

                        <Markdown text={`Baserat på ditt resultat hittills i år, här är en **preliminär beräkning** av dina egenavgifter:`} />

                        <div className="max-w-lg">
                            <CardRenderer display={{
                                type: "summary",
                                data: {
                                    title: "Egenavgifter 2026 (preliminärt)",
                                    items: [
                                        { label: "Årsresultat (prognos)", value: 485000 },
                                        { label: "Sjukpenninggrundande ink.", value: 485000 },
                                        { label: "Egenavgifter (31.42%)", value: 152363, highlight: true },
                                        { label: "Resultat efter avgifter", value: 332637 },
                                    ],
                                },
                            }} />
                        </div>

                        <Markdown text={`Klicka på kortet nedan för att se den fullständiga uppdelningen med alla delposter.`} />

                        <WalkthroughOpenerCard
                            title="Egenavgifter 2026"
                            subtitle="Årsresultat 485 000 kr · Avgifter 152 363 kr · Sats 31.42%"
                        />
                    </ScoobyMessage>
                </Scenario>

                {/* Scenario 2: WRITE — Full calculation */}
                <Scenario title="Beräkna egenavgifter" description="Skriv-scenario — detaljerad beräkning med delpostförklaring" badges={["EF"]}>
                    <UserMessage>Beräkna mina egenavgifter för 2026 baserat på nuvarande resultat</UserMessage>
                    <ScoobyMessage>
                        <AiProcessingState toolName="get_income_statement" completed />
                        <AiProcessingState toolName="calculate_tax" completed />
                        <AiProcessingState toolName="get_knowledge" completed />

                        <Markdown text={`Jag har beräknat dina egenavgifter baserat på ditt resultat **485 000 kr** för 2026.

**Uppdelning av egenavgifter:**

| Delpost | Sats | Belopp |
|---|---|---|
| Sjukförsäkring | 3.64% | 17 654 kr |
| Ålderspensionsavgift | 10.21% | 49 519 kr |
| Efterlevandepensionsavgift | 0.60% | 2 910 kr |
| Arbetsmarknadsavgift | 2.64% | 12 804 kr |
| Arbetsskadeavgift | 0.20% | 970 kr |
| Allmän löneavgift | 11.62% | 56 367 kr |
| **Totalt** | **28.97%** | **140 224 kr** |

> 💡 *Nedsättning:* Om du är under 26 eller över 65 gäller reducerade satser. Din fulla sats är **31.42%** inklusive alla tillägg.

Ska jag lägga av preliminärskatt baserat på detta, eller vill du justera resultatet?`} />

                        <WalkthroughOpenerCard
                            title="Egenavgifter 2026 — fullständig beräkning"
                            subtitle="7 delposter · Total sats 31.42% · 152 363 kr"
                        />
                    </ScoobyMessage>
                </Scenario>
            </div>
        </div>
    )
}
