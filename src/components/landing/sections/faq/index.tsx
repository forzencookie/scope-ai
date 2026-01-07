"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const faqItems = [
    {
        question: "Kan jag börja använda Scope AI nu?",
        answer: "Absolut! Grunderna är på plats och vi bygger vidare varje dag. Du kan hoppa på tåget direkt."
    },
    {
        question: "Är min bokföring säker?",
        answer: "Japp. Vi använder beprövad teknik (Supabase & AWS) och all data är krypterad. Vi tummar aldrig på säkerheten."
    },
    {
        question: "Kan jag byta från mitt gamla program?",
        answer: "Jajemän, vi kan oftast importera din gamla data. Hör av dig så hjälper vi dig att flytta in."
    },
    {
        question: "Vad kostar kalaset?",
        answer: "Börja gratis och bokför själv om du vill. Eller låt AI göra grovjobbet för 449 kr/mån. Ingen bindningstid såklart."
    },
    {
        question: "Funkar BankID?",
        answer: "Inte just idag, men det ligger högt på vår att-göra-lista. Automatisk bankkoppling är också på gång."
    },
    {
        question: "Varför inte bara köra Fortnox?",
        answer: "Vi tänker AI först. Istället för att klicka i tusen formulär pratar du med systemet. Som en kollega, fast snabbare."
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

                {/* Right: Questions with + icons */}
                <div className="border-t border-stone-200">
                    {faqItems.map((item, index) => (
                        <div key={index} className="border-b border-stone-200">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between py-6 text-left group"
                            >
                                <span className="text-stone-900 font-medium pr-8 group-hover:text-stone-600 transition-colors">
                                    {item.question}
                                </span>
                                <Plus
                                    className={cn(
                                        "w-5 h-5 text-stone-400 flex-shrink-0 transition-transform duration-200",
                                        openIndex === index && "rotate-45"
                                    )}
                                />
                            </button>
                            <AnimatePresence initial={false}>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="pb-6 text-stone-500 leading-relaxed pr-12">
                                            {item.answer}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
