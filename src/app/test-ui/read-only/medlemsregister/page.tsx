"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Download, Check, X, Users, User, Tag, CreditCard, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

type MemberStatus = "aktiv" | "vilande" | "avslutad"
type MemberType = "ordinarie" | "stodmedlem" | "hedersmedlem"

const STATUS_META: Record<MemberStatus, { label: string; color: string; dot: string; badge: string }> = {
    aktiv: { label: "Aktiv", color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" },
    vilande: { label: "Vilande", color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" },
    avslutad: { label: "Avslutad", color: "text-muted-foreground", dot: "bg-muted-foreground", badge: "bg-muted/60 text-muted-foreground" },
}

const TYPE_BADGE: Record<MemberType, string> = {
    ordinarie: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
    stodmedlem: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
    hedersmedlem: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
}

const TYPE_LABEL: Record<MemberType, string> = {
    ordinarie: "Ordinarie",
    stodmedlem: "Stödmedlem",
    hedersmedlem: "Hedersmedlem",
}

const AVATAR_COLORS = [
    "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
    "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400",
    "bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400",
    "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",
    "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400",
    "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400",
    "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400",
    "bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400",
]

const MEMBERS = [
    { id: "1", nr: "M-001", name: "Anna Bergström", email: "anna@example.se", status: "aktiv" as MemberStatus, type: "ordinarie" as MemberType, feePaid: true, joinedAt: "2021-03-01" },
    { id: "2", nr: "M-002", name: "Carl Eriksson", email: "carl@example.se", status: "aktiv" as MemberStatus, type: "ordinarie" as MemberType, feePaid: true, joinedAt: "2021-03-01" },
    { id: "3", nr: "M-003", name: "Maria Lindqvist", email: "maria@example.se", status: "aktiv" as MemberStatus, type: "ordinarie" as MemberType, feePaid: false, joinedAt: "2022-01-15" },
    { id: "4", nr: "M-004", name: "Jonas Persson", email: "jonas@example.se", status: "vilande" as MemberStatus, type: "ordinarie" as MemberType, feePaid: false, joinedAt: "2020-05-10" },
    { id: "5", nr: "M-005", name: "Stella Holmgren", email: "stella@example.se", status: "aktiv" as MemberStatus, type: "hedersmedlem" as MemberType, feePaid: true, joinedAt: "2019-11-01" },
    { id: "6", nr: "M-006", name: "Oscar Magnusson", email: "oscar@example.se", status: "aktiv" as MemberStatus, type: "stodmedlem" as MemberType, feePaid: true, joinedAt: "2023-06-20" },
    { id: "7", nr: "M-007", name: "Frida Nilsson", email: "frida@example.se", status: "avslutad" as MemberStatus, type: "ordinarie" as MemberType, feePaid: false, joinedAt: "2020-02-28" },
    { id: "8", nr: "M-008", name: "Viktor Ström", email: "viktor@example.se", status: "aktiv" as MemberStatus, type: "ordinarie" as MemberType, feePaid: true, joinedAt: "2023-09-01" },
]

export default function TestMedlemsregisterPage() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<MemberStatus | null>(null)
    const [feeFilter, setFeeFilter] = useState<boolean | null>(null)

    const filtered = useMemo(() => MEMBERS.filter(m => {
        const q = search.toLowerCase()
        const matchSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.nr.toLowerCase().includes(q)
        const matchStatus = statusFilter === null || m.status === statusFilter
        const matchFee = feeFilter === null || m.feePaid === feeFilter
        return matchSearch && matchStatus && matchFee
    }), [search, statusFilter, feeFilter])

    const stats = {
        total: MEMBERS.length,
        aktiva: MEMBERS.filter(m => m.status === "aktiv").length,
        paid: MEMBERS.filter(m => m.feePaid).length,
        unpaid: MEMBERS.filter(m => !m.feePaid && m.status === "aktiv").length,
    }

    const paidPercent = Math.round((stats.paid / stats.total) * 100)

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <Link href="/test-ui" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />Alla test-sidor
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 rounded-full mb-2">
                            Ägare & Styrning · Förening
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight">Medlemsregister</h1>
                        <p className="text-sm text-muted-foreground mt-1">Föreningens medlemmar, roller och avgifter.</p>
                    </div>
                    <button className="h-8 px-3 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5" />Exportera
                    </button>
                </div>

                {/* Stat */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-br from-teal-50/60 to-zinc-50 dark:from-teal-950/30 dark:to-zinc-950/40 overflow-hidden">
                    <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center bg-teal-50 dark:bg-teal-950">
                        <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-muted-foreground truncate">Medlemmar</p>
                        <p className="text-xl font-bold tabular-nums">{stats.total}</p>
                    </div>
                </div>

                {/* Avgift bar */}
                <div className="bg-muted/20 rounded-xl p-4 border border-border/30 space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="font-medium">Avgiftsstatus</span>
                        <span className="tabular-nums text-muted-foreground">{stats.paid}/{stats.total} betalt ({paidPercent}%)</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                            style={{ width: `${paidPercent}%` }}
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[160px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök namn, e-post eller nr..." className="w-full pl-8 pr-3 h-9 rounded-xl border border-border/60 bg-muted/20 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/40 transition-all" />
                    </div>
                    <div className="flex gap-1.5">
                        {([null, "aktiv", "vilande", "avslutad"] as const).map(s => {
                            const isActive = statusFilter === s
                            const activeColor = s ? STATUS_META[s].badge : "bg-foreground/5 text-foreground"
                            return (
                                <button key={String(s)} onClick={() => setStatusFilter(s)} className={cn(
                                    "h-9 px-3 rounded-full text-xs font-medium transition-all border",
                                    isActive ? activeColor + " border-transparent" : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30"
                                )}>
                                    {s === null ? "Alla" : STATUS_META[s].label}
                                </button>
                            )
                        })}
                    </div>
                    <div className="flex gap-1.5">
                        {([null, true, false] as const).map(f => {
                            const isActive = feeFilter === f
                            return (
                                <button key={String(f)} onClick={() => setFeeFilter(f)} className={cn(
                                    "h-9 px-3 rounded-full text-xs font-medium transition-all border",
                                    isActive ? "bg-foreground/5 text-foreground border-foreground/20" : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30"
                                )}>
                                    {f === null ? "Avgift" : f ? "Betald" : "Ej betald"}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Table header */}
                <div>
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-2.5 px-3 bg-muted/40 rounded-xl mb-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Namn & Nr</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-24 text-center flex items-center justify-center gap-1.5"><Tag className="h-3.5 w-3.5" />Typ</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-16 text-center flex items-center justify-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Avgift</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-20 text-right flex items-center justify-end gap-1.5"><Activity className="h-3.5 w-3.5" />Status</p>
                    </div>
                    {filtered.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Inga medlemmar matchar filtret.</p>}
                    <div className="space-y-1">
                        {filtered.map((m, mi) => (
                            <div key={m.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center py-3 hover:bg-muted/30 transition-all px-3 rounded-xl cursor-pointer group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-transform group-hover:scale-105",
                                        AVATAR_COLORS[mi % AVATAR_COLORS.length]
                                    )}>
                                        {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{m.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono">{m.nr} · {m.email}</p>
                                    </div>
                                </div>
                                <div className="w-24 text-center">
                                    <span className={cn("text-[9px] font-bold uppercase px-2 py-0.5 rounded-full", TYPE_BADGE[m.type])}>
                                        {TYPE_LABEL[m.type]}
                                    </span>
                                </div>
                                <div className="w-16 flex justify-center">
                                    {m.feePaid
                                        ? <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center"><Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /></div>
                                        : <div className="h-6 w-6 rounded-full bg-muted/50 flex items-center justify-center"><X className="h-3.5 w-3.5 text-muted-foreground/40" /></div>
                                    }
                                </div>
                                <div className="w-20 flex justify-end items-center gap-1.5">
                                    <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", STATUS_META[m.status].badge)}>
                                        {STATUS_META[m.status].label}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
