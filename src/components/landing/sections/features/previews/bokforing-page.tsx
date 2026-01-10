"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { ScaledPreview, PreviewStatusBadge } from "./shared"

/**
 * Bokföring Page Preview - Step 3 of 3: View in Accounting
 * 
 * Shows mini version of the Bokföring page with the new 
 * verifikation highlighted, demonstrating the end result
 */

// Mock verifikationer list
const verifikationer = [
    { id: "V-1247", date: "2025-01-15", desc: "Z-rapport kassasystem", amount: 30970, isNew: true },
    { id: "V-1246", date: "2025-01-14", desc: "Kvitto Clas Ohlson", amount: -249, isNew: false },
    { id: "V-1245", date: "2025-01-13", desc: "Kundfaktura #1042", amount: 12500, isNew: false },
    { id: "V-1244", date: "2025-01-12", desc: "Leverantörsfaktura", amount: -4800, isNew: false },
]

// Tab configuration matching real app
const tabs = [
    { id: "transaktioner", label: "Transaktioner", color: "bg-blue-500" },
    { id: "fakturor", label: "Fakturor", color: "bg-purple-500" },
    { id: "kvitton", label: "Kvitton", color: "bg-amber-500" },
    { id: "inventarier", label: "Inventarier", color: "bg-indigo-500" },
]

export function BokforingPagePreview() {
    const [hasViewed, setHasViewed] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHasViewed(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.1 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => observer.disconnect()
    }, [])

    if (!hasViewed) {
        return (
            <ScaledPreview scale={0.7} className="h-full" variant="responsive-flush">
                <div ref={containerRef} className="relative w-full h-[620px] bg-background" />
            </ScaledPreview>
        )
    }

    return <BokforingPagePreviewContent />
}

function BokforingPagePreviewContent() {
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { amount: 0.3 })

    const [step, setStep] = useState(0)
    const [highlightNew, setHighlightNew] = useState(false)
    const activeTab = "transaktioner"

    useEffect(() => {
        if (!isInView) return

        let mounted = true

        const runSequence = async () => {
            if (!mounted) return

            // Reset
            setStep(0)
            setHighlightNew(false)

            await new Promise(r => setTimeout(r, 500))
            if (!mounted) return

            // Page loads
            setStep(1)

            await new Promise(r => setTimeout(r, 600))
            if (!mounted) return

            // Highlight new entry
            setHighlightNew(true)

            // Hold
            await new Promise(r => setTimeout(r, 6000))
            if (!mounted) return

            runSequence()
        }

        runSequence()
        return () => { mounted = false }
    }, [isInView])

    return (
        <ScaledPreview scale={0.7} className="h-full" variant="responsive-flush">
            <div ref={containerRef} className="relative w-full h-[620px]">
                <AnimatePresence>
                    {step >= 1 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="pt-6 pb-0 space-y-4 max-w-6xl origin-top w-full"
                        >
                            {/* Page Header */}
                            <div className="flex flex-col gap-2 px-6">
                                <h2 className="text-2xl font-bold tracking-tight">Bokföring</h2>
                                <p className="text-muted-foreground">Alla verifikationer och transaktioner</p>
                            </div>

                            {/* Tab Bar (matching real app) */}
                            <div className="px-6">
                                <div className="flex items-center gap-1 pb-2 border-b-2 border-border/60">
                                    {tabs.map((tab) => {
                                        const isActive = activeTab === tab.id
                                        return (
                                            <div
                                                key={tab.id}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground"
                                                    }`}
                                            >
                                                <div className={`h-2 w-2 rounded-full ${tab.color}`} />
                                                {isActive && <span>{tab.label}</span>}
                                            </div>
                                        )
                                    })}

                                    {/* Last updated text */}
                                    <div className="ml-auto text-xs text-muted-foreground">
                                        Senast uppdaterad: 15:42
                                    </div>
                                </div>
                            </div>

                            {/* Table header - simplified columns */}
                            <div className="px-6">
                                <div className="grid grid-cols-12 text-xs text-muted-foreground uppercase tracking-wider font-medium py-2 border-b border-border">
                                    <div className="col-span-3">Datum</div>
                                    <div className="col-span-5">Beskrivning</div>
                                    <div className="col-span-2 text-right">Belopp</div>
                                    <div className="col-span-2 text-right">Status</div>
                                </div>
                            </div>

                            {/* Table rows */}
                            <div className="px-6 space-y-0">
                                {verifikationer.map((v) => (
                                    <motion.div
                                        key={v.id}
                                        initial={v.isNew ? { backgroundColor: "rgba(0,0,0,0)" } : false}
                                        animate={v.isNew && highlightNew ? {
                                            backgroundColor: ["rgba(34, 197, 94, 0.08)", "rgba(34, 197, 94, 0.04)"]
                                        } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                                        className={`grid grid-cols-12 text-sm py-3 border-b border-border/40 items-center ${v.isNew && highlightNew ? 'rounded-lg' : ''}`}
                                    >
                                        <div className="col-span-3 text-muted-foreground">{v.date}</div>
                                        <div className="col-span-5 font-medium">
                                            {v.desc}
                                        </div>
                                        <div className={`col-span-2 text-right tabular-nums font-medium ${v.amount > 0 ? 'text-emerald-700/80' : ''}`}>
                                            {v.amount > 0 ? '+' : ''}{v.amount.toLocaleString('sv-SE')} kr
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <PreviewStatusBadge
                                                status="Bokförd"
                                                variant="success"
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ScaledPreview>
    )
}
