"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AiProcessingState } from "@/components/shared/ai-processing-state"
import { ConfirmationCard } from "@/components/ai/confirmations/confirmation-card"
import { Calculator } from "lucide-react"
import { InlineCardRenderer } from "@/components/ai/cards/inline"
import { BalanceAuditCard } from "@/components/ai/cards/BalanceAuditCard"
import { WalkthroughRenderer } from "@/components/ai/blocks/block-renderer"
import type { WalkthroughResponse } from "@/components/ai/blocks/types"
import dynamic from "next/dynamic"

const PayslipPreview = dynamic(
    () => import("@/components/ai/documents/payslip-preview").then(m => ({ default: m.PayslipPreview })),
    { ssr: false }
)

/**
 * Scenario: Månadsavslut mars 2026
 *
 * A realistic conversation where a business owner asks Scooby to close
 * the month. This touches every UI surface in sequence:
 *
 * 1. User asks "Stäng mars"
 * 2. Scooby thinks + runs tools (checking bookkeeping state)
 * 3. Streams markdown summary of what needs to happen
 * 4. Shows balance audit results (inline check rows)
 * 5. Streams more text about payroll
 * 6. Shows payslip document preview (white, PDF-ready)
 * 7. Shows confirmation card for booking employer fees
 * 8. User confirms → activity card + verification inline card
 * 9. Scooby shows AGI walkthrough (block renderer)
 * 10. Final summary with status checks
 */

function fmt(n: number): string {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr"
}

type ScenarioStep =
    | "idle"
    | "thinking"
    | "tools-checking"
    | "tools-done"
    | "text-1"          // Markdown: overview of month
    | "audit"           // Balance audit card
    | "text-2"          // Markdown: payroll section
    | "payslip"         // PayslipPreview document
    | "confirmation"    // Confirm booking arbetsgivaravgifter
    | "confirm-loading"
    | "booked"          // Activity card + inline verification
    | "text-3"          // Markdown: AGI ready
    | "agi-walkthrough" // Full AGI walkthrough
    | "done"            // Final status summary

const AUTO_DELAYS: Partial<Record<ScenarioStep, number>> = {
    thinking: 1000,
    "tools-checking": 1500,
    "tools-done": 800,
}

