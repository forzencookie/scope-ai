"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { Search, FileText, Calendar, ArrowDownRight } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
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
                            className="pt-6 pb-0 space-y-5 max-w-6xl origin-top w-full"
                        >
                            {/* Page Header */}
                            <div className="flex flex-col gap-4 px-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight">Bokföring</h2>
                                        <p className="text-muted-foreground mt-1">Alla verifikationer och transaktioner</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats summary */}
                            <div className="px-6">
                                <StatCardGrid columns={3}>
                                    <StatCard
                                        label="Verifikationer"
                                        value="1 247"
                                        subtitle="+4 denna vecka"
                                        headerIcon={FileText}
                                    />
                                    <StatCard
                                        label="Senast bokfört"
                                        value="Idag"
                                        subtitle="15:42"
                                        headerIcon={Calendar}
                                    />
                                    <StatCard
                                        label="Total omsättning"
                                        value="847 520 kr"
                                        subtitle="2025"
                                        headerIcon={ArrowDownRight}
                                    />
                                </StatCardGrid>
                            </div>

                            {/* Search bar */}
                            <div className="px-6">
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border border-border rounded-lg text-muted-foreground">
                                    <Search className="w-4 h-4" />
                                    <span className="text-sm">Sök verifikation...</span>
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="border-b-2 border-border/60" />

                            {/* Table header */}
                            <div className="px-6">
                                <div className="grid grid-cols-12 text-xs text-muted-foreground uppercase tracking-wider font-medium py-2 border-b border-border">
                                    <div className="col-span-2">Verifikation</div>
                                    <div className="col-span-2">Datum</div>
                                    <div className="col-span-5">Beskrivning</div>
                                    <div className="col-span-2 text-right">Belopp</div>
                                    <div className="col-span-1">Status</div>
                                </div>
                            </div>

                            {/* Table rows */}
                            <div className="px-6 space-y-0">
                                {verifikationer.map((v, i) => (
                                    <motion.div
                                        key={v.id}
                                        initial={v.isNew ? { backgroundColor: "rgba(0,0,0,0)" } : false}
                                        animate={v.isNew && highlightNew ? {
                                            backgroundColor: ["rgba(34, 197, 94, 0.15)", "rgba(34, 197, 94, 0.08)"]
                                        } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                                        className={`grid grid-cols-12 text-sm py-3 border-b border-border/40 items-center ${v.isNew && highlightNew ? 'rounded-lg' : ''}`}
                                    >
                                        <div className="col-span-2 font-mono text-muted-foreground flex items-center gap-2">
                                            {v.isNew && highlightNew && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-2 h-2 rounded-full bg-emerald-500"
                                                />
                                            )}
                                            {v.id}
                                        </div>
                                        <div className="col-span-2 text-muted-foreground">{v.date}</div>
                                        <div className="col-span-5 font-medium">
                                            {v.desc}
                                            {v.isNew && highlightNew && (
                                                <span className="ml-2 text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-700 rounded font-medium">
                                                    NY
                                                </span>
                                            )}
                                        </div>
                                        <div className={`col-span-2 text-right tabular-nums font-medium ${v.amount > 0 ? 'text-emerald-600' : ''}`}>
                                            {v.amount > 0 ? '+' : ''}{v.amount.toLocaleString('sv-SE')} kr
                                        </div>
                                        <div className="col-span-1">
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
