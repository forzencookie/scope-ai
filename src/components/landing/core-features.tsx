"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Calendar, Banknote, Wallet, User, FileText, Link2, Clock, Building2, Tag, Paperclip, CheckCircle2, ArrowUpRight, ArrowDownRight, Search } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { GridTableHeader, GridTableRow, GridTableRows } from "@/components/ui/grid-table"

// Wrapper that scales down actual components to create miniature preview
function ScaledPreview({ children, scale = 0.65, className }: { children: React.ReactNode; scale?: number; className?: string }) {
    return (
        <div className={`bg-background border border-border rounded-xl overflow-hidden ${className}`}>
            {/* Window header with macOS dots */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/60 bg-muted/30">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            {/* Scaled content - use a wrapper to properly contain the scaled height */}
            <div className="overflow-hidden" style={{ height: 'fit-content' }}>
                <div
                    className="origin-top-left"
                    style={{
                        transform: `scale(${scale})`,
                        width: `${100 / scale}%`,
                        marginBottom: `-${(1 - scale) * 100}%`
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    )
}

// ===== Status badge that matches AppStatusBadge styling =====
function PreviewStatusBadge({
    status,
    variant = "neutral"
}: {
    status: string
    variant?: "success" | "warning" | "neutral"
}) {
    const variantStyles = {
        success: "text-green-700 dark:text-green-500/70 bg-green-100 dark:bg-green-900/20",
        warning: "text-amber-700 dark:text-amber-500/70 bg-amber-100 dark:bg-amber-900/20",
        neutral: "text-muted-foreground bg-muted/50"
    }

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-sm font-medium text-xs px-2 py-0.5 ${variantStyles[variant]}`}>
            {status}
        </span>
    )
}

// ===== CURSOR COMPONENT =====
function Cursor({ x, y, click, opacity = 1 }: { x: number; y: number; click: boolean; opacity?: number }) {
    return (
        <motion.div
            className="absolute z-50 pointer-events-none drop-shadow-xl"
            animate={{ x, y, scale: click ? 0.8 : 1, opacity }}
            transition={{
                x: { type: "spring", stiffness: 150, damping: 25 },
                y: { type: "spring", stiffness: 150, damping: 25 },
                scale: { duration: 0.1 },
                opacity: { duration: 0.2 } // Fast fade
            }}
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 -ml-3 -mt-2">
                <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19117L11.7841 12.3673H5.65376Z" fill="black" stroke="white" strokeWidth="1" />
            </svg>
        </motion.div>
    )
}

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

// ===== REPORT VIEW (Content only) =====
function MomsReportView() {
    // Mock data matching real component display
    const mockPeriods = [
        { period: "Q4 2025", dueDate: "2026-02-26", salesVat: 45250, inputVat: 12800, netVat: 32450, status: "Kommande" },
        { period: "Q3 2025", dueDate: "2025-11-26", salesVat: 38900, inputVat: 15200, netVat: 23700, status: "Inskickad" }
    ]

    return (
        <div className="space-y-6">
            {/* Stats Cards - Compact Grid for Dialog */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">Moms att betala</div>
                    <div className="text-lg font-bold">32 450 kr</div>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">Status</div>
                    <div className="text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 inline-flex px-2 py-0.5 rounded-full">Kommande</div>
                </div>
            </div>

            {/* Section Separator */}
            <div className="border-b border-border/40" />

            {/* GridTable Header - Compact */}
            <div className="w-full text-sm">
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="font-semibold text-muted-foreground text-xs uppercase">Period</div>
                    <div className="font-semibold text-muted-foreground text-xs uppercase text-right">Belopp</div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-border/30">
                        <span>Utgående moms 25%</span>
                        <span className="font-mono">45 250 kr</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/30">
                        <span>Ingående moms</span>
                        <span className="font-mono">-12 800 kr</span>
                    </div>
                    <div className="flex justify-between py-2 border-t border-border font-medium pt-2">
                        <span>Att betala</span>
                        <span className="font-mono">32 450 kr</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ===== WORKFLOW ORCHESTRATOR =====
function MomsWorkflowPreview() {
    const [step, setStep] = useState(0)
    const [scrollTo, setScrollTo] = useState(0)
    // Coords:    const [step, setStep] = useState(0) // 0: Dashboard, 1: Report, 2: Success
    const [cursor, setCursor] = useState({ x: 300, y: 450, click: false, opacity: 0 }) // Start invisible at target
    // Coords: 0=Initial, 1=Click Card, 2=Wait, 3=Click Export, 4=Done
    // const [cursor, setCursor] = useState({ x: 400, y: 400, click: false })

    useEffect(() => {
        let mounted = true

        const runSequence = async () => {
            // Reset
            if (!mounted) return
            setStep(0)
            setCursor({ x: 300, y: 415, click: false, opacity: 0 }) // Init at Row Target, Hidden

            // Initial Delay - Cursor APPEARS at target
            await new Promise(r => setTimeout(r, 1000))
            if (!mounted) return
            setCursor(c => ({ ...c, opacity: 1 })) // POPUP at Row
            await new Promise(r => setTimeout(r, 800))
            if (!mounted) return

            // Step 2: Click Row
            setCursor(c => ({ ...c, click: true }))
            await new Promise(r => setTimeout(r, 300))
            if (!mounted) return
            setCursor(c => ({ ...c, click: false }))

            // Open Dialog
            setStep(1)

            // Step 3: Scroll Down (Simulate looking)
            await new Promise(r => setTimeout(r, 800))
            setScrollTo(100)
            await new Promise(r => setTimeout(r, 1500))

            // Step 4: Scroll Up
            setScrollTo(0)
            await new Promise(r => setTimeout(r, 1000))
            if (!mounted) return

            // PREPARE FOR EXPORT BUTTON JUMP
            // Hide Cursor
            setCursor(c => ({ ...c, opacity: 0 }))
            await new Promise(r => setTimeout(r, 400))
            if (!mounted) return

            // Move Cursor to Button (While Hidden)
            // Dialog Top is pt-12 (48px). Height 420. Bottom ~468.
            // Target X=750, Y=440
            setCursor({ x: 750, y: 440, click: false, opacity: 0 })
            await new Promise(r => setTimeout(r, 100))
            if (!mounted) return

            // Show Cursor (POPUP at Button)
            setCursor(c => ({ ...c, opacity: 1 }))
            await new Promise(r => setTimeout(r, 800))
            if (!mounted) return

            // Step 6: Click Export
            setCursor(c => ({ ...c, click: true }))
            await new Promise(r => setTimeout(r, 300))
            if (!mounted) return
            setCursor(c => ({ ...c, click: false }))

            // Success State
            await new Promise(r => setTimeout(r, 500))
            setStep(2)

            // Step 7: Reset Loop
            await new Promise(r => setTimeout(r, 3000))
            // Hide cursor before reset
            setCursor(c => ({ ...c, opacity: 0 }))
            if (!mounted) return
            runSequence()
        }

        runSequence()
        return () => { mounted = false }
    }, [])

    return (
        <ScaledPreview scale={0.65} className="h-full flex flex-col rounded-b-none border-b-0 shadow-sm">
            <div className="relative w-full h-full min-h-[900px]">
                {/* Background Dashboard */}
                <div className="absolute inset-0 z-0">
                    <MomsPageView />
                </div>

                {/* Dialog Overlay */}
                <AnimatePresence>
                    {step > 0 && (
                        <div className="absolute inset-0 z-10 flex items-start justify-center pt-12 pointer-events-none">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
                            />

                            {/* Centered Modal Dialog */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                                className="bg-background border border-border rounded-xl shadow-2xl w-[90%] max-w-[500px] h-[420px] relative z-20 flex flex-col overflow-hidden pointer-events-auto"
                            >
                                {step === 1 ? (
                                    <div className="flex flex-col h-full">
                                        {/* Dialog Header */}
                                        <div className="px-6 py-4 flex items-center justify-between bg-card/50">
                                            <h3 className="font-semibold">Momsdeklaration Q4</h3>
                                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                                            </div>
                                        </div>

                                        {/* Scrollable Content */}
                                        <div className="flex-1 overflow-hidden relative">
                                            <motion.div
                                                animate={{ y: -scrollTo }}
                                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                                className="p-6 space-y-6"
                                            >
                                                {/* File Download Preview Content */}
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

                                        {/* Dialog Footer with Action */}
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
                                            className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center"
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

                {/* Cursor Overlay - Topmost Z */}
                <Cursor x={cursor.x} y={cursor.y} click={cursor.click} opacity={cursor.opacity} />
            </div>
        </ScaledPreview>
    )
}

// ===== PREVIEW 1: KVITTON - exact match of receipts page structure =====
function ReceiptsPreview() {
    // Mock data matching what the real component displays
    const mockReceipts = [
        { id: 1, supplier: "Taxi Stockholm AB", date: "2026-01-03", category: "Resekostnad", amount: "495 kr", status: "Bokförd" },
        { id: 2, supplier: "Kontorsmaterial AB", date: "2026-01-02", category: "Förbrukning", amount: "1 250 kr", status: "Att bokföra" },
        { id: 3, supplier: "Amazon Web Services", date: "2026-01-01", category: "IT & Licenser", amount: "2 340 kr", status: "Väntar" }
    ]

    return (
        <ScaledPreview scale={0.65}>
            <div className="p-6 space-y-6 max-w-6xl">
                {/* Page Heading - matches real component */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Kvitton & underlag</h2>
                        <p className="text-muted-foreground">Hantera kvitton och underlag för bokföring.</p>
                    </div>
                </div>

                {/* Stats Cards - exact StatCardGrid with 4 columns like real component */}
                <StatCardGrid columns={4}>
                    <StatCard
                        label="Totalt antal"
                        value="24"
                        subtitle="Alla underlag"
                        headerIcon={FileText}
                    />
                    <StatCard
                        label="Matchade"
                        value="18"
                        subtitle="Kopplade till transaktion"
                        headerIcon={Link2}
                        changeType="positive"
                    />
                    <StatCard
                        label="Omatchade"
                        value="6"
                        subtitle="Kräver uppmärksamhet"
                        headerIcon={Clock}
                        changeType="negative"
                    />
                    <StatCard
                        label="Totalt belopp"
                        value="45 230 kr"
                        headerIcon={Banknote}
                    />
                </StatCardGrid>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                {/* Sub-header with title */}
                <div className="flex items-center justify-between py-1">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Alla underlag</h3>
                </div>

                {/* GridTable Header - exact match */}
                <GridTableHeader
                    columns={[
                        { label: "Leverantör", icon: Building2, span: 3 },
                        { label: "Datum", icon: Calendar, span: 2 },
                        { label: "Kategori", icon: Tag, span: 2 },
                        { label: "Belopp", icon: Banknote, span: 2, align: "right" },
                        { label: "Status", icon: CheckCircle2, span: 2, align: "center" },
                    ]}
                    trailing={
                        <div className="flex items-center justify-end gap-3">
                            <Paperclip className="h-3 w-3" />
                        </div>
                    }
                />

                {/* GridTable Rows - exact structure */}
                <GridTableRows>
                    {mockReceipts.map((receipt) => (
                        <GridTableRow key={receipt.id}>
                            <div style={{ gridColumn: 'span 3' }} className="font-medium truncate">
                                {receipt.supplier}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground text-sm">
                                {receipt.date}
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-muted/50 text-foreground">
                                    {receipt.category}
                                </span>
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums font-medium">
                                {receipt.amount}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="flex justify-center">
                                <PreviewStatusBadge
                                    status={receipt.status}
                                    variant={receipt.status === "Bokförd" ? "success" : receipt.status === "Att bokföra" ? "warning" : "neutral"}
                                />
                            </div>
                            <div style={{ gridColumn: 'span 1' }} className="flex items-center justify-end gap-2">
                                <div className="text-muted-foreground bg-muted p-1 rounded-sm">
                                    <Paperclip className="h-3 w-3" />
                                </div>
                            </div>
                        </GridTableRow>
                    ))}
                </GridTableRows>
            </div>
        </ScaledPreview>
    )
}



// ===== PREVIEW 3: LÖNEKÖRNING - exact match of payroll page structure =====
function PayrollPreview() {
    // Mock data matching real component
    const mockPayslips = [
        { id: 1, employee: "Anna Andersson", period: "Jan 2026", grossSalary: 42000, tax: 12600, netSalary: 29400, status: "Skickad" },
        { id: 2, employee: "Erik Eriksson", period: "Jan 2026", grossSalary: 38000, tax: 11400, netSalary: 26600, status: "Skickad" },
        { id: 3, employee: "Maria Månsson", period: "Jan 2026", grossSalary: 46000, tax: 13800, netSalary: 32200, status: "Väntar" }
    ]
    return (
        <div className="w-full bg-background h-full flex flex-col">
            {/* Window controls - manually added since we removed ScaledPreview */}
            <div className="flex gap-1.5 px-4 pt-4 pb-2 border-b border-border/40">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
            </div>

            <div className="px-6 pt-6 pb-2">
                {/* Sub-header & Search - Horizontal Layout */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Lönespecifikationer</h3>

                    {/* Non-functional Search Bar - pushed right to be cut off */}
                    <div className="relative w-48 opacity-60 pointer-events-none select-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <div className="w-full h-8 pl-9 pr-4 rounded-md border border-input bg-muted/20 text-xs flex items-center text-muted-foreground">
                            Sök anställd...
                        </div>
                    </div>
                </div>

                {/* GridTable Header */}
                <GridTableHeader
                    columns={[
                        { label: "Anställd", icon: User, span: 3 },
                        { label: "Period", icon: Calendar, span: 2 },
                        { label: "Bruttolön", icon: Banknote, span: 2, align: 'right' },
                        { label: "Skatt", icon: Banknote, span: 2, align: 'right' },
                        { label: "Nettolön", icon: Wallet, span: 2, align: 'right' },
                        { label: "Status", icon: CheckCircle2, span: 1 },
                    ]}
                />

                {/* GridTable Rows */}
                <GridTableRows>
                    {mockPayslips.map((slip) => (
                        <GridTableRow key={slip.id}>
                            <div className="col-span-3 font-medium text-sm text-foreground whitespace-nowrap overflow-hidden text-ellipsis">{slip.employee}</div>
                            <div className="col-span-2 text-sm text-muted-foreground whitespace-nowrap">{slip.period}</div>
                            <div className="col-span-2 text-right tabular-nums text-foreground/90 whitespace-nowrap">
                                {slip.grossSalary.toLocaleString("sv-SE")} kr
                            </div>
                            <div className="col-span-2 text-right tabular-nums text-red-600 dark:text-red-500/70 whitespace-nowrap">
                                -{slip.tax.toLocaleString("sv-SE")} kr
                            </div>
                            <div className="col-span-2 text-right tabular-nums font-medium text-foreground whitespace-nowrap">
                                {slip.netSalary.toLocaleString("sv-SE")} kr
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <PreviewStatusBadge
                                    status={slip.status}
                                    variant={slip.status === "Skickad" ? "success" : "warning"}
                                />
                            </div>
                        </GridTableRow>
                    ))}
                </GridTableRows>
            </div>
        </div>
    )
}

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
        <section className="px-3 md:px-4 py-12 max-w-[2400px] mx-auto">
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
                                            <div className="absolute top-0 left-[12%] right-[-50%] h-full bg-muted/20 border-t border-l border-border rounded-tl-2xl z-0" />
                                            {/* Tab 2 (Middle) */}
                                            <div className="absolute top-4 left-[6%] right-[-55%] h-full bg-muted/40 border-t border-l border-border rounded-tl-2xl z-0" />

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
