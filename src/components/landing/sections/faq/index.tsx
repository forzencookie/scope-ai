"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Rocket, Shield, ArrowRightLeft, Coins, KeyRound, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const faqItems = [
    {
        question: "Kan jag börja använda Scope AI nu?",
        answer: "Absolut! Grunderna är på plats och vi bygger vidare varje dag. Du kan komma igång direkt.",
        icon: Rocket
    },
    {
        question: "Är min bokföring säker?",
        answer: "Ja. Vi använder beprövad teknik (Supabase & AWS) och all data är krypterad. Säkerhet är prio ett för oss.",
        icon: Shield
    },
    {
        question: "Kan jag byta från mitt gamla program?",
        answer: "Självklart, vi kan oftast importera din gamla data. Hör av dig så hjälper vi dig att flytta in.",
        icon: ArrowRightLeft
    },
    {
        question: "Vad kostar Scope?",
        answer: "Börja gratis och bokför själv om du vill. Eller låt AI göra grovjobbet för 449 kr/mån. Ingen bindningstid såklart.",
        icon: Coins
    },
    {
        question: "Funkar BankID?",
        answer: "Inte just idag, men det ligger högt på vår att-göra-lista. Automatisk bankkoppling är också på gång.",
        icon: KeyRound
    },
    {
        question: "Hur skiljer ni er från Fortnox?",
        answer: "Vi tänker AI först. Istället för att klicka i komplexa formulär pratar du med systemet — smidigare än formulär.",
        icon: Sparkles
    }
]

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className="px-6 md:px-12 lg:px-24 py-24 max-w-[1400px] mx-auto border-t border-stone-200">
            {/* Two-column layout: Title left, Questions right */}
            <div className="grid md:grid-cols-[280px_1fr] gap-16">
                {/* Left: Big title */}
                <div>
                    <h2 className="text-4xl md:text-5xl font-bold text-stone-900 sticky top-24">
                        FAQ
                    </h2>
                </div>

                {/* Right: Questions with icons */}
                <div className="space-y-3">
                    {faqItems.map((item, index) => {
                        const Icon = item.icon
                        const isOpen = openIndex === index

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "bg-stone-50 rounded-xl border border-stone-200 overflow-hidden transition-all duration-200",
                                    isOpen && "bg-white shadow-sm"
                                )}
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : index)}
                                    className="w-full flex items-center gap-4 p-4 text-left group"
                                >
                                    {/* Icon */}
                                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg border border-stone-200 flex items-center justify-center group-hover:border-stone-300 transition-colors">
                                        <Icon className="w-5 h-5 text-stone-500" />
                                    </div>

                                    {/* Question */}
                                    <span className="flex-1 text-stone-900 font-medium group-hover:text-stone-700 transition-colors">
                                        {item.question}
                                    </span>

                                    {/* Chevron */}
                                    <ChevronDown
                                        className={cn(
                                            "w-5 h-5 text-stone-400 flex-shrink-0 transition-transform duration-200",
                                            isOpen && "rotate-180"
                                        )}
                                    />
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="px-4 pb-4 pl-18 text-stone-500 leading-relaxed ml-14">
                                                {item.answer}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
