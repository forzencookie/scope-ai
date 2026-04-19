"use client"

/**
 * Conversation Simulation Engine
 *
 * Simulates how Scooby *should* stream responses — the ideal production experience.
 * Each scenario page defines a script, and this engine plays it out with realistic timing:
 *
 * - Text streams character by character (typewriter)
 * - Tool calls show shimmer → checkmark with realistic latency
 * - Thinking state appears before first content, then disappears
 * - Cards/confirmations appear with a subtle delay after text
 * - Multi-turn conversations flow naturally
 * - The whole thing auto-plays when the scenario scrolls into view
 */

import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AiProcessingState } from "@/components/shared/ai-processing-state"
import { PixelDogStatic } from "@/components/ai/mascots/dog"
import { cn } from "@/lib/utils"
import { RotateCcw, Play, FileText, Image as ImageIcon } from "lucide-react"

// ═══════════════════════════════════════════════════════════════════════════════
// Public types — used by scenario pages to define conversation scripts
// ═══════════════════════════════════════════════════════════════════════════════

export type SimElement =
    | { type: "thinking"; duration?: number }
    | { type: "tool"; name: string; duration?: number; resultLabel?: string }
    | { type: "stream"; text: string; speed?: number }
    | { type: "card"; content: React.ReactNode; delay?: number }
    | { type: "card-list"; items: React.ReactNode[]; staggerDelay?: number; delay?: number }
    | { type: "fire-event"; eventName: string }

export type SimTurn =
    | { role: "user"; content: string; delay?: number; attachment?: { name: string; type?: string } }
    | { role: "scooby"; elements: SimElement[]; delay?: number }

export type SimScript = SimTurn[]

// ═══════════════════════════════════════════════════════════════════════════════
// Internal: flatten script into sequential atoms
// ═══════════════════════════════════════════════════════════════════════════════

interface Atom {
    id: number
    turnIndex: number
    type: "user" | "thinking" | "tool" | "stream" | "card" | "fire-event"
    preDelay: number          // ms to wait BEFORE showing this atom
    activeDuration?: number   // ms this atom stays "active" (thinking, tool)
    name?: string             // tool name
    resultLabel?: string      // label shown when tool call completes
    text?: string             // user message or stream text
    speed?: number            // typewriter speed (ms per char)
    content?: React.ReactNode // card JSX
    isStaggered?: boolean     // card from a card-list — uses faster animation
    attachment?: { name: string; type?: string } // user message file attachment
    eventName?: string        // for fire-event: dispatched as CustomEvent on window
}

// Brief auto-acknowledgment text injected between thinking and the first tool call.
// Confirms intent ("I heard you and I'm on it") rather than just describing what Scooby is doing.
// Rotates through a small set per category to avoid feeling scripted.
const AUTO_ACKS = {
    read:    ["Absolut, jag kollar!", "Hämtar det åt dig!", "Jag tittar på det!"],
    compute: ["Jag räknar ihop det!", "Absolut, ett ögonblick!", "Ska kolla på det!"],
    write:   ["Fixar det åt dig!", "Absolut, jag ordnar det!", "Jag fixar det!"],
}

function getAutoAck(firstToolName: string): string {
    let options: string[]
    if (firstToolName.startsWith("calculate_") || firstToolName.startsWith("generate_")) {
        options = AUTO_ACKS.compute
    } else if (firstToolName.startsWith("create_") || firstToolName.startsWith("run_") || firstToolName.startsWith("send_") || firstToolName.startsWith("submit_") || firstToolName.startsWith("update_")) {
        options = AUTO_ACKS.write
    } else {
        options = AUTO_ACKS.read
    }
    return options[Math.floor(Math.random() * options.length)]
}

