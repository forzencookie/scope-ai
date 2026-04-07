"use client"

/**
 * Test page: Verifikationer (Ledger entries)
 *
 * Data display: stats + grid of verification entries.
 * Each verification shows: ver.nr, date, description, debit/credit totals, status indicators.
 * Filterable by account class (1xxx Tillgångar, 2xxx Skulder, etc.)
 */

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    Search,
    Hash,
    FileCheck,
    AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) {
    return n.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type VerStatus = "Komplett" | "Underlag saknas" | "Obalanserad"

const STATUS_STYLE: Record<VerStatus, string> = {
    "Komplett": "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    "Underlag saknas": "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
    "Obalanserad": "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400",
}

const ACCOUNT_CLASSES = [
    { key: "all", label: "Alla" },
    { key: "1", label: "1 Tillgångar" },
    { key: "2", label: "2 Skulder" },
    { key: "3", label: "3 Intäkter" },
    { key: "4-7", label: "4-7 Kostnader" },
    { key: "8", label: "8 Finansiellt" },
]

interface VerRow {
    account: string
    description: string
    debit: number
    credit: number
}

const VERIFICATIONS: Array<{
    id: string
    verNr: string
    date: string
    description: string
    rows: VerRow[]
    status: VerStatus
}> = [
    {
        id: "v1", verNr: "A-48", date: "2026-03-28", description: "Kjell & Company — Kontorsmaterial",
        rows: [
            { account: "6110", description: "Kontorsmaterial", debit: 1999, credit: 0 },
            { account: "2641", description: "Ingående moms 25%", debit: 500, credit: 0 },
            { account: "1930", description: "Företagskonto", debit: 0, credit: 2499 },
        ],
        status: "Komplett",
    },
    {
        id: "v2", verNr: "A-47", date: "2026-03-22", description: "Postnord — Porto",
        rows: [
            { account: "6250", description: "Porto", debit: 71, credit: 0 },
            { account: "2641", description: "Ingående moms 25%", debit: 18, credit: 0 },
            { account: "1930", description: "Företagskonto", debit: 0, credit: 89 },
        ],
        status: "Komplett",
    },
    {
        id: "v3", verNr: "A-46", date: "2026-03-25", description: "Acme Consulting — Konsultarvode",
        rows: [
            { account: "1930", description: "Företagskonto", debit: 45000, credit: 0 },
            { account: "3010", description: "Försäljning tjänster", debit: 0, credit: 36000 },
            { account: "2611", description: "Utgående moms 25%", debit: 0, credit: 9000 },
        ],
        status: "Komplett",
    },
    {
        id: "v4", verNr: "A-45", date: "2026-03-20", description: "Friskvård Q1 — Gym",
        rows: [
            { account: "7690", description: "Friskvård", debit: 1500, credit: 0 },
            { account: "1930", description: "Företagskonto", debit: 0, credit: 1500 },
        ],
        status: "Underlag saknas",
    },
    {
        id: "v5", verNr: "A-44", date: "2026-03-15", description: "Felaktig bokning — kontorshyra",
        rows: [
            { account: "5010", description: "Lokalhyra", debit: 8500, credit: 0 },
            { account: "1930", description: "Företagskonto", debit: 0, credit: 8400 },
        ],
        status: "Obalanserad",
    },
    {
        id: "v6", verNr: "A-43", date: "2026-03-10", description: "Kontorshyra april",
        rows: [
            { account: "5010", description: "Lokalhyra", debit: 8500, credit: 0 },
            { account: "1930", description: "Företagskonto", debit: 0, credit: 8500 },
        ],
        status: "Komplett",
    },
]

export default function TestVerifikationerPage() {
    const [search, setSearch] = useState("")
    const [classFilter, setClassFilter] = useState("all")
    const [expanded, setExpanded] = useState<string | null>(null)

    const filtered = VERIFICATIONS.filter(v => {
        if (search && !v.description.toLowerCase().includes(search.toLowerCase()) && !v.verNr.toLowerCase().includes(search.toLowerCase())) return false
        if (classFilter !== "all") {
            const hasClass = v.rows.some(r => {
                const first = r.account[0]
                if (classFilter === "4-7") return ["4", "5", "6", "7"].includes(first)
                return first === classFilter
            })
            if (!hasClass) return false
        }
        return true
    })

    const totalVerifications = VERIFICATIONS.length
    const completeCount = VERIFICATIONS.filter(v => v.status === "Komplett").length
    const issueCount = VERIFICATIONS.filter(v => v.status !== "Komplett").length

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <Link href="/test-ui/read-only" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Read Only UIs
                </Link>

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Verifikationer</h1>
                    <p className="text-sm text-muted-foreground mt-1">Alla bokförda verifikationer med debet/kredit-detaljer.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Totalt", value: String(totalVerifications), icon: Hash, iconBg: "bg-blue-50 dark:bg-blue-950", iconColor: "text-blue-600 dark:text-blue-400", gradient: "from-blue-50/60 to-zinc-50 dark:from-blue-950/30 dark:to-zinc-950/40" },
                        { label: "Kompletta", value: String(completeCount), icon: FileCheck, iconBg: "bg-emerald-50 dark:bg-emerald-950", iconColor: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-50/60 to-zinc-50 dark:from-emerald-950/30 dark:to-zinc-950/40" },
                        { label: "Problem", value: String(issueCount), icon: AlertTriangle, iconBg: "bg-amber-50 dark:bg-amber-950", iconColor: "text-amber-600 dark:text-amber-400", gradient: "from-amber-50/60 to-zinc-50 dark:from-amber-950/30 dark:to-zinc-950/40" },
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
                    <div className="flex items-center gap-1 border rounded-md p-0.5 overflow-x-auto">
                        {ACCOUNT_CLASSES.map(c => (
                            <button
                                key={c.key}
                                onClick={() => setClassFilter(c.key)}
                                className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap", classFilter === c.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative shrink-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Sök ver.nr eller beskrivning..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 w-56 rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Verification Grid */}
                <div className="space-y-2">
                    {filtered.map((ver) => {
                        const totalDebit = ver.rows.reduce((s, r) => s + r.debit, 0)
                        const totalCredit = ver.rows.reduce((s, r) => s + r.credit, 0)
                        const isExpanded = expanded === ver.id

                        return (
                            <div key={ver.id} className="rounded-lg border hover:bg-muted/30 transition-colors">
                                <button
                                    onClick={() => setExpanded(isExpanded ? null : ver.id)}
                                    className="w-full grid grid-cols-[60px_1fr_100px_100px_100px] gap-2 px-3 py-3 items-center text-left"
                                >
                                    <span className="text-xs font-mono font-bold">{ver.verNr}</span>
                                    <div>
                                        <p className="text-sm font-medium truncate">{ver.description}</p>
                                        <p className="text-xs text-muted-foreground">{ver.date}</p>
                                    </div>
                                    <p className="text-xs tabular-nums text-right">{fmt(totalDebit)}</p>
                                    <p className="text-xs tabular-nums text-right">{fmt(totalCredit)}</p>
                                    <div className="flex justify-end">
                                        <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", STATUS_STYLE[ver.status])}>
                                            {ver.status}
                                        </span>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-3 pb-3 pt-0">
                                        <div className="border-t pt-2 space-y-1">
                                            <div className="grid grid-cols-[60px_1fr_100px_100px] gap-2 text-xs font-medium text-muted-foreground px-1">
                                                <span>Konto</span>
                                                <span>Beskrivning</span>
                                                <span className="text-right">Debet</span>
                                                <span className="text-right">Kredit</span>
                                            </div>
                                            {ver.rows.map((row, ri) => (
                                                <div key={ri} className="grid grid-cols-[60px_1fr_100px_100px] gap-2 px-1 py-1 text-sm">
                                                    <span className="font-mono text-xs tabular-nums">{row.account}</span>
                                                    <span className="text-xs text-muted-foreground">{row.description}</span>
                                                    <span className="text-right font-mono text-xs tabular-nums">{row.debit ? fmt(row.debit) : ""}</span>
                                                    <span className="text-right font-mono text-xs tabular-nums">{row.credit ? fmt(row.credit) : ""}</span>
                                                </div>
                                            ))}
                                            <div className="grid grid-cols-[60px_1fr_100px_100px] gap-2 px-1 pt-1 border-t text-xs font-semibold">
                                                <span />
                                                <span>Totalt</span>
                                                <span className="text-right tabular-nums">{fmt(totalDebit)}</span>
                                                <span className="text-right tabular-nums">{fmt(totalCredit)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {filtered.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">Inga verifikationer matchar filtret.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
