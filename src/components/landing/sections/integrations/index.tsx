"use client"

import { motion } from "framer-motion"

// Integrations with on/off state
const integrations = [
    // Active (lit) - what we have
    { name: "Supabase", active: true },
    { name: "Google Cloud", active: true },
    { name: "Vercel", active: true },

    // Planned (greyed) - what we want
    { name: "BankID", active: false },
    { name: "Swish", active: false },
    { name: "Kivra", active: false },
    { name: "Skatteverket", active: false },
    { name: "SEB", active: false },
    { name: "Swedbank", active: false },
    { name: "Nordea", active: false },
]

export function Integrations() {
    const activeCount = integrations.filter(i => i.active).length
    const plannedCount = integrations.filter(i => !i.active).length

    return (
        <section className="px-6 md:px-12 lg:px-24 py-24 max-w-[1400px] mx-auto border-t border-stone-200">
            {/* Header */}
            <div className="text-center mb-12">
                <p className="text-xs text-stone-400 uppercase tracking-widest mb-4">
                    Vår resa
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
                    Vi bygger i det öppna
                </h2>
                <p className="text-stone-500 max-w-xl mx-auto">
                    Vi bygger integrationer med de verktyg du redan använder.
                </p>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-8 mb-10">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-stone-900" />
                    <span className="text-sm text-stone-600">Aktiva ({activeCount})</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-stone-300" />
                    <span className="text-sm text-stone-400">Planerade ({plannedCount})</span>
                </div>
            </div>

            {/* Logo grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-3xl mx-auto">
                {integrations.map((integration, index) => (
                    <motion.div
                        key={integration.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        className={`
              flex flex-col items-center justify-center p-4 rounded-xl
              border transition-all
              ${integration.active
                                ? 'bg-white border-stone-200 hover:border-stone-300'
                                : 'bg-stone-50 border-stone-100'
                            }
            `}
                    >
                        {/* Logo placeholder with on/off state */}
                        <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center mb-2 text-lg font-bold
              ${integration.active
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-200 text-stone-400'
                            }
            `}>
                            {integration.name.charAt(0)}
                        </div>
                        <span className={`
              text-xs font-medium
              ${integration.active ? 'text-stone-900' : 'text-stone-400'}
            `}>
                            {integration.name}
                        </span>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
