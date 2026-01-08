"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronDown, Sparkles, FileText, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureItem {
    title: string
    description: string
}

const featureColumns = [
    {
        icon: Sparkles,
        title: "AI-Core & Automatisering",
        items: [
            { title: "Bokföringsautopilot", description: "Vår AI sköter löpande bokföring och matchning automatiskt." },
            { title: "Smart händelselogg", description: "Allt som händer i bolaget loggas och sparas i en sökbar tidslinje." },
            { title: "Kvitto- & Faktura-AI", description: "Ladda upp underlag så tolkar och bokför AI:n åt dig direkt." },
            { title: "Ditt jobb", description: "AI:n gör grovjobbet, men du har alltid full kontroll och sista ordet." },
            { title: "Prata med AI", description: "Styr bokföringen med din röst via appen eller webben." }
        ]
    },
    {
        icon: FileText,
        title: "Skatt, Lön & Deklarationer",
        items: [
            { title: "Lönehantering & Lönebesked", description: "Skapa löner och hantera utbetalningar till anställda smidigt." },
            { title: "Moms- & Arbetsgivardeklaration", description: "Automatiska rapporter för moms och AGI direkt till Skatteverket." },
            { title: "Årsredovisning & Bokslut", description: "Färdiga underlag för årsredovisning och bokslut enligt K2." },
            { title: "K10 & Utdelning", description: "Fullt stöd för utdelning och K10-blanketten för fåmansbolag." },
            { title: "Digitala blanketter", description: "Tillgång till alla viktiga bolagsblanketter digitalt." }
        ]
    },
    {
        icon: Building2,
        title: "Bolagsstyrning & Insikter",
        items: [
            { title: "Aktiebok & Ägarstruktur", description: "Digital aktiebok som håller koll på ägare och antal aktier." },
            { title: "Styrelse & Protokoll", description: "Verktyg för styrelsearbete, protokoll och årsmöten." },
            { title: "Resultat- & Balansräkning", description: "Följ företagets ekonomi med rapporter i realtid." },
            { title: "Företagsstatistik", description: "Djupgående insikter och nyckeltal om hur bolaget presterar." },
            { title: "Myndighetsregister", description: "Håll ordning på alla viktiga kontakter med myndigheter." }
        ]
    }
]

function ExpandableItem({ item, delay }: { item: FeatureItem, delay: number }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <motion.li
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.3 }}
            className="group"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-start gap-3 p-2 -ml-2 rounded-lg transition-all duration-200",
                    "hover:bg-stone-50",
                    isOpen && "bg-stone-50"
                )}
            >
                <motion.div
                    className="flex-shrink-0 mt-0.5"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                        delay: delay + 0.1,
                        type: "spring",
                        stiffness: 300,
                        damping: 15
                    }}
                >
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                    </div>
                </motion.div>
                <div className="flex-1 text-left">
                    <span className="text-stone-700 text-sm leading-relaxed group-hover:text-stone-900 transition-colors">
                        {item.title}
                    </span>
                </div>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5 transition-transform duration-200",
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
                        <p className="text-stone-500 text-sm leading-relaxed pl-10 pr-2 pb-2">
                            {item.description}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.li>
    )
}

export function FeaturesChecklist() {
    return (
        <section className="px-6 md:px-12 lg:px-24 py-12 max-w-[1400px] mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
                {featureColumns.map((column, colIndex) => (
                    <motion.div
                        key={column.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: colIndex * 0.15 }}
                    >
                        {/* Column header */}
                        <div className="flex items-center gap-2 mb-6">
                            <column.icon className="w-4 h-4 text-stone-400" />
                            <span className="text-sm text-stone-400">{column.title}</span>
                        </div>

                        {/* Feature items with staggered animation */}
                        <ul className="space-y-1">
                            {column.items.map((item, itemIndex) => (
                                <ExpandableItem
                                    key={itemIndex}
                                    item={item}
                                    delay={colIndex * 0.15 + itemIndex * 0.08}
                                />
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
