"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"

const featureItems = [
    {
        title: "Bokföring i turbofart",
        description: "Fota kvittot, klart. Scope läser av och bokför åt dig automatiskt."
    },
    {
        title: "Deklarationen fixar sig själv",
        description: "Moms och avgifter räknas ut automatiskt utifrån dina händelser. Bara att godkänna."
    },
    {
        title: "Löner på nolltid",
        description: "Lönebesked och skatt är redan uträknat. Skicka till banken med ett klick."
    },
    {
        title: "Full koll på siffrorna",
        description: "Se exakt hur det går för bolaget, utan att behöva vara civilekonom."
    }
]

export function FeaturePitch() {
    return (
        <section className="px-6 md:px-12 lg:px-24 py-24 max-w-[1400px] mx-auto border-t border-stone-200">
            {/* Split layout: Left headline, Right features list */}
            <div className="grid md:grid-cols-2 gap-16 items-start">
                {/* Left: Editorial headline */}
                <div>
                    <p className="text-xs text-stone-400 uppercase tracking-widest mb-4">
                        Hur det funkar
                    </p>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 leading-[1.15]">
                        Din nya AI-kollega som aldrig tar semester
                    </h2>
                </div>

                {/* Right: Feature list with checkmarks */}
                <div className="space-y-8">
                    {featureItems.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-4"
                        >
                            {/* Checkmark dot */}
                            <div className="flex-shrink-0 mt-1">
                                <div className="w-2 h-2 rounded-full bg-stone-900" />
                            </div>

                            {/* Content */}
                            <div>
                                <h3 className="font-semibold text-stone-900 mb-1">
                                    {item.title}
                                </h3>
                                <p className="text-stone-500 text-sm leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