function flattenScript(script: SimScript): Atom[] {
    const atoms: Atom[] = []
    let id = 0

    for (let ti = 0; ti < script.length; ti++) {
        const turn = script[ti]

        if (turn.role === "user") {
            atoms.push({
                id: id++,
                turnIndex: ti,
                type: "user",
                text: turn.content,
                attachment: turn.attachment,
                // First user message appears quickly, follow-ups have a pause
                preDelay: ti === 0 ? 400 : (turn.delay ?? 1500),
            })
        } else {
            // Detect thinking → tool pattern to auto-inject acknowledgment
            const elems = turn.elements
            const needsAutoAck =
                elems.length >= 2 &&
                elems[0].type === "thinking" &&
                elems[1].type === "tool"

            for (let ei = 0; ei < elems.length; ei++) {
                const elem = elems[ei]
                const isFirst = ei === 0

                switch (elem.type) {
                    case "thinking":
                        atoms.push({
                            id: id++,
                            turnIndex: ti,
                            type: "thinking",
                            preDelay: isFirst ? (turn.delay ?? 500) : 0,
                            activeDuration: elem.duration ?? 1200,
                        })
                        // Auto-inject brief ack stream right after thinking, before first tool
                        if (needsAutoAck) {
                            const firstTool = elems[1]
                            const ackText = firstTool.type === "tool" ? getAutoAck(firstTool.name) : getAutoAck("")
                            atoms.push({
                                id: id++,
                                turnIndex: ti,
                                type: "stream",
                                text: ackText,
                                speed: 18,
                                preDelay: 80,
                            })
                        }
                        break

                    case "tool":
                        atoms.push({
                            id: id++,
                            turnIndex: ti,
                            type: "tool",
                            name: elem.name,
                            resultLabel: elem.resultLabel,
                            // First tool after a gap needs more delay (Scooby is "deciding")
                            preDelay: isFirst ? (turn.delay ?? 600) : 200,
                            // Realistic latency: simple lookups fast, complex queries slow
                            activeDuration: elem.duration ?? 1200,
                        })
                        break

                    case "stream":
                        atoms.push({
                            id: id++,
                            turnIndex: ti,
                            type: "stream",
                            text: elem.text,
                            speed: elem.speed ?? 10,
                            // Brief pause before text starts (AI formulating first words)
                            preDelay: isFirst ? (turn.delay ?? 500) : 400,
                        })
                        break

                    case "card":
                        atoms.push({
                            id: id++,
                            turnIndex: ti,
                            type: "card",
                            content: elem.content,
                            preDelay: isFirst ? (turn.delay ?? 500) : (elem.delay ?? 250),
                        })
                        break

                    case "card-list": {
                        const staggerDelay = elem.staggerDelay ?? 150
                        for (let itemIdx = 0; itemIdx < elem.items.length; itemIdx++) {
                            atoms.push({
                                id: id++,
                                turnIndex: ti,
                                type: "card",
                                content: elem.items[itemIdx],
                                isStaggered: true,
                                preDelay: itemIdx === 0
                                    ? (isFirst ? (turn.delay ?? 500) : (elem.delay ?? staggerDelay))
                                    : staggerDelay,
                            })
                        }
                        break
                    }

                    case "fire-event":
                        atoms.push({
                            id: id++,
                            turnIndex: ti,
                            type: "fire-event",
                            eventName: elem.eventName,
                            preDelay: 0,
                        })
                        break
                }
            }
        }
    }

    return atoms
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hook: drive the simulation state machine
// ═══════════════════════════════════════════════════════════════════════════════

type Phase = "idle" | "pre-delay" | "active" | "done"

function useSimulation(atoms: Atom[], eventBusRef: React.MutableRefObject<SimEventBus>) {
    const [cursor, setCursor] = useState(-1)
    const [phase, setPhase] = useState<Phase>("idle")
    const [streamChars, setStreamChars] = useState(0)

    // Refs to avoid stale closures in timers
    const cursorRef = useRef(cursor)
    cursorRef.current = cursor
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const cleanup = useCallback(() => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }, [])

    const advance = useCallback(() => {
        cleanup()
        const next = cursorRef.current + 1
        if (next >= atoms.length) {
            setCursor(next) // set beyond last to mark all as done
            setPhase("done")
            return
        }
        setCursor(next)
        cursorRef.current = next
        setPhase("pre-delay")
    }, [atoms.length, cleanup])

    // Pre-delay → active transition
    useEffect(() => {
        if (phase !== "pre-delay") return
        const atom = atoms[cursor]
        if (!atom) return

        if (atom.preDelay <= 0) {
            setPhase("active")
            return
        }

        timerRef.current = setTimeout(() => setPhase("active"), atom.preDelay)
        return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }, [phase, cursor, atoms])

    // Active phase: handle each atom type
    useEffect(() => {
        if (phase !== "active") return
        const atom = atoms[cursor]
        if (!atom) return

        switch (atom.type) {
            case "user":
            case "card":
                // Show immediately, advance after brief render
                timerRef.current = setTimeout(advance, 80)
                break

            case "fire-event":
                // Emit via the event bus then immediately advance
                if (atom.eventName && eventBusRef.current) {
                    simEmit(eventBusRef.current, atom.eventName)
                }
                timerRef.current = setTimeout(advance, 50)
                break

            case "thinking":
            case "tool":
                // Active for duration, then advance
                timerRef.current = setTimeout(advance, atom.activeDuration ?? 1200)
                break

            case "stream": {
                // Typewriter effect
                setStreamChars(0)
                const text = atom.text ?? ""
                let chars = 0
                const speed = atom.speed ?? 10

                // Stream in chunks of 1-3 chars for more natural feel
                intervalRef.current = setInterval(() => {
                    // Vary chunk size: mostly 1, sometimes 2-3 for faster feel
                    const chunk = Math.random() < 0.3 ? 2 : 1
                    chars = Math.min(chars + chunk, text.length)
                    setStreamChars(chars)

                    if (chars >= text.length) {
                        if (intervalRef.current) clearInterval(intervalRef.current)
                        // Small pause after stream finishes before advancing
                        timerRef.current = setTimeout(advance, 350)
                    }
                }, speed)
                break
            }
        }

        return cleanup
    }, [phase, cursor, atoms, advance, cleanup])

    const start = useCallback(() => {
        cleanup()
        setCursor(0)
        cursorRef.current = 0
        setStreamChars(0)
        setPhase("pre-delay")
    }, [cleanup])

    const reset = useCallback(() => {
        cleanup()
        setCursor(-1)
        cursorRef.current = -1
        setPhase("idle")
        setStreamChars(0)
    }, [cleanup])

    return {
        cursor,
        phase,
        streamChars,
        isIdle: phase === "idle",
        isDone: phase === "done",
        isPlaying: phase === "pre-delay" || phase === "active",
        start,
        reset,
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════════

interface SimulatedConversationProps {
    script: SimScript
    className?: string
}

// ── Simulation event bus ──
// Maps event names to sets of subscriber callbacks.
// Used by InteractiveActionCard (via useSimEvent) to react to fire-event
// atoms without relying on window CustomEvents, which have race conditions in
// React 19's concurrent renderer.
type SimEventBus = Map<string, Set<() => void>>

function createEventBus(): SimEventBus {
    return new Map()
}

function simEmit(bus: SimEventBus, eventName: string) {
    bus.get(eventName)?.forEach(fn => fn())
}

function simSubscribe(bus: SimEventBus, eventName: string, fn: () => void): () => void {
    if (!bus.has(eventName)) bus.set(eventName, new Set())
    bus.get(eventName)!.add(fn)
    return () => bus.get(eventName)?.delete(fn)
}

// Context through which InteractiveActionCard (or any card component) can
// subscribe to simulation events fired by fire-event atoms.
const SimEventContext = createContext<SimEventBus | null>(null)

/** Subscribe to a simulation fire-event by name. Returns isDone state. */
export function useSimEvent(eventName: string | undefined): boolean {
    const bus = useContext(SimEventContext)
    const [triggered, setTriggered] = useState(false)

    useEffect(() => {
        if (!eventName || !bus) return
        return simSubscribe(bus, eventName, () => setTriggered(true))
    }, [eventName, bus])

    return triggered
}

export function SimulatedConversation({ script, className }: SimulatedConversationProps) {
    const [atoms] = useState(() => flattenScript(script))

    // Event bus — stable reference, reset on replay
    const eventBusRef = useRef<SimEventBus>(createEventBus())

    const { cursor, phase, streamChars, isIdle, isDone, isPlaying, start, reset } = useSimulation(atoms, eventBusRef)

    // Manual play — no auto-play on scroll
    const containerRef = useRef<HTMLDivElement>(null)
    const hasStartedRef = useRef(false)

    // Incremented on each replay — used as part of card keys to force remount
    // (ensures interactive card components like InteractiveActionCard reset their state)
    const [replayCount, setReplayCount] = useState(0)

    const handleReplay = useCallback(() => {
        reset()
        // Reset event bus so cards remount with fresh state
        eventBusRef.current = createEventBus()
        setReplayCount(c => c + 1)
        // Small delay then restart
        setTimeout(() => {
            hasStartedRef.current = true
            start()
        }, 200)
    }, [reset, start])

    // ── Atom visibility helpers ──

    const isVisible = useCallback((atom: Atom): boolean => {
        if (atom.type === "thinking") {
            // Show while active AND after completion (transitions to "Tänkte i Xs")
            return (atom.id === cursor && phase === "active") || atom.id < cursor
        }
        // Everything else: visible if active or past
        return atom.id < cursor || (atom.id === cursor && phase === "active")
    }, [cursor, phase])

    const isActive = useCallback((atom: Atom): boolean => {
        return atom.id === cursor && phase === "active"
    }, [cursor, phase])

    const isDoneAtom = useCallback((atom: Atom): boolean => {
        return atom.id < cursor
    }, [cursor])

    // ── Group atoms by turn for rendering ──

    const turnGroups = useMemo(() => {
        const groups: { turnIndex: number; role: "user" | "scooby"; atoms: Atom[] }[] = []
        let currentGroup: typeof groups[0] | null = null

        for (const atom of atoms) {
            if (!currentGroup || currentGroup.turnIndex !== atom.turnIndex) {
                currentGroup = {
                    turnIndex: atom.turnIndex,
                    role: atom.type === "user" ? "user" : "scooby",
                    atoms: [],
                }
                groups.push(currentGroup)
            }
            currentGroup.atoms.push(atom)
        }

        return groups
    }, [atoms])

    // ── Render ──

    return (
        <SimEventContext value={eventBusRef.current}>
        <div ref={containerRef} className={cn("space-y-5 min-h-[60px]", className)}>
            {turnGroups.map((group) => {
                // Check if any atom in this group is visible
                const anyVisible = group.atoms.some(a => isVisible(a))
                if (!anyVisible && !isIdle) return null
                // When idle, show nothing
                if (isIdle) return null

                if (group.role === "user") {
                    const atom = group.atoms[0]
                    if (!isVisible(atom)) return null

                    const isImageAttachment = atom.attachment?.type?.startsWith("image/")

                    return (
                        <div key={`turn-${group.turnIndex}`} className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex flex-col items-end gap-1.5 max-w-[85%]">
                                <div className="px-3.5 py-2 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground text-sm">
                                    {atom.text}
                                </div>
                                {atom.attachment && (
                                    <div className="flex items-center gap-2 bg-muted/60 rounded-lg p-2 pr-3 text-xs max-w-[200px]">
                                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                            {isImageAttachment ? (
                                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                            ) : (
                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-medium truncate max-w-[100px]">{atom.attachment.name}</span>
                                            <span className="text-muted-foreground">Bifogad fil</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                // Scooby turn
                return (
                    <div key={`turn-${group.turnIndex}`} className="space-y-3 max-w-[90%] animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5">
                            <PixelDogStatic size={20} />
                            <span className="text-[11px] font-semibold text-muted-foreground">Scooby</span>
                        </div>
                        {group.atoms.map((atom) => {
                            if (!isVisible(atom)) return null

                            switch (atom.type) {
                                case "thinking": {
                                    const thinkSecs = Math.ceil((atom.activeDuration ?? 1200) / 1000)
                                    return (
                                        <div key={atom.id} className="animate-in fade-in duration-200">
                                            <AiProcessingState
                                                completed={isDoneAtom(atom)}
                                                resultLabel={`Tänkte i ${thinkSecs}s`}
                                            />
                                        </div>
                                    )
                                }

                                case "tool":
                                    return (
                                        <div key={atom.id} className="animate-in fade-in duration-150">
                                            <AiProcessingState
                                                toolName={atom.name}
                                                completed={isDoneAtom(atom)}
                                                resultLabel={atom.resultLabel}
                                            />
                                        </div>
                                    )

                                case "stream": {
                                    const fullText = atom.text ?? ""
                                    const displayText = isActive(atom)
                                        ? fullText.slice(0, streamChars)
                                        : fullText

                                    return (
                                        <div key={atom.id} className="animate-in fade-in duration-200">
                                            <div className="prose prose-sm dark:prose-invert prose-p:my-1.5 prose-li:my-0.5 prose-headings:mb-2 prose-headings:mt-4 max-w-none text-sm">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {displayText}
                                                </ReactMarkdown>
                                                {isActive(atom) && streamChars < fullText.length && (
                                                    <span className="inline-block w-1.5 h-4 bg-primary align-middle animate-pulse ml-0.5 rounded-sm" />
                                                )}
                                            </div>
                                        </div>
                                    )
                                }

                                case "card":
                                    return (
                                        <div key={`${atom.id}-${replayCount}`} className={cn("animate-in fade-in slide-in-from-bottom-1", atom.isStaggered ? "duration-200" : "duration-300")}>
                                            {atom.content}
                                        </div>
                                    )

                                case "fire-event":
                                    return null

                                default:
                                    return null
                            }
                        })}
                    </div>
                )
            })}

            {/* Controls */}
            <div className="flex items-center gap-2 pt-2">
                {isIdle && (
                    <button
                        onClick={() => { hasStartedRef.current = true; start() }}
                        className="text-[11px] bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                    >
                        <Play className="h-3 w-3" />
                        Spela scenario
                    </button>
                )}
                {isDone && (
                    <button
                        onClick={handleReplay}
                        className="text-[11px] bg-muted text-muted-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center gap-1.5"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Spela igen
                    </button>
                )}
            </div>
        </div>
        </SimEventContext>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared layout components (used by all scenario pages)
// ═══════════════════════════════════════════════════════════════════════════════

export function Scenario({ title, description, badges, children }: {
    title: string
    description: string
    badges?: string[]
    children: React.ReactNode
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="text-sm font-semibold">{title}</h3>
                <span className="text-xs text-muted-foreground">{description}</span>
                {badges?.map(b => (
                    <span key={b} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {b}
                    </span>
                ))}
            </div>
            <div className="rounded-xl border bg-card p-5">
                {children}
            </div>
        </div>
    )
}

export function ScenarioPage({ title, subtitle, backHref, backLabel, children }: {
    title: string
    subtitle: string
    backHref: string
    backLabel: string
    children: React.ReactNode
}) {
    // Inline the Link import — pages already import it
    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
                <div>
                    <a href={backHref} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                        {backLabel}
                    </a>
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                </div>
                {children}
            </div>
        </div>
    )
}
