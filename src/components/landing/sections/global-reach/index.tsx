"use client"

import { motion } from "framer-motion"
import { Globe, Zap, Bot, UserCheck } from "lucide-react"
import { SectionHeader } from "../../shared/section-header"
import { DottedWorldMap } from "./dotted-world-map"

const visionPoints = [
    {
        icon: Bot,
        title: "AI sköter grovjobbet",
        description: "AI automatiserar det manuella arbetet så att ni slipper."
    },
    {
        icon: UserCheck,
        title: "Mänsklig kontroll",
        description: "Experter övervakar och godkänner allt AI:n gör."
    },
    {
        icon: Zap,
        title: "Effektiva flöden",
        description: "Optimerade processer för maximal hastighet och precision."
    },
    {
        icon: Globe,
        title: "Global skalbarhet",
        description: "Hantera fler kunder utan att behöva öka personalstyrkan."
    }
]

export function GlobalReach() {
    return (
        <section className="px-6 md:px-12 lg:px-24 py-24 max-w-[1400px] mx-auto border-t border-stone-200">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left: Content */}
                <div>
                    <SectionHeader
                        badge="Vår vision"
                        title="Vi frigör tid för tillväxt"
                        description="Vi strävar efter att effektivt eliminera den administrativa arbetsbördan genom att utnyttja AI och hjälpa företag att skala upp genom att optimera sina arbetsflöden. Detta uppnås genom att AI gör grovjobbet medan människor står för övervakningen, vilket innebär att redovisningskonsulter kan hantera fler företag med samma insats. I framtiden siktar vi globalt, men just nu fokuserar vi på Sverige."
                        align="left"
                        className="mb-10"
                    />

                    {/* Feature cards */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        {visionPoints.map((point, i) => (
                            <motion.div
                                key={point.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-3 p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                                    <point.icon className="w-5 h-5 text-stone-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-stone-900 mb-1">{point.title}</h3>
                                    <p className="text-sm text-stone-500">{point.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Right: Dotted World Map */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative flex items-center justify-center"
                >
                    <DottedWorldMap className="w-full max-w-lg" dotColor="#8b5cf6" />
                </motion.div>
            </div>
        </section>
    )
}
