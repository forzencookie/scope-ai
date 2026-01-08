"use client"

import { motion, useInView } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { DitherPattern } from "../../shared/dither-pattern"

// Scramble effect for 10X - shows random characters before final value
function ScrambleText({ finalText, isInView }: { finalText: string, isInView: boolean }) {
    const [displayText, setDisplayText] = useState(finalText)
    const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    useEffect(() => {
        if (!isInView) return

        let iteration = 0
        const maxIterations = 50
        const intervalTime = 50
        const revealStart = 40 // Start revealing at 80% of the way through

        const interval = setInterval(() => {
            setDisplayText(
                finalText
                    .split("")
                    .map((char, index) => {
                        // Only start revealing characters after revealStart
                        if (iteration > revealStart && index < (iteration - revealStart) / 3) {
                            return finalText[index]
                        }
                        return chars[Math.floor(Math.random() * chars.length)]
                    })
                    .join("")
            )

            iteration += 1
            if (iteration >= maxIterations) {
                clearInterval(interval)
                setDisplayText(finalText)
            }
        }, intervalTime)

        return () => clearInterval(interval)
    }, [isInView, finalText])

    return <span className="font-mono">{displayText}</span>
}

// Loading percentage animation for 100%
function LoadingPercent({ isInView }: { isInView: boolean }) {
    const [percent, setPercent] = useState(0)

    useEffect(() => {
        if (!isInView) return

        let current = 0
        const target = 100
        const duration = 2500
        const steps = 50
        const increment = target / steps
        const stepTime = duration / steps

        const interval = setInterval(() => {
            current += increment
            if (current >= target) {
                setPercent(target)
                clearInterval(interval)
            } else {
                setPercent(Math.floor(current))
            }
        }, stepTime)

        return () => clearInterval(interval)
    }, [isInView])

    return <span className="tabular-nums inline-block w-full text-center">{percent}%</span>
}

// Countdown animation for 20 min (from 120 to 20)
function CountdownMinutes({ isInView }: { isInView: boolean }) {
    const [minutes, setMinutes] = useState(120)

    useEffect(() => {
        if (!isInView) return

        let current = 120
        const target = 20
        const duration = 2500
        const steps = 50
        const decrement = (current - target) / steps
        const stepTime = duration / steps

        const interval = setInterval(() => {
            current -= decrement
            if (current <= target) {
                setMinutes(target)
                clearInterval(interval)
            } else {
                setMinutes(Math.floor(current))
            }
        }, stepTime)

        return () => clearInterval(interval)
    }, [isInView])

    return <span className="tabular-nums">{minutes} min</span>
}

export function Stats() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section className="px-6 md:px-12 lg:px-24 py-16 max-w-[1400px] mx-auto">
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12">
                {/* Left: Section Header */}
                <div className="text-center lg:text-left lg:max-w-xs flex-shrink-0">
                    <p className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-2">
                        Effektivitet
                    </p>
                    <h2 className="text-3xl font-bold text-stone-900 mb-4">
                        Siffror som talar för sig själva
                    </h2>
                    <p className="text-stone-500">
                        Vi har optimerat varje del av processen för att du ska slippa lägga tid på administration.
                    </p>
                </div>

                {/* Right: Metrics Row */}
                <div ref={ref} className="flex-1 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                        {/* 10X Card - Scramble Effect */}
                        <CardWithHoverReplay delay={0}>
                            {(key) => (
                                <>
                                    <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter block mb-0 md:mb-2 text-foreground">
                                        <ScrambleText key={key} finalText="10X" isInView={isInView} />
                                    </span>
                                    <p className="text-xs sm:text-xs md:text-sm font-bold text-foreground uppercase tracking-wide mb-0 md:mb-1">
                                        Effektivare arbete
                                    </p>
                                    <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                                        Jämfört med traditionella byråer
                                    </p>
                                </>
                            )}
                        </CardWithHoverReplay>

                        {/* 100% Card - Loading Effect */}
                        <CardWithHoverReplay delay={0.1}>
                            {(key) => (
                                <>
                                    <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter block mb-0 md:mb-2 text-violet-600">
                                        <LoadingPercent key={key} isInView={isInView} />
                                    </span>
                                    <p className="text-xs sm:text-xs md:text-sm font-bold text-foreground uppercase tracking-wide mb-0 md:mb-1">
                                        AI gör jobbet
                                    </p>
                                    <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                                        Färre sena kvällar
                                    </p>
                                </>
                            )}
                        </CardWithHoverReplay>

                        {/* 20 min Card - Countdown Effect */}
                        <CardWithHoverReplay delay={0.2}>
                            {(key) => (
                                <>
                                    <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter block mb-0 md:mb-2 text-foreground">
                                        <CountdownMinutes key={key} isInView={isInView} />
                                    </span>
                                    <p className="text-xs sm:text-xs md:text-sm font-bold text-foreground uppercase tracking-wide mb-0 md:mb-1">
                                        Kraftigt reducerad handpåläggning
                                    </p>
                                    <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                                        Fokusera på kärnverksamheten
                                    </p>
                                </>
                            )}
                        </CardWithHoverReplay>
                    </div>
                </div>
            </div>
        </section>
    )
}

function CardWithHoverReplay({ children, delay }: { children: (key: number) => React.ReactNode, delay: number }) {
    const [replayKey, setReplayKey] = useState(0)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            onMouseEnter={() => setReplayKey(k => k + 1)}
            className="relative overflow-hidden bg-stone-50 border border-stone-200 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-row-reverse items-center justify-between md:flex-col md:justify-center md:items-center text-left md:text-center hover:bg-white hover:shadow-md transition-all duration-300 cursor-default"
        >
            {/* Dither pattern background */}
            <DitherPattern className="inset-0 w-full h-full" opacity={0.04} />
            {children(replayKey)}
        </motion.div>
    )
}
