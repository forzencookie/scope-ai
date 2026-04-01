"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Users, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr"
}

type PartnerType = "komplementar" | "kommanditdelagare"

const AVATAR_COLORS = [
    "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400",
    "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-300",
    "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400",
    "bg-violet-50 dark:bg-violet-900/30 text-violet-500 dark:text-violet-300",
    "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400",
    "bg-purple-50 dark:bg-purple-900/30 text-purple-500 dark:text-purple-300",
]

const PIE_COLORS = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"]

const PARTNERS = [
    {
        id: "p1", name: "Erik Lindström", pno: "810412-XXXX", type: "komplementar" as PartnerType,
        share: 35, profitShare: 35, kapitalkonto: 312000, registeredAt: "2019-04-01",
        address: "Storgatan 12, Stockholm", email: "erik@example.se",
    },
    {
        id: "p2", name: "Sara Johansson", pno: "880920-XXXX", type: "komplementar" as PartnerType,
        share: 25, profitShare: 25, kapitalkonto: 198000, registeredAt: "2019-04-01",
        address: "Björkvägen 5, Göteborg", email: "sara@example.se",
    },
    {
        id: "p3", name: "Investera Mer AB", pno: "559012-3456", type: "kommanditdelagare" as PartnerType,
        share: 20, profitShare: 20, kapitalkonto: 150000, registeredAt: "2021-06-15",
        address: "Kungsgatan 44, Stockholm", email: "info@investeramer.se",
    },
    {
        id: "p4", name: "Nils Andersson", pno: "750305-XXXX", type: "kommanditdelagare" as PartnerType,
        share: 12, profitShare: 12, kapitalkonto: 85000, registeredAt: "2022-01-10",
        address: "Ekvägen 8, Malmö", email: "nils@example.se",
    },
    {
        id: "p5", name: "Lena Pettersson", pno: "920718-XXXX", type: "komplementar" as PartnerType,
        share: 8, profitShare: 8, kapitalkonto: 62000, registeredAt: "2023-03-20",
        address: "Vasagatan 3, Uppsala", email: "lena@example.se",
    },
]

const TYPE_LABEL: Record<PartnerType, string> = {
    komplementar: "Komplementär",
    kommanditdelagare: "Kommanditdelägare",
}

const TYPE_BADGE: Record<PartnerType, string> = {
    komplementar: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
    kommanditdelagare: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
}

export default function TestDelagarePage() {
    const [search, setSearch] = useState("")
    const [selected, setSelected] = useState<string | null>(null)

    const filtered = PARTNERS.filter(p =>
        !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.pno.includes(search)
    )

    const totalKapital = PARTNERS.reduce((a, p) => a + p.kapitalkonto, 0)

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

                <Link href="/test-ui" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Alla test-sidor
                </Link>

                <div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full mb-2">
                        Ägare & Styrning · HB
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight">Delägare</h1>
                    <p className="text-sm text-muted-foreground mt-1">Ägarregister och kapitalkonton för handelsbolaget.</p>
                </div>


                {/* Ownership visual */}
                <div className="bg-muted/30 rounded-2xl p-5 space-y-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ägarfördelning & Kapitalkonton</p>
                    <div className="flex items-center gap-8">
                        {/* Pie chart */}
                        <div className="shrink-0">
                            <div
                                className="h-28 w-28 rounded-full"
                                style={{
                                    background: `conic-gradient(${PARTNERS.map((p, i) => {
                                        const start = PARTNERS.slice(0, i).reduce((a, pp) => a + pp.share, 0)
                                        const end = start + p.share
                                        return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${end}%`
                                    }).join(", ")})`,
                                }}
                            />
                        </div>
                        {/* Legend */}
                        <div className="flex-1 space-y-3">
                            {PARTNERS.map((p, i) => (
                                <div key={p.id} className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{p.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{p.share}% ägarandel</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold tabular-nums">{fmt(p.kapitalkonto)}</p>
                                        <p className="text-[10px] text-muted-foreground">Kapitalkonto</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Sök delägare..."
                        className="w-full pl-8 pr-3 h-9 rounded-xl border border-border/60 bg-muted/20 text-xs focus:outline-none focus:border-border transition-all"
                    />
                </div>

                {/* Partner rows */}
                <div className="space-y-1.5">
                    {filtered.map((p, i) => {
                        const isExpanded = selected === p.id
                        return (
                        <div key={p.id} className={cn(
                            "rounded-xl overflow-hidden border transition-all",
                            isExpanded ? "border-border/50 shadow-sm" : "border-transparent"
                        )}>
                            <button
                                onClick={() => setSelected(isExpanded ? null : p.id)}
                                className={cn("w-full flex items-center gap-4 py-4 text-left transition-all px-3 group", !isExpanded && "hover:bg-muted/30")}
                            >
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-transform group-hover:scale-105",
                                    AVATAR_COLORS[i % AVATAR_COLORS.length]
                                )}>
                                    {p.name.split(" ").map(n => n[0]).join("")}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">{p.name}</p>
                                        <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", TYPE_BADGE[p.type])}>
                                            {TYPE_LABEL[p.type]}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-mono">{p.pno}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold tabular-nums">{fmt(p.kapitalkonto)}</p>
                                    <p className="text-[10px] text-muted-foreground">Kapitalkonto</p>
                                </div>
                                <div className="w-16 text-right shrink-0">
                                    <p className="text-sm font-bold" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>{p.share}%</p>
                                    <p className="text-[10px] text-muted-foreground">Ägarandel</p>
                                </div>
                                <div className="text-muted-foreground">
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </div>
                            </button>

                            {/* Expanded detail */}
                            {isExpanded && (<>
                                <div className="px-3">
                                    <div className="border-t border-border/30 ml-[2.75rem] mr-6" />
                                </div>
                                <div className="px-4 py-4 grid grid-cols-2 gap-x-8 gap-y-3">
                                    {[
                                        { label: "Typ", value: TYPE_LABEL[p.type], accent: true },
                                        { label: "Vinstfördelning", value: `${p.profitShare}%`, accent: false },
                                        { label: "Registrerad", value: p.registeredAt, accent: false },
                                        { label: "E-post", value: p.email, accent: false },
                                        { label: "Adress", value: p.address, accent: false },
                                    ].map(row => (
                                        <div key={row.label}>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{row.label}</p>
                                            <p className={cn("text-sm mt-0.5", row.accent && "font-medium")}>{row.value}</p>
                                        </div>
                                    ))}
                                    <div className="col-span-2 pt-2">
                                        <button className="h-8 px-3.5 rounded-lg bg-foreground text-background text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Fråga Scooby om {p.name.split(" ")[0]}
                                        </button>
                                    </div>
                                </div>
                            </>)}
                        </div>
                        )
                    })}
                </div>

            </div>
        </div>
    )
}
