"use client"

/**
 * Test page: Fakturor (Invoices)
 *
 * Data display: stats + kanban board (grouped by status).
 * Statuses: Utkast (neutral), Skickad (info/blue), Betald (success), Makulerad (neutral).
 * Supports both customer and supplier invoices via view toggle.
 */

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    FileText,
    Clock,
    CheckCircle2,
    Ban,
    ArrowUpRight,
    ArrowDownLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })
}

type InvoiceStatus = "Utkast" | "Skickad" | "Betald" | "Makulerad"
type ViewFilter = "Kundfakturor" | "Leverantörsfakturor"

const STATUS_STYLE: Record<InvoiceStatus, string> = {
    "Utkast": "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
    "Skickad": "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
    "Betald": "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    "Makulerad": "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 line-through",
}

const CUSTOMER_INVOICES = [
    { id: "f1", number: "#2026-042", customer: "Acme Consulting AB", amount: 45000, dueDate: "2026-04-15", status: "Skickad" as InvoiceStatus },
    { id: "f2", number: "#2026-041", customer: "Nordström & Partners", amount: 28500, dueDate: "2026-04-10", status: "Betald" as InvoiceStatus },
    { id: "f3", number: "#2026-040", customer: "TechVenture AB", amount: 62000, dueDate: "2026-04-20", status: "Skickad" as InvoiceStatus },
    { id: "f4", number: "#2026-039", customer: "Startup Labs", amount: 15000, dueDate: "2026-03-30", status: "Betald" as InvoiceStatus },
    { id: "f5", number: "#2026-038", customer: "Acme Consulting AB", amount: 37500, dueDate: "2026-03-25", status: "Betald" as InvoiceStatus },
    { id: "f6", number: "#2026-043", customer: "Digital Agency AB", amount: 22000, dueDate: null, status: "Utkast" as InvoiceStatus },
    { id: "f7", number: "#2026-037", customer: "Old Client AB", amount: 8500, dueDate: "2026-03-01", status: "Makulerad" as InvoiceStatus },
]

const SUPPLIER_INVOICES = [
    { id: "lf1", number: "LF-8821", customer: "Kontorshotellet AB", amount: 8500, dueDate: "2026-04-01", status: "Betald" as InvoiceStatus },
    { id: "lf2", number: "LF-8820", customer: "AWS Sweden", amount: 4200, dueDate: "2026-04-15", status: "Skickad" as InvoiceStatus },
    { id: "lf3", number: "LF-8819", customer: "Telia Företag", amount: 899, dueDate: "2026-04-10", status: "Skickad" as InvoiceStatus },
]

const COLUMNS: InvoiceStatus[] = ["Utkast", "Skickad", "Betald", "Makulerad"]

export default function TestFakturorPage() {
    const [view, setView] = useState<ViewFilter>("Kundfakturor")

    const invoices = view === "Kundfakturor" ? CUSTOMER_INVOICES : SUPPLIER_INVOICES

    const totalUnpaid = invoices.filter(i => i.status === "Skickad").reduce((s, i) => s + i.amount, 0)
    const totalPaid = invoices.filter(i => i.status === "Betald").reduce((s, i) => s + i.amount, 0)

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                <Link href="/test-ui/read-only" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Read Only UIs
                </Link>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Fakturor</h1>
                        <p className="text-sm text-muted-foreground mt-1">Kund- och leverantörsfakturor i kanban-vy.</p>
                    </div>
                    <div className="flex items-center gap-1 border rounded-md p-0.5">
                        {(["Kundfakturor", "Leverantörsfakturor"] as ViewFilter[]).map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors", view === v ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                            >
                                {v === "Kundfakturor" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Utestående", value: fmt(totalUnpaid) + " kr", icon: Clock, iconBg: "bg-blue-50 dark:bg-blue-950", iconColor: "text-blue-600 dark:text-blue-400", gradient: "from-blue-50/60 to-zinc-50 dark:from-blue-950/30 dark:to-zinc-950/40" },
                        { label: "Betalt", value: fmt(totalPaid) + " kr", icon: CheckCircle2, iconBg: "bg-emerald-50 dark:bg-emerald-950", iconColor: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-50/60 to-zinc-50 dark:from-emerald-950/30 dark:to-zinc-950/40" },
                        { label: "Antal fakturor", value: String(invoices.length), icon: FileText, iconBg: "bg-violet-50 dark:bg-violet-950", iconColor: "text-violet-600 dark:text-violet-400", gradient: "from-violet-50/60 to-zinc-50 dark:from-violet-950/30 dark:to-zinc-950/40" },
                    ].map((stat) => {
                        const Icon = stat.icon
                        return (
                            <div key={stat.label} className={cn("rounded-xl border p-4 bg-gradient-to-br", stat.gradient)}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", stat.iconBg)}>
                                        <Icon className={cn("h-3.5 w-3.5", stat.iconColor)} />
                                    </div>
                                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                                </div>
                                <p className="text-lg font-bold tabular-nums">{stat.value}</p>
                            </div>
                        )
                    })}
                </div>

                {/* Separator */}
                <div className="border-b-2 border-border/60" />

                {/* Kanban Board */}
                <div className="grid grid-cols-4 gap-4">
                    {COLUMNS.map(status => {
                        const columnInvoices = invoices.filter(i => i.status === status)
                        return (
                            <div key={status} className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", STATUS_STYLE[status])}>
                                        {status}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{columnInvoices.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {columnInvoices.map(inv => (
                                        <div key={inv.id} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-mono text-muted-foreground">{inv.number}</p>
                                            </div>
                                            <p className="text-sm font-medium truncate">{inv.customer}</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold tabular-nums">{fmt(inv.amount)} kr</p>
                                                {inv.dueDate && (
                                                    <p className="text-[10px] text-muted-foreground">{inv.dueDate}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {columnInvoices.length === 0 && (
                                        <div className="rounded-lg border border-dashed p-4 text-center">
                                            <p className="text-xs text-muted-foreground">Inga fakturor</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
