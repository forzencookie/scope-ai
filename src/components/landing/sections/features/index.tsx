"use client"

import { motion } from "framer-motion"
import { LayoutGrid } from "lucide-react"
import { SectionHeader } from "../../shared/section-header"
import { ReceiptsPreview } from "./previews/receipts"
import { MomsWorkflowPreview } from "./previews/moms"
import { PayrollPreview } from "./previews/payroll"

// Feature card data
const features = [
    {
        number: "01",
        title: "Alla dina kvitton på en plats",
        description: "Ladda upp kvitton, fakturor och utlägg. Scope läser av dokumenten och föreslår kontering automatiskt.",
        preview: ReceiptsPreview
    },
    {
        number: "02",
        title: "Moms och skatt, redo att skicka",
        description: "Momsdeklaration och arbetsgivaravgifter beräknas automatiskt utifrån dina bokförda transaktioner.",
        preview: MomsWorkflowPreview
    },
    {
        number: "03",
        title: "Löner klara på minuter",
        description: "Skapa lönebesked med skatt och sociala avgifter beräknade. Exportera till bankfil eller PDF.",
        preview: PayrollPreview
    }
]

export function CoreFeatures() {
    const heroFeature = features[0]
    const gridFeatures = features.slice(1)

    return (
        <section className="px-3 md:px-4 py-24 max-w-[2400px] mx-auto">
            <SectionHeader
                badge="Funktioner"
                title="Allt du behöver för din bokföring"
                description="Från kvittohantering till färdiga deklarationer. Scope AI automatiserar det tidskrävande arbetet så att du kan fokusera på din verksamhet."
                icon={LayoutGrid}
                className="mb-16"
            />
            <div className="space-y-6">
                {/* Hero Feature - Text left, preview floating right */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-card border border-border rounded-3xl p-8 md:p-10 overflow-hidden relative min-h-[400px] md:min-h-[500px]"
                >
                    {/* Text content - left side */}
                    <div className="max-w-md relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-1 h-8 bg-foreground rounded-full" />
                            <span className="text-sm font-mono text-muted-foreground">{heroFeature.number}</span>
                        </div>

                        <h3 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
                            {heroFeature.title}
                        </h3>

                        <p className="text-muted-foreground leading-relaxed text-lg">
                            {heroFeature.description}
                        </p>
                    </div>

                    {/* Preview - floating right, partially cut off */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[10%] w-[60%] md:w-[55%]">
                        <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                            <heroFeature.preview />
                        </div>
                    </div>
                </motion.div>

                {/* Grid Features - Bento Grid Layout */}
                <div className="grid md:grid-cols-3 gap-6">
                    {gridFeatures.map((feature, i) => {
                        const isPayroll = feature.title.includes("Löner")
                        const isMoms = i === 0 // Moms is the first grid item
                        // Momsdeklaration (first item) takes 2 columns, Payroll takes 1
                        const colSpan = i === 0 ? "md:col-span-2" : "md:col-span-1"

                        // Apply Reduced padding for both Payroll and Moms to let them extend to bottom
                        const paddingClass = (isPayroll || isMoms) ? 'pt-8 pl-8 pr-8 pb-0' : 'p-6 md:p-8'

                        return (
                            <motion.div
                                key={feature.number}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                // Conditional padding and Spans
                                className={`bg-card border border-border rounded-3xl overflow-hidden flex flex-col relative ${colSpan} ${paddingClass}`}
                            >
                                {/* Text content */}
                                <div className={`${(isPayroll || isMoms) ? 'mb-8 relative z-10' : 'mb-6'}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-1 h-6 bg-foreground rounded-full" />
                                        <span className="text-sm font-mono text-muted-foreground">{feature.number}</span>
                                    </div>

                                    <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
                                        {feature.title}
                                    </h3>

                                    <p className="text-muted-foreground leading-relaxed text-sm">
                                        {feature.description}
                                    </p>
                                </div>

                                {/* Preview container */}
                                {/* For Moms & Payroll, we want full width/height extension to bottom without the 'inset' card look */}
                                <div className={`flex-1 relative ${(isPayroll || isMoms) ? 'min-h-[340px]' : 'bg-muted/30 rounded-xl p-3 border border-border/50'}`}>
                                    {isPayroll ? (
                                        // Payroll specific styling: Narrow Column Adjustment
                                        // We make the inner container much wider (right=-60%) so the table doesn't squash.
                                        // The parent card's overflow-hidden will handle the cutoff.
                                        <div className="absolute inset-0">
                                            {/* Fake tabs behind - neatly stacked */}
                                            {/* Tab 1 (Back) */}
                                            <div className="absolute top-0 left-[12%] right-[-50%] h-full bg-muted border-t border-l border-border rounded-tl-2xl z-0" />
                                            {/* Tab 2 (Middle) */}
                                            <div className="absolute top-4 left-[6%] right-[-55%] h-full bg-muted border-t border-l border-border rounded-tl-2xl z-0" />

                                            {/* Main Preview (Front) - Wide width to prevent squashed table */}
                                            <div className="absolute top-8 left-0 right-[-60%] bottom-[-25%] z-10 shadow-xl rounded-tl-2xl overflow-hidden bg-background border-t border-l border-border">
                                                <feature.preview />
                                            </div>
                                        </div>
                                    ) : isMoms ? (
                                        // Moms styling: "Inner Card" look but extended to bottom
                                        // Re-adding the grey background and borders, but flush with bottom
                                        <div className="absolute inset-0 top-0 overflow-hidden rounded-t-xl border-t border-x border-border/50 bg-muted/30 p-2 pb-0">
                                            <feature.preview />
                                        </div>
                                    ) : (
                                        // Standard styling for other grid items
                                        <feature.preview />
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
