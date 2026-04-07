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

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AiProcessingState } from "@/components/shared/ai-processing-state"
import { cn } from "@/lib/utils"
import { RotateCcw, Play } from "lucide-react"

// ═══════════════════════════════════════════════════════════════════════════════
// Public types — used by scenario pages to define conversation scripts
// ═══════════════════════════════════════════════════════════════════════════════

export type SimElement =
    | { type: "thinking"; duration?: number }
    | { type: "tool"; name: string; duration?: number }
    | { type: "stream"; text: string; speed?: number }
    | { type: "card"; content: React.ReactNode; delay?: number }

export type SimTurn =
    | { role: "user"; content: string; delay?: number }
    | { role: "scooby"; elements: SimElement[]; delay?: number }

export type SimScript = SimTurn[]

// ═══════════════════════════════════════════════════════════════════════════════
// Internal: flatten script into sequential atoms
// ═══════════════════════════════════════════════════════════════════════════════

interface Atom {
    id: number
    turnIndex: number
    type: "user" | "thinking" | "tool" | "stream" | "card"
    preDelay: number          // ms to wait BEFORE showing this atom
    activeDuration?: number   // ms this atom stays "active" (thinking, tool)
    name?: string             // tool name
    text?: string             // user message or stream text
    speed?: number            // typewriter speed (ms per char)
    content?: React.ReactNode // card JSX
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
                // First user message appears quickly, follow-ups have a pause
                preDelay: ti === 0 ? 400 : (turn.delay ?? 1500),
            })
        } else {
            for (let ei = 0; ei < turn.elements.length; ei++) {
                const elem = turn.elements[ei]
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
                        break

                    case "tool":
                        atoms.push({
                            id: id++,
                            turnIndex: ti,
                            type: "tool",
                            name: elem.name,
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

function useSimulation(atoms: Atom[]) {
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
    /** Extra delay before auto-play (for staggering multiple scenarios) */
    autoPlayDelay?: number
    className?: string
}

export function SimulatedConversation({ script, autoPlayDelay = 0, className }: SimulatedConversationProps) {
    const [atoms] = useState(() => flattenScript(script))
    const { cursor, phase, streamChars, isIdle, isDone, isPlaying, start, reset } = useSimulation(atoms)

    // Auto-play when component scrolls into view
    const containerRef = useRef<HTMLDivElement>(null)
    const hasStartedRef = useRef(false)
    const startRef = useRef(start)
    startRef.current = start

    useEffect(() => {
        const el = containerRef.current
        if (!el || hasStartedRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStartedRef.current) {
                    hasStartedRef.current = true
                    setTimeout(() => startRef.current(), Math.max(200, autoPlayDelay))
                    observer.disconnect()
                }
            },
            { threshold: 0.2 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [autoPlayDelay])

    const handleReplay = useCallback(() => {
        reset()
        // Small delay then restart
        setTimeout(() => {
            hasStartedRef.current = true
            start()
        }, 200)
    }, [reset, start])

    // ── Atom visibility helpers ──

    const isVisible = useCallback((atom: Atom): boolean => {
        if (atom.type === "thinking") {
            // Thinking only shows while active — disappears once we move past it
            return atom.id === cursor && phase === "active"
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

                    return (
                        <div key={`turn-${group.turnIndex}`} className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="px-3.5 py-2 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground text-sm max-w-[85%]">
                                {atom.text}
                            </div>
                        </div>
                    )
                }

                // Scooby turn
                return (
                    <div key={`turn-${group.turnIndex}`} className="space-y-3 max-w-[90%] animate-in fade-in duration-200">
                        {group.atoms.map((atom) => {
                            if (!isVisible(atom)) return null

                            switch (atom.type) {
                                case "thinking":
                                    return (
                                        <div key={atom.id} className="animate-in fade-in duration-200">
                                            <AiProcessingState />
                                        </div>
                                    )

                                case "tool":
                                    return (
                                        <div key={atom.id} className="animate-in fade-in duration-150">
                                            <AiProcessingState
                                                toolName={atom.name}
                                                completed={isDoneAtom(atom)}
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
                                        <div key={atom.id} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                                            {atom.content}
                                        </div>
                                    )

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
                {isPlaying && (
                    <span className="text-[10px] text-muted-foreground/60 animate-pulse">
                        Simulerar...
                    </span>
                )}
            </div>
        </div>
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