function useTypewriter(text: string, active: boolean, speed = 14) {
    const [displayed, setDisplayed] = useState("")
    const [done, setDone] = useState(false)

    useEffect(() => {
        if (!active) { return }
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

// ─── Text blocks ────────────────────────────────────────────────────────────

const TEXT_1 = `Jag har gått igenom bokföringen för mars 2026. Här är statusen:

**47 verifikationer** bokförda (A1–A47). Alla balanserar.

Jag har kontrollerat bank, moms, och periodiseringar. Resultat:`

const TEXT_2 = `Bra — bokföringen ser ren ut. Nu till lönerna.

**Lönekörning LK-2026-03-01** är klar med 3 anställda. Här är Anna Lindbergs lönebesked som exempel:`

const TEXT_3 = `Arbetsgivaravgifterna är bokförda. Nu kan jag sammanställa **arbetsgivardeklarationen** för mars.

Här är den fullständiga AGI:n med individuppgifter — varje rad härledd från lönekörningen:`

// ─── AGI walkthrough data (simplified for scenario) ─────────────────────────

const agiWalkthrough: WalkthroughResponse = {
    mode: "fixed",
    title: "Arbetsgivardeklaration 2026-03",
    subtitle: "AGI individuppgift · 3 anställda · Skatteverket",
    blocks: [
        {
            type: "stat-cards",
            props: {
                items: [
                    { label: "Totalt att betala", value: "87 831 kr", change: "Skatt + avgifter den 12 april", trend: "neutral" as const, icon: "banknote", iconColor: "red" as const, valueColor: "red" as const },
                    { label: "Arbetsgivaravgifter", value: "44 212 kr", change: "31,42% av underlag", trend: "neutral" as const, icon: "calculator", iconColor: "blue" as const, valueColor: "red" as const },
                    { label: "Avdragen skatt", value: "43 619 kr", change: "3 individuppgifter", trend: "neutral" as const, icon: "receipt", iconColor: "violet" as const, valueColor: "default" as const },
                ],
            },
        },
        {
            type: "heading",
            props: { text: "Individuppgifter", level: 2, subtitle: "Härledda från lönekörning LK-2026-03-01" },
        },
        {
            type: "heading",
            props: { text: "Anna Lindberg", level: 3, subtitle: "920315-**** · Stockholm · Tabell 32" },
        },
        {
            type: "annotation",
            props: { text: "Källa: Lönekörning LK-2026-03-01 (2026-03-25)", variant: "muted" },
        },
        {
            type: "financial-table",
            props: {
                columns: [
                    { label: "Löneart", icon: "receipt" },
                    { label: "Belopp", icon: "banknote" },
                ],
                variant: "compact",
                rows: [
                    { Löneart: "Månadslön", Belopp: "42 000 kr" },
                    { Löneart: "Friskvårdsbidrag", Belopp: "500 kr" },
                    { Löneart: "Sjukavdrag (2 dgr)", Belopp: "−2 800 kr" },
                ],
            },
        },
        {
            type: "heading",
            props: { text: "Erik Svensson", level: 3, subtitle: "850101-**** · Stockholm · Tabell 33" },
        },
        {
            type: "annotation",
            props: { text: "Källa: Lönekörning LK-2026-03-01 (2026-03-25)", variant: "muted" },
        },
        {
            type: "financial-table",
            props: {
                columns: [
                    { label: "Löneart", icon: "receipt" },
                    { label: "Belopp", icon: "banknote" },
                ],
                variant: "compact",
                rows: [
                    { Löneart: "Månadslön", Belopp: "55 000 kr" },
                    { Löneart: "OB-tillägg kväll", Belopp: "1 600 kr" },
                    { Löneart: "Bilförmån", Belopp: "2 400 kr" },
                ],
            },
        },
        {
            type: "heading",
            props: { text: "Maria Johansson", level: 3, subtitle: "900515-**** · Göteborg · Tabell 33" },
        },
        {
            type: "annotation",
            props: { text: "Källa: Lönekörning LK-2026-03-01 (2026-03-25)", variant: "muted" },
        },
        {
            type: "financial-table",
            props: {
                columns: [
                    { label: "Löneart", icon: "receipt" },
                    { label: "Belopp", icon: "banknote" },
                ],
                variant: "compact",
                rows: [
                    { Löneart: "Månadslön", Belopp: "38 000 kr" },
                    { Löneart: "Semestertillägg", Belopp: "760 kr" },
                ],
            },
        },
        {
            type: "separator",
            props: { label: "Sammanställning" },
        },
        {
            type: "financial-table",
            props: {
                columns: [
                    { label: "Anställd", icon: "user" },
                    { label: "Bruttolön", icon: "banknote" },
                    { label: "Avdragen skatt", icon: "receipt", color: "red" as const },
                ],
                rows: [
                    { Anställd: "Anna Lindberg", Bruttolön: "39 700 kr", "Avdragen skatt": "12 475 kr" },
                    { Anställd: "Erik Svensson", Bruttolön: "56 600 kr", "Avdragen skatt": "18 590 kr" },
                    { Anställd: "Maria Johansson", Bruttolön: "38 760 kr", "Avdragen skatt": "12 554 kr" },
                ],
                totals: {
                    Anställd: "Totalt",
                    Bruttolön: "135 060 kr",
                    "Avdragen skatt": "43 619 kr",
                },
            },
        },
        {
            type: "status-check",
            props: {
                items: [
                    { label: "Individuppgifter komplett", status: "pass", detail: "3 anställda med personnummer" },
                    { label: "Avgiftsunderlag stämmer", status: "pass", detail: "Lön + förmåner = 137 460 kr" },
                    { label: "Klart för inlämning", status: "pass", detail: "XML kan genereras" },
                ],
            },
        },
        {
            type: "action-bar",
            props: {
                actions: [
                    { label: "Skicka till Skatteverket", variant: "default", actionId: "submit-agi" },
                    { label: "Stäng", variant: "outline" },
                ],
            },
        },
    ],
}

// ─── Scenario Component ─────────────────────────────────────────────────────

export default function TestScenarioPage() {
    const [step, setStep] = useState<ScenarioStep>("idle")

    const advanceTo = useCallback((next: ScenarioStep) => setStep(next), [])

    // Auto-advance for tool steps
    useEffect(() => {
        const nextMap: Partial<Record<ScenarioStep, ScenarioStep>> = {
            thinking: "tools-checking",
            "tools-checking": "tools-done",
            "tools-done": "text-1",
        }
        const next = nextMap[step]
        if (next) {
            const delay = AUTO_DELAYS[next] ?? AUTO_DELAYS[step] ?? 800
            const timer = setTimeout(() => advanceTo(next), delay)
            return () => clearTimeout(timer)
        }
    }, [step, advanceTo])

    // Typewriter hooks
    const t1 = useTypewriter(TEXT_1, stepAtOrPast(step, "text-1"), 10)
    const t2 = useTypewriter(TEXT_2, stepAtOrPast(step, "text-2"), 10)
    const t3 = useTypewriter(TEXT_3, stepAtOrPast(step, "text-3"), 10)

    // Auto-advance after each text finishes
    useEffect(() => {
        if (t1.done && step === "text-1") {
            const t = setTimeout(() => advanceTo("audit"), 400)
            return () => clearTimeout(t)
        }
    }, [t1.done, step, advanceTo])

    useEffect(() => {
        if (t2.done && step === "text-2") {
            const t = setTimeout(() => advanceTo("payslip"), 400)
            return () => clearTimeout(t)
        }
    }, [t2.done, step, advanceTo])

    useEffect(() => {
        if (t3.done && step === "text-3") {
            const t = setTimeout(() => advanceTo("agi-walkthrough"), 400)
            return () => clearTimeout(t)
        }
    }, [t3.done, step, advanceTo])

    // After audit, advance to text-2
    const handleAuditContinue = () => advanceTo("text-2")
    // After payslip, show confirmation
    const handlePayslipContinue = () => advanceTo("confirmation")
    // Confirm → booked
    const handleConfirm = () => {
        advanceTo("confirm-loading")
        setTimeout(() => advanceTo("booked"), 1200)
    }
    // After booked result, advance to text-3
    const handleBookedContinue = () => advanceTo("text-3")
    // After AGI walkthrough, done
    const handleDone = () => advanceTo("done")

    const handleStart = () => advanceTo("thinking")
    const handleReset = () => setStep("idle")

    const stepLabels: Array<{ key: ScenarioStep; label: string }> = [
        { key: "thinking", label: "Tänker" },
        { key: "tools-checking", label: "Verktyg" },
        { key: "text-1", label: "Bokföring" },
        { key: "audit", label: "Kontroll" },
        { key: "text-2", label: "Löner" },
        { key: "payslip", label: "Dokument" },
        { key: "confirmation", label: "Bekräftelse" },
        { key: "booked", label: "Bokfört" },
        { key: "text-3", label: "AGI" },
        { key: "agi-walkthrough", label: "Walkthrough" },
        { key: "done", label: "Klart" },
    ]

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="border-b border-border/40 bg-muted/20">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <Link
                        href="/test-ui/walkthroughs"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Walkthroughs & Overlays
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight">Scenario: Månadsavslut mars 2026</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Komplett konversation som visar alla UI-ytor i ett realistiskt flöde —
                        balanskontroll, lönebesked, bokföring, arbetsgivardeklaration.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                {/* Step indicator */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {stepLabels.map((s) => (
                        <span
                            key={s.key}
                            className={cn(
                                "text-[10px] px-2 py-1 rounded-full font-medium transition-all",
                                stepAtOrPast(step, s.key)
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
                        <p className="text-sm">Stäng mars åt mig. Kör lönerna, kontrollera bokföringen, och gör arbetsgivardeklarationen.</p>
                    </div>
                </div>

                {/* AI response area */}
                {step !== "idle" && (
                    <div className="w-full max-w-[90%] space-y-5">
                        {/* Thinking */}
                        {step === "thinking" && <AiProcessingState />}

                        {/* Tool calls */}
                        {stepAtOrPast(step, "tools-checking") && (
                            <div className="space-y-0.5">
                                <AiProcessingState toolName="get_verifications" completed={stepAtOrPast(step, "tools-done")} />
                                <AiProcessingState toolName="get_bank_balance" completed={stepAtOrPast(step, "tools-done")} />
                                <AiProcessingState toolName="get_payroll_runs" completed={stepAtOrPast(step, "tools-done")} />
                            </div>
                        )}

                        {/* Text block 1: Bookkeeping overview */}
                        {stepAtOrPast(step, "text-1") && t1.displayed && (
                            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-3">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{t1.displayed}</ReactMarkdown>
                                {!t1.done && <span className="inline-block w-1.5 h-4 bg-primary align-middle animate-pulse ml-0.5 rounded-sm" />}
                            </div>
                        )}

                        {/* Balance audit results */}
                        {stepAtOrPast(step, "audit") && (
                            <div className="space-y-3">
                                <BalanceAuditCard
                                    audit={{
                                        date: "2026-03-31",
                                        checks: [
                                            { name: "Debet = Kredit", status: "pass", description: "Alla 47 verifikationer balanserar" },
                                            { name: "Bank stämmer", status: "pass", description: "Konto 1930 matchar kontoutdrag: 245 320 kr" },
                                            { name: "Momsavstämning", status: "warning", description: "Ingående moms avviker med 340 kr", details: "Konto 2641 visar 23 340 kr, beräknad moms 23 000 kr" },
                                            { name: "Periodiseringar", status: "pass", description: "Inga ouppmärkta periodiseringar" },
                                            { name: "Verifikationsnumrering", status: "pass", description: "Sekventiell A1–A47 utan luckor" },
                                        ],
                                        summary: { total: 5, passed: 4, warnings: 1, failed: 0 },
                                    }}
                                />
                                {step === "audit" && (
                                    <ContinueButton onClick={handleAuditContinue} />
                                )}
                            </div>
                        )}

                        {/* Text block 2: Payroll */}
                        {stepAtOrPast(step, "text-2") && t2.displayed && (
                            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-3">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{t2.displayed}</ReactMarkdown>
                                {!t2.done && <span className="inline-block w-1.5 h-4 bg-primary align-middle animate-pulse ml-0.5 rounded-sm" />}
                            </div>
                        )}

                        {/* Payslip document preview */}
                        {stepAtOrPast(step, "payslip") && (
                            <div className="space-y-3">
                                <PayslipPreview
                                    company={{ name: "Scope AI AB", orgNumber: "559123-4567", address: "Kungsgatan 12, 111 35 Stockholm" }}
                                    employee={{ name: "Anna Lindberg", personalNumber: "920315-1234", employeeId: "1003" }}
                                    period="2026-03-01 – 2026-03-31"
                                    grossSalary={42000}
                                    lineItems={[
                                        { label: "Månadslön", amount: 42000, type: "earning" },
                                        { label: "Friskvårdsbidrag", amount: 500, type: "earning" },
                                        { label: "Sjukavdrag (2 dgr)", amount: 2800, type: "deduction" },
                                        { label: "Karensavdrag", amount: 1120, type: "deduction" },
                                    ]}
                                    taxRate={0.324}
                                    taxAmount={12475}
                                    netSalary={26105}
                                    paymentDate="2026-03-25"
                                    employerContributions={12470}
                                    vacationInfo={{ paidDaysRemaining: 18, savedDays: 5, earnedDaysThisYear: 7 }}
                                    ytd={{ grossYTD: 118580, taxYTD: 37524, netYTD: 81056 }}
                                />
                                {step === "payslip" && (
                                    <ContinueButton onClick={handlePayslipContinue} label="Bokför arbetsgivaravgifter →" />
                                )}
                            </div>
                        )}

                        {/* Confirmation card */}
                        {(step === "confirmation" || step === "confirm-loading") && (
                            <ConfirmationCard
                                confirmation={{
                                    title: "Bokför arbetsgivaravgifter mars 2026",
                                    description: "Arbetsgivaravgifter för 3 anställda baserat på lönekörning LK-2026-03-01",
                                    summary: [
                                        { label: "Underlag", value: "137 460 kr" },
                                        { label: "Avgiftssats", value: "31,42%" },
                                        { label: "Arbetsgivaravgifter", value: "43 186 kr" },
                                        { label: "Konto debet", value: "7510 Arbetsgivaravgifter" },
                                        { label: "Konto kredit", value: "2730 Lagstadgade sociala avgifter" },
                                        { label: "Verifikation", value: "A48" },
                                    ],
                                    action: { toolName: "create_verification", params: {} },
                                }}
                                isLoading={step === "confirm-loading"}
                                onConfirm={handleConfirm}
                                onCancel={handleReset}
                            />
                        )}

                        {/* Booked result — post-confirm card + link card */}
                        {stepAtOrPast(step, "booked") && (
                            <div className="space-y-3">
                                <ConfirmationCard
                                    confirmation={{
                                        title: "Bokför arbetsgivaravgifter mars 2026",
                                        description: "Arbetsgivaravgifter för 3 anställda baserat på lönekörning LK-2026-03-01",
                                        summary: [
                                            { label: "Underlag", value: "137 460 kr" },
                                            { label: "Avgiftssats", value: "31,42%" },
                                            { label: "Arbetsgivaravgifter", value: "43 186 kr" },
                                            { label: "Konto debet", value: "7510 Arbetsgivaravgifter" },
                                            { label: "Konto kredit", value: "2730 Lagstadgade sociala avgifter" },
                                            { label: "Verifikation", value: "A48" },
                                        ],
                                        action: { toolName: "create_verification", params: {} },
                                    }}
                                    isDone
                                    completedAction="booked"
                                    completedTitle="Arbetsgivaravgifter bokförda"
                                    icon={Calculator}
                                    accent="emerald"
                                    onConfirm={() => {}}
                                    onCancel={() => {}}
                                />
                                <InlineCardRenderer
                                    card={{
                                        cardType: "verification",
                                        data: {
                                            id: "ver-48",
                                            verificationNumber: "A48",
                                            date: "2026-03-31",
                                            description: "Arbetsgivaravgifter mars 2026",
                                            amount: 43186,
                                        },
                                    }}
                                />
                                {step === "booked" && (
                                    <ContinueButton onClick={handleBookedContinue} label="Visa arbetsgivardeklaration →" />
                                )}
                            </div>
                        )}

                        {/* Text block 3: AGI transition */}
                        {stepAtOrPast(step, "text-3") && t3.displayed && (
                            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-3">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{t3.displayed}</ReactMarkdown>
                                {!t3.done && <span className="inline-block w-1.5 h-4 bg-primary align-middle animate-pulse ml-0.5 rounded-sm" />}
                            </div>
                        )}

                        {/* AGI walkthrough */}
                        {stepAtOrPast(step, "agi-walkthrough") && (
                            <div className="space-y-3">
                                <WalkthroughRenderer
                                    response={agiWalkthrough}
                                    onClose={() => {}}
                                    embedded
                                />
                                {step === "agi-walkthrough" && (
                                    <ContinueButton onClick={handleDone} label="Avsluta månadsavslut →" />
                                )}
                            </div>
                        )}

                        {/* Done */}
                        {step === "done" && (
                            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900/50 p-4 space-y-2">
                                <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                                    Mars 2026 — avslutad
                                </p>
                                <ul className="text-xs text-green-800 dark:text-green-300 space-y-1">
                                    <li>✓ Bokföring kontrollerad (47 verifikationer, 1 varning)</li>
                                    <li>✓ Löner körda och utbetalda (3 anställda)</li>
                                    <li>✓ Arbetsgivaravgifter bokförda (A48)</li>
                                    <li>✓ AGI sammanställd — redo att skicka till Skatteverket</li>
                                </ul>
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
                            Starta scenariot
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
                        {step === "idle" && "Simulerar: Balanskontroll → Lönebesked → Bokföring → AGI walkthrough"}
                        {step === "done" && "Alla UI-ytor visade: audit check, document preview, confirmation, activity card, inline card, walkthrough"}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function stepAtOrPast(current: ScenarioStep, target: ScenarioStep): boolean {
    const order: ScenarioStep[] = [
        "idle", "thinking", "tools-checking", "tools-done",
        "text-1", "audit", "text-2", "payslip", "confirmation",
        "confirm-loading", "booked", "text-3", "agi-walkthrough", "done",
    ]
    return order.indexOf(current) >= order.indexOf(target)
}

function ContinueButton({ onClick, label = "Fortsätt →" }: { onClick: () => void; label?: string }) {
    return (
        <button
            onClick={onClick}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
            {label}
        </button>
    )
}
