"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { CheckCircle2, ArrowRight, FileText, Check } from "lucide-react"
// import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"
import { ScaledPreview, Cursor } from "./shared"

/**
 * Journal Entry Preview - Step 2 of 3: Confirm & Generate Verifikat
 * 
 * Shows AI creating the actual accounting journal entry with 
 * debit/credit lines - fully transparent bookkeeping
 */

// Journal entry lines for the Z-report
const journalLines = [
    { account: "1910", name: "Kassa", debit: 12450, credit: 0 },
    { account: "1580", name: "Kortfordringar", debit: 12470, credit: 0 },
    { account: "1940", name: "Plusgiro/Swish", debit: 6780, credit: 0 },
    { account: "3010", name: "Försäljning", debit: 0, credit: 30970 },
    { account: "2610", name: "Utgående moms", debit: 0, credit: 730 },
]

export function JournalEntryPreview() {
    const [hasViewed, setHasViewed] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHasViewed(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.1 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => observer.disconnect()
    }, [])

    if (!hasViewed) {
        return (
            <ScaledPreview scale={0.8} className="h-full" variant="responsive-flush">
                <div ref={containerRef} className="bg-background flex flex-col h-[620px] relative p-5" />
            </ScaledPreview>
        )
    }

    return <JournalEntryPreviewContent />
}

function JournalEntryPreviewContent() {
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { amount: 0.3 })

    const [step, setStep] = useState(0)
    const [visibleLines, setVisibleLines] = useState(0)
    const [cursor, setCursor] = useState({ x: 0, y: 0, click: false, opacity: 0 })

    useEffect(() => {
        if (!isInView) return

        let mounted = true

        const runSequence = async () => {
            if (!mounted) return

            // Reset
            setStep(0)
            setVisibleLines(0)
            setCursor({ x: 0, y: 0, click: false, opacity: 0 })

            await new Promise(r => setTimeout(r, 800))
            if (!mounted) return

            // Show user approved message
            setStep(1)

            await new Promise(r => setTimeout(r, 800))
            if (!mounted) return

            // AI thinking
            setStep(2)

            await new Promise(r => setTimeout(r, 1000))
            if (!mounted) return

            // Show verifikat card with lines appearing one by one
            setStep(3)

            for (let i = 1; i <= journalLines.length; i++) {
                await new Promise(r => setTimeout(r, 350))
                if (!mounted) return
                setVisibleLines(i)
            }

            await new Promise(r => setTimeout(r, 1000))
            if (!mounted) return

            // Show complete state
            setStep(4)

            // Hold
            await new Promise(r => setTimeout(r, 4000))
            if (!mounted) return

            runSequence()
        }

        runSequence()
        return () => { mounted = false }
    }, [isInView])

    const totalDebit = journalLines.reduce((sum, l) => sum + l.debit, 0)
    const totalCredit = journalLines.reduce((sum, l) => sum + l.credit, 0)

    return (
        <ScaledPreview scale={0.8} className="h-full" variant="responsive-flush">
            <div ref={containerRef} className="bg-background flex flex-col h-[620px] relative p-5">
                <Cursor x={cursor.x} y={cursor.y} click={cursor.click} opacity={cursor.opacity} />

                {/* Chat flow */}
                <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                    {/* Previous context - User approved */}
                    <AnimatePresence>
                        {step >= 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-end"
                            >
                                <div className="rounded-lg px-4 py-2 bg-primary text-white text-sm flex items-center gap-1.5">
                                    <Check className="w-4 h-4" /> Godkänd
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* AI thinking */}
                    <AnimatePresence>
                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm text-muted-foreground"
                            >
                                Skapar verifikation...
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Journal Entry Card */}
                    <AnimatePresence>
                        {step >= 3 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                <p className="text-sm text-muted-foreground">
                                    {step >= 4 ? "Verifikation skapad!" : "Skapar verifikation..."}
                                </p>

                                {/* Verifikat Card */}
                                <div className={`rounded-xl border-2 overflow-hidden transition-colors max-w-lg ${step >= 4 ? 'border-emerald-600/40 bg-emerald-50/20' : 'border-border'}`}>
                                    <div className="px-4 py-3 flex items-center gap-3">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${step >= 4 ? 'bg-emerald-600/15' : 'bg-blue-100'}`}>
                                            {step >= 4 ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <FileText className="h-4 w-4 text-blue-600" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm">Verifikation #1247</h3>
                                            <p className="text-xs text-muted-foreground">Z-rapport 2025-01-15</p>
                                        </div>
                                        {step >= 4 && (
                                            <span className="text-xs font-medium px-2 py-1 rounded-md bg-emerald-600/15 text-emerald-700">✓ Bokfört</span>
                                        )}
                                    </div>
                                    <div className="h-px bg-border/40 mx-4" />
                                    {/* Journal lines table */}
                                    <div className="px-4 py-3">
                                        {/* Header */}
                                        <div className="grid grid-cols-12 text-xs text-muted-foreground border-b border-border/40 pb-2 mb-2">
                                            <div className="col-span-2">Konto</div>
                                            <div className="col-span-5">Beskrivning</div>
                                            <div className="col-span-2 text-right">Debet</div>
                                            <div className="col-span-3 text-right">Kredit</div>
                                        </div>

                                        {/* Lines */}
                                        {journalLines.slice(0, visibleLines).map((line, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="grid grid-cols-12 text-sm py-1"
                                            >
                                                <div className="col-span-2 font-mono text-muted-foreground">{line.account}</div>
                                                <div className="col-span-5">{line.name}</div>
                                                <div className="col-span-2 text-right tabular-nums">
                                                    {line.debit > 0 ? line.debit.toLocaleString('sv-SE') : ''}
                                                </div>
                                                <div className="col-span-3 text-right tabular-nums">
                                                    {line.credit > 0 ? line.credit.toLocaleString('sv-SE') : ''}
                                                </div>
                                            </motion.div>
                                        ))}

                                        {/* Totals */}
                                        {visibleLines === journalLines.length && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="grid grid-cols-12 text-sm font-semibold border-t border-border/40 pt-2 mt-2"
                                            >
                                                <div className="col-span-2"></div>
                                                <div className="col-span-5">Summa</div>
                                                <div className="col-span-2 text-right tabular-nums">{totalDebit.toLocaleString('sv-SE')}</div>
                                                <div className="col-span-3 text-right tabular-nums">{totalCredit.toLocaleString('sv-SE')}</div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Link to page */}
                                {step >= 4 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 text-sm text-primary"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                        <span className="underline">Visa i bokföringen</span>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </ScaledPreview>
    )
}
