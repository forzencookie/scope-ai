"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Download, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Wallet, ChevronDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { cn } from "@/lib/utils"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui"

function fmt(n: number) {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr"
}

const AVATAR_COLORS = [
    "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400",
    "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400",
]

const chartConfig = {
    uttag: { label: "Uttag", color: "#818cf8" },
    insattning: { label: "Insättning", color: "#4f46e5" },
} satisfies ChartConfig

const PARTNERS = [
    { id: "p1", name: "Erik Lindström", initials: "EL", share: 60 },
    { id: "p2", name: "Sara Johansson", initials: "SJ", share: 40 },
]

type TxType = "uttag" | "insattning" | "lon"

const MOCK: { id: string; partnerId: string; partner: string; initials: string; type: TxType; amount: number; date: string; description: string; kapitalkonto: number }[] = [
    { id: "1", partnerId: "p1", partner: "Erik Lindström", initials: "EL", type: "uttag", amount: -45000, date: "2026-03-15", description: "Privat uttag mars", kapitalkonto: 312000 },
    { id: "2", partnerId: "p2", partner: "Sara Johansson", initials: "SJ", type: "uttag", amount: -30000, date: "2026-03-14", description: "Privat uttag mars", kapitalkonto: 198000 },
    { id: "3", partnerId: "p1", partner: "Erik Lindström", initials: "EL", type: "insattning", amount: 100000, date: "2026-02-01", description: "Kapitaltillskott", kapitalkonto: 357000 },
    { id: "4", partnerId: "p2", partner: "Sara Johansson", initials: "SJ", type: "lon", amount: -28000, date: "2026-02-28", description: "Lön februari", kapitalkonto: 228000 },
    { id: "5", partnerId: "p1", partner: "Erik Lindström", initials: "EL", type: "uttag", amount: -45000, date: "2026-02-15", description: "Privat uttag feb", kapitalkonto: 257000 },
    { id: "6", partnerId: "p2", partner: "Sara Johansson", initials: "SJ", type: "uttag", amount: -30000, date: "2026-02-14", description: "Privat uttag feb", kapitalkonto: 256000 },
    { id: "7", partnerId: "p1", partner: "Erik Lindström", initials: "EL", type: "uttag", amount: -45000, date: "2026-01-15", description: "Privat uttag jan", kapitalkonto: 302000 },
    { id: "8", partnerId: "p2", partner: "Sara Johansson", initials: "SJ", type: "insattning", amount: 50000, date: "2026-01-05", description: "Kapitaltillskott jan", kapitalkonto: 286000 },
]

