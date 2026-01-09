"use client"

import { motion } from "framer-motion"
import { LayoutGrid } from "lucide-react"
import { SectionHeader } from "../../shared/section-header"
import { ZReportContextPreview } from "./previews/zreport-context"
import { JournalEntryPreview } from "./previews/journal-entry"
import { BokforingPagePreview } from "./previews/bokforing-page"

// Feature card data - 3-step connected story
const features = [
    {
        number: "01",
        title: "Ladda upp & analysera",
        description: "Ladda upp en Z-rapport, kvitto eller faktura. AI:n tolkar dokumentet och föreslår kontering.",
        preview: ZReportContextPreview
    },
    {
        number: "02",
        title: "Granska verifikation",
        description: "AI:n skapar en komplett verifikation med debet- och kreditrader. Du ser exakt vad som bokförs.",
        preview: JournalEntryPreview
    },
    {
        number: "03",
        title: "Klar i bokföringen",
        description: "Verifikationen sparas direkt i bokföringen. Du har full översikt och kan alltid gå tillbaka.",
        preview: BokforingPagePreview
    }
]

export function CoreFeatures() {
    return (
        <section className="px-6 md:px-12 lg:px-24 py-24 max-w-[1400px] mx-auto border-t border-stone-200">
            <SectionHeader
                badge="Hur det funkar"
                title="Allt du behöver, i tre enkla steg"
                description="Ladda upp, granska, klar. Scope AI hanterar resten — från kvitton till färdiga verifikationer."
                icon={LayoutGrid}
                className="mb-16"
            />

            {/* 3-Step Connected Story - Stacked for larger demos */}
            <div className="space-y-6">
                {features.map((feature, i) => (
                    <motion.div
                        key={feature.number}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-card border border-border rounded-3xl overflow-hidden relative"
                    >
                        {/* Desktop: side-by-side | Mobile: stacked */}
                        <div className="flex flex-col md:flex-row">
                            {/* Text content */}
                            <div className="p-6 md:p-8 lg:p-10 md:w-[40%] lg:w-[35%] flex flex-col justify-center">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-1 h-6 bg-foreground rounded-full" />
                                    <span className="text-sm font-mono text-muted-foreground">{feature.number}</span>
                                </div>

                                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight mb-3">
                                    {feature.title}
                                </h3>

                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>

                            {/* Preview - takes remaining space, ScaledPreview handles container */}
                            <div className="md:w-[60%] lg:w-[65%] p-4 md:p-6 md:pb-0 bg-muted/30 flex flex-col justify-end">
                                <feature.preview />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}

