"use client"

/**
 * AI Streaming: Ägare → Bolagsstämma (AB only)
 *
 * Scenarios:
 * 1. WRITE: "Förbered bolagsstämmoprotokoll" — confirmation + document generation
 * 2. WRITE: "Fatta utdelningsbeslut" — confirmation with K10 reference
 */

import Link from "next/link"
import { ArrowLeft, Landmark, FileText } from "lucide-react"
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

export default function BolagsstammaStreamingPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
                <div>
                    <Link href="/test-ui/ai-streaming/agare" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Ägare
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Bolagsstämma</h1>
                    <p className="text-sm text-muted-foreground mt-1">Hur Scooby förbereder stämmoprotokoll och fattar beslut.</p>
                </div>

                {/* Scenario 1: WRITE — Prepare AGM protocol */}
                <Scenario title="Förbered stämmoprotokoll" description="Skriv-scenario — generera dokument" badges={["AB"]}>
                    <UserMessage>Förbered bolagsstämmoprotokoll för ordinarie stämma 2026</UserMessage>
                    <ScoobyMessage>
                        <AiProcessingState toolName="search_tools" completed />
                        <AiProcessingState toolName="get_company_info" completed />
                        <AiProcessingState toolName="get_income_statement" completed />

                        <Markdown text={`Jag förbereder ett stämmoprotokoll för **ordinarie bolagsstämma 2026**. Baserat på årsredovisningen 2025 inkluderar jag standardpunkterna:

1. ✅ Val av ordförande och justerare
2. ✅ Godkännande av dagordning
3. ✅ Framläggande av årsredovisning
4. ✅ Fastställande av resultat- och balansräkning
5. ✅ Resultatdisposition
6. ✅ Ansvarsfrihet för styrelsen
7. ✅ Val av styrelse och revisor

Vill du lägga till ett **utdelningsbeslut** i punkt 5?`} />

                        <ConfirmationCard
                            confirmation={{
                                title: "Generera stämmoprotokoll",
                                description: "Ordinarie bolagsstämma 2026",
                                summary: [
                                    { label: "Bolag", value: "Scope Consulting AB (559123-4567)" },
                                    { label: "Räkenskapsår", value: "2025" },
                                    { label: "Typ", value: "Ordinarie bolagsstämma" },
                                    { label: "Punkter", value: "7 st (standard)" },
                                    { label: "Format", value: "PDF + digital signering" },
                                ],
                                action: { toolName: "generate_agm_protocol", params: {} },
                            }}
                            confirmLabel="Generera protokoll"
                            icon={FileText}
                            accent="indigo"
                            isDone
                            onConfirm={() => {}}
                            onCancel={() => {}}
                        />

                        <Markdown text={`Stämmoprotokoll genererat ✅ Du kan granska och ladda ner PDF:en. Behöver signeras av ordförande och justerare.`} />
                    </ScoobyMessage>
                </Scenario>

                {/* Scenario 2: WRITE — Dividend decision */}
                <Scenario title="Utdelningsbeslut på stämman" description="Skriv-scenario — beslut kopplat till K10-gränsbelopp" badges={["AB"]}>
                    <UserMessage>Vi vill besluta om utdelning på 150 000 kr</UserMessage>
                    <ScoobyMessage>
                        <AiProcessingState toolName="search_tools" completed />
                        <AiProcessingState toolName="calculate_tax" completed />
                        <AiProcessingState toolName="get_knowledge" completed />

                        <Markdown text={`Bra val! Ditt **K10-gränsbelopp** är **187 550 kr** — utdelning på 150 000 kr hamnar **helt inom gränsbeloppet** och beskattas som kapitalinkomst (20%).

| Post | Belopp |
|---|---|
| Beslutad utdelning | 150 000 kr |
| K10-gränsbelopp | 187 550 kr |
| Inom gräns? | ✅ Ja |
| Skatt (20%) | 30 000 kr |
| Netto efter skatt | 120 000 kr |

> 💡 Du har **37 550 kr kvar** av gränsbeloppet som kan sparas till nästa år.`} />

                        <ConfirmationCard
                            confirmation={{
                                title: "Registrera utdelningsbeslut",
                                description: "150 000 kr — inom K10-gränsbelopp",
                                summary: [
                                    { label: "Utdelning", value: "150 000 kr" },
                                    { label: "Skatt", value: "30 000 kr (20% kapital)" },
                                    { label: "Netto", value: "120 000 kr" },
                                    { label: "Typ", value: "Stämmobeslut" },
                                    { label: "Bokföring", value: "Konto 2091 → 2898" },
                                ],
                                action: { toolName: "register_dividend_decision", params: {} },
                            }}
                            confirmLabel="Registrera beslut"
                            icon={Landmark}
                            accent="purple"
                            isDone
                            onConfirm={() => {}}
                            onCancel={() => {}}
                        />

                        <Markdown text={`Utdelningsbeslut registrerat ✅ 150 000 kr beslutad utdelning. Bokfört på konto 2091 (Balanserad vinst) → 2898 (Outtagen utdelning).

Utbetalningen sker när du bekräftar den separat.`} />
                    </ScoobyMessage>
                </Scenario>
            </div>
        </div>
    )
}
