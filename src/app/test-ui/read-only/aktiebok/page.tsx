"use client"

/**
 * Test page: Aktiebok (share register)
 *
 * Data display: stats + shareholders table + event history.
 * No pie charts — doesn't scale with many shareholders.
 */

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    Search,
    Users,
    BarChart3,
    Landmark,
    FileText,
    User,
    Hash,
    Layers,
    Percent,
    Vote,
} from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })
}

const ROLE_COLORS: Record<string, string> = {
    "VD": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "Firmatecknare": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "Styrelseordförande": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    "Styrelseledamot": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "Suppleant": "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    "Revisor": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
}

const SHAREHOLDERS = [
    { id: "s1", name: "Erik Lindström", pno: "810412-XXXX", shares: 600, shareClass: "A", votes: 60, ownership: 60, acquisitionDate: "2019-04-01", roles: ["VD", "Firmatecknare"] },
    { id: "s2", name: "Sara Johansson", pno: "880920-XXXX", shares: 300, shareClass: "A", votes: 30, ownership: 30, acquisitionDate: "2019-04-01", roles: ["Styrelseledamot"] },
    { id: "s3", name: "Investerings AB", pno: "556234-1234", shares: 100, shareClass: "B", votes: 10, ownership: 10, acquisitionDate: "2023-06-15", roles: [] },
]

const TOTAL_SHARES = SHAREHOLDERS.reduce((a, s) => a + s.shares, 0)
const SHARE_CAPITAL = 100000

const EVENTS = [
    { id: "e1", date: "2023-06-15", event: "Aktieöverlåtelse", detail: "100 B-aktier överlåtna till Investerings AB, kurs 500 kr/st" },
    { id: "e2", date: "2022-01-10", event: "Nyemission", detail: "100 B-aktier emitterade, kurs 500 kr/st, totalt 50 000 kr" },
    { id: "e3", date: "2019-04-01", event: "Bolagsbildning", detail: "1 000 A-aktier, 100 000 kr aktiekapital" },
]

export default function TestAktiebokPage() {
    const [search, setSearch] = useState("")

    const filtered = SHAREHOLDERS.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.pno.includes(search)
    )

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <Link href="/test-ui" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Alla test-sidor
                </Link>

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Aktiebok</h1>
                    <p className="text-sm text-muted-foreground mt-1">Aktieägare, aktieinnehav och händelser.</p>
                </div>

                {/* Stats — 3 cards */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        {
                            label: "Aktiekapital",
                            value: fmt(SHARE_CAPITAL) + " kr",
                            icon: Landmark,
                            iconBg: "bg-blue-50 dark:bg-blue-950",
                            iconColor: "text-blue-600 dark:text-blue-400",
                            gradient: "from-blue-50/60 to-zinc-50 dark:from-blue-950/30 dark:to-zinc-950/40",
                        },
                        {
                            label: "Antal aktier",
                            value: fmt(TOTAL_SHARES),
                            icon: BarChart3,
                            iconBg: "bg-emerald-50 dark:bg-emerald-950",
                            iconColor: "text-emerald-600 dark:text-emerald-400",
                            gradient: "from-emerald-50/60 to-zinc-50 dark:from-emerald-950/30 dark:to-zinc-950/40",
                        },
                        {
                            label: "Aktieägare",
                            value: String(SHAREHOLDERS.length),
                            icon: Users,
                            iconBg: "bg-violet-50 dark:bg-violet-950",
                            iconColor: "text-violet-600 dark:text-violet-400",
                            gradient: "from-violet-50/60 to-zinc-50 dark:from-violet-950/30 dark:to-zinc-950/40",
                        },
                    ].map((s) => {
                        const Icon = s.icon
                        return (
                            <div
                                key={s.label}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-br overflow-hidden",
                                    s.gradient
                                )}
                            >
                                <div className={cn("h-9 w-9 shrink-0 rounded-xl flex items-center justify-center", s.iconBg)}>
                                    <Icon className={cn("h-4 w-4", s.iconColor)} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                                    <p className="text-lg font-bold tabular-nums truncate">{s.value}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Shareholders table */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">Aktieägare</h2>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Sök..."
                                className="pl-7 pr-3 h-8 w-44 rounded-lg border border-border/60 bg-transparent text-xs focus:outline-none focus:border-border transition-colors"
                            />
                        </div>
                    </div>

                    <div className="text-sm space-y-0.5">
                        {/* Header */}
                        <div className="flex bg-muted/40 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex-1 flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Namn</div>
                            <div className="w-20 text-right flex items-center justify-end gap-1.5"><Hash className="h-3.5 w-3.5" />Aktier</div>
                            <div className="w-16 text-right flex items-center justify-end gap-1.5"><Layers className="h-3.5 w-3.5" />Klass</div>
                            <div className="w-20 text-right flex items-center justify-end gap-1.5"><Percent className="h-3.5 w-3.5" />Andel</div>
                            <div className="w-20 text-right hidden sm:flex items-center justify-end gap-1.5"><Vote className="h-3.5 w-3.5" />Röster</div>
                        </div>

                        {/* Rows */}
                        {filtered.map((s) => (
                            <div
                                key={s.id}
                                className="flex items-center px-4 py-2.5 rounded-lg transition-colors hover:bg-muted/30"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium truncate">{s.name}</span>
                                        {s.roles.map(role => (
                                            <span key={role} className={cn(
                                                "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0",
                                                ROLE_COLORS[role] || "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                                            )}>
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-mono">{s.pno}</p>
                                </div>
                                <div className="w-20 text-right tabular-nums">{fmt(s.shares)}</div>
                                <div className="w-16 text-right">
                                    <span className={cn(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                                        s.shareClass === "A"
                                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    )}>
                                        {s.shareClass}
                                    </span>
                                </div>
                                <div className="w-20 text-right tabular-nums font-medium">{s.ownership}%</div>
                                <div className="w-20 text-right tabular-nums text-muted-foreground hidden sm:block">{s.votes}%</div>
                            </div>
                        ))}

                        {/* Total */}
                        <div className="flex px-4 py-2.5 border-t font-semibold mt-1">
                            <div className="flex-1">Totalt</div>
                            <div className="w-20 text-right tabular-nums">{fmt(TOTAL_SHARES)}</div>
                            <div className="w-16" />
                            <div className="w-20 text-right tabular-nums">100%</div>
                            <div className="w-20 text-right hidden sm:block">100%</div>
                        </div>
                    </div>
                </div>

                {/* Event history */}
                <div className="space-y-3">
                    <h2 className="text-base font-semibold">Händelsehistorik</h2>

                    <div className="space-y-0">
                        {EVENTS.map((e, i) => (
                            <div key={e.id} className="flex gap-4 min-h-[56px]">
                                {/* Dot + line column */}
                                <div className="flex flex-col items-center w-3 shrink-0 pt-1">
                                    <div className="h-2.5 w-2.5 rounded-full bg-foreground/70 shrink-0" />
                                    {i < EVENTS.length - 1 && (
                                        <div className="w-px flex-1 bg-border/40" />
                                    )}
                                </div>
                                {/* Content */}
                                <div className="flex items-start gap-4 flex-1 pb-4">
                                    <div className="text-[10px] text-muted-foreground tabular-nums w-20 shrink-0 font-medium pt-px">
                                        {e.date}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                                            <p className="text-xs font-semibold">{e.event}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 pl-5">{e.detail}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
