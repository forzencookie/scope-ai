"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { ArrowRight, Paperclip, Mic, AtSign, Check, Pencil, X } from "lucide-react"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"
import { Cursor } from "./shared"

/**
 * AI Chat Preview - Demonstrates conversational bookkeeping
 * 
 * Flow: User uploads receipt → Types "Bokför kvittot" → AI shows 
 * confirmation card with interpretation → User approves
 */

export function AIChatPreview() {
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

            const sendButtonX = 280
            const inputY = 270

            await new Promise(r => setTimeout(r, 800))
            if (!mounted) return

            // Show file attached state
            setStep(1)

            await new Promise(r => setTimeout(r, 600))
            if (!mounted) return

            // Move cursor to input area
            setCursor({ x: 100, y: inputY, click: false, opacity: 1 })
            await new Promise(r => setTimeout(r, 400))
            setHoverButton('input')

            // Type the command
            const command = "Bokför kvittot"
            for (let i = 0; i <= command.length; i++) {
                await new Promise(r => setTimeout(r, 55))
                if (!mounted) return
                setInputText(command.slice(0, i))
            }

            await new Promise(r => setTimeout(r, 400))
            if (!mounted) return

            // Move to send button
            setCursor({ x: sendButtonX, y: inputY, click: false, opacity: 1 })
            await new Promise(r => setTimeout(r, 300))
            setHoverButton('send')
            await new Promise(r => setTimeout(r, 200))
            setCursor(c => ({ ...c, click: true }))
            await new Promise(r => setTimeout(r, 100))
            setCursor(c => ({ ...c, click: false, opacity: 0 }))
            setHoverButton(null)
            setInputText("")
            setStep(2) // User message sent

            await new Promise(r => setTimeout(r, 500))
            if (!mounted) return
            setStep(3) // AI thinking

            await new Promise(r => setTimeout(r, 1200))
            if (!mounted) return
            setStep(4) // AI shows confirmation card

            await new Promise(r => setTimeout(r, 1800))
            if (!mounted) return

            // Click approve
            setCursor({ x: 45, y: 390, click: false, opacity: 1 })
            await new Promise(r => setTimeout(r, 500))
            setCursor(c => ({ ...c, click: true }))
            await new Promise(r => setTimeout(r, 100))
            setCursor(c => ({ ...c, click: false, opacity: 0 }))
            setStep(5) // Confirmed

            await new Promise(r => setTimeout(r, 3500))
            if (!mounted) return

            runSequence()
        }

        runSequence()
        return () => { mounted = false }
    }, [isInView])

    const showGreeting = step === 0

    return (
        <div ref={containerRef} className="bg-background flex flex-col h-full min-h-[320px] relative overflow-hidden">
            <div className="flex flex-col h-full relative p-3 pt-2">
                {/* Cursor */}
                <Cursor x={cursor.x} y={cursor.y} click={cursor.click} opacity={cursor.opacity} />

                {/* Greeting State */}
                <AnimatePresence>
                    {showGreeting && (
                        <motion.div
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-3"
                        >
                            <div className="mb-3">
                                <ScopeAILogo className="w-7 h-7 text-stone-900" />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Hur kan jag hjälpa dig?
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat Messages */}
                <div className={`flex flex-col gap-2 flex-1 transition-opacity duration-300 overflow-hidden ${showGreeting ? 'opacity-0' : 'opacity-100'}`}>
                    {/* User message with file attachment */}
                    <AnimatePresence>
                        {step >= 2 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-end gap-1.5"
                            >
                                <div className="rounded-lg px-2.5 py-1 bg-primary text-white text-[11px]">
                                    Bokför kvittot
                                </div>
                                <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1.5 pr-2 text-[10px]">
                                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                                        <span className="text-sm">🧾</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-muted-foreground">kvitto.jpg</span>
                                        <span className="text-muted-foreground">12 KB</span>
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
                                className="text-[11px] text-muted-foreground"
                            >
                                Tänker...
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* AI response with confirmation card */}
                    <AnimatePresence>
                        {step >= 4 && step < 5 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-1.5"
                            >
                                <p className="text-[11px] text-muted-foreground">
                                    Jag tolkade kvittot. Vill du att jag bokför det?
                                </p>
                                {/* Confirmation Card - matching real component */}
                                <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 overflow-hidden">
                                    <div className="px-2.5 py-1.5 border-b border-border/40 flex items-center gap-2">
                                        <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                                            <Pencil className="h-2.5 w-2.5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[10px]">Skapa kvitto</h3>
                                            <p className="text-[9px] text-muted-foreground">Clas Ohlson • -249 kr</p>
                                        </div>
                                    </div>
                                    <div className="px-2.5 py-1.5 space-y-0.5 text-[9px]">
                                        <div className="flex justify-between"><span className="text-muted-foreground">Leverantör</span><span className="font-medium">Clas Ohlson</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Konto</span><span className="font-medium">6110 Kontorsmaterial</span></div>
                                    </div>
                                    <div className="px-2.5 py-1.5 border-t border-border/40 flex items-center gap-1">
                                        <button className="h-5 px-1.5 bg-primary text-white text-[9px] font-medium rounded flex items-center gap-0.5">
                                            <Check className="w-2 h-2" />Godkänn
                                        </button>
                                        <button className="h-5 px-1.5 text-muted-foreground text-[9px] rounded">Kommentera</button>
                                        <button className="h-5 px-1.5 text-muted-foreground text-[9px] rounded ml-auto">
                                            <X className="w-2 h-2" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Confirmed state */}
                    <AnimatePresence>
                        {step >= 5 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-1.5"
                            >
                                <p className="text-[11px] text-muted-foreground">
                                    Klart! Kvittot är nu bokfört.
                                </p>
                                <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50/30 overflow-hidden">
                                    <div className="px-2.5 py-1.5 flex items-center gap-2">
                                        <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20">
                                            <Check className="h-2.5 w-2.5 text-emerald-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-[10px]">Kvitto bokfört</h3>
                                            <p className="text-[9px] text-muted-foreground">Clas Ohlson • 6110</p>
                                        </div>
                                        <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-700">✓</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Bar */}
                <div className="mt-auto pt-2">
                    {/* File attachment preview */}
                    {step >= 1 && step < 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1.5 mb-1.5 text-[10px]"
                        >
                            <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                                <span className="text-sm">🧾</span>
                            </div>
                            <span className="font-medium text-muted-foreground flex-1">kvitto.jpg</span>
                            <X className="w-2.5 h-2.5 text-muted-foreground" />
                        </motion.div>
                    )}

                    <div className={`bg-muted/50 border-2 rounded-lg overflow-hidden transition-colors ${hoverButton === 'input' ? 'border-ring' : 'border-border/60'}`}>
                        <div className="px-2.5 py-1.5 min-h-[16px]">
                            {inputText ? (
                                <span className="text-foreground text-[11px]">{inputText}<span className="animate-pulse">|</span></span>
                            ) : (
                                <span className="text-muted-foreground text-[11px]">Skriv ett meddelande...</span>
                            )}
                        </div>
                        <div className="flex items-center justify-between px-1.5 pb-1.5">
                            <div className="flex items-center gap-0.5">
                                <div className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/60">
                                    <Paperclip className="w-3 h-3" />
                                </div>
                                <div className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/60">
                                    <AtSign className="w-3 h-3" />
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <div className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground/60">
                                    <Mic className="w-3 h-3" />
                                </div>
                                <div className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${hoverButton === 'send' ? 'bg-primary/90' : 'bg-primary'}`}>
                                    <ArrowRight className="w-3 h-3 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
