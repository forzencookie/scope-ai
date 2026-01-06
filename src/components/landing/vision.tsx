"use client"

import { motion } from "framer-motion"
import { Check, Clock, Sparkles } from "lucide-react"

const roadmapItems = [
    {
        status: "done",
        title: "AI-bokföring",
        description: "Ladda upp kvitton, få förslag",
        badge: "KLAR",
        timeline: "Idag"
    },
    {
        status: "done",
        title: "Moms & AGI",
        description: "Deklarationer genereras",
        badge: "KLAR",
        timeline: "Idag"
    },
    {
        status: "soon",
        title: "Bankkoppling",
        description: "Automatisk import",
        badge: "SNART",
        timeline: "Q1 2026"
    },
    {
        status: "future",
        title: "API-åtkomst",
        description: "För utvecklare",
        badge: "PLANERAD",
        timeline: "Senare"
    }
]

export function Vision() {
    return (
        <section className="px-3 md:px-4 py-8 max-w-[2400px] mx-auto">
            <div className="bg-white border border-stone-200 rounded-3xl p-8 md:p-12">
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mb-3">
                        Vår vision: Bokföring som sköter sig själv
                    </h2>
                    <p className="text-stone-600 max-w-xl mx-auto">
                        Vi börjar med det viktigaste — att göra bokföring enklare för dig, idag.
                    </p>
                </div>

                {/* Timeline line */}
                <div className="relative mb-8">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-stone-200" />
                    <div className="absolute top-4 left-0 w-1/2 h-0.5 bg-emerald-500" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {roadmapItems.map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`rounded-xl p-5 border transition-colors ${item.status === "done"
                                    ? "bg-emerald-50/50 border-emerald-200"
                                    : item.status === "soon"
                                        ? "bg-amber-50/50 border-amber-200"
                                        : "bg-stone-50 border-stone-200"
                                }`}
                        >
                            {/* Status icon */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${item.status === "done"
                                    ? "bg-emerald-500"
                                    : item.status === "soon"
                                        ? "bg-amber-500"
                                        : "bg-stone-300"
                                }`}>
                                {item.status === "done" ? (
                                    <Check className="w-4 h-4 text-white" />
                                ) : item.status === "soon" ? (
                                    <Clock className="w-4 h-4 text-white" />
                                ) : (
                                    <Sparkles className="w-4 h-4 text-white" />
                                )}
                            </div>

                            {/* Badge */}
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${item.status === "done"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : item.status === "soon"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-stone-200 text-stone-600"
                                }`}>
                                {item.badge}
                            </span>

                            <h3 className="font-semibold text-stone-900 mt-3 mb-1">{item.title}</h3>
                            <p className="text-sm text-stone-500">{item.description}</p>
                            <p className="text-xs text-stone-400 mt-2">{item.timeline}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