const TYPE_META: Record<TxType, { label: string; color: string; bg: string; icon: typeof TrendingUp }> = {
    uttag: { label: "Uttag", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/40", icon: ArrowDownRight },
    insattning: { label: "Insättning", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/40", icon: ArrowUpRight },
    lon: { label: "Lön", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/40", icon: Wallet },
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun"]

export default function TestDelagaruttagPage() {
    const [search, setSearch] = useState("")
    const [partnerFilter, setPartnerFilter] = useState<string | null>(null)
    const [typeFilter, setTypeFilter] = useState<TxType | null>(null)

    const filtered = useMemo(() => {
        return MOCK.filter(tx => {
            const q = search.toLowerCase()
            const matchSearch = !q || tx.description.toLowerCase().includes(q) || tx.partner.toLowerCase().includes(q)
            const matchPartner = !partnerFilter || tx.partnerId === partnerFilter
            const matchType = !typeFilter || tx.type === typeFilter
            return matchSearch && matchPartner && matchType
        })
    }, [search, partnerFilter, typeFilter])

    const stats = useMemo(() => {
        const totUttak = MOCK.filter(t => t.type === "uttag" || t.type === "lon").reduce((a, t) => a + t.amount, 0)
        const totInsattning = MOCK.filter(t => t.type === "insattning").reduce((a, t) => a + t.amount, 0)
        return { totUttak, totInsattning, netto: totInsattning + totUttak }
    }, [])

    const chartData = useMemo(() => {
        return MONTH_LABELS.map((month, mi) => {
            const monthNum = mi + 1
            const monthStr = `2026-${String(monthNum).padStart(2, "0")}`
            const txs = MOCK.filter(tx => {
                const matchMonth = tx.date.startsWith(monthStr)
                const matchPartner = !partnerFilter || tx.partnerId === partnerFilter
                const matchType = !typeFilter || tx.type === typeFilter
                return matchMonth && matchPartner && matchType
            })
            const uttag = txs.filter(tx => tx.amount < 0).reduce((a, tx) => a + Math.abs(tx.amount), 0)
            const insattning = txs.filter(tx => tx.amount > 0).reduce((a, tx) => a + tx.amount, 0)
            return { month, uttag, insattning }
        })
    }, [partnerFilter, typeFilter])

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

                <Link href="/test-ui" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Alla test-sidor
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded-full mb-2">
                            Löner · HB/KB
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight">Delägaruttag</h1>
                        <p className="text-sm text-muted-foreground mt-1">Uttag, insättningar och lön per delägare.</p>
                    </div>
                    <button className="h-8 px-3 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        PDF
                    </button>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Totala uttag", value: fmt(Math.abs(stats.totUttak)), icon: TrendingDown, gradient: "from-orange-50/60 to-zinc-50 dark:from-orange-950/30 dark:to-zinc-950/40", iconBg: "bg-orange-50 dark:bg-orange-950", iconColor: "text-orange-600 dark:text-orange-400" },
                        { label: "Totala insättningar", value: fmt(stats.totInsattning), icon: TrendingUp, gradient: "from-emerald-50/60 to-zinc-50 dark:from-emerald-950/30 dark:to-zinc-950/40", iconBg: "bg-emerald-50 dark:bg-emerald-950", iconColor: "text-emerald-600 dark:text-emerald-400" },
                        { label: "Netto kapital", value: fmt(stats.netto), icon: Minus, gradient: "from-violet-50/60 to-zinc-50 dark:from-violet-950/30 dark:to-zinc-950/40", iconBg: "bg-violet-50 dark:bg-violet-950", iconColor: "text-violet-600 dark:text-violet-400" },
                    ].map(s => {
                        const Icon = s.icon
                        return (
                            <div key={s.label} className={cn("flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-br overflow-hidden", s.gradient)}>
                                <div className={cn("h-9 w-9 shrink-0 rounded-xl flex items-center justify-center", s.iconBg)}>
                                    <Icon className={cn("h-4 w-4", s.iconColor)} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                                    <p className="text-sm font-bold tabular-nums truncate">{s.value}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Stacked bar chart — uttag + insättning per month */}
                <div className="bg-muted/30 rounded-2xl p-5 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kapitalrörelser</p>
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                        <BarChart accessibilityLayer data={chartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar
                                dataKey="uttag"
                                stackId="a"
                                fill="var(--color-uttag)"
                                radius={[0, 0, 4, 4]}
                            />
                            <Bar
                                dataKey="insattning"
                                stackId="a"
                                fill="var(--color-insattning)"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ChartContainer>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[160px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Sök transaktion..."
                            className="w-full pl-8 pr-3 h-9 rounded-xl border border-border/60 bg-muted/20 text-xs focus:outline-none focus:border-border transition-all"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={partnerFilter ?? ""}
                            onChange={e => setPartnerFilter(e.target.value || null)}
                            className="h-9 pl-3 pr-8 rounded-xl border border-border/60 bg-muted/20 text-xs appearance-none focus:outline-none focus:border-border transition-all cursor-pointer"
                        >
                            <option value="">Alla delägare</option>
                            {PARTNERS.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="flex gap-1.5">
                        {([null, "uttag", "insattning", "lon"] as const).map(t => {
                            const isActive = typeFilter === t
                            const activeColor = t ? TYPE_META[t].bg + " " + TYPE_META[t].color : "bg-foreground/5 text-foreground"
                            return (
                                <button
                                    key={t ?? "all"}
                                    onClick={() => setTypeFilter(t)}
                                    className={cn(
                                        "h-9 px-3 rounded-full text-xs font-medium transition-all border",
                                        isActive
                                            ? activeColor + " border-transparent"
                                            : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30"
                                    )}
                                >
                                    {t === null ? "Alla" : TYPE_META[t].label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Transaction list */}
                <div className="space-y-1">
                    {filtered.length === 0 && (
                        <p className="text-sm text-muted-foreground py-8 text-center">Inga transaktioner matchar filtret.</p>
                    )}
                    {filtered.map(tx => {
                        const meta = TYPE_META[tx.type]
                        const TypeIcon = meta.icon
                        const pi = PARTNERS.findIndex(p => p.id === tx.partnerId)
                        return (
                            <div key={tx.id} className="flex items-center gap-4 py-3.5 hover:bg-muted/30 transition-all px-3 rounded-xl cursor-pointer group">
                                <div className={cn(
                                    "h-9 w-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-transform group-hover:scale-105",
                                    AVATAR_COLORS[pi >= 0 ? pi % AVATAR_COLORS.length : 0]
                                )}>
                                    {tx.initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{tx.description}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-muted-foreground">{tx.partner}</span>
                                        <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md inline-flex items-center gap-1", meta.bg, meta.color)}>
                                            <TypeIcon className="h-2.5 w-2.5" />
                                            {meta.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={cn("text-sm font-bold tabular-nums", tx.amount < 0 ? "text-red-500 dark:text-red-400/80" : "text-emerald-600 dark:text-emerald-400")}>
                                        {tx.amount >= 0 ? "+" : ""}{fmt(tx.amount)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground tabular-nums">{tx.date}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
