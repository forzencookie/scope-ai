"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, FileText, CheckCircle2, Paperclip, Mic, AtSign } from "lucide-react"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"

// --- Sub-components (pointing hand cursor) ---
function DemoCursor({ x, y, clicking }: { x: number; y: number; clicking: boolean }) {
    return (
        <motion.div
            className="absolute z-50 pointer-events-none"
            initial={{ x, y }}
            animate={{ x, y }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <motion.div
                animate={{ scale: clicking ? 0.9 : 1 }}
                transition={{ duration: 0.08 }}
            >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="w-8 h-8 drop-shadow-lg">
                    <path d="M11.3,20.4c-0.3-0.4-0.6-1.1-1.2-2c-0.3-0.5-1.2-1.5-1.5-1.9c-0.2-0.4-0.2-0.6-0.1-1c0.1-0.6,0.7-1.1,1.4-1.1c0.5,0,1,0.4,1.4,0.7c0.2,0.2,0.5,0.6,0.7,0.8c0.2,0.2,0.2,0.3,0.4,0.5c0.2,0.3,0.3,0.5,0.2,0.1c-0.1-0.5-0.2-1.3-0.4-2.1c-0.1-0.6-0.2-0.7-0.3-1.1c-0.1-0.5-0.2-0.8-0.3-1.3c-0.1-0.3-0.2-1.1-0.3-1.5c-0.1-0.5-0.1-1.4,0.3-1.8c0.3-0.3,0.9-0.4,1.3-0.2c0.5,0.3,0.8,1,0.9,1.3c0.2,0.5,0.4,1.2,0.5,2c0.2,1,0.5,2.5,0.5,2.8c0-0.4-0.1-1.1,0-1.5c0.1-0.3,0.3-0.7,0.7-0.8c0.3-0.1,0.6-0.1,0.9-0.1c0.3,0.1,0.6,0.3,0.8,0.5c0.4,0.6,0.4,1.9,0.4,1.8c0.1-0.4,0.1-1.2,0.3-1.6c0.1-0.2,0.5-0.4,0.7-0.5c0.3-0.1,0.7-0.1,1,0c0.2,0,0.6,0.3,0.7,0.5c0.2,0.3,0.3,1.3,0.4,1.7c0,0.1,0.1-0.4,0.3-0.7c0.4-0.6,1.8-0.8,1.9,0.6c0,0.7,0,0.6,0,1.1c0,0.5,0,0.8,0,1.2c0,0.4-0.1,1.3-0.2,1.7c-0.1,0.3-0.4,1-0.7,1.4c0,0-1.1,1.2-1.2,1.8c-0.1,0.6-0.1,0.6-0.1,1c0,0.4,0.1,0.9,0.1,0.9s-0.8,0.1-1.2,0c-0.4-0.1-0.9-0.8-1-1.1c-0.2-0.3-0.5-0.3-0.7,0c-0.2,0.4-0.7,1.1-1.1,1.1c-0.7,0.1-2.1,0-3.1,0c0,0,0.2-1-0.2-1.4c-0.3-0.3-0.8-0.8-1.1-1.1L11.3,20.4z" fill="white" stroke="#000" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="19.6" y1="20.7" x2="19.6" y2="17.3" stroke="#000" strokeWidth="0.75" strokeLinecap="round" />
                    <line x1="17.6" y1="20.7" x2="17.5" y2="17.3" stroke="#000" strokeWidth="0.75" strokeLinecap="round" />
                    <line x1="15.6" y1="17.3" x2="15.6" y2="20.7" stroke="#000" strokeWidth="0.75" strokeLinecap="round" />
                </svg>
            </motion.div>
            <AnimatePresence>
                {clicking && (
                    <motion.div
                        className="absolute top-3 left-1 w-3 h-3 rounded-full bg-primary/20"
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    )
}

interface HeroDemoProps {
    step: number
    setStep: (step: number) => void
    restartKey: number
    timelineOffset: number
    setTimelineOffset: (offset: number) => void
    isPaused: boolean
    setIsPaused: (paused: boolean) => void
    onLoopComplete?: () => void
}

export function HeroDemo({
    step,
    setStep,
    restartKey,
    timelineOffset,
    setTimelineOffset,
    isPaused,
    setIsPaused,
    onLoopComplete
}: HeroDemoProps) {
    const [inputText, setInputText] = useState("")
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
    const [clicking, setClicking] = useState(false)
    const [typedComment, setTypedComment] = useState("")
    const [aiStreamText, setAiStreamText] = useState("")
    const [hoverButton, setHoverButton] = useState<string | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isPaused) return

        const getSendButtonX = () => {
            if (!containerRef.current) return 320
            // Adjusted offset from right edge to hit center of send button
            // Was 55, moving left -> 75
            return containerRef.current.offsetWidth - 75
        }


        const isMobile = window.innerWidth < 768
        const sendButtonY = isMobile ? 465 : 480

        const userMessage = "Bokför det här kvittot"
        const comment = "Ändra konto till 5810"

        const timeline = [
            { delay: 2000, action: () => setCursorPos({ x: 200, y: 460 }) },
            { delay: 2850, action: () => { setHoverButton('input'); setClicking(true); setTimeout(() => setClicking(false), 100) } },
            ...userMessage.split('').map((_, i) => ({
                delay: 3500 + i * 70,
                action: () => setInputText(userMessage.slice(0, i + 1))
            })),
            { delay: 6000, action: () => setCursorPos({ x: getSendButtonX(), y: sendButtonY }) },
            { delay: 6400, action: () => setHoverButton('send') },
            { delay: 6800, action: () => { setClicking(true); setTimeout(() => setClicking(false), 100) } },
            { delay: 7100, action: () => { setInputText(""); setStep(2); setHoverButton(null) } },
            { delay: 7300, action: () => setCursorPos({ x: 0, y: 0 }) },
            { delay: 8000, action: () => setStep(3) },
            { delay: 10000, action: () => setStep(4) },
            { delay: 13000, action: () => setCursorPos({ x: 140, y: 295 }) },
            { delay: 13500, action: () => setHoverButton('kommentera') },
            { delay: 14000, action: () => { setClicking(true); setTimeout(() => setClicking(false), 100) } },
            { delay: 14300, action: () => { setStep(5); setHoverButton('input'); setCursorPos({ x: 0, y: 0 }) } },
            ...comment.split('').map((_, i) => ({
                delay: 14800 + i * 70,
                action: () => setInputText(comment.slice(0, i + 1))
            })),
            { delay: 16500, action: () => setHoverButton(null) },
            { delay: 17200, action: () => setCursorPos({ x: getSendButtonX(), y: sendButtonY }) },
            { delay: 17600, action: () => setHoverButton('send') },
            { delay: 18000, action: () => { setClicking(true); setTimeout(() => setClicking(false), 100) } },
            { delay: 18300, action: () => { setInputText(""); setTypedComment(comment); setStep(6); setHoverButton(null) } },
            { delay: 18500, action: () => setCursorPos({ x: 0, y: 0 }) },
            { delay: 19000, action: () => setStep(7) },
            { delay: 21000, action: () => setStep(8) },
            { delay: 24000, action: () => setCursorPos({ x: 40, y: 240 }) },
            { delay: 24500, action: () => setHoverButton('godkann') },
            { delay: 25000, action: () => { setClicking(true); setTimeout(() => setClicking(false), 100) } },
            { delay: 25300, action: () => { setStep(9); setCursorPos({ x: 0, y: 0 }); setHoverButton(null) } },
            { delay: 28000, action: () => setCursorPos({ x: 200, y: 460 }) },
            { delay: 28500, action: () => setHoverButton('input') },
            { delay: 29000, action: () => { setClicking(true); setTimeout(() => setClicking(false), 100); } },
            { delay: 29400, action: () => setInputText("T") },
            { delay: 29600, action: () => setInputText("Ta") },
            { delay: 29800, action: () => setInputText("Tac") },
            { delay: 30000, action: () => setInputText("Tack") },
            { delay: 30200, action: () => setInputText("Tack!") },
            { delay: 31000, action: () => setCursorPos({ x: getSendButtonX(), y: sendButtonY }) },
            { delay: 31400, action: () => setHoverButton('send') },
            { delay: 31800, action: () => { setClicking(true); setTimeout(() => setClicking(false), 100) } },
            { delay: 32100, action: () => { setInputText(""); setStep(10); setHoverButton(null) } },
            { delay: 32300, action: () => setCursorPos({ x: 0, y: 0 }) },
            { delay: 32800, action: () => setStep(11) },
            { delay: 34500, action: () => setStep(12) },
            ..."Inga problem! 🙌 Det var ditt 47:e kvitto denna månad — du håller ett bra tempo.".split('').map((_, i) => ({
                delay: 34700 + i * 35,
                action: () => setAiStreamText("Inga problem! 🙌 Det var ditt 47:e kvitto denna månad — du håller ett bra tempo.".slice(0, i + 1))
            })),
            {
                delay: 42000, action: () => {
                    setStep(0)
                    setInputText("")
                    setTypedComment("")
                    setAiStreamText("")
                    setHoverButton(null)
                    setCursorPos({ x: 0, y: 0 })
                    setTimelineOffset(0)
                    // Trigger loop restart in parent
                    onLoopComplete?.()
                }
            },
        ]

        const activeTimeline = timeline
            .filter(item => item.delay > timelineOffset)
            .map(item => ({ ...item, delay: item.delay - timelineOffset }))

        const timeouts = activeTimeline.map(({ delay, action }) => setTimeout(action, delay))
        return () => timeouts.forEach(clearTimeout)
    }, [isPaused, restartKey, timelineOffset, setStep, setTimelineOffset, onLoopComplete])

    const showCursor = (cursorPos.x > 0 || cursorPos.y > 0)
    const showGreeting = step === 0

    return (
        <div ref={containerRef} className="bg-background rounded-xl flex flex-col h-[560px] relative overflow-hidden border border-border">
            {/* Window Chrome / Traffic Lights - Standardized size/padding */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40 bg-muted/20">
                <div className="w-2 h-2 rounded-full bg-red-400/80" />
                <div className="w-2 h-2 rounded-full bg-yellow-400/80" />
                <div className="w-2 h-2 rounded-full bg-green-400/80" />
            </div>

            <div className="flex flex-col h-full relative p-6 pt-2">
                {/* Cursor */}
                {showCursor && (
                    <DemoCursor x={cursorPos.x} y={cursorPos.y} clicking={clicking} />
                )}

                {/* Welcome State - Greeting (fades when user starts) */}
                <AnimatePresence>
                    {showGreeting && (
                        <motion.div
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-6"
                        >
                            <div className="mb-6">
                                <ScopeAILogo className="w-12 h-12 text-stone-900" />
                            </div>
                            <p className="text-xl text-muted-foreground text-center max-w-sm">
                                God eftermiddag! Vad vill du att jag hjälper dig med idag?
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat Messages */}
                <div className={`flex flex-col gap-3 flex-1 transition-opacity duration-300 ${showGreeting ? 'opacity-0' : 'opacity-100'}`}>
                    <AnimatePresence>
                        {step >= 2 && step < 6 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-end gap-2"
                            >
                                <div className="rounded-lg px-3 py-1.5 bg-primary text-white">
                                    <p className="text-sm">Bokför det här kvittot</p>
                                </div>
                                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 pr-3 text-xs">
                                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                        <span className="text-lg">🧾</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-muted-foreground">taxi_kvitto.jpg</span>
                                        <span className="text-muted-foreground">12 KB</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {step === 3 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-muted-foreground">
                                Tänker...
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {step >= 4 && step < 6 && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                <p className="text-sm text-muted-foreground">Jag tolkade kvittot. Vill du att jag bokför det?</p>
                                <div className="rounded-xl border-2 border-dashed border-ring/40 bg-muted/30 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-base">🧾</div>
                                        <div>
                                            <h3 className="font-semibold text-sm">Skapa kvitto</h3>
                                            <p className="text-xs text-muted-foreground">Taxi Stockholm AB • -495 kr</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-3 space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-muted-foreground">Leverantör</span><span className="font-medium">Taxi Stockholm AB</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Konto</span><span className="font-medium">5800 Resekostnader</span></div>
                                    </div>
                                    <div className="px-4 py-3 border-t border-border/40 flex items-center gap-2">
                                        <button className="h-7 px-3 bg-primary text-white text-xs font-medium rounded-md flex items-center gap-1">Godkänn</button>
                                        <button className={`h-7 px-3 text-muted-foreground text-xs font-medium rounded-md ${hoverButton === 'kommentera' ? 'bg-muted' : 'hover:bg-muted/50'}`}>Kommentera</button>
                                        <button className="h-7 px-3 text-muted-foreground text-xs font-medium rounded-md hover:bg-muted/50 ml-auto">Avbryt</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {step >= 6 && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                                <div className="rounded-lg px-3 py-1.5 bg-primary text-white"><p className="text-sm">{typedComment}</p></div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {step === 7 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-muted-foreground">
                                Tänker...
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {step >= 8 && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    {step >= 9 ? "Klart! Kvittot är nu bokfört." : "Perfekt, jag ändrade kontot. Godkänn för att bokföra."}
                                </p>
                                <div className={`rounded-xl border-2 overflow-hidden transition-colors duration-300 ${step >= 9 ? 'border-emerald-500 bg-emerald-50/30' : 'border-dashed border-ring/40 bg-muted/30'}`}>
                                    <div className={`px-4 py-3 flex items-center gap-3 ${step === 9 ? 'border-b border-emerald-200/60' : 'border-b border-border/40'}`}>
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${step >= 9 ? 'bg-emerald-500/20' : 'bg-muted/60'}`}>
                                            {step >= 9 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span>🧾</span>}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm">Skapa kvitto</h3>
                                            <p className="text-xs text-muted-foreground">Taxi Stockholm AB • -495 kr</p>
                                        </div>
                                        {step >= 9 && <span className="text-xs font-medium px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-700">Bokfört ✓</span>}
                                    </div>
                                    <div className="px-4 py-3 space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-muted-foreground">Leverantör</span><span className="font-medium">Taxi Stockholm AB</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Konto</span><span className="font-medium text-emerald-600">5810 Taxi & Transport</span></div>
                                    </div>
                                    {step < 9 && (
                                        <div className="px-4 py-3 border-t border-border/40 flex items-center gap-2">
                                            <button className={`h-7 px-3 text-white text-xs font-medium rounded-md transition-colors ${hoverButton === 'godkann' ? 'bg-primary/90' : 'bg-primary'}`}>Godkänn</button>
                                            <button className="h-7 px-3 text-muted-foreground text-xs font-medium rounded-md hover:bg-muted/50">Kommentera</button>
                                            <button className="h-7 px-3 text-muted-foreground text-xs font-medium rounded-md hover:bg-muted/50 ml-auto">Avbryt</button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {step >= 10 && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                                <div className="rounded-lg px-3 py-1.5 bg-primary text-white"><p className="text-sm">Tack!</p></div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {step === 11 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-muted-foreground">
                                Tänker...
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {step === 12 && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                <p className="text-sm text-muted-foreground">{aiStreamText}<span className="animate-pulse">|</span></p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Bar */}
                <div className="mt-auto pt-4">
                    <div className={`bg-muted/50 border-2 rounded-xl overflow-hidden transition-colors ${hoverButton === 'input' ? 'border-ring' : 'border-border/60'}`}>
                        <div className="px-4 py-3 min-h-[24px]">
                            {inputText ? (
                                <span className="text-foreground text-sm">{inputText}<span className="animate-pulse">|</span></span>
                            ) : (
                                <span className="text-muted-foreground text-sm">Skriv ett meddelande...</span>
                            )}
                        </div>
                        <div className="flex items-center justify-between px-2 pb-2">
                            {/* Left - attachment and mention buttons */}
                            <div className="flex items-center gap-0.5">
                                <div className={`h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:bg-muted/30 transition-colors`}>
                                    <Paperclip className="w-4 h-4" />
                                </div>
                                <div className={`h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:bg-muted/30 transition-colors`}>
                                    <AtSign className="w-4 h-4" />
                                </div>
                            </div>
                            {/* Right - mic and send */}
                            <div className="flex items-center gap-0.5">
                                <div className={`h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:bg-muted/30 transition-colors`}>
                                    <Mic className="w-4 h-4" />
                                </div>
                                <div className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${hoverButton === 'send' ? 'bg-primary/90' : 'bg-primary'}`}>
                                    <ArrowRight className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
