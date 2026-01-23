"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { IntegrationLogos } from "@/components/installningar/integration-logos"

export function IntegrationMesh() {
    const integrations: { name: keyof typeof IntegrationLogos; angle: number }[] = [
        { name: "Skatteverket", angle: 0 },
        { name: "SEB", angle: 51 },
        { name: "Swedbank", angle: 103 },
        { name: "Handelsbanken", angle: 154 },
        { name: "Nordea", angle: 206 },
        { name: "Kivra", angle: 257 },
        { name: "BankID", angle: 309 },
    ]

    return (
        <section className="px-3 md:px-4 py-8 max-w-[2400px] mx-auto">
            <div className="bg-stone-900 rounded-3xl p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left side - Text only */}
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Kopplat till allt du behöver.</h2>
                        <p className="text-stone-400 leading-relaxed">
                            Direktkoppling till svenska banker, Skatteverket, Kivra och BankID. Allt synkas automatiskt — inga manuella importer.
                        </p>
                    </div>

                    {/* Right side - Orbital diagram with logos */}
                    <div className="relative w-full max-w-sm mx-auto aspect-square">
                        {/* Connection lines with energy flow */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 300">
                            <defs>
                                {/* Define individual gradients for each line direction */}
                                {integrations.map((integration, i) => {
                                    const angleRad = (integration.angle - 90) * (Math.PI / 180)
                                    const x = 150 + Math.cos(angleRad) * 100
                                    const y = 150 + Math.sin(angleRad) * 100
                                    return (
                                        <linearGradient
                                            key={`gradient-${i}`}
                                            id={`energyGradient-${i}`}
                                            x1={x} y1={y} x2="150" y2="150"
                                            gradientUnits="userSpaceOnUse"
                                        >
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0">
                                                <animate
                                                    attributeName="offset"
                                                    values="0;1"
                                                    dur="1.5s"
                                                    repeatCount="indefinite"
                                                    begin={`${i * 0.2}s`}
                                                />
                                            </stop>
                                            <stop offset="10%" stopColor="#8b5cf6" stopOpacity="1">
                                                <animate
                                                    attributeName="offset"
                                                    values="0.1;1.1"
                                                    dur="1.5s"
                                                    repeatCount="indefinite"
                                                    begin={`${i * 0.2}s`}
                                                />
                                            </stop>
                                            <stop offset="20%" stopColor="#a78bfa" stopOpacity="0">
                                                <animate
                                                    attributeName="offset"
                                                    values="0.2;1.2"
                                                    dur="1.5s"
                                                    repeatCount="indefinite"
                                                    begin={`${i * 0.2}s`}
                                                />
                                            </stop>
                                        </linearGradient>
                                    )
                                })}
                            </defs>

                            {/* Static background lines */}
                            {integrations.map((integration, i) => {
                                const angleRad = (integration.angle - 90) * (Math.PI / 180)
                                const x = 150 + Math.cos(angleRad) * 100
                                const y = 150 + Math.sin(angleRad) * 100
                                return (
                                    <line
                                        key={`static-${i}`}
                                        x1="150"
                                        y1="150"
                                        x2={x}
                                        y2={y}
                                        stroke="#d4d4d8"
                                        strokeWidth="1"
                                        strokeDasharray="4 4"
                                        opacity="0.4"
                                    />
                                )
                            })}

                            {/* Energy flow lines */}
                            {integrations.map((integration, i) => {
                                const angleRad = (integration.angle - 90) * (Math.PI / 180)
                                const x = 150 + Math.cos(angleRad) * 100
                                const y = 150 + Math.sin(angleRad) * 100
                                return (
                                    <line
                                        key={`energy-${i}`}
                                        x1={x}
                                        y1={y}
                                        x2="150"
                                        y2="150"
                                        stroke={`url(#energyGradient-${i})`}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                )
                            })}
                        </svg>

                        {/* Center hub - Scope AI (circle) - removed pulse animation */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center z-10 border border-stone-200 will-change-transform-opacity"
                        >
                            <span className="text-stone-900 font-bold text-xs">Scope AI</span>
                        </motion.div>

                        {/* Orbital integration nodes with logos */}
                        {integrations.map((integration, i) => {
                            const angleRad = (integration.angle - 90) * (Math.PI / 180)
                            const radius = 33
                            const x = 50 + Math.cos(angleRad) * radius
                            const y = 50 + Math.sin(angleRad) * radius
                            const LogoComponent = IntegrationLogos[integration.name]
                            const isLargeSize = integration.name === "Handelsbanken"
                            const isMediumSize = integration.name === "Nordea"

                            return (
                                <motion.div
                                    key={integration.name}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 group will-change-transform-opacity"
                                    style={{ left: `${x}%`, top: `${y}%` }}
                                >
                                    <div className={cn("bg-white border border-stone-700 rounded-full flex items-center justify-center hover:bg-stone-100 hover:border-stone-500 transition-all cursor-default", "w-12 h-12")}>
                                        <LogoComponent className={cn("text-white", isLargeSize ? "w-8 h-8" : isMediumSize ? "w-7 h-7" : "w-6 h-6")} />
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-stone-400 whitespace-nowrap">
                                        {integration.name}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}
