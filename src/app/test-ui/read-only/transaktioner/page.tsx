"use client"

/**
 * Test page: Transaktioner (Transactions)
 *
 * Data display: stats + filterable table with status badges.
 * Statuses: Obokförd (warning), Bokförd (success), Ignorerad (neutral).
 * Clicking a booked row opens a detail overlay.
 */

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    Search,
    TrendingUp,
    TrendingDown,
    Hash,
    Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })
}

type TxStatus = "Obokförd" | "Bokförd" | "Ignorerad"

const STATUS_STYLE: Record<TxStatus, string> = {
    "Obokförd": "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
    "Bokförd": "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    "Ignorerad": "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
}

const TRANSACTIONS = [
    { id: "t1", date: "2026-03-28", description: "Kjell & Company — Kontorsmaterial", amount: -2499, account: "6110", status: "Bokförd" as TxStatus, verNr: "A-48" },
    { id: "t2", date: "2026-03-25", description: "Acme Consulting AB — Konsultarvode", amount: 45000, account: "3010", status: "Bokförd" as TxStatus, verNr: "A-46" },
    { id: "t3", date: "2026-03-22", description: "Postnord — Porto", amount: -89, account: "6250", status: "Bokförd" as TxStatus, verNr: "A-47" },
    { id: "t4", date: "2026-03-20", description: "AWS — Serverhosting", amount: -4200, account: "6540", status: "Obokförd" as TxStatus, verNr: null },
    { id: "t5", date: "2026-03-18", description: "Webhallen — Datorutrustning", amount: -12900, account: "1250", status: "Obokförd" as TxStatus, verNr: null },
    { id: "t6", date: "2026-03-15", description: "Kund AB — Betalning faktura #2026-039", amount: 15000, account: "1930", status: "Bokförd" as TxStatus, verNr: "A-44" },
    { id: "t7", date: "2026-03-12", description: "Spotify — Företagsabonnemang", amount: -169, account: null, status: "Ignorerad" as TxStatus, verNr: null },
    { id: "t8", date: "2026-03-10", description: "Kontorshyra april", amount: -8500, account: "5010", status: "Bokförd" as TxStatus, verNr: "A-41" },
    { id: "t9", date: "2026-03-05", description: "Friskvård Q1 — Gym", amount: -1500, account: "7690", status: "Obokförd" as TxStatus, verNr: null },
    { id: "t10", date: "2026-03-01", description: "Ränteintäkt företagskonto", amount: 342, account: "8310", status: "Bokförd" as TxStatus, verNr: "A-39" },
]

const ALL_STATUSES: TxStatus[] = ["Obokförd", "Bokförd", "Ignorerad"]

export default function TestTransaktionerPage() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<TxStatus | null>(null)

    const filtered = TRANSACTIONS.filter(t => {
        if (statusFilter && t.status !== statusFilter) return false
        if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    const income = TRANSACTIONS.filter(t => t.amount > 0 && t.status === "Bokförd").reduce((s, t) => s + t.amount, 0)
    const expenses = TRANSACTIONS.filter(t => t.amount < 0 && t.status === "Bokförd").reduce((s, t) => s + Math.abs(t.amount), 0)
    const unbooked = TRANSACTIONS.filter(t => t.status === "Obokförd").length

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <Link href="/test-ui/read-only" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Read Only UIs
                </Link>

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Transaktioner</h1>
                    <p className="text-sm text-muted-foreground mt-1">Alla transaktioner — bokförda, obokförda och ignorerade.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Intäkter", value: fmt(income) + " kr", icon: TrendingUp, iconBg: "bg-emerald-50 dark:bg-emerald-950", iconColor: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-50/60 to-zinc-50 dark:from-emerald-950/30 dark:to-zinc-950/40" },
                        { label: "Kostnader", value: fmt(expenses) + " kr", icon: TrendingDown, iconBg: "bg-red-50 dark:bg-red-950", iconColor: "text-red-600 dark:text-red-400", gradient: "from-red-50/60 to-zinc-50 dark:from-red-950/30 dark:to-zinc-950/40" },
                        { label: "Obokförda", value: String(unbooked), icon: Hash, iconBg: "bg-amber-50 dark:bg-amber-950", iconColor: "text-amber-600 dark:text-amber-400", gradient: "from-amber-50/60 to-zinc-50 dark:from-amber-950/30 dark:to-zinc-950/40" },
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

                {/* Filters */}
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Alla transaktioner</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Sök..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8 w-48 rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="flex items-center gap-1 border rounded-md p-0.5">
                            <button
                                onClick={() => setStatusFilter(null)}
                                className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors", !statusFilter ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                            >
                                Alla
                            </button>
                            {ALL_STATUSES.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                                    className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors", statusFilter === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="space-y-1">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_100px_80px_70px_90px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                        <span>Beskrivning</span>
                        <span className="text-right">Belopp</span>
                        <span>Konto</span>
                        <span>Ver.nr</span>
                        <span className="text-right">Status</span>
                    </div>

                    {filtered.map((tx) => (
                        <div
                            key={tx.id}
                            className="grid grid-cols-[1fr_100px_80px_70px_90px] gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer items-center"
                        >
                            <div>
                                <p className="text-sm font-medium truncate">{tx.description}</p>
                                <p className="text-xs text-muted-foreground">{tx.date}</p>
                            </div>
                            <p className={cn("text-sm font-semibold tabular-nums text-right", tx.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "")}>
                                {tx.amount > 0 ? "+" : ""}{fmt(tx.amount)} kr
                            </p>
                            <p className="text-xs font-mono tabular-nums text-muted-foreground">{tx.account || "—"}</p>
                            <p className="text-xs font-mono tabular-nums text-muted-foreground">{tx.verNr || "—"}</p>
                            <div className="flex justify-end">
                                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", STATUS_STYLE[tx.status])}>
                                    {tx.status}
                                </span>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">Inga transaktioner matchar filtret.</p>
                    )}
                </div>

                {/* Pagination mock */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <span>Visar {filtered.length} av {TRANSACTIONS.length} transaktioner</span>
                    <span>Sida 1 av 1</span>
                </div>
            </div>
        </div>
    )
}
