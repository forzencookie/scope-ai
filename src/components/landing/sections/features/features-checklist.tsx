"use client"

import { motion } from "framer-motion"
import { Check, Lock, Settings, Sparkles } from "lucide-react"

const featureColumns = [
    {
        icon: Lock,
        title: "AI-assisterad bokföring",
        items: [
            "AI hjälper till med löpande bokföring",
            "AI matchar kvitton mot transaktioner",
            "AI assisterar med moms & representation",
            "AI underlättar avstämning av bank",
            "Jobbar dygnet runt"
        ]
    },
    {
        icon: Settings,
        title: "AI-assisterad skatt",
        items: [
            "AI förbereder underlag för INK2",
            "AI hjälper med momsredovisning",
            "Stöd för K2-regelverk",
            "AI assisterar med periodiseringsfonder",
            "AI ger realtids-prognos för skatt"
        ]
    },
    {
        icon: Sparkles,
        title: "Säkerhet & Data",
        items: [
            "Spara tid med SIE-export",
            "Bank-klassad kryptering",
            "Ingen träning på din data",
            "Svenska servrar (GDPR)",
            "Automatiska säkerhetskopior"
        ]
    }
]

export function FeaturesChecklist() {
    return (
        <section className="px-6 md:px-12 lg:px-24 py-24 max-w-[1400px] mx-auto">
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
                        <ul className="space-y-4">
                            {column.items.map((item, itemIndex) => (
                                <motion.li
                                    key={itemIndex}
                                    className="flex items-start gap-3"
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        delay: colIndex * 0.15 + itemIndex * 0.08,
                                        duration: 0.3
                                    }}
                                >
                                    <motion.div
                                        className="flex-shrink-0 mt-0.5"
                                        initial={{ scale: 0 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            delay: colIndex * 0.15 + itemIndex * 0.08 + 0.1,
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 15
                                        }}
                                    >
                                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    </motion.div>
                                    <span className="text-stone-700 text-sm leading-relaxed">
                                        {item}
                                    </span>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
