"use client"

import { useState, useCallback, type ReactNode } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { VatProcessor, type VatReport } from "@/services/processors/vat-processor"
import { cn } from "@/lib/utils"
import { Bot, User, Send, CheckCircle2 } from "lucide-react"

// ============================================
// AI Wizard Dialog - Reusable 3-step wizard
// ============================================

export interface AIWizardStep1Config {
    title: string
    periodLabel: string
    periodSubtitle: string
    deadlineLabel: string
    deadline: string
    icon: ReactNode
    summaryItems: Array<{ label: string; value: string }>
}

export interface AIWizardStep2Config {
    initialPrompt: string
    promptHint: string
    responseHandler?: (message: string) => string
}

export interface AIWizardStep3Config {
    title: string
    subtitle: string
    icon: ReactNode
    summaryRows: Array<{ label: string; value: string; highlight?: boolean; negative?: boolean }>
    resultLabel: string
    resultValue: string
    generatedParts?: string[]
}

export interface AIWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    step1: AIWizardStep1Config
    step2: AIWizardStep2Config
    step3: AIWizardStep3Config
    onConfirm?: () => void
}

export function AIWizardDialog({
    open,
    onOpenChange,
    step1,
    step2,
    step3,
    onConfirm,
}: AIWizardDialogProps) {
    const [step, setStep] = useState(1)
    const [chatInput, setChatInput] = useState("")
    const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([])
    const [useAIRecommendation, setUseAIRecommendation] = useState(true)

    const resetDialog = useCallback(() => {
        setStep(1)
        setChatInput("")
        setChatMessages([])
        setUseAIRecommendation(true)
        onOpenChange(false)
    }, [onOpenChange])

    const handleSendMessage = useCallback(() => {
        if (!chatInput.trim()) return
        const userMsg = chatInput.trim()
        setChatMessages((prev) => [...prev, { role: "user", text: userMsg }])
        setChatInput("")

        setTimeout(() => {
            const response = step2.responseHandler
                ? step2.responseHandler(userMsg)
                : "Jag har noterat det. Finns det något mer?"
            setChatMessages((prev) => [...prev, { role: "ai", text: response }])
        }, 500)
    }, [chatInput, step2])

    const handleConfirm = useCallback(() => {
        onConfirm?.()
        resetDialog()
    }, [onConfirm, resetDialog])

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && resetDialog()}>
            <DialogContent className="sm:max-w-lg">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                                    step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}
                            >
                                {s}
                            </div>
                            {s < 3 && <div className={cn("w-8 h-0.5", step > s ? "bg-primary" : "bg-muted")} />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Confirm Period */}
                {step === 1 && (
                    <>
                        <DialogHeader>
                            <DialogTitle>{step1.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 py-4">
                            <button className="w-full p-4 rounded-lg border-2 border-primary bg-primary/5 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        {step1.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{step1.periodLabel}</p>
                                        <p className="text-sm text-muted-foreground">{step1.periodSubtitle}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">{step1.deadlineLabel}</p>
                                        <p className="font-medium">{step1.deadline}</p>
                                    </div>
                                </div>
                            </button>
                            <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                                <p>📊 Baserat på bokföringen:</p>
                                <div className="mt-2 space-y-1">
                                    {step1.summaryItems.map((item, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span>{item.label}</span>
                                            <span className="font-medium text-foreground">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={resetDialog}>
                                Avbryt
                            </Button>
                            <Button className="flex-1" onClick={() => setStep(2)}>
                                Nästa
                            </Button>
                        </div>
                    </>
                )}

                {/* Step 2: AI Chat */}
                {step === 2 && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Bot className="h-5 w-5 text-purple-600" />
                                Finns det något speciellt?
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="bg-muted/30 rounded-lg p-4 min-h-[200px] max-h-[280px] overflow-y-auto space-y-3">
                                <div className="flex gap-2">
                                    <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center flex-shrink-0">
                                        <Bot className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div className="bg-white dark:bg-background rounded-lg p-3 text-sm max-w-[85%]">
                                        <p>{step2.initialPrompt}</p>
                                        <p className="text-muted-foreground mt-1 text-xs">{step2.promptHint}</p>
                                    </div>
                                </div>

                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={cn("flex gap-2", msg.role === "user" && "justify-end")}>
                                        {msg.role === "ai" && (
                                            <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center flex-shrink-0">
                                                <Bot className="h-4 w-4 text-purple-600" />
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                "rounded-lg p-3 text-sm max-w-[85%]",
                                                msg.role === "user"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-white dark:bg-background"
                                            )}
                                        >
                                            {msg.text}
                                        </div>
                                        {msg.role === "user" && (
                                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                    placeholder="Skriv här..."
                                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                                />
                                <Button size="icon" onClick={handleSendMessage} disabled={!chatInput.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                                Tillbaka
                            </Button>
                            <Button className="flex-1" onClick={() => setStep(3)}>
                                Klar, visa förslag
                            </Button>
                        </div>
                    </>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                    <>
                        <DialogHeader>
                            <DialogTitle>{step3.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div
                                className={cn(
                                    "rounded-lg p-5 space-y-5 border-2 transition-colors",
                                    useAIRecommendation ? "bg-muted/40 border-foreground" : "bg-muted/30 border-border"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        {step3.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{step3.title}</p>
                                        <p className="text-sm text-muted-foreground">{step3.subtitle}</p>
                                    </div>
                                    {useAIRecommendation && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-400 text-xs font-medium">
                                            <Bot className="h-3 w-3" strokeWidth={2.5} />
                                            AI-förslag
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-3 space-y-2">
                                    {step3.summaryRows.map((row, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{row.label}</span>
                                            <span className={row.negative ? "text-green-600 dark:text-green-500/70" : ""}>
                                                {row.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-3">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-medium">{step3.resultLabel}</span>
                                        <span className="text-2xl font-bold">{step3.resultValue}</span>
                                    </div>
                                </div>

                                {step3.generatedParts && step3.generatedParts.length > 0 && (
                                    <div className="border-t pt-3">
                                        <p className="text-sm text-muted-foreground mb-2">Genererade delar:</p>
                                        <div className="space-y-1 text-sm">
                                            {step3.generatedParts.map((part, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    <span>{part}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setUseAIRecommendation(!useAIRecommendation)}
                                className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-2"
                            >
                                {useAIRecommendation ? "Vill du redigera manuellt?" : "Använd AI-förslag"}
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                                Tillbaka
                            </Button>
                            <Button className="flex-1" onClick={handleConfirm}>
                                Bekräfta
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

// ============================================
// Pre-configured wizard variants
// ============================================

interface SimpleWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm?: () => void
}

// Momsdeklaration wizard
export function MomsWizardDialog({ open, onOpenChange, onConfirm, initialData }: SimpleWizardProps & { initialData?: VatReport }) {
    const handleConfirm = async () => {
        if (!initialData) return

        try {
            const response = await fetch('/api/reports/vat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    period_id: (initialData as any).periodId,
                    report_type: 'vat',
                    data: initialData,
                    status: 'submitted',
                    period_start: initialData.period // Simplified, should be proper dates in real scenario
                })
            })

            if (response.ok) {
                onConfirm?.()
            }
        } catch (err) {
            console.error("Failed to save report:", err)
        }
    }

    if (!initialData) return null

    return (
        <AIWizardDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={handleConfirm}
            step1={{
                title: "Välj momsperiod",
                periodLabel: initialData.period,
                periodSubtitle: "Baserat på dina senaste transaktioner",
                deadlineLabel: "Deadline",
                deadline: initialData.dueDate,
                icon: <span className="text-primary">📅</span>,
                summaryItems: [
                    { label: "Utgående moms", value: `${initialData.salesVat.toLocaleString('sv-SE')} kr` },
                    { label: "Ingående moms", value: `${initialData.inputVat.toLocaleString('sv-SE')} kr` },
                ],
            }}
            step2={{
                initialPrompt: `Finns det något speciellt som påverkar momsen för ${initialData.period}?`,
                promptHint: "T.ex. EU-försäljning, korrigeringar, export",
                responseHandler: (msg) => {
                    const lower = msg.toLowerCase()
                    if (lower.includes("export") || lower.includes("eu")) {
                        return "Förstått! Jag har justerat för EU-försäljning/export med 0% moms."
                    }
                    if (lower.includes("fel") || lower.includes("korrigera")) {
                        return "Jag har noterat korrigeringen. Den kommer att inkluderas i beräkningen."
                    }
                    return "Jag har noterat det. Finns det något mer som påverkar momsdeklarationen?"
                },
            }}
            step3={{
                title: `Momsdeklaration ${initialData.period}`,
                subtitle: "Beräknat underlag",
                icon: <span>📄</span>,
                summaryRows: [
                    { label: "Utgående moms", value: `${initialData.salesVat.toLocaleString('sv-SE')} kr` },
                    { label: "Ingående moms", value: `-${initialData.inputVat.toLocaleString('sv-SE')} kr`, negative: true },
                ],
                resultLabel: "Moms att betala",
                resultValue: `${initialData.netVat.toLocaleString('sv-SE')} kr`,
            }}
        />
    )
}

// Inkomstdeklaration wizard
export function InkomstWizardDialog({ open, onOpenChange, onConfirm }: SimpleWizardProps) {
    return (
        <AIWizardDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            step1={{
                title: "Välj beskattningsår",
                periodLabel: "Inkomstår 2024",
                periodSubtitle: "INK2 - Aktiebolag",
                deadlineLabel: "Deadline",
                deadline: "1 jul 2025",
                icon: <span className="text-primary">📅</span>,
                summaryItems: [
                    { label: "Rörelseintäkter", value: "1 420 000 kr" },
                    { label: "Rörelsekostnader", value: "-1 041 000 kr" },
                    { label: "Bokfört resultat", value: "379 000 kr" },
                ],
            }}
            step2={{
                initialPrompt: "Finns det något speciellt som påverkar inkomstdeklarationen?",
                promptHint: "T.ex. skattemässiga justeringar, underskott att rulla, särskilda avdrag",
                responseHandler: (msg) => {
                    const lower = msg.toLowerCase()
                    if (lower.includes("avskrivning") || lower.includes("inventarier")) {
                        return "Förstått! Jag har justerat avskrivningar enligt bokföringen."
                    }
                    if (lower.includes("underskott") || lower.includes("förlust")) {
                        return "Noterat! Underskottet kommer att rullas framåt enligt reglerna."
                    }
                    return "Jag har noterat det. Finns det något mer som påverkar deklarationen?"
                },
            }}
            step3={{
                title: "INK2 - Inkomstår 2024",
                subtitle: "Aktiebolag",
                icon: <span>📄</span>,
                summaryRows: [
                    { label: "Rörelseresultat", value: "379 000 kr" },
                    { label: "Skattemässiga justeringar", value: "0 kr" },
                    { label: "Beräknad skatt (20,6%)", value: "78 074 kr" },
                ],
                resultLabel: "Skattemässigt resultat",
                resultValue: "379 000 kr",
            }}
        />
    )
}

// Årsredovisning wizard
export function ArsredovisningWizardDialog({ open, onOpenChange, onConfirm }: SimpleWizardProps) {
    return (
        <AIWizardDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            step1={{
                title: "Välj räkenskapsår",
                periodLabel: "Räkenskapsår 2024",
                periodSubtitle: "2024-01-01 – 2024-12-31",
                deadlineLabel: "Deadline",
                deadline: "30 jun 2025",
                icon: <span className="text-primary">🏢</span>,
                summaryItems: [
                    { label: "Nettoomsättning", value: "1 420 000 kr" },
                    { label: "Årets resultat", value: "301 000 kr" },
                    { label: "Balansomslutning", value: "890 000 kr" },
                ],
            }}
            step2={{
                initialPrompt: "Finns det något speciellt som ska med i årsredovisningen?",
                promptHint: "T.ex. väsentliga händelser, personalförändringar, framtidsutsikter",
                responseHandler: (msg) => {
                    const lower = msg.toLowerCase()
                    if (lower.includes("händelse") || lower.includes("väsentlig")) {
                        return "Förstått! Jag lägger till detta under Väsentliga händelser i förvaltningsberättelsen."
                    }
                    if (lower.includes("personal") || lower.includes("anställd")) {
                        return "Noterat! Jag uppdaterar personalnoten med den informationen."
                    }
                    return "Jag har noterat det. Finns det något mer att ta med i förvaltningsberättelsen?"
                },
            }}
            step3={{
                title: "Årsredovisning 2024",
                subtitle: "K2-regelverk",
                icon: <span>🏢</span>,
                summaryRows: [
                    { label: "Nettoomsättning", value: "1 420 000 kr" },
                    { label: "Årets resultat", value: "301 000 kr", negative: true },
                    { label: "Balansomslutning", value: "890 000 kr" },
                ],
                resultLabel: "Årets resultat",
                resultValue: "301 000 kr",
                generatedParts: ["Förvaltningsberättelse", "Resultaträkning", "Balansräkning", "Noter"],
            }}
        />
    )
}
