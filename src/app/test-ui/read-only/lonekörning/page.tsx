"use client"

/**
 * Test page: Lönekörning (Payslips)
 *
 * Data display: stats + table of payslips per employee/period.
 * Statuses: Utkast (neutral), Godkänd (warning/amber), Skickad (success).
 */

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    Search,
    Coins,
    Users,
    FileCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })
}

type PayslipStatus = "Utkast" | "Godkänd" | "Skickad"

const STATUS_STYLE: Record<PayslipStatus, string> = {
    "Utkast": "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
    "Godkänd": "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
    "Skickad": "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
}

const ALL_STATUSES: PayslipStatus[] = ["Utkast", "Godkänd", "Skickad"]

const PAYSLIPS = [
    { id: "p1", employee: "Anna Lindberg", period: "Mars 2026", gross: 42000, tax: 12860, net: 29140, employer: 13196, status: "Skickad" as PayslipStatus },
    { id: "p2", employee: "Johan Berg", period: "Mars 2026", gross: 38000, tax: 11628, net: 26372, employer: 11940, status: "Skickad" as PayslipStatus },
    { id: "p3", employee: "Maria Svensson", period: "Mars 2026", gross: 45000, tax: 13770, net: 31230, employer: 14139, status: "Godkänd" as PayslipStatus },
    { id: "p4", employee: "Anna Lindberg", period: "Februari 2026", gross: 42000, tax: 12860, net: 29140, employer: 13196, status: "Skickad" as PayslipStatus },
    { id: "p5", employee: "Johan Berg", period: "Februari 2026", gross: 38000, tax: 11628, net: 26372, employer: 11940, status: "Skickad" as PayslipStatus },
    { id: "p6", employee: "Maria Svensson", period: "Februari 2026", gross: 45000, tax: 13770, net: 31230, employer: 14139, status: "Skickad" as PayslipStatus },
    { id: "p7", employee: "Anna Lindberg", period: "April 2026", gross: 42000, tax: 12860, net: 29140, employer: 13196, status: "Utkast" as PayslipStatus },
    { id: "p8", employee: "Johan Berg", period: "April 2026", gross: 38000, tax: 11628, net: 26372, employer: 11940, status: "Utkast" as PayslipStatus },
]

export default function TestLonekörningPage() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<PayslipStatus | null>(null)

    const filtered = PAYSLIPS.filter(p => {
        if (statusFilter && p.status !== statusFilter) return false
        if (search && !p.employee.toLowerCase().includes(search.toLowerCase()) && !p.period.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    const totalGross = PAYSLIPS.filter(p => p.period === "Mars 2026").reduce((s, p) => s + p.gross, 0)
    const totalNet = PAYSLIPS.filter(p => p.period === "Mars 2026").reduce((s, p) => s + p.net, 0)
    const totalEmployer = PAYSLIPS.filter(p => p.period === "Mars 2026").reduce((s, p) => s + p.employer, 0)

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <Link href="/test-ui/read-only" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Read Only UIs
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Lönekörning</h1>
                    <p className="text-sm text-muted-foreground mt-1">Lönebesked per anställd och period.</p>
                </div>

                {/* Stats — current period */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Bruttolön mars", value: fmt(totalGross) + " kr", icon: Coins, iconBg: "bg-blue-50 dark:bg-blue-950", iconColor: "text-blue-600 dark:text-blue-400", gradient: "from-blue-50/60 to-zinc-50 dark:from-blue-950/30 dark:to-zinc-950/40" },
                        { label: "Nettolön mars", value: fmt(totalNet) + " kr", icon: Users, iconBg: "bg-emerald-50 dark:bg-emerald-950", iconColor: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-50/60 to-zinc-50 dark:from-emerald-950/30 dark:to-zinc-950/40" },
                        { label: "Arb.givaravgift mars", value: fmt(totalEmployer) + " kr", icon: FileCheck, iconBg: "bg-amber-50 dark:bg-amber-950", iconColor: "text-amber-600 dark:text-amber-400", gradient: "from-amber-50/60 to-zinc-50 dark:from-amber-950/30 dark:to-zinc-950/40" },
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

                <div className="border-b-2 border-border/60" />

                {/* Filters */}
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Alla lönebesked</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input type="text" placeholder="Sök..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="h-8 w-48 rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="flex items-center gap-1 border rounded-md p-0.5">
                            <button onClick={() => setStatusFilter(null)} className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors", !statusFilter ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>Alla</button>
                            {ALL_STATUSES.map(s => (
                                <button key={s} onClick={() => setStatusFilter(statusFilter === s ? null : s)} className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors", statusFilter === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>{s}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="space-y-1">
                    <div className="grid grid-cols-[1fr_100px_90px_90px_80px_80px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                        <span>Anställd</span>
                        <span>Period</span>
                        <span className="text-right">Brutto</span>
                        <span className="text-right">Skatt</span>
                        <span className="text-right">Netto</span>
                        <span className="text-right">Status</span>
                    </div>

                    {filtered.map((p) => (
                        <div key={p.id} className="grid grid-cols-[1fr_100px_90px_90px_80px_80px] gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer items-center">
                            <p className="text-sm font-medium">{p.employee}</p>
                            <p className="text-xs text-muted-foreground">{p.period}</p>
                            <p className="text-sm tabular-nums text-right">{fmt(p.gross)}</p>
                            <p className="text-xs tabular-nums text-right text-muted-foreground">{fmt(p.tax)}</p>
                            <p className="text-sm font-semibold tabular-nums text-right">{fmt(p.net)}</p>
                            <div className="flex justify-end">
                                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", STATUS_STYLE[p.status])}>{p.status}</span>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">Inga lönebesked matchar filtret.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
