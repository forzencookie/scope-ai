"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Sparkles, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AiProcessingState } from "@/components/shared/ai-processing-state"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { ActivityCard } from "@/components/ai/cards/ActivityCard"
import { InlineCardRenderer } from "@/components/ai/cards/inline"

/**
 * Test page: Full Conversation Flow
 *
 * Simulates the exact lifecycle of a real Scooby conversation:
 *
 * 1. User sends message
 * 2. "Tänker..." shimmer (no content yet)
 * 3. Tool call 1 — shimmer label
 * 4. Tool call 1 — completed checkmark
 * 5. Tool call 2 — shimmer label
 * 6. Tool call 2 — completed checkmark
 * 7. Markdown text streams in
 * 8. Confirmation card appears (user must approve)
 * 9. User confirms → loading state
 * 10. Activity card + inline card appear as result
 *
 * This mirrors the real rendering order in chat-message-list.tsx.
 */

type FlowStep =
    | "idle"
    | "thinking"
    | "tool1-active"
    | "tool1-done"
    | "tool2-active"
    | "tool2-done"
    | "streaming"
    | "stream-done"
    | "confirming"
    | "confirm-loading"
    | "result"

const STEP_DELAYS: Record<FlowStep, number> = {
    idle: 0,
    thinking: 800,
    "tool1-active": 1200,
    "tool1-done": 900,
    "tool2-active": 1000,
    "tool2-done": 800,
    streaming: 0, // streaming has its own timing
    "stream-done": 0,
    confirming: 500,
    "confirm-loading": 0, // user-triggered
    result: 1200,
}

const STREAM_TEXT = `Jag har hittat fakturan och kontrollerat betalningsstatusen. Här är sammanfattningen:

**Faktura #10243** från Svea Hosting

- **Belopp:** 1 499 kr (inkl. moms)
- **Status:** Betald
- **Betald:** 2026-03-28

Fakturan bokfördes automatiskt på konto **5420** (Programvara & IT-tjänster) med ingående moms på konto **2641**.

Jag kan bokföra den åt dig direkt — vill du det?`

function useTypewriter(text: string, active: boolean, speed = 12) {
    const [displayed, setDisplayed] = useState("")
    const [done, setDone] = useState(false)

    useEffect(() => {
        if (!active) return
        setDisplayed("")
        setDone(false)
        let i = 0
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1))
                i++
            } else {
                setDone(true)
                clearInterval(timer)
            }
        }, speed)
        return () => clearInterval(timer)
    }, [text, active, speed])

    return { displayed, done }
}

