"use client"

import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"
import { ArrowRight, Paperclip, AtSign, Mic, ChevronDown, Search, TrendingDown, CheckCircle2, Plus, Building2, Calendar, Banknote, AlertCircle, UploadCloud, FileText, Tag, Hash, CreditCard, Loader2, FileCheck, Download, Clock, ArrowUpRight, Check, Pencil, X, BookOpen, Play, Pause } from "lucide-react"
import { AppStatusBadge } from "@/components/ui/status-badge"
import type { AppStatus } from "@/lib/status-types"
import { useRef, useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// ─── Phase durations (ms) ───
// Total ~58 seconds
const PHASE_DURATIONS = [
    2000,  // 0:  Idle
    1500,  // 1:  Upload receipt (Paperclip click)
    2500,  // 2:  Show Upload Preview in chat bar
    2000,  // 3:  Type "Bokför mitt kvitto."
    2500,  // 4:  Send + AI thinking + booking overlay
    2500,  // 5:  AI response "Kvittot bokfört"
    2000,  // 6:  Type "Visa verifikationen."
    2000,  // 7:  Send + AI thinking + "Öppnar verifikationer" overlay
    3000,  // 8:  Verifikationer view
    2500,  // 9:  Type "Kan du ta fram momsdeklarationen?"
    2000,  // 10: Send + AI thinking + "Öppnar momsdeklaration flik" overlay
    3500,  // 11: Show moms page + AI asks to generate
    1500,  // 12: Type "Ja, kör!"
    3000,  // 13: Send + AI thinking + generation overlay
    7000,  // 14: Walkthrough overlay — reading time
    1500,  // 15: Walkthrough — Godkänn button pressed
    3000,  // 16: AI file card + moms page with Genererad badge
    2500,  // 17: Type "Vad gör jag nu?"
    2000,  // 18: Send + AI thinking 
    4500,  // 19: AI instructions response
    3000,  // 20: Hold on moms page
    3500,  // 21: Scope AI Brand overlay
    1500,  // 22: Reset crossfade
]

// ─── New receipt data ───
const NEW_RECEIPT = {
    supplier: "Scandic Hotels",
    date: "26 Feb",
    category: "Representation",
    amount: "- 2 450,00 kr",
    verNr: "047",
    konto: "6071",
    kontoName: "Representation",
    description: "Scandic Hotels — Kundmöte lunch",
}

// ─── Timeline / Checkpoints ───
const DEMO_STEPS = [
    { label: "Uppladdning", phase: 0 },
    { label: "Bokföring", phase: 3 },
    { label: "Verifikationer", phase: 7 },
    { label: "Momsdeklaration", phase: 10 },
    { label: "Godkänn", phase: 14 }
]

export function AppDemoShowcase() {
    const containerRef = useRef<HTMLDivElement>(null)
    const chatScrollRef = useRef<HTMLDivElement>(null)
    const typingCancelRef = useRef(false)
    const [scale, setScale] = useState(0)
    const [ready, setReady] = useState(false)
    const [phase, setPhase] = useState(0)
    const [isInView, setIsInView] = useState(false)
    const [isPaused, setIsPaused] = useState(false)

    // Typing state for sidebar chat input
    const [chatInputText, setChatInputText] = useState("")

    const INTERNAL_WIDTH = 1100
    const INTERNAL_HEIGHT = 680

    // ─── Scale observer ───
    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const styles = getComputedStyle(containerRef.current)
                const paddingX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
                const innerWidth = containerRef.current.offsetWidth - paddingX
                const newScale = innerWidth / INTERNAL_WIDTH
                setScale(Math.min(newScale, 1))
                if (!ready) setReady(true)
            }
        }
        updateScale()
        const observer = new ResizeObserver(updateScale)
        if (containerRef.current) observer.observe(containerRef.current)
        window.addEventListener("resize", updateScale)
        return () => {
            window.removeEventListener("resize", updateScale)
            observer.disconnect()
        }
    }, [ready])

    // ─── IntersectionObserver for visibility ───
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const obs = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            { threshold: 0.3 }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    // ─── Reset when out of view ───
    useEffect(() => {
        if (!isInView) {
            setPhase(0)
            setChatInputText("")
        }
    }, [isInView])

    // ─── Phase auto-advance timer ───
    useEffect(() => {
        if (!isInView || isPaused) return
        const timer = setTimeout(() => {
            setPhase(prev => (prev + 1) % PHASE_DURATIONS.length)
        }, PHASE_DURATIONS[phase])
        return () => clearTimeout(timer)
    }, [phase, isInView, isPaused])

    // ─── Phase chat typing logic (with cleanup) ───
    useEffect(() => {
        // Cancel any previous typing chain
        typingCancelRef.current = true

        let textToType = ""
        if (phase === 3) textToType = "Bokför mitt kvitto."
        else if (phase === 6) textToType = "Visa verifikationen."
        else if (phase === 9) textToType = "Kan du ta fram momsdeklarationen?"
        else if (phase === 12) textToType = "Ja, kör!"
        else if (phase === 17) textToType = "Vad gör jag med filen nu?"

        if (textToType) {
            setChatInputText("")
            // Create a new cancel token for this typing chain
            const cancelToken = { cancelled: false }
            typingCancelRef.current = false

            let i = 0
            const typeNext = () => {
                if (cancelToken.cancelled) return
                if (i <= textToType.length) {
                    setChatInputText(textToType.substring(0, i))
                    i++
                    const delay = Math.random() * 40 + 30
                    setTimeout(typeNext, delay)
                }
            }
            setTimeout(typeNext, 200)

            return () => {
                cancelToken.cancelled = true
            }
        } else {
            setChatInputText("")
        }
    }, [phase])

    // ─── Auto-scroll chat to bottom ───
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
        }
    }, [phase])

    // ─── Derive visual states from phase ───
    const showNewReceipt = phase >= 1 && phase <= 6
    const receiptStatus: AppStatus = phase >= 5 ? "Bokförd" : "Uppladdad"
    const isProcessingReceipt = phase === 4

    // Content view: kvitton (0-6), verifikationer (7-10), momsdeklaration (11+)
    const showMomsPage = phase >= 11 && phase < 20
    const showVerifikationer = phase >= 7 && phase <= 10
    const activeTab = showMomsPage ? "moms" : showVerifikationer ? "verifikationer" : "kvitton"

    // Overlay states
    const showBookingOverlay = phase === 4
    const showVerifikationerOverlay = phase === 7
    const showMomsFetchOverlay = phase === 10
    const showMomsGenerateOverlay = phase === 13
    const showWalkthroughOverlay = phase === 14 || phase === 15
    const walkthroughGodkannPressed = phase === 15

    const messages: Array<{ id: string, role: "user" | "ai", content?: string, isFile?: boolean, attachedFileName?: string }> = []
    if (phase >= 4 && phase < 21) messages.push({ id: "1", role: "user", content: "Bokför mitt kvitto.", attachedFileName: "Scandic Hotel..." })
    if (phase >= 5 && phase < 21) messages.push({ id: "2", role: "ai", content: `Kvittot från **${NEW_RECEIPT.supplier}** är bokfört som verifikation **V-${NEW_RECEIPT.verNr}**.` })
    if (phase >= 7 && phase < 21) messages.push({ id: "2b", role: "user", content: "Visa verifikationen." })
    if (phase >= 8 && phase < 21) messages.push({ id: "2c", role: "ai", content: "Självklart, jag öppnar listan med verifikationer åt dig." })
    if (phase >= 10 && phase < 21) messages.push({ id: "3", role: "user", content: "Kan du ta fram momsdeklarationen?" })
    if (phase >= 11 && phase < 21) messages.push({ id: "4", role: "ai", content: "Du har en kommande momsdeklaration för **Q1 2026**. Perioden täcker jan\u2013mars. Vill du att jag genererar den?" })
    if (phase >= 13 && phase < 21) messages.push({ id: "5", role: "user", content: "Ja, kör!" })
    if (phase >= 16 && phase < 21) messages.push({ id: "6", role: "ai", isFile: true, content: "Momsdeklarationen är genererad och redo. Filen innehåller all data för Skatteverkets e-tjänst." })
    if (phase >= 18 && phase < 21) messages.push({ id: "7", role: "user", content: "Vad gör jag med filen nu?" })
    if (phase >= 19 && phase < 21) messages.push({ id: "8", role: "ai", content: "Ladda ner SRU-filen ovan och logga in på **Skatteverket.se**.\nGå till *Momsdeklaration > Lämna fil* och ladda upp den där. Bekräfta och signera med BankID." })

    const isAiThinking = phase === 4 || phase === 7 || phase === 10 || phase === 13 || phase === 18

    return (
        <section className="flex flex-col items-center justify-center min-h-screen px-4 w-full py-16">
            <div className="w-full max-w-[440px] md:max-w-[640px] mx-auto text-center mb-6 mt-8">
                {/* Interactive Timeline Playback Controls */}
                <div className={`inline-flex items-center p-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Play/Pause Button */}
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all mr-2 shrink-0 group"
                        title={isPaused ? "Spela upp" : "Pausa"}
                    >
                        {isPaused ? <Play className="w-3.5 h-3.5 ml-0.5 group-hover:scale-110 transition-transform" /> : <Pause className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                    </button>

                    {/* Timeline Segments */}
                    <div className="flex items-center gap-1.5 pr-1.5 overflow-x-auto no-scrollbar mask-edges">
                        {DEMO_STEPS.map((step, index) => {
                            const nextStepPhase = DEMO_STEPS[index + 1]?.phase ?? PHASE_DURATIONS.length;
                            const isActive = phase >= step.phase && phase < nextStepPhase;
                            const isPast = phase >= nextStepPhase;

                            return (
                                <button
                                    key={step.phase}
                                    onClick={() => {
                                        setPhase(step.phase)
                                        setIsPaused(true)
                                    }}
                                    title={step.label}
                                    className="relative h-6 group flex items-center shrink-0"
                                >
                                    <div className={`w-2.5 h-2.5 mx-1.5 rounded-full transition-all duration-300 z-10 ${isActive
                                        ? "bg-primary ring-4 ring-primary/30"
                                        : isPast
                                            ? "bg-white/80"
                                            : "bg-white/20 group-hover:bg-white/40"
                                        }`}
                                    />
                                    {/* Connector line - shown except for last item */}
                                    {index < DEMO_STEPS.length - 1 && (
                                        <div className={`w-8 sm:w-10 h-px mx-1 transition-colors duration-300 ${isPast ? "bg-white/40" : "bg-white/10"}`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="w-full max-w-[440px] md:max-w-[640px] mx-auto">

                {/* Outer glass card */}
                <div
                    ref={containerRef}
                    className={`rounded-[2rem] bg-black/30 backdrop-blur-2xl p-3 md:p-4 overflow-hidden transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
                >
                    {/* Inner scaled container */}
                    <div
                        className="relative overflow-hidden rounded-2xl"
                        style={{ height: INTERNAL_HEIGHT * scale }}
                    >
                        <div
                            className="absolute top-0 left-0 origin-top-left"
                            style={{
                                width: INTERNAL_WIDTH,
                                height: INTERNAL_HEIGHT,
                                transform: `scale(${scale})`,
                            }}
                        >
                            {/* Scope AI Full Screen Overlay (Brand ending reset) */}
                            <div
                                className={`absolute inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-1000 rounded-2xl pointer-events-none ${phase === 21 ? 'opacity-100' : 'opacity-0'}`}
                            >
                                {(phase === 21 || phase === 22) && (
                                    <div className="flex items-center gap-5 animate-in fade-in zoom-in-95 duration-1000 delay-300 fill-mode-both">
                                        <ScopeAILogo className="w-[72px] h-[72px] text-white" />
                                        <span className="text-[64px] font-semibold text-white tracking-tight mt-[4px]">scope ai</span>
                                    </div>
                                )}
                            </div>

                            {/* ============================================
                                THE ACTUAL APP LAYOUT
                               ============================================ */}
                            <div className={`w-full h-full bg-black rounded-2xl overflow-hidden flex flex-col ring-1 ring-white/10 relative transition-opacity duration-700 ${phase >= 21 ? 'opacity-0' : 'opacity-100'}`}>
                                <div className="flex flex-1 min-h-0 p-2 gap-2 overflow-hidden">

                                    {/* LEFT: AI Sidebar */}
                                    <div className="w-[280px] flex flex-col shrink-0 bg-[#18181a] rounded-xl overflow-hidden ring-1 ring-white/5">

                                        {/* Sidebar Header */}
                                        <div className="flex items-center gap-2 px-3 py-3">
                                            <ScopeAILogo className="w-5 h-5 text-white" />
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-semibold text-white leading-tight">Scope AI</span>
                                                <span className="text-[10px] text-white/40 leading-tight">AI Assistent</span>
                                            </div>
                                            <ChevronDown className="w-3 h-3 text-white/30 ml-auto" />
                                        </div>

                                        {/* Chat Area Container */}
                                        <div className="flex-1 flex flex-col mx-2 mb-2 bg-[#27272a] rounded-lg overflow-hidden">

                                            {/* Chat Messages Scroll Area */}
                                            <div
                                                ref={chatScrollRef}
                                                className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth"
                                            >
                                                <div className={`flex flex-col gap-5 min-h-full ${messages.length > 0 ? "justify-end" : "justify-center"}`}>

                                                    {/* MASCOT (Centered naturally, then pushed up by flex column flow) */}
                                                    <div className={`flex flex-col items-center justify-center text-center pb-4 transition-opacity ${messages.length === 0 ? "flex-1" : "mt-auto"}`}>
                                                        <svg width="48" height="48" viewBox="0 0 16 16" shapeRendering="crispEdges" className="mb-4">
                                                            <rect x="2" y="2" width="2" height="3" className="fill-amber-600 dark:fill-amber-500" />
                                                            <rect x="12" y="2" width="2" height="3" className="fill-amber-600 dark:fill-amber-500" />
                                                            <rect x="3" y="4" width="10" height="6" className="fill-amber-400 dark:fill-amber-300" />
                                                            <rect x="5" y="5" width="6" height="4" className="fill-amber-100 dark:fill-amber-50" />
                                                            <rect x="5" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
                                                            <rect x="9" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
                                                            <rect x="5" y="6" width="1" height="1" className="fill-white" />
                                                            <rect x="9" y="6" width="1" height="1" className="fill-white" />
                                                            <rect x="7" y="8" width="2" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                                            <rect x="7" y="9" width="2" height="1" className="fill-pink-400" />
                                                            <rect x="4" y="10" width="8" height="4" className="fill-amber-400 dark:fill-amber-300" />
                                                            <rect x="6" y="10" width="4" height="3" className="fill-amber-100 dark:fill-amber-50" />
                                                            <rect x="12" y="11" width="2" height="2" className="fill-amber-600 dark:fill-amber-500" />
                                                            <rect x="4" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
                                                            <rect x="10" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
                                                        </svg>
                                                        <p className="text-sm font-medium text-white">God natt!</p>
                                                        <p className="text-xs text-white/40 mt-1">Hur kan jag hjälpa dig?</p>
                                                    </div>

                                                    {/* Chat Messages */}
                                                    {messages.map((msg) => (
                                                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                                            {msg.role === 'user' ? (
                                                                // User Message
                                                                <div className="flex flex-col gap-2 items-end max-w-[85%]">
                                                                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3 py-2 text-[13px]">
                                                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                                                    </div>
                                                                    {msg.attachedFileName && (
                                                                        <div className="flex flex-wrap gap-2 justify-end">
                                                                            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2 pr-3 text-xs max-w-[200px] text-left">
                                                                                <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                                                                                    <FileText className="h-5 w-5 text-white/40" />
                                                                                </div>
                                                                                <div className="flex flex-col min-w-0">
                                                                                    <span className="font-medium text-white truncate max-w-[100px]">{msg.attachedFileName}</span>
                                                                                    <span className="text-white/40">Bifogad fil</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                // AI Message
                                                                <div className="w-full flex flex-col gap-2 justify-start">
                                                                    {msg.isFile && (
                                                                        // SRU File Card
                                                                        <div className="w-[95%] bg-zinc-900 rounded-xl p-3 shadow-sm">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                                                                                    <FileText className="w-5 h-5" />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-[13px] font-medium text-white truncate">momsdeklaration.sru</p>
                                                                                    <p className="text-[11px] text-white/50">Skapad och redo för nedladdning</p>
                                                                                </div>
                                                                                <button className="h-8 w-8 bg-white/5 hover:bg-white/10 rounded-md flex items-center justify-center transition-colors">
                                                                                    <Download className="w-4 h-4 text-white" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {msg.content && (
                                                                        // Text markdown response
                                                                        <div className="text-[13px] text-white/90 prose prose-sm prose-invert prose-p:leading-snug">
                                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Thinking Dots */}
                                                    {isAiThinking && (
                                                        <div className="flex justify-start items-center gap-1.5 py-1 text-white/50">
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            <span className="text-[12px]">Scope AI funderar...</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Chat Input */}
                                            <div className="p-2.5 bg-[#27272a]">
                                                <div className="bg-white/5 rounded-xl border border-white/10 flex flex-col transition-all overflow-hidden focus-within:ring-2 focus-within:ring-white/20">
                                                    {/* File Upload Preview Panel */}
                                                    {(phase === 2 || phase === 3) && (
                                                        <div className="px-3 pt-3 flex flex-wrap gap-2 animate-in fade-in zoom-in-95 duration-200">
                                                            <div className="relative group flex items-center gap-2 bg-white/10 rounded-lg p-2 pr-3 text-xs">
                                                                <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                                                                    <FileText className="h-5 w-5 text-white/40" />
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-medium text-white truncate max-w-[100px]">Scandic Hotel...</span>
                                                                    <span className="text-white/40">842 KB</span>
                                                                </div>
                                                                <button className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center opacity-100 transition-opacity z-20">
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="p-2.5">
                                                        <div className="text-[13px] mb-3 min-h-[20px] flex items-center px-1.5">
                                                            {chatInputText.length > 0 ? (
                                                                <span className="text-white">
                                                                    {chatInputText}
                                                                    <span className="animate-pulse ms-[1px] font-bold">|</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-white/40">Skriv ett meddelande...</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-0.5">
                                                                <button className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${phase === 1 ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80 hover:bg-white/10"}`}>
                                                                    <Paperclip className="w-4 h-4" />
                                                                </button>
                                                                <button className="w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all">
                                                                    <AtSign className="w-4 h-4" />
                                                                </button>
                                                                <div className="w-px h-4 bg-white/10 mx-1" />
                                                                <div className="flex items-center gap-1 hover:bg-white/10 px-2 py-1.5 rounded-md cursor-pointer transition-colors">
                                                                    <span className="text-[12px]">{"\u{1F9E0}"}</span>
                                                                    <span className="text-[11px] text-white/80 font-medium tracking-tight">Smart</span>
                                                                    <ChevronDown className="w-3 h-3 text-white/40 ml-0.5" />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-0.5">
                                                                <button className="w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all">
                                                                    <Mic className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${chatInputText ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/30"}`}
                                                                >
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-white/30 text-center mt-2.5">
                                                    Scope AI kan göra misstag. Kontrollera viktig info.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT: Main Content Area */}
                                    <div className="bg-black rounded-xl flex flex-col overflow-hidden ring-1 ring-white/5 relative" style={{ width: 'calc(100% - 288px)' }}>

                                        {/* ─── OVERLAY: Booking receipt (Phase 3) ─── */}
                                        {showBookingOverlay && (
                                            <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center animate-in fade-in duration-300">
                                                <div className="bg-zinc-900 shadow-2xl rounded-2xl p-5 flex items-center gap-4">
                                                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-white">Bokför kvitto</span>
                                                        <span className="text-xs text-white/50 mt-0.5">Avläser och matchar mot kontoplan...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ─── OVERLAY: Opening verifikationer (Phase 6) ─── */}
                                        {showVerifikationerOverlay && (
                                            <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center animate-in fade-in duration-300">
                                                <div className="bg-zinc-900 shadow-2xl rounded-2xl p-5 flex items-center gap-4">
                                                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-white">Öppnar verifikationer</span>
                                                        <span className="text-xs text-white/50 mt-0.5">Hämtar verifikationslista...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ─── OVERLAY: Opening momsdeklaration (Phase 9) ─── */}
                                        {showMomsFetchOverlay && (
                                            <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center animate-in fade-in duration-300">
                                                <div className="bg-zinc-900 shadow-2xl rounded-2xl p-5 flex items-center gap-4">
                                                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-white">Öppnar momsdeklaration flik</span>
                                                        <span className="text-xs text-white/50 mt-0.5">Laddar skatteuppgifter och momsperiod...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ─── OVERLAY: Generating momsdeklaration (Phase 12) ─── */}
                                        {showMomsGenerateOverlay && (
                                            <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center animate-in fade-in duration-300">
                                                <div className="bg-zinc-900 shadow-2xl rounded-2xl p-5 flex items-center gap-4">
                                                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-white">Genererar momsdeklaration</span>
                                                        <span className="text-xs text-white/50 mt-0.5">Beräknar moms och skapar SRU-fil...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ─── OVERLAY: Walkthrough report (Phase 12) ─── */}
                                        {/* Document-style walkthrough showing AI reasoning with source data */}
                                        {showWalkthroughOverlay && (
                                            <div className="absolute inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in duration-300">
                                                {/* Close button */}
                                                <button className="absolute top-3 right-3 z-10 rounded-md p-1.5 hover:bg-white/5 transition-colors">
                                                    <X className="h-3.5 w-3.5 text-white/40" />
                                                </button>

                                                {/* Vertically centered document body */}
                                                <article className="w-full max-w-[90%] px-5 animate-in slide-in-from-bottom-2 duration-300">
                                                    {/* Title */}
                                                    <header className="mb-4">
                                                        <h1 className="text-[17px] font-bold text-white tracking-tight">Momsdeklaration Q1 2026</h1>
                                                        <p className="mt-0.5 text-[12px] text-white/50">Period: Jan – Mar 2026</p>
                                                    </header>

                                                    <div className="border-b border-white/10 mb-4" />

                                                    {/* ── Utgående moms breakdown ── */}
                                                    <section className="mb-4">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <h2 className="text-[14px] font-semibold text-white">Utgående moms (försäljning)</h2>
                                                            <span className="text-[14px] font-bold text-white">24 500 kr</span>
                                                        </div>
                                                        <p className="text-[12px] text-white/50 mb-2">25% moms på 98 000 kr omsättning</p>
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center justify-between text-[12px] px-2.5 py-1.5 rounded-md bg-white/[0.03]">
                                                                <span className="text-white/70">Faktura #1042 — Konsulttjänster AB</span>
                                                                <span className="text-white/80 font-medium">12 500 kr</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[12px] px-2.5 py-1.5 rounded-md bg-white/[0.03]">
                                                                <span className="text-white/70">Faktura #1043 — Tech Solutions AB</span>
                                                                <span className="text-white/80 font-medium">8 000 kr</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[12px] px-2.5 py-1.5 rounded-md bg-white/[0.03]">
                                                                <span className="text-white/70">Faktura #1044 — Digital Agency AB</span>
                                                                <span className="text-white/80 font-medium">4 000 kr</span>
                                                            </div>
                                                        </div>
                                                    </section>

                                                    <div className="border-b border-white/10 mb-4" />

                                                    {/* ── Ingående moms breakdown ── */}
                                                    <section className="mb-4">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <h2 className="text-[14px] font-semibold text-white">Ingående moms (inköp)</h2>
                                                            <span className="text-[14px] font-bold text-white">18 200 kr</span>
                                                        </div>
                                                        <p className="text-[12px] text-white/50 mb-2">Från 47 verifikationer under perioden</p>
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center justify-between text-[12px] px-2.5 py-1.5 rounded-md bg-white/[0.03]">
                                                                <span className="text-white/70">V-047 Scandic Hotels — Representation</span>
                                                                <span className="text-white/80 font-medium">490 kr</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[12px] px-2.5 py-1.5 rounded-md bg-white/[0.03]">
                                                                <span className="text-white/70">V-046 Clas Ohlson — Kontorsmaterial</span>
                                                                <span className="text-white/80 font-medium">250 kr</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[12px] px-2.5 py-1.5 rounded-md bg-white/[0.03]">
                                                                <span className="text-white/70">V-045 IKEA AB — Kontorsinredning</span>
                                                                <span className="text-white/80 font-medium">918 kr</span>
                                                            </div>
                                                            <div className="flex items-center text-[12px] px-2.5 py-1 text-white/40">
                                                                <span>+ 44 fler verifikationer...</span>
                                                            </div>
                                                        </div>
                                                    </section>

                                                    <div className="border-b border-white/10 mb-4" />

                                                    {/* ── Result ── */}
                                                    <section className="mb-4">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <h2 className="text-[14px] font-semibold text-white">Moms att betala</h2>
                                                            <span className="text-[15px] font-bold text-red-400">- 6 300 kr</span>
                                                        </div>
                                                        <div className="text-[12px] text-white/50 space-y-0.5 pl-2.5 border-l-2 border-white/10">
                                                            <p>Utgående moms: 24 500 kr</p>
                                                            <p>Ingående moms: −18 200 kr</p>
                                                            <p className="text-white/70 font-medium">Skillnad: 6 300 kr att betala till Skatteverket</p>
                                                        </div>
                                                    </section>

                                                    <div className="border-b border-white/10 mb-4" />

                                                    {/* Footer actions */}
                                                    <div className="flex items-center gap-2">
                                                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-[12px] text-white/70 hover:bg-white/10 transition-colors">
                                                            <Pencil className="w-3 h-3" />
                                                            Redigera
                                                        </button>
                                                        <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] text-white font-medium transition-all duration-300 ${walkthroughGodkannPressed ? "bg-emerald-500 scale-95 ring-2 ring-emerald-400/50" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                                                            <Check className="w-3 h-3" />
                                                            {walkthroughGodkannPressed ? "Godkänd!" : "Godkänn"}
                                                        </button>
                                                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-[12px] text-white/70 hover:bg-white/10 transition-colors ml-auto">
                                                            Stäng
                                                        </button>
                                                    </div>
                                                </article>
                                            </div>
                                        )}

                                        <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-5">
                                            {/* Tabs Row (Quick Menu) */}
                                            <div className="flex items-center gap-1 pb-3 mb-5 border-b-2 border-white/5">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-md text-white/30 hover:bg-white/5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                </div>
                                                <div className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all duration-300 ${activeTab === "kvitton" ? "bg-purple-500/10" : ""}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                                    {activeTab === "kvitton" && <span className="text-[12px] text-purple-400 font-medium">Kvitton</span>}
                                                </div>
                                                <div className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all duration-300 ${activeTab === "verifikationer" ? "bg-sky-500/10" : ""}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                                    {activeTab === "verifikationer" && <span className="text-[12px] text-sky-400 font-medium">Verifikationer</span>}
                                                </div>
                                                <div className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all duration-300 ${activeTab === "moms" ? "bg-amber-500/10" : ""}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                    {activeTab === "moms" && <span className="text-[12px] text-amber-400 font-medium">Momsdeklaration</span>}
                                                </div>
                                                <div className="flex items-center justify-center w-8 h-8 ml-1 rounded-md text-white/30 hover:bg-white/5">
                                                    <Plus className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="ml-auto text-[11px] text-white/30">
                                                    Senaste uppdaterad: 23:00
                                                </div>
                                            </div>

                                            {/* Views Container */}
                                            <div className="space-y-4 flex-1 overflow-y-auto pr-1 relative">

                                                {/* KVITTON VIEW */}
                                                <div className={`transition-all duration-500 ${activeTab === "kvitton" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h2 className="text-xl font-bold text-white">Kvitton</h2>
                                                            <p className="text-[13px] text-white/40 mt-0.5">Ladda upp och hantera dina kvitton</p>
                                                        </div>
                                                        <button className={`flex items-center gap-1.5 bg-white/90 text-black rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${phase === 1 ? "ring-2 ring-white ring-offset-2 ring-offset-black animate-pulse" : ""}`}>
                                                            <UploadCloud className="w-3.5 h-3.5" /> Ladda upp
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-900/40 to-zinc-900/40">
                                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center">
                                                                <FileText className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] text-white/40">Antal kvitton</p>
                                                                <p className="text-xl font-bold text-white">{showNewReceipt ? 13 : 12}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-900/40 to-zinc-900/40">
                                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center">
                                                                <TrendingDown className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] text-white/40">Totalt belopp</p>
                                                                <p className="text-xl font-bold text-white">{showNewReceipt ? "- 50 800,00 kr" : "- 48 350,00 kr"}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-950/20 to-zinc-900/40 hover:from-amber-950/40 hover:to-orange-950/40 transition-colors">
                                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-950 flex items-center justify-center">
                                                                <AlertCircle className="h-4 w-4 text-amber-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] text-white/40">Att hantera</p>
                                                                <p className="text-xl font-bold text-white">{phase >= 1 && phase < 5 ? 3 : 2}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4">
                                                        <div className="border-b-2 border-white/5" />
                                                        <div className="flex items-center justify-between py-3 mb-2">
                                                            <span className="text-[12px] font-bold text-white/50 tracking-wider uppercase">Alla kvitton</span>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5">
                                                                    <Search className="w-3 h-3 text-white/25" />
                                                                    <span className="text-[11px] text-white/25">Sök...</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-12 items-center bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-[11px] font-semibold text-white/50 tracking-wider">
                                                            <div className="col-span-3 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />LEVERANTÖR</div>
                                                            <div className="col-span-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />DATUM</div>
                                                            <div className="col-span-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />KATEGORI</div>
                                                            <div className="col-span-2 flex items-center gap-1.5 justify-end"><Banknote className="w-3.5 h-3.5" />BELOPP</div>
                                                            <div className="col-span-2 flex items-center gap-1.5 justify-center"><CheckCircle2 className="w-3.5 h-3.5" />STATUS</div>
                                                            <div className="col-span-1 flex items-center justify-end"><Paperclip className="w-3.5 h-3.5" /></div>
                                                        </div>

                                                        <div className="mt-2 space-y-1">
                                                            {/* New Receipt row — neon purple glow */}
                                                            {showNewReceipt && (
                                                                <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 via-purple-400/15 to-purple-500/20 ring-1 ring-purple-400/30 transition-all duration-500 animate-in slide-in-from-top-2 fade-in">
                                                                    <div className="col-span-3 text-[14px] font-medium text-purple-100 truncate">{NEW_RECEIPT.supplier}</div>
                                                                    <div className="col-span-2 text-[13px] text-purple-200/70">{NEW_RECEIPT.date}</div>
                                                                    <div className="col-span-2">
                                                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-400/15 text-purple-300">{NEW_RECEIPT.category}</span>
                                                                    </div>
                                                                    <div className="col-span-2 text-[14px] font-medium text-purple-100 text-right">{NEW_RECEIPT.amount}</div>
                                                                    <div className="col-span-2 flex justify-center">
                                                                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-purple-400/15 text-purple-300 font-medium">
                                                                            {receiptStatus === "Bokförd" ? <BookOpen className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                                            {receiptStatus}
                                                                        </span>
                                                                    </div>
                                                                    <div className="col-span-1 flex justify-end">
                                                                        <div className="text-purple-300/50 bg-purple-400/10 p-1 rounded-sm"><Paperclip className="h-3 w-3" /></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {/* Static Receipt Rows */}
                                                            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-[#0a0a0a] hover:bg-white/[0.03] transition-all">
                                                                <div className="col-span-3 text-[14px] font-medium text-white truncate">Clas Ohlson AB</div>
                                                                <div className="col-span-2 text-[13px] text-white/70">24 Feb</div>
                                                                <div className="col-span-2"><span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">Kontorsmaterial</span></div>
                                                                <div className="col-span-2 text-[14px] font-medium text-white text-right">- 1 249,00 kr</div>
                                                                <div className="col-span-2 flex justify-center"><AppStatusBadge status="Underlag finns" size="sm" /></div>
                                                                <div className="col-span-1 flex justify-end"><div className="text-white/30 bg-white/5 p-1 rounded-sm"><Paperclip className="h-3 w-3" /></div></div>
                                                            </div>
                                                            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-[#0a0a0a] hover:bg-white/[0.03] transition-all">
                                                                <div className="col-span-3 text-[14px] font-medium text-white truncate">Circle K</div>
                                                                <div className="col-span-2 text-[13px] text-white/70">22 Feb</div>
                                                                <div className="col-span-2"><span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">Drivmedel</span></div>
                                                                <div className="col-span-2 text-[14px] font-medium text-white text-right">- 892,50 kr</div>
                                                                <div className="col-span-2 flex justify-center"><AppStatusBadge status="Granskning krävs" size="sm" /></div>
                                                                <div className="col-span-1 flex justify-end"><div className="text-white/30 bg-white/5 p-1 rounded-sm"><Paperclip className="h-3 w-3" /></div></div>
                                                            </div>
                                                            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-[#0a0a0a] hover:bg-white/[0.03] transition-all">
                                                                <div className="col-span-3 text-[14px] font-medium text-white truncate">IKEA AB</div>
                                                                <div className="col-span-2 text-[13px] text-white/70">18 Feb</div>
                                                                <div className="col-span-2"><span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">Kontorsinredning</span></div>
                                                                <div className="col-span-2 text-[14px] font-medium text-white text-right">- 4 590,00 kr</div>
                                                                <div className="col-span-2 flex justify-center"><AppStatusBadge status="Bokförd" size="sm" /></div>
                                                                <div className="col-span-1 flex justify-end"><div className="text-white/30 bg-white/5 p-1 rounded-sm"><Paperclip className="h-3 w-3" /></div></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* VERIFIKATIONER VIEW */}
                                                <div className={`transition-all duration-500 ${activeTab === "verifikationer" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h2 className="text-xl font-bold text-white">Verifikationer</h2>
                                                            <p className="text-[13px] text-white/40 mt-0.5">Se alla bokförda transaktioner och verifikationer.</p>
                                                        </div>
                                                        <button className="flex items-center gap-1.5 bg-white/90 text-black rounded-lg px-3 py-1.5 text-[12px] font-medium">
                                                            <Plus className="w-3.5 h-3.5" /> Ny verifikation
                                                        </button>
                                                    </div>

                                                    {/* Verifikationer Stats Cards */}
                                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-900/40 to-zinc-900/40">
                                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center">
                                                                <FileCheck className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] text-white/40">Antal verifikationer</p>
                                                                <p className="text-xl font-bold text-white">47</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-900/40 to-zinc-900/40">
                                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center">
                                                                <Banknote className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] text-white/40">Omslutning</p>
                                                                <p className="text-xl font-bold text-white">345 200,00 kr</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-green-950/20 to-zinc-950/40">
                                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-green-950 flex items-center justify-center">
                                                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] text-white/40">Kopplade</p>
                                                                <p className="text-xl font-bold text-white">47</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Separator + List Header */}
                                                    <div className="mt-4">
                                                        <div className="border-b-2 border-white/5" />
                                                        <div className="flex items-center justify-between py-3 mb-2">
                                                            <span className="text-[12px] font-bold text-white/50 tracking-wider uppercase">Verifikationer</span>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5">
                                                                    <Search className="w-3 h-3 text-white/25" />
                                                                    <span className="text-[11px] text-white/25">Sök verifikation...</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-12 items-center bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-[11px] font-semibold text-white/50 tracking-wider">
                                                            <div className="col-span-1 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />NR</div>
                                                            <div className="col-span-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />DATUM</div>
                                                            <div className="col-span-2 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" />KONTO</div>
                                                            <div className="col-span-4 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />BESKRIVNING</div>
                                                            <div className="col-span-3 flex items-center gap-1.5 justify-end"><Banknote className="w-3.5 h-3.5" />BELOPP</div>
                                                        </div>

                                                        <div className="mt-2 space-y-1">
                                                            {/* New highlighted verifikation — neon sky glow */}
                                                            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-gradient-to-r from-sky-500/20 via-sky-400/15 to-sky-500/20 ring-1 ring-sky-400/30 transition-all duration-500 animate-in slide-in-from-top-2 fade-in">
                                                                <div className="col-span-1 font-mono text-[11px] text-sky-200/70">{NEW_RECEIPT.verNr}</div>
                                                                <div className="col-span-2 text-[13px] text-sky-200/70">{NEW_RECEIPT.date}</div>
                                                                <div className="col-span-2 flex flex-col">
                                                                    <span className="text-[13px] font-medium text-sky-100">{NEW_RECEIPT.konto}</span>
                                                                    <span className="text-[10px] text-sky-200/50">{NEW_RECEIPT.kontoName}</span>
                                                                </div>
                                                                <div className="col-span-4 text-[14px] font-medium text-sky-100 truncate">{NEW_RECEIPT.description}</div>
                                                                <div className="col-span-3 text-[14px] font-medium text-right text-sky-100">{NEW_RECEIPT.amount}</div>
                                                            </div>

                                                            {/* Static Verifs */}
                                                            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-[#0a0a0a] hover:bg-white/[0.03]">
                                                                <div className="col-span-1 font-mono text-[11px] text-white/60">046</div>
                                                                <div className="col-span-2 text-[13px] text-white/70">24 Feb</div>
                                                                <div className="col-span-2 flex flex-col"><span className="text-[13px] font-medium text-white">6110</span><span className="text-[10px] text-white/40">Kontorsmaterial</span></div>
                                                                <div className="col-span-4 text-[14px] font-medium text-white truncate">Clas Ohlson AB — Kontorsmaterial</div>
                                                                <div className="col-span-3 text-[14px] font-medium text-right text-white">- 1 249,00 kr</div>
                                                            </div>
                                                            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-[#0a0a0a] hover:bg-white/[0.03]">
                                                                <div className="col-span-1 font-mono text-[11px] text-white/60">045</div>
                                                                <div className="col-span-2 text-[13px] text-white/70">18 Feb</div>
                                                                <div className="col-span-2 flex flex-col"><span className="text-[13px] font-medium text-white">5410</span><span className="text-[10px] text-white/40">Förbrukningsinven.</span></div>
                                                                <div className="col-span-4 text-[14px] font-medium text-white truncate">IKEA AB — Kontorsinredning</div>
                                                                <div className="col-span-3 text-[14px] font-medium text-right text-white">- 4 590,00 kr</div>
                                                            </div>
                                                            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-[#0a0a0a] hover:bg-white/[0.03]">
                                                                <div className="col-span-1 font-mono text-[11px] text-white/60">044</div>
                                                                <div className="col-span-2 text-[13px] text-white/70">15 Feb</div>
                                                                <div className="col-span-2 flex flex-col"><span className="text-[13px] font-medium text-white">6212</span><span className="text-[10px] text-white/40">Mobiltelefoni</span></div>
                                                                <div className="col-span-4 text-[14px] font-medium text-white truncate">Telia Company AB — Mobilabonnemang</div>
                                                                <div className="col-span-3 text-[14px] font-medium text-right text-white">- 899,00 kr</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* MOMSDEKLARATION VIEW */}
                                                <div className={`transition-all duration-500 ${activeTab === "moms" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h2 className="text-xl font-bold text-white">Momsdeklaration</h2>
                                                            <p className="text-[13px] text-white/40 mt-0.5">Hantera och skicka in momsdeklarationer</p>
                                                        </div>
                                                        {phase < 15 && (
                                                            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 rounded-lg px-3 py-1.5 text-[12px] font-medium">
                                                                <Clock className="w-3.5 h-3.5" /> Q1 2026
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Moms Stats */}
                                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-900/40 to-zinc-900/40">
                                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center">
                                                                <ArrowUpRight className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] text-white/40">Utgående moms</p>
                                                                <p className="text-xl font-bold text-white">24 500 kr</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-900/40 to-zinc-900/40">
                                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center">
                                                                <TrendingDown className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] text-white/40">Ingående moms</p>
                                                                <p className="text-xl font-bold text-white">18 200 kr</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-950/20 to-zinc-900/40">
                                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-950 flex items-center justify-center">
                                                                <Banknote className="h-4 w-4 text-amber-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] text-white/40">Att betala</p>
                                                                <p className="text-xl font-bold text-amber-400">6 300 kr</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Moms Period Table */}
                                                    <div className="mt-4">
                                                        <div className="border-b-2 border-white/5" />
                                                        <div className="flex items-center justify-between py-3 mb-2">
                                                            <span className="text-[12px] font-bold text-white/50 tracking-wider uppercase">Perioder</span>
                                                        </div>

                                                        <div className="grid grid-cols-12 items-center bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-[11px] font-semibold text-white/50 tracking-wider">
                                                            <div className="col-span-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />PERIOD</div>
                                                            <div className="col-span-3 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />DEADLINE</div>
                                                            <div className="col-span-3 flex items-center gap-1.5 justify-end"><Banknote className="w-3.5 h-3.5" />BELOPP</div>
                                                            <div className="col-span-3 flex items-center gap-1.5 justify-center"><CheckCircle2 className="w-3.5 h-3.5" />STATUS</div>
                                                        </div>

                                                        <div className="mt-2 space-y-1">
                                                            <div className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl transition-all duration-500 ${phase >= 15 ? "bg-gradient-to-r from-emerald-500/20 via-emerald-400/15 to-emerald-500/20" : "bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20"}`}>
                                                                <div className={`col-span-3 text-[14px] font-medium ${phase >= 15 ? "text-emerald-100" : "text-amber-100"}`}>Q1 2026</div>
                                                                <div className={`col-span-3 text-[13px] ${phase >= 15 ? "text-emerald-200/70" : "text-amber-200/70"}`}>12 maj 2026</div>
                                                                <div className={`col-span-3 text-[14px] font-medium text-right ${phase >= 15 ? "text-emerald-300" : "text-amber-300"}`}>6 300 kr</div>
                                                                <div className="col-span-3 flex justify-center">
                                                                    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-medium ${phase >= 16 ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"}`}>
                                                                        {phase >= 16 ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                                        {phase >= 16 ? "Genererad" : "Kommande"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-[#0a0a0a] hover:bg-white/[0.03]">
                                                                <div className="col-span-3 text-[14px] font-medium text-white">Q4 2025</div>
                                                                <div className="col-span-3 text-[13px] text-white/70">12 feb 2026</div>
                                                                <div className="col-span-3 text-[14px] font-medium text-right text-white">4 850 kr</div>
                                                                <div className="col-span-3 flex justify-center">
                                                                    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        Inskickad
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-[#0a0a0a] hover:bg-white/[0.03]">
                                                                <div className="col-span-3 text-[14px] font-medium text-white">Q3 2025</div>
                                                                <div className="col-span-3 text-[13px] text-white/70">12 nov 2025</div>
                                                                <div className="col-span-3 text-[14px] font-medium text-right text-white">3 200 kr</div>
                                                                <div className="col-span-3 flex justify-center">
                                                                    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        Inskickad
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section >
    )
}
