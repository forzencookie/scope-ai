"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface SectionHeaderProps {
    badge?: string
    title: string
    description: string
    icon?: LucideIcon
    statusDot?: string // Tailwind color class like 'bg-emerald-500'
    align?: "left" | "center"
    className?: string
}

export function SectionHeader({
    badge,
    title,
    description,
    align = "center",
    className = ""
}: SectionHeaderProps) {
    const isLeft = align === "left"

    return (
        <div className={`flex flex-col ${isLeft ? "items-start text-left" : "items-center text-center"} ${className}`}>
            {/* Label - matching Stats section "EFFEKTIVITET" style */}
            {badge && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-4"
                >
                    {badge}
                </motion.p>
            )}

            {/* Headline */}
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight leading-[1.1] mb-6 ${!isLeft ? "max-w-2xl" : ""}`}
            >
                {title}
            </motion.h2>

            {/* Description */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className={`text-stone-500 leading-relaxed ${!isLeft ? "max-w-xl" : "max-w-md"}`}
            >
                {description}
            </motion.p>
        </div>
    )
}
