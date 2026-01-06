"use client"

import { motion } from "framer-motion"
import { LucideIcon, Sparkles } from "lucide-react"

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
    icon: Icon = Sparkles,
    statusDot,
    align = "center",
    className = ""
}: SectionHeaderProps) {
    const isLeft = align === "left"

    return (
        <div className={`flex flex-col ${isLeft ? "items-start text-left" : "items-center text-center"} ${className}`}>
            {/* Pill Badge */}
            {badge && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-border shadow-sm rounded-full mb-6 overflow-hidden relative group cursor-default"
                >
                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent transition-opacity opacity-0 group-hover:opacity-100" />
                    {statusDot ? (
                        <div className={`w-1.5 h-1.5 rounded-full ${statusDot} animate-pulse`} />
                    ) : (
                        <Icon className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground tracking-widest">{badge}</span>
                </motion.div>
            )}

            {/* Headline */}
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.1] mb-6 ${!isLeft ? "max-w-2xl" : ""}`}
            >
                {title}
            </motion.h2>

            {/* Description */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className={`text-lg md:text-xl text-muted-foreground leading-relaxed ${!isLeft ? "max-w-xl" : "max-w-md"}`}
            >
                {description}
            </motion.p>
        </div>
    )
}
