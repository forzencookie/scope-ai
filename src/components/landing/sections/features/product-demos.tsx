"use client"

import { motion } from "framer-motion"
import { ReceiptsPreview } from "./previews/receipts"
import { MomsWorkflowPreview } from "./previews/moms"
import { PayrollPreview } from "./previews/payroll"
import { Receipt, Calculator, Wallet } from "lucide-react"

const demos = [
    {
        id: "receipts",
        icon: Receipt,
        title: "Kvittohantering",
        description: "Ladda upp kvitton och få automatisk kategorisering. AI läser av summa, datum och leverantör — du godkänner bara.",
        Preview: ReceiptsPreview
    },
    {
        id: "moms",
        icon: Calculator,
        title: "Momsdeklaration",
        description: "Automatisk beräkning baserat på dina bokförda transaktioner. Redo att skicka till Skatteverket med ett klick.",
        Preview: MomsWorkflowPreview
    },
    {
        id: "payroll",
        icon: Wallet,
        title: "Lönebesked",
        description: "Skapa lönebesked med skatt och sociala avgifter beräknade på minuter. Exportera till bankfil eller PDF.",
        Preview: PayrollPreview
    }
]

export function ProductDemos() {
    return (
        <section className="px-6 md:px-12 lg:px-24 py-24 max-w-[1400px] mx-auto border-t border-stone-200">
            {/* Header */}
            <div className="text-center mb-16">
                <p className="text-xs text-stone-400 uppercase tracking-widest mb-4">
                    Se det i aktion
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
                    Så fungerar det
                </h2>
                <p className="text-stone-500 max-w-xl mx-auto">
                    Interaktiva demos av våra viktigaste funktioner
                </p>
            </div>

            {/* Staggered alternating layout */}
            <div className="space-y-24">
                {demos.map((demo, index) => {
                    const isReversed = index % 2 === 1
                    const Icon = demo.icon

                    return (
                        <motion.div
                            key={demo.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className={`flex flex-col md:flex-row gap-12 items-center ${isReversed ? 'md:flex-row-reverse' : ''}`}
                        >
                            {/* Content side */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-stone-600" />
                                    </div>
                                    <span className="text-xs text-stone-400 uppercase tracking-widest">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">
                                    {demo.title}
                                </h3>
                                <p className="text-stone-600 leading-relaxed max-w-md">
                                    {demo.description}
                                </p>
                            </div>

                            {/* Demo preview side */}
                            <div className="flex-1 w-full">
                                <div className="bg-stone-100 rounded-2xl p-3 border border-stone-200">
                                    <div className="bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm">
                                        <demo.Preview />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </section>
    )
}
