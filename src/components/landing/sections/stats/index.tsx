"use client"

import { motion, useInView } from "framer-motion"
import { useEffect, useState, useRef } from "react"

export function Stats() {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
        if (!isInView) return

        let start = 0
        const end = 65
        const duration = 2000 // 2 seconds
        const increment = end / (duration / 16) // ~60fps

        const timer = setInterval(() => {
            start += increment
            if (start >= end) {
                setCount(end)
                clearInterval(timer)
            } else {
                setCount(Math.floor(start))
            }
        }, 16)

        return () => clearInterval(timer)
    }, [isInView])

    return (
        <section className="px-6 md:px-12 lg:px-24 py-16 max-w-[1400px] mx-auto">
            {/* Split layout: Left text, Right stat card */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                {/* Left: Small label text */}
                <div className="text-left">
                    <p className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-1">
                        Potentiell tidsbesparing
                    </p>
                    <p className="text-lg text-stone-600">
                        för konsultföretag
                    </p>
                </div>

                {/* Right: Stat card */}
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-stone-50 border border-stone-200 rounded-2xl p-8 md:p-10 max-w-md"
                >
                    <p className="text-sm text-stone-500 mb-4">
                        Uppskattar vi att konsultföretag kan spara upp till
                    </p>
                    <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-5xl md:text-6xl font-bold text-emerald-500 tabular-nums">
                            {count}%
                        </span>
                    </div>
                    <p className="text-sm text-stone-500">
                        av tiden på bokföring*
                    </p>
                    <p className="text-xs text-stone-400 mt-4">
                        *Baserat på interna uppskattningar
                    </p>
                </motion.div>
            </div>
        </section>
    )
}
