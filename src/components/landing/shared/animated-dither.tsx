"use client"

import { useEffect, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

// Shared dot generation constants
// These match the original "organic" generation logic exactly
const generateDotsData = (count: number, seed: number) => {
    return Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + seed
        const radius = 30 + Math.sin(i * 0.5) * 20 + Math.cos(i * 0.3) * 15
        const x = 50 + Math.cos(angle) * radius
        const y = 50 + Math.sin(angle) * radius
        const size = 2 + Math.sin(i * 0.7) * 1.5
        const opacity = 0.3 + Math.cos(i * 0.4) * 0.2
        // Use pseudo-random based on index for stability
        const randomDuration = (Math.sin(i * 7919) * 0.5 + 0.5) * 2
        return { x, y, size, opacity, delay: i * 0.02, randomDuration }
    })
}

const leftDotsData = generateDotsData(80, 0)
const rightDotsData = generateDotsData(60, Math.PI)

const floatingParticlesData = Array.from({ length: 20 }, (_, i) => ({
    left: 15 + (Math.sin(i * 12.3) * 0.5 + 0.5) * 70,
    top: 10 + (Math.cos(i * 23.4) * 0.5 + 0.5) * 80,
    opacity: 0.05 + (Math.sin(i * 34.5) * 0.5 + 0.5) * 0.1,
    x: (Math.cos(i * 45.6) * 0.5 + 0.5) * 10 - 5,
    duration: 5 + (Math.sin(i * 56.7) * 0.5 + 0.5) * 5,
    delay: i * 0.3
}))

// 1. Static version for mobile (CSS rotation only, no individual dot animations)
function StaticDitherArt() {
    const { scrollY } = useScroll()
    const yLeft = useTransform(scrollY, value => value * 0.1)
    const yRight = useTransform(scrollY, value => value * -0.08)

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Left side - CSS rotation */}
            <motion.div
                className="absolute -left-12 top-[10%] w-72 h-72 animate-spin-slow"
                style={{ y: yLeft }}
            >
                <svg viewBox="-20 -20 140 140" className="w-full h-full overflow-visible">
                    {leftDotsData.map((dot, i) => (
                        <circle
                            key={i}
                            cx={dot.x}
                            cy={dot.y}
                            r={dot.size}
                            fill="currentColor"
                            className="text-violet-400"
                            style={{ opacity: dot.opacity }}
                        />
                    ))}
                </svg>
            </motion.div>

            {/* Right side - CSS rotation (reverse) */}
            <motion.div
                className="absolute -right-12 top-[35%] w-64 h-64 animate-spin-slow-reverse"
                style={{ y: yRight }}
            >
                <svg viewBox="-20 -20 140 140" className="w-full h-full overflow-visible">
                    {rightDotsData.map((dot, i) => (
                        <circle
                            key={i}
                            cx={dot.x}
                            cy={dot.y}
                            r={dot.size}
                            fill="currentColor"
                            className="text-violet-400"
                            style={{ opacity: dot.opacity }}
                        />
                    ))}
                </svg>
            </motion.div>
        </div>
    )
}

// 2. Full Organic version for Desktop (Exact match to original component)
function OrganicDitherArt() {
    const { scrollY } = useScroll()
    const yLeft = useTransform(scrollY, value => value * 0.1)
    const yRight = useTransform(scrollY, value => value * -0.08)

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Left side organic shape */}
            <motion.div
                className="absolute -left-12 top-[10%] w-72 h-72"
                style={{
                    y: yLeft,
                }}
                animate={{
                    rotate: 360
                }}
                transition={{
                    duration: 200,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <svg viewBox="-20 -20 140 140" className="w-full h-full overflow-visible">
                    {leftDotsData.map((dot, i) => (
                        <motion.circle
                            key={i}
                            cx={dot.x}
                            cy={dot.y}
                            r={dot.size}
                            fill="currentColor"
                            className="text-violet-400"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: dot.opacity,
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                opacity: { duration: 0.5, delay: dot.delay },
                                scale: {
                                    duration: 3 + dot.randomDuration,
                                    repeat: Infinity,
                                    delay: dot.delay
                                }
                            }}
                        />
                    ))}
                </svg>
            </motion.div>

            {/* Right side organic shape */}
            <motion.div
                className="absolute -right-12 top-[35%] w-64 h-64"
                style={{
                    y: yRight,
                }}
                animate={{
                    rotate: -360
                }}
                transition={{
                    duration: 240,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <svg viewBox="-20 -20 140 140" className="w-full h-full overflow-visible">
                    {rightDotsData.map((dot, i) => (
                        <motion.circle
                            key={i}
                            cx={dot.x}
                            cy={dot.y}
                            r={dot.size}
                            fill="currentColor"
                            className="text-violet-400"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: dot.opacity * 0.7,
                                scale: [1, 1.15, 1],
                            }}
                            transition={{
                                opacity: { duration: 0.5, delay: dot.delay + 0.5 },
                                scale: {
                                    duration: 4 + dot.randomDuration,
                                    repeat: Infinity,
                                    delay: dot.delay
                                }
                            }}
                        />
                    ))}
                </svg>
            </motion.div>

            {/* Floating particles in the middle (Original logic) */}
            {floatingParticlesData.map((particle, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-violet-400"
                    style={{
                        left: `${particle.left}%`,
                        top: `${particle.top}%`,
                        opacity: particle.opacity,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        x: [0, particle.x, 0],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                    }}
                />
            ))}
        </div>
    )
}

// Main component: Adapts based on viewport
export function AnimatedDitherArt() {
    const [mounted, setMounted] = useState(false)
    const [isDesktop, setIsDesktop] = useState(true)

    useEffect(() => {
        setTimeout(() => setMounted(true), 0)

        const checkViewport = () => {
            // 768px is standard tablet/mobile breakpoint
            setIsDesktop(window.innerWidth >= 768)
        }

        checkViewport()
        window.addEventListener("resize", checkViewport)
        return () => window.removeEventListener("resize", checkViewport)
    }, [])

    if (!mounted) return null

    // Desktop gets the full organic experience (exact original)
    // Mobile gets the optimized static version (CSS rotation)
    return isDesktop ? <OrganicDitherArt /> : <StaticDitherArt />
}