function FlowSimulation() {
    const [step, setStep] = useState<FlowStep>("idle")
    const [autoAdvance, setAutoAdvance] = useState(false)

    const advanceTo = useCallback((next: FlowStep) => {
        setStep(next)
    }, [])

    // Auto-advance for automated steps
    useEffect(() => {
        if (!autoAdvance) return

        const nextStep: Partial<Record<FlowStep, FlowStep>> = {
            thinking: "tool1-active",
            "tool1-active": "tool1-done",
            "tool1-done": "tool2-active",
            "tool2-active": "tool2-done",
            "tool2-done": "streaming",
        }

        const next = nextStep[step]
        if (next) {
            const delay = STEP_DELAYS[next] || 800
            const timer = setTimeout(() => advanceTo(next), delay)
            return () => clearTimeout(timer)
        }
    }, [step, autoAdvance, advanceTo])

    // Start streaming
    const { displayed: streamedText, done: streamDone } = useTypewriter(
        STREAM_TEXT,
        step === "streaming" || step === "stream-done" || step === "confirming" || step === "confirm-loading" || step === "result",
        12
    )

    // When stream finishes, move to confirming
    useEffect(() => {
        if (streamDone && step === "streaming") {
            const timer = setTimeout(() => advanceTo("confirming"), STEP_DELAYS.confirming)
            return () => clearTimeout(timer)
        }
    }, [streamDone, step, advanceTo])

    const handleStart = () => {
        setAutoAdvance(true)
        advanceTo("thinking")
    }

    const handleConfirm = () => {
        advanceTo("confirm-loading")
        setTimeout(() => advanceTo("result"), STEP_DELAYS.result)
    }

    const handleReset = () => {
        setStep("idle")
        setAutoAdvance(false)
    }

    const stepIndex = [
        "idle", "thinking", "tool1-active", "tool1-done",
        "tool2-active", "tool2-done", "streaming", "stream-done",
        "confirming", "confirm-loading", "result",
    ].indexOf(step)

    const pastStep = (s: FlowStep) => {
        const sIndex = [
            "idle", "thinking", "tool1-active", "tool1-done",
            "tool2-active", "tool2-done", "streaming", "stream-done",
            "confirming", "confirm-loading", "result",
        ].indexOf(s)
        return stepIndex > sIndex
    }

    const atOrPast = (s: FlowStep) => step === s || pastStep(s)

    return (
        <div className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2 flex-wrap">
                {[
                    { key: "thinking", label: "Tänker" },
                    { key: "tool1-active", label: "Verktyg 1" },
                    { key: "tool2-active", label: "Verktyg 2" },
                    { key: "streaming", label: "Text" },
                    { key: "confirming", label: "Bekräftelse" },
                    { key: "result", label: "Resultat" },
                ].map((s) => (
                    <span
                        key={s.key}
                        className={cn(
                            "text-[10px] px-2 py-1 rounded-full font-medium transition-all",
                            atOrPast(s.key as FlowStep)
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        {s.label}
                    </span>
                ))}
            </div>

            {/* User message */}
            <div className="flex flex-col items-end gap-2">
                <div className="rounded-lg px-3 py-1.5 bg-primary text-primary-foreground max-w-[85%]">
                    <p className="text-sm">Har vi betalat faktura 10243 från Svea Hosting? Bokför den om den är betald.</p>
                </div>
            </div>

            {/* AI message */}
            {step !== "idle" && (
                <div className="w-full max-w-[85%] space-y-4">
                    {/* 1. Thinking state — only shows when no content/tools yet */}
                    {step === "thinking" && (
                        <AiProcessingState />
                    )}

                    {/* 2. Tool calls — pending then completed */}
                    {atOrPast("tool1-active") && (
                        <div className="space-y-0.5">
                            <AiProcessingState
                                toolName="get_invoices"
                                completed={pastStep("tool1-active")}
                            />
                            {atOrPast("tool2-active") && (
                                <AiProcessingState
                                    toolName="get_transactions"
                                    completed={pastStep("tool2-active")}
                                />
                            )}
                        </div>
                    )}

                    {/* 3. Streaming markdown text */}
                    {atOrPast("streaming") && streamedText && (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-3 prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-foreground">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {streamedText}
                            </ReactMarkdown>
                            {!streamDone && (
                                <span className="inline-block w-1.5 h-4 bg-primary align-middle animate-pulse ml-0.5 rounded-sm" />
                            )}
                        </div>
                    )}

                    {/* 4. Confirmation card */}
                    {(step === "confirming" || step === "confirm-loading") && (
                        <ConfirmationCard
                            confirmation={{
                                title: "Bokför betalning",
                                description: "Scooby vill bokföra faktura #10243 som betald",
                                summary: [
                                    { label: "Leverantör", value: "Svea Hosting" },
                                    { label: "Belopp", value: "1 499 kr" },
                                    { label: "Konto", value: "5420 IT-tjänster" },
                                    { label: "Moms (25%)", value: "300 kr" },
                                    { label: "Verifikation", value: "A48" },
                                ],
                                action: { toolName: "create_verification", params: {} },
                            }}
                            isLoading={step === "confirm-loading"}
                            onConfirm={handleConfirm}
                            onCancel={handleReset}
                        />
                    )}

                    {/* 5. Result — Activity card + Inline card */}
                    {step === "result" && (
                        <div className="space-y-3">
                            <ActivityCard
                                action="booked"
                                entityType="transaction"
                                title="Svea Hosting — mars 2026"
                                subtitle="Faktura #10243 bokförd"
                                changes={[
                                    { label: "Konto", value: "5420 IT-tjänster" },
                                    { label: "Belopp", value: "1 499 kr" },
                                    { label: "Verifikation", value: "A48" },
                                ]}
                            />
                            <InlineCardRenderer
                                card={{
                                    cardType: "verification",
                                    data: {
                                        id: "ver-48",
                                        verificationNumber: "A48",
                                        date: "2026-03-28",
                                        description: "Svea Hosting faktura #10243",
                                        amount: 1499,
                                    },
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3 pt-4 border-t">
                {step === "idle" ? (
                    <button
                        onClick={handleStart}
                        className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        Starta flödet
                    </button>
                ) : (
                    <button
                        onClick={handleReset}
                        className="text-xs bg-muted text-muted-foreground px-4 py-2 rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center gap-1.5"
                    >
                        <RefreshCw className="h-3 w-3" />
                        Börja om
                    </button>
                )}
                <span className="text-[10px] text-muted-foreground">
                    {step === "idle" && "Klicka för att simulera en hel konversation"}
                    {step === "thinking" && "Scooby tänker..."}
                    {step === "tool1-active" && "Hämtar fakturor..."}
                    {step === "tool1-done" && "Fakturor hämtade"}
                    {step === "tool2-active" && "Hämtar transaktioner..."}
                    {step === "tool2-done" && "Transaktioner hämtade"}
                    {step === "streaming" && "Text strömmas in..."}
                    {step === "confirming" && "Väntar på användarens godkännande"}
                    {step === "confirm-loading" && "Bokför..."}
                    {step === "result" && "Klart — verifikation skapad"}
                </span>
            </div>
        </div>
    )
}

function FlowDocumentation() {
    return (
        <div className="mt-12 space-y-6">
            <h2 className="text-lg font-bold">Renderingsordning i chatten</h2>
            <p className="text-sm text-muted-foreground">
                Exakt ordning som <code>chat-message-list.tsx</code> renderar varje AI-meddelande:
            </p>

            <div className="grid gap-3">
                {[
                    { step: "1", label: "Markdown-text", desc: "ReactMarkdown med remarkGfm. Renderas löpande medan streamen pågår." },
                    { step: "2", label: "ConfirmationCard", desc: "Visas under texten om message.confirmationRequired finns. Mobil: inline. Desktop: dialog-overlay." },
                    { step: "3", label: "Display-kort", desc: "ReceiptCard, TransactionCard, TaskChecklist, ActivityCard, ComparisonTable. Mobil: inline. Desktop: dialog." },
                    { step: "4", label: "BalanceAuditCard", desc: "Alltid inline (aldrig i dialog). Visas om display.type === 'BalanceAuditCard'." },
                    { step: "5", label: "InlineCard / InlineCards", desc: "Kompakta klickbara resultatrader. Alltid inline. Navigerar vid klick." },
                    { step: "6", label: "Pending tool calls", desc: "AiProcessingState med shimmer-animation. En rad per verktyg." },
                    { step: "7", label: "Completed tools", desc: "AiProcessingState med grönt bockikon. Visas bara om inget display-kort finns." },
                    { step: "8", label: "Thinking state", desc: "AiProcessingState utan toolName. Visas bara om: isLoading + inget content + inga tools + ingen display." },
                ].map((item) => (
                    <div key={item.step} className="flex gap-3 items-start">
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                            {item.step}
                        </span>
                        <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function TestFullFlowPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="border-b border-border/40 bg-muted/20">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <Link
                        href="/test-ui/ai-streaming"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        AI Streaming
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg shrink-0">
                            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Komplett konversationsflöde</h1>
                            <p className="text-sm text-muted-foreground">
                                Hela livscykeln: meddelande &rarr; tänker &rarr; verktyg &rarr; text &rarr; bekräftelse &rarr; resultat.
                                Använder riktiga komponenter från produktionskoden.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-10">
                <FlowSimulation />
                <FlowDocumentation />
            </div>
        </div>
    )
}
