"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

// Animated dither dots that float and respond to scroll
export function AnimatedDitherArt() {
    const [mounted, setMounted] = useState(false)
    const { scrollY } = useScroll()

    // Transform scroll values directly to styles to avoid re-renders
    const yLeft = useTransform(scrollY, value => value * 0.1)
    const yRight = useTransform(scrollY, value => value * -0.08)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Generate dot positions for organic shapes
    const generateDots = (count: number, seed: number) => {
        const dots = []
        for (let i = 0; i < count; i++) {
            // Use seed to create consistent but varied positions
            const angle = (i / count) * Math.PI * 2 + seed
            const radius = 30 + Math.sin(i * 0.5) * 20 + Math.cos(i * 0.3) * 15
            const x = 50 + Math.cos(angle) * radius
            const y = 50 + Math.sin(angle) * radius
            const size = 2 + Math.sin(i * 0.7) * 1.5
            const opacity = 0.3 + Math.cos(i * 0.4) * 0.2
            dots.push({ x, y, size, opacity, delay: i * 0.02 })
        }
        return dots
    }

    if (!mounted) return null

    const leftDots = generateDots(80, 0)
    const rightDots = generateDots(60, Math.PI)

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
                    duration: 100,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <svg viewBox="-20 -20 140 140" className="w-full h-full overflow-visible">
                    {leftDots.map((dot, i) => (
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
                                    duration: 3 + Math.random() * 2,
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
                    duration: 120,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <svg viewBox="-20 -20 140 140" className="w-full h-full overflow-visible">
                    {rightDots.map((dot, i) => (
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
                                    duration: 4 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: dot.delay
                                }
                            }}
                        />
                    ))}
                </svg>
            </motion.div>


            {/* Floating particles in the middle */}
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-violet-400"
                    style={{
                        left: `${15 + Math.random() * 70}%`,
                        top: `${10 + Math.random() * 80}%`,
                        opacity: 0.05 + Math.random() * 0.1,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        x: [0, Math.random() * 10 - 5, 0],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: 5 + Math.random() * 5,
                        repeat: Infinity,
                        delay: i * 0.3,
                    }}
                />
            ))}
        </div>
    )
}
