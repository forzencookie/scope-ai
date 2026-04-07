"use client"

/**
 * AI Streaming: Löner → Förmåner
 *
 * Scenarios:
 * 1. WRITE: "Tilldela friskvårdsbidrag till Anna" — confirmation
 * 2. READ: "Vilka förmåner har vi?" — list overview
 * 3. WRITE: "Lägg till tjänstebil för Johan" — confirmation with tax implications
 */

import Link from "next/link"
import { ArrowLeft, Gift, Car } from "lucide-react"
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

export default function FormanerStreamingPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
                <div>
                    <Link href="/test-ui/ai-streaming/loner" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Löner
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Förmåner</h1>
                    <p className="text-sm text-muted-foreground mt-1">Hur Scooby tilldelar och visar förmåner som friskvård och tjänstebil.</p>
                </div>

                {/* Scenario 1: WRITE — Assign wellness benefit */}
                <Scenario title="Tilldela friskvårdsbidrag" description="Skriv-scenario — enkel förmån utan förmånsvärde" badges={["Alla"]}>
                    <UserMessage>Ge Anna Lindberg friskvårdsbidrag på 5 000 kr per år</UserMessage>
                    <ScoobyMessage>
                        <AiProcessingState toolName="search_tools" completed />

                        <Markdown text={`Friskvårdsbidrag upp till **5 000 kr** är skattefritt för den anställde. Det bokförs som personalvårdskostnad på konto **7690**.`} />

                        <ConfirmationCard
                            confirmation={{
                                title: "Tilldela friskvårdsbidrag",
                                description: "Anna Lindberg — 5 000 kr/år",
                                summary: [
                                    { label: "Anställd", value: "Anna Lindberg" },
                                    { label: "Förmån", value: "Friskvårdsbidrag" },
                                    { label: "Belopp", value: "5 000 kr/år" },
                                    { label: "Skatteeffekt", value: "Skattefritt (≤ 5 000 kr)" },
                                    { label: "Konto", value: "7690 Personalvård" },
                                ],
                                action: { toolName: "assign_benefit", params: {} },
                            }}
                            confirmLabel="Tilldela"
                            icon={Gift}
                            accent="green"
                            isDone
                            onConfirm={() => {}}
                            onCancel={() => {}}
                        />

                        <Markdown text={`Friskvårdsbidrag tilldelat ✅ Anna kan nu nyttja upp till 5 000 kr per år.`} />
                    </ScoobyMessage>
                </Scenario>

                {/* Scenario 2: READ — List benefits */}
                <Scenario title="Visa förmåner" description="Läs-scenario — översikt av alla aktiva förmåner" badges={["Alla"]}>
                    <UserMessage>Vilka förmåner har vi i företaget?</UserMessage>
                    <ScoobyMessage>
                        <AiProcessingState toolName="search_tools" completed />

                        <Markdown text={`Ni har **3 aktiva förmåner** i företaget:

| Anställd | Förmån | Belopp | Förmånsvärde |
|---|---|---|---|
| Anna Lindberg | Friskvårdsbidrag | 5 000 kr/år | Skattefritt |
| Johan Berg | Friskvårdsbidrag | 5 000 kr/år | Skattefritt |
| Johan Berg | Tjänstebil (Volvo XC40) | — | 4 200 kr/mån |

Johans tjänstebil beskattas som förmån — **4 200 kr/mån** läggs på hans bruttolön vid lönekörning.

Vill du lägga till eller ändra en förmån?`} />
                    </ScoobyMessage>
                </Scenario>

                {/* Scenario 3: WRITE — Company car with tax implications */}
                <Scenario title="Lägg till tjänstebil" description="Skriv-scenario — förmån med förmånsvärde och skatteeffekt" badges={["Alla"]}>
                    <UserMessage>Ge Sara en tjänstebil, det är en Tesla Model 3</UserMessage>
                    <ScoobyMessage>
                        <AiProcessingState toolName="search_tools" completed />
                        <AiProcessingState toolName="get_knowledge" completed />

                        <Markdown text={`Tesla Model 3 har ett förmånsvärde baserat på Skatteverkets beräkning. Jag behöver nybilspriset och om den är miljöbil (nedsättning).

**Tesla Model 3** (nybilspris ~480 000 kr, miljöbil) ger ett förmånsvärde på ca **3 800 kr/mån** efter miljöbilsnedsättning.

⚠️ Förmånsvärdet beskattas som lön — Saras nettolön minskar.`} />

                        <ConfirmationCard
                            confirmation={{
                                title: "Lägg till tjänstebil",
                                description: "Sara Ek — Tesla Model 3",
                                summary: [
                                    { label: "Anställd", value: "Sara Ek" },
                                    { label: "Bil", value: "Tesla Model 3" },
                                    { label: "Nybilspris", value: "480 000 kr" },
                                    { label: "Miljöbil", value: "Ja (nedsättning 40%)" },
                                    { label: "Förmånsvärde", value: "3 800 kr/mån" },
                                    { label: "Skatteeffekt", value: "Nettolön −1 200 kr/mån" },
                                ],
                                warnings: ["Förmånsvärdet beskattas som inkomst. Saras nettolön påverkas vid nästa lönekörning."],
                                action: { toolName: "assign_benefit", params: {} },
                            }}
                            confirmLabel="Lägg till"
                            icon={Car}
                            accent="blue"
                            isDone
                            onConfirm={() => {}}
                            onCancel={() => {}}
                        />

                        <Markdown text={`Tjänstebil tillagd ✅ Tesla Model 3 registrerad för Sara Ek. Förmånsvärdet (3 800 kr/mån) räknas in automatiskt vid nästa lönekörning.`} />
                    </ScoobyMessage>
                </Scenario>
            </div>
        </div>
    )
}
