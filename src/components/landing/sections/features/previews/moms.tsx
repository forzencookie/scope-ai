"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Wallet, ArrowDownRight, Search, Clock, ArrowUpRight, CheckCircle2 } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { GridTableHeader, GridTableRow, GridTableRows } from "@/components/ui/grid-table"
import { ScaledPreview, PreviewStatusBadge, Cursor } from "./shared"

// ===== MOMS LIST VIEW (State 0 - The "Page") =====
function MomsPageView() {
    // Mock data for the main list
    const periods = [
        { period: "Q4 2025", dueDate: "2026-02-26", salesVat: 45250, inputVat: 12800, netVat: 32450, status: "Kommande" },
        { period: "Q3 2025", dueDate: "2025-11-26", salesVat: 38900, inputVat: 15200, netVat: 23700, status: "Inskickad" },
        { period: "Q2 2025", dueDate: "2025-08-26", salesVat: 42100, inputVat: 14500, netVat: 27600, status: "Inskickad" },
    ]

    return (
        <div className="pt-6 pb-0 space-y-6 max-w-6xl origin-top w-full">
            {/* Page Heading matching real component */}
            <div className="flex flex-col gap-6 px-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Momsdeklaration</h2>
                        <p className="text-muted-foreground mt-1">Hantera momsrapporter och skicka till Skatteverket.</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid matching real component */}
            <div className="px-6">
                <StatCardGrid columns={3}>
                    <StatCard
                        label="Nästa deklaration"
                        value="Q4 2025"
                        subtitle="Deadline: 2026-02-26"
                        headerIcon={Calendar}
                    />
                    <StatCard
                        label="Moms att betala"
                        value="32 450 kr"
                        subtitle="Utgående: 45 250 kr"
                        headerIcon={Wallet}
                    />
                    <StatCard
                        label="Ingående moms"
                        value="12 800 kr"
                        subtitle="Avdragsgill"
                        headerIcon={ArrowDownRight}
                    />
                </StatCardGrid>
            </div>

            {/* Section Separator */}
            <div className="border-b-2 border-border/60" />

            {/* Table Actions Toolbar matching real component */}
            <div className="flex items-center justify-between py-1 px-6">
                <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Alla perioder</h3>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border border-border rounded-md text-sm text-muted-foreground w-48">
                        <Search className="w-4 h-4" />
                        <span>Sök period...</span>
                    </div>
                </div>
            </div>

            {/* GridTable Header */}
            <div className="w-full">
                <div className="px-6">
                    <GridTableHeader
                        columns={[
                            { label: "Period", icon: Calendar, span: 2 },
                            { label: "Deadline", icon: Clock, span: 2 },
                            { label: "Utgående moms", icon: ArrowUpRight, span: 2, align: "right" },
                            { label: "Ingående moms", icon: ArrowDownRight, span: 2, align: "right" },
                            { label: "Att betala", icon: Wallet, span: 2, align: "right" },
                            { label: "Status", icon: CheckCircle2, span: 1 },
                        ]}
                    />
                </div>

                {/* GridTable Rows */}
                <div className="px-6">
                    <GridTableRows>
                        {periods.map((item, i) => (
                            <GridTableRow key={item.period} className={i === 0 ? "bg-muted/40" : ""}>
                                <div style={{ gridColumn: 'span 2' }} className="font-medium">
                                    {item.period}
                                </div>
                                <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground">
                                    {item.dueDate}
                                </div>
                                <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums">
                                    {item.salesVat.toLocaleString("sv-SE")} kr
                                </div>
                                <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums">
                                    {item.inputVat.toLocaleString("sv-SE")} kr
                                </div>
                                <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums font-medium">
                                    {item.netVat.toLocaleString("sv-SE")} kr
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <PreviewStatusBadge
                                        status={item.status}
                                        variant={item.status === "Inskickad" ? "success" : "warning"}
                                    />
                                </div>
                            </GridTableRow>
                        ))}
                    </GridTableRows>
                </div>
            </div>
        </div>
    )
}

