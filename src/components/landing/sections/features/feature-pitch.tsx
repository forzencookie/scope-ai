"use client"

import { motion } from "framer-motion"
import { Check, Receipt, Send, TrendingUp, FileCheck } from "lucide-react"

const featureCards = [
    {
        title: "Bokföring i turbofart",
        description: "Fota kvittot, klart. Scope läser av och bokför åt dig automatiskt.",
        icon: (
            <div className="w-full h-full flex items-center justify-center">
                {/* Mini receipt card */}
                <motion.div
                    animate={{ y: [2, -2, 2] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-10 h-12 bg-white border border-stone-200 rounded-lg shadow-sm p-1.5 flex flex-col"
                >
                    <div className="w-4 h-4 bg-stone-100 rounded-full mx-auto mb-1" />
                    <div className="space-y-0.5">
                        <div className="h-0.5 bg-stone-200 rounded-full" />
                        <div className="h-0.5 bg-stone-200 rounded-full w-3/4" />
                        <div className="h-0.5 bg-stone-200 rounded-full w-1/2" />
                    </div>
                    <div className="mt-auto pt-1 border-t border-stone-100">
                        <div className="h-0.5 bg-stone-300 rounded-full w-2/3 mx-auto" />
                    </div>
                </motion.div>
            </div>
        )
    },
    {
        title: "Deklarationen fixar sig själv",
        description: "Moms och avgifter räknas ut automatiskt utifrån dina händelser.",
        icon: (
            <div className="w-full h-full flex items-center justify-center">
                {/* Mini checklist */}
                <div className="w-11 h-14 bg-white border border-stone-200 rounded-lg shadow-sm p-1.5 flex flex-col gap-1">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-1">
                            <motion.div
                                animate={{
                                    backgroundColor: ["#f5f5f4", "#10b981", "#10b981"]
                                }}
                                transition={{
                                    duration: 0.5,
                                    delay: 0.8 + i * 0.3,
                                    repeat: Infinity,
                                    repeatDelay: 2
                                }}
                                className="w-2 h-2 rounded-sm border border-stone-200 flex-shrink-0"
                            />
                            <div className="h-0.5 bg-stone-200 rounded-full flex-1" />
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    {
        title: "Löner på nolltid",
        description: "Lönebesked och skatt är redan uträknat. Skicka till banken med ett klick.",
        icon: (
            <div className="w-full h-full flex items-center justify-center">
                {/* Mini payslip */}
                <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-11 h-14 bg-white border border-stone-200 rounded-lg shadow-sm p-1.5 flex flex-col"
                >
                    <div className="flex items-center gap-1 mb-1">
                        <div className="w-3 h-3 bg-stone-100 rounded-full" />
                        <div className="h-0.5 bg-stone-200 rounded-full flex-1" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                        <div className="flex justify-between">
                            <div className="h-0.5 bg-stone-200 rounded-full w-1/3" />
                            <div className="h-0.5 bg-stone-300 rounded-full w-1/4" />
                        </div>
                        <div className="flex justify-between">
                            <div className="h-0.5 bg-stone-200 rounded-full w-1/2" />
                            <div className="h-0.5 bg-stone-300 rounded-full w-1/5" />
                        </div>
                    </div>
                    <div className="pt-1 border-t border-stone-100">
                        <motion.div
                            animate={{ backgroundColor: ["#e7e5e4", "#10b981", "#e7e5e4"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="h-1.5 rounded-sm"
                        />
                    </div>
                </motion.div>
            </div>
        )
    },
    {
        title: "Full koll på siffrorna",
        description: "Se exakt hur det går för bolaget, utan att behöva vara civilekonom.",
        icon: (
            <div className="w-full h-full flex items-center justify-center">
                {/* Mini chart card */}
                <div className="w-12 h-14 bg-white border border-stone-200 rounded-lg shadow-sm p-1.5 flex flex-col">
                    <div className="h-0.5 bg-stone-200 rounded-full w-2/3 mb-1" />
                    <div className="flex-1 flex items-end justify-center gap-0.5 pb-0.5">
                        {[4, 7, 5, 9].map((h, i) => (
                            <motion.div
                                key={i}
                                animate={{ height: [`${h * 4}%`, `${h * 5}%`, `${h * 4}%`] }}
                                transition={{
                                    duration: 1.5 + i * 0.2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="w-1.5 bg-stone-800 rounded-t-sm"
                            />
                        ))}
                    </div>
                </div>
            </div>
        )
    }
]

export function FeaturePitch() {
    return (
        <section className="px-6 md:px-12 lg:px-24 py-24 max-w-[1400px] mx-auto border-t border-stone-200">
            <div className="grid md:grid-cols-2 gap-16 items-start">
                {/* Left: Headline */}
                <div className="md:sticky md:top-32">
                    <p className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-4">
                        Hur det funkar
                    </p>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 leading-[1.15] mb-6">
                        Din nya AI-kollega som aldrig tar semester
                    </h2>
                    <p className="text-stone-500 leading-relaxed max-w-md">
                        Glöm pärmar och krångliga system. Scope jobbar i bakgrunden så du kan fokusera på din verksamhet.
                    </p>
                </div>

                {/* Right: Animated Feature List */}
                <div className="space-y-12">
                    {featureCards.map((card, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-6 items-start group"
                        >
                            {/* Animated Icon Container */}
                            <div className="flex-shrink-0 w-16 h-16 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-center overflow-hidden group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
                                {card.icon}
                            </div>

                            {/* Content */}
                            <div className="pt-1.5">
                                <h3 className="font-bold text-lg text-stone-900 mb-1 group-hover:text-emerald-600 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-stone-500 text-sm leading-relaxed max-w-sm">
                                    {card.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
