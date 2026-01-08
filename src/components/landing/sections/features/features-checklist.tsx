"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, BookOpen, Calculator, Shield, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureItem {
    title: string
    description: string
}

const featureColumns = [
    {
        icon: BookOpen,
        title: "AI-assisterad bokföring",
        items: [
            { title: "AI hjälper till med löpande bokföring", description: "Automatisk kontering av transaktioner baserat på tidigare mönster och branschstandard." },
            { title: "AI matchar kvitton mot transaktioner", description: "Fota kvittot — AI kopplar ihop det med rätt banktransaktion automatiskt." },
            { title: "AI assisterar med moms & representation", description: "Rätt momssats föreslås automatiskt, inklusive avdragsbegränsningar för representation." },
            { title: "AI underlättar avstämning av bank", description: "Se direkt vilka transaktioner som saknar underlag och få förslag på åtgärder." },
            { title: "Jobbar dygnet runt", description: "Din digitala assistent är alltid tillgänglig — ingen väntan på svar." }
        ]
    },
    {
        icon: Calculator,
        title: "AI-assisterad skatt",
        items: [
            { title: "AI förbereder underlag för INK2", description: "Sammanställer automatiskt underlag för inkomstdeklaration för aktiebolag." },
            { title: "AI hjälper med momsredovisning", description: "Beräknar utgående och ingående moms, redo att rapporteras till Skatteverket." },
            { title: "Stöd för K2-regelverk", description: "Följer K2-reglerna för mindre företag med förenklad årsredovisning." },
            { title: "AI assisterar med periodiseringsfonder", description: "Föreslår optimala avsättningar för att jämna ut resultat mellan år." },
            { title: "AI ger realtids-prognos för skatt", description: "Se hur mycket skatt du kan förvänta dig att betala — uppdateras löpande." }
        ]
    },
    {
        icon: Shield,
        title: "Säkerhet & Data",
        items: [
            { title: "Spara tid med SIE-export", description: "Exportera din bokföring i SIE-format för enkel överföring till revisor eller annat system." },
            { title: "Bank-klassad kryptering", description: "All data skyddas med samma krypteringsstandard som banker använder." },
            { title: "Ingen träning på din data", description: "Dina affärsuppgifter används aldrig för att träna AI-modeller." },
            { title: "Svenska servrar (GDPR)", description: "All data lagras på servrar i Sverige, fullt GDPR-kompatibelt." },
            { title: "Automatiska säkerhetskopior", description: "Din data backas upp automatiskt — ingen risk att förlora något." }
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