export function MomsWorkflowPreview() {
    const [step, setStep] = useState(0)
    const [scrollTo, setScrollTo] = useState(0)
    // New state for page scrolling animation
    const [pageScroll, setPageScroll] = useState(0)
    const [cursor, setCursor] = useState({ x: 300, y: 450, click: false, opacity: 0 })

    useEffect(() => {
        let mounted = true

        const runSequence = async () => {
            if (!mounted) return

            // Check if mobile (md breakpoint is 768px)
            const isMobile = window.innerWidth < 768

            setStep(0)
            setPageScroll(0)

            if (isMobile) {
                // === MOBILE SEQUENCE (With Scroll) ===
                // Start cursor lower
                setCursor({ x: 300, y: 460, click: false, opacity: 0 })

                await new Promise(r => setTimeout(r, 1000))
                if (!mounted) return
                setCursor(c => ({ ...c, opacity: 1 }))

                // 1. Scroll down animation
                await new Promise(r => setTimeout(r, 500))
                setPageScroll(-60) // Scroll up
                // Adjust cursor to follow scroll
                setCursor(c => ({ ...c, y: 430 }))

                await new Promise(r => setTimeout(r, 800))
                if (!mounted) return

                // 2. Click the row
                setCursor(c => ({ ...c, click: true }))
                await new Promise(r => setTimeout(r, 300))
                if (!mounted) return
                setCursor(c => ({ ...c, click: false }))
            } else {
                // === DESKTOP SEQUENCE (No Scroll) ===
                // Original simple click behavior
                setCursor({ x: 300, y: 415, click: false, opacity: 0 })

                await new Promise(r => setTimeout(r, 1000))
                if (!mounted) return
                setCursor(c => ({ ...c, opacity: 1 }))
                await new Promise(r => setTimeout(r, 800))
                if (!mounted) return

                // Click the row at original position
                setCursor(c => ({ ...c, click: true }))
                await new Promise(r => setTimeout(r, 300))
                if (!mounted) return
                setCursor(c => ({ ...c, click: false }))
            }

            // Hide cursor immediately after click
            setCursor(c => ({ ...c, opacity: 0 }))

            // Shared sequence (Dialog open, etc.)
            setStep(1)

            await new Promise(r => setTimeout(r, 800))
            setScrollTo(100)
            await new Promise(r => setTimeout(r, 1500))

            setScrollTo(0)
            await new Promise(r => setTimeout(r, 1000))
            if (!mounted) return

            // Redundant fade out removed/kept for safety
            setCursor(c => ({ ...c, opacity: 0 }))
            await new Promise(r => setTimeout(r, 400))
            if (!mounted) return

            // Moving cursor left on desktop: NO, needs to be RIGHT because dialog is centered and container is wider
            // Mobile (450), Desktop (700)
            setCursor({ x: isMobile ? 450 : 700, y: 410, click: false, opacity: 0 })

            await new Promise(r => setTimeout(r, 100))
            if (!mounted) return

            setCursor(c => ({ ...c, opacity: 1 }))
            await new Promise(r => setTimeout(r, 800))
            if (!mounted) return

            setCursor(c => ({ ...c, click: true }))
            await new Promise(r => setTimeout(r, 300))
            if (!mounted) return
            setCursor(c => ({ ...c, click: false }))

            await new Promise(r => setTimeout(r, 500))
            setStep(2)

            await new Promise(r => setTimeout(r, 3000))
            setCursor(c => ({ ...c, opacity: 0 }))

            // Wait for fade out, then reset everything silently
            await new Promise(r => setTimeout(r, 500))
            if (!mounted) return

            // RESET SCROLL AND STEPS SILENTLY BEFORE RESTARTING
            setPageScroll(0)
            setStep(0)

            // Small pause before restarting loop
            await new Promise(r => setTimeout(r, 500))
            runSequence()
        }

        runSequence()
        return () => { mounted = false }
    }, [])

    return (
        <ScaledPreview scale={0.65} className="h-full flex flex-col rounded-b-none border-b-0 shadow-sm">
            <div className="relative w-full h-full min-h-[900px]">
                {/* Animate the page content scrolling */}
                <motion.div
                    className="absolute inset-0 z-0"
                    animate={{ y: pageScroll }}
                    transition={{
                        duration: pageScroll === 0 ? 0 : 0.8,
                        ease: "easeInOut"
                    }}
                >
                    <MomsPageView />
                </motion.div>

                <AnimatePresence>
                    {step > 0 && (
                        // Changed to items-start pt-4 to spawn dialog higher up per user request
                        <div className="absolute inset-0 z-10 flex items-start justify-center pt-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
                            />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                                className="bg-background border border-border rounded-xl shadow-2xl w-[90%] max-w-[500px] h-[420px] relative z-20 flex flex-col overflow-hidden pointer-events-auto"
                            >
                                {step === 1 ? (
                                    <div className="flex flex-col h-full">
                                        <div className="px-6 py-4 flex items-center justify-between bg-card/50">
                                            <h3 className="font-semibold">Momsdeklaration Q4</h3>
                                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-hidden relative">
                                            <motion.div
                                                animate={{ y: -scrollTo }}
                                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                                className="p-6 space-y-6"
                                            >
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-muted/40">
                                                        <div className="w-10 h-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                            <div className="font-bold text-[10px]">XML</div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">momsdeklaration-2025-q4.xml</p>
                                                            <p className="text-xs text-muted-foreground">32 450 kr att betala</p>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                                                            24kB
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 pt-2">
                                                        <h4 className="font-medium text-sm text-foreground">Innehåll</h4>
                                                        <div className="space-y-2 text-sm text-muted-foreground">
                                                            <div className="flex justify-between py-1 border-b border-border/40">
                                                                <span>Period</span>
                                                                <span className="font-medium text-foreground">2025-10-01 - 2025-12-31</span>
                                                            </div>
                                                            <div className="flex justify-between py-1 border-b border-border/40">
                                                                <span>Momspliktig försäljning</span>
                                                                <span className="font-mono">226 250 kr</span>
                                                            </div>
                                                            <div className="flex justify-between py-1 border-b border-border/40">
                                                                <span>Utgående moms</span>
                                                                <span className="font-mono">45 250 kr</span>
                                                            </div>
                                                            <div className="flex justify-between py-1 border-b border-border/40">
                                                                <span>Ingående moms</span>
                                                                <span className="font-mono">-12 800 kr</span>
                                                            </div>
                                                            <div className="flex justify-between pt-1">
                                                                <span className="font-medium text-foreground">Att betala</span>
                                                                <span className="font-bold text-foreground">32 450 kr</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>

                                        <div className="p-4 bg-card/30 flex justify-end gap-2">
                                            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Avbryt</button>
                                            <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-sm">Exportera XML</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="w-16 h-16 bg-[#d1fae5] text-[#059669] rounded-full flex items-center justify-center mb-4"
                                        >
                                            <CheckCircle2 className="w-8 h-8" />
                                        </motion.div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Export klar!</h3>
                                            <p className="text-muted-foreground text-sm mt-1">Filen har skapats och är redo att laddas upp till Skatteverket.</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <Cursor x={cursor.x} y={cursor.y} click={cursor.click} opacity={cursor.opacity} />
            </div>
        </ScaledPreview>
    )
}
