"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { ArrowRight, Paperclip, Mic, AtSign, FileText, Pencil, X, Check } from "lucide-react"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"
import { ScaledPreview, Cursor } from "./shared"

/**
 * Z-Report Preview - Step 1 of 3: Upload & Analyze
 * 
 * Flow: User uploads Z-rapport → Types "Bokför" → AI analyzes and shows 
 * parsed breakdown in ConfirmationCard ready for approval
 */

export function ZReportContextPreview() {
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

    return <ZReportContextPreviewContent />
}

function ZReportContextPreviewContent() {
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { amount: 0.3 })

    const [step, setStep] = useState(0)
    const [inputText, setInputText] = useState("")
    const [cursor, setCursor] = useState({ x: 0, y: 0, click: false, opacity: 0 })
    const [hoverButton, setHoverButton] = useState<string | null>(null)

    useEffect(() => {
        if (!isInView) return

        let mounted = true

        const runSequence = async () => {
            if (!mounted) return

            // Reset
            setStep(0)
            setInputText("")
            setCursor({ x: 0, y: 0, click: false, opacity: 0 })
            setHoverButton(null)

            await new Promise(r => setTimeout(r, 800))
            if (!mounted) return

            // Show file attached
            setStep(1)

            await new Promise(r => setTimeout(r, 600))
            if (!mounted) return

            // Type command
            const cmd = "Bokför detta"
            for (let i = 0; i <= cmd.length; i++) {
                await new Promise(r => setTimeout(r, 55))
                if (!mounted) return
                setInputText(cmd.slice(0, i))
            }

            await new Promise(r => setTimeout(r, 300))
            if (!mounted) return
            setInputText("")
            setStep(2) // Message sent

            await new Promise(r => setTimeout(r, 500))
            if (!mounted) return
            setStep(3) // AI thinking

            await new Promise(r => setTimeout(r, 1200))
            if (!mounted) return
            setStep(4) // AI shows confirmation card

            // Hold
            await new Promise(r => setTimeout(r, 5000))
            if (!mounted) return

            runSequence()
        }

        runSequence()
        return () => { mounted = false }
    }, [isInView])

    const showGreeting = step === 0

    return (
        <ScaledPreview scale={0.8} className="h-full" variant="responsive-flush">
            <div ref={containerRef} className="bg-background flex flex-col h-[620px] relative p-5">
                <Cursor x={cursor.x} y={cursor.y} click={cursor.click} opacity={cursor.opacity} />

                {/* Greeting */}
                <AnimatePresence>
                    {showGreeting && (
                        <motion.div
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-4"
                        >
                            <ScopeAILogo className="w-12 h-12 text-stone-900 mb-4" />
                            <p className="text-base text-muted-foreground text-center">Hur kan jag hjälpa dig?</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Messages */}
                <div className={`flex flex-col gap-4 flex-1 transition-opacity duration-300 overflow-hidden ${showGreeting ? 'opacity-0' : 'opacity-100'}`}>
                    {/* User message + file */}
                    <AnimatePresence>
                        {step >= 2 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-end gap-2"
                            >
                                <div className="rounded-lg px-4 py-2 bg-primary text-white text-sm">
                                    Bokför detta
                                </div>
                                <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3 text-sm">
                                    <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-muted-foreground">zrapport_2025-01-15.pdf</span>
                                        <span className="text-muted-foreground text-xs">Z-rapport • 48 KB</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* AI thinking */}
                    <AnimatePresence>
                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm text-muted-foreground"
                            >
                                Analyserar Z-rapport...
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* AI confirmation card */}
                    <AnimatePresence>
                        {step >= 4 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                <p className="text-sm text-muted-foreground">
                                    Jag tolkade Z-rapporten. 8 transaktioner identifierade.
                                </p>
                                {/* Confirmation Card */}
                                <div className="rounded-xl border-2 border-dashed border-ring/40 bg-muted/30 overflow-hidden max-w-md">
                                    <div className="px-4 py-3 flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm">Bokför Z-rapport</h3>
                                            <p className="text-xs text-muted-foreground">2025-01-15 • Kassasystem</p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-border/40 mx-4" />
                                    <div className="px-4 py-3 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Kontantförsäljning</span>
                                            <span className="font-medium">12 450 kr</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Kortbetalningar</span>
                                            <span className="font-medium">12 470 kr</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Swish</span>
                                            <span className="font-medium">6 780 kr</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Returer/Rabatter</span>
                                            <span className="font-medium text-red-800/70">-730 kr</span>
                                        </div>
                                        <div className="flex justify-between pt-2">
                                            <span className="font-medium">Total</span>
                                            <span className="font-bold">30 970 kr</span>
                                        </div>
                                    </div>
                                    <div className="py-3">
                                        <div className="h-px bg-border/40 mx-4 mb-3" />
                                        <div className="px-4 flex items-center gap-2">
                                            <button className="h-8 px-3 bg-primary text-white text-sm font-medium rounded-md flex items-center gap-1.5">
                                                <Check className="w-3.5 h-3.5" />Godkänn
                                            </button>
                                            <button className="h-8 px-3 text-muted-foreground text-sm font-medium rounded-md">Kommentera</button>
                                            <button className="h-8 px-3 text-muted-foreground text-sm font-medium rounded-md ml-auto">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Bar */}
                <div className="mt-auto pt-2 md:mb-6">
                    {step >= 1 && step < 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 mb-2 text-xs"
                        >
                            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-muted-foreground flex-1">zrapport.pdf</span>
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </motion.div>
                    )}

                    <div className={`bg-muted/50 border-2 rounded-xl overflow-hidden transition-colors ${hoverButton === 'input' ? 'border-ring' : 'border-border/60'}`}>
                        <div className="px-3 py-2 min-h-[20px]">
                            {inputText ? (
                                <span className="text-foreground text-sm">{inputText}<span className="animate-pulse">|</span></span>
                            ) : (
                                <span className="text-muted-foreground text-sm">Skriv...</span>
                            )}
                        </div>
                        <div className="flex items-center justify-between px-2 pb-2">
                            <div className="flex items-center gap-1">
                                <div className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60">
                                    <Paperclip className="w-3.5 h-3.5" />
                                </div>
                                <div className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60">
                                    <AtSign className="w-3.5 h-3.5" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60">
                                    <Mic className="w-3.5 h-3.5" />
                                </div>
                                <div className="h-7 w-7 rounded-md flex items-center justify-center bg-primary">
                                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ScaledPreview>
    )
}
