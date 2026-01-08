"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionHeader } from "../../shared/section-header"

const faqItems = [
    {
        question: "Kan jag börja använda Scope AI nu?",
        answer: "Absolut! Grunderna är på plats och vi bygger vidare varje dag. Du kan komma igång direkt."
    },
    {
        question: "Är min bokföring säker?",
        answer: "Ja. Vi använder beprövad teknik (Supabase & AWS) och all data är krypterad. Säkerhet är prio ett för oss."
    },
    {
        question: "Kan jag byta från mitt gamla program?",
        answer: "Självklart, vi kan oftast importera din gamla data. Hör av dig så hjälper vi dig att flytta in."
    },
    {
        question: "Vad kostar Scope?",
        answer: "Börja gratis och bokför själv om du vill. Eller låt AI göra grovjobbet för 449 kr/mån. Ingen bindningstid såklart."
    },
    {
        question: "Funkar BankID?",
        answer: "Inte just idag, men det ligger högt på vår att-göra-lista. Automatisk bankkoppling är också på gång."
    },
    {
        question: "Hur skiljer ni er från Fortnox?",
        answer: "Vi tänker AI först. Istället för att klicka i komplexa formulär pratar du med systemet — smidigare än formulär."
    }
]

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section id="faq" className="px-6 md:px-12 lg:px-24 py-24 max-w-[1400px] mx-auto border-t border-stone-200">
            <SectionHeader
                badge="Vanliga frågor"
                title="Har du frågor? Vi har svar."
                description="Här hittar du svar på de vanligaste frågorna om Scope. Saknar du något? Hör av dig!"
                icon={HelpCircle}
                className="mb-12"
            />

            {/* White card container */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 lg:p-10 max-w-3xl mx-auto">
                <div className="divide-y divide-stone-100">
                    {faqItems.map((item, index) => {
                        const isOpen = openIndex === index

                        return (
                            <div key={index} className="py-2">
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : index)}
                                    className="w-full flex items-center justify-between gap-4 py-4 text-left group"
                                >
                                    <span className={cn(
                                        "text-lg font-medium text-stone-900 transition-colors",
                                        isOpen ? "text-stone-900" : "text-stone-600 group-hover:text-stone-900"
                                    )}>
                                        {item.question}
                                    </span>

                                    <div className={cn(
                                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                                        isOpen ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500 group-hover:bg-stone-200"
                                    )}>
                                        {isOpen ? (
                                            <Minus className="w-4 h-4" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                    </div>
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <p className="pb-6 text-stone-500 leading-relaxed max-w-2xl">
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
