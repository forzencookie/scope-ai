"use client"

/**
 * Test page: Inventarier (Assets)
 *
 * Data display: stats + card grid of assets.
 * Each asset shows: name, category, purchase date, acquisition value,
 * accumulated depreciation, book value, depreciation rate.
 */

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    Search,
    Package,
    TrendingDown,
    Landmark,
    Monitor,
    Armchair,
    Car,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

function fmt(n: number) {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    "Datorer": Monitor,
    "Möbler": Armchair,
    "Fordon": Car,
    "Övrigt": Package,
}

const ASSETS = [
    { id: "a1", name: "MacBook Pro 16\"", category: "Datorer", account: "1250", purchaseDate: "2025-01-15", acquisitionValue: 34990, depreciationYears: 3, accumulatedDep: 14580, bookValue: 20410 },
    { id: "a2", name: "Skrivbord + kontorsstol", category: "Möbler", account: "1220", purchaseDate: "2024-06-01", acquisitionValue: 18500, depreciationYears: 5, accumulatedDep: 6167, bookValue: 12333 },
    { id: "a3", name: "Dell-skärm 27\" × 2", category: "Datorer", account: "1250", purchaseDate: "2025-03-10", acquisitionValue: 12990, depreciationYears: 3, accumulatedDep: 3609, bookValue: 9381 },
    { id: "a4", name: "iPhone 15 Pro (företagstelefon)", category: "Datorer", account: "1250", purchaseDate: "2025-09-20", acquisitionValue: 16990, depreciationYears: 3, accumulatedDep: 2832, bookValue: 14158 },
    { id: "a5", name: "Kaffemaskin Jura E8", category: "Övrigt", account: "1220", purchaseDate: "2024-11-01", acquisitionValue: 14990, depreciationYears: 5, accumulatedDep: 2498, bookValue: 12492 },
    { id: "a6", name: "Firmabil — Toyota Corolla", category: "Fordon", account: "1240", purchaseDate: "2024-03-01", acquisitionValue: 285000, depreciationYears: 5, accumulatedDep: 114000, bookValue: 171000 },
]

export default function TestInventarierPage() {
    const [search, setSearch] = useState("")

    const filtered = ASSETS.filter(a =>
        !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase())
    )

    const totalValue = ASSETS.reduce((s, a) => s + a.acquisitionValue, 0)
    const totalBookValue = ASSETS.reduce((s, a) => s + a.bookValue, 0)
    const totalDep = ASSETS.reduce((s, a) => s + a.accumulatedDep, 0)

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <Link href="/test-ui/read-only" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Read Only UIs
                </Link>

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tillgångar</h1>
                    <p className="text-sm text-muted-foreground mt-1">Datorer, möbler och andra saker du äger.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Anskaffningsvärde", value: fmt(totalValue) + " kr", icon: Landmark, iconBg: "bg-blue-50 dark:bg-blue-950", iconColor: "text-blue-600 dark:text-blue-400", gradient: "from-blue-50/60 to-zinc-50 dark:from-blue-950/30 dark:to-zinc-950/40" },
                        { label: "Bokfört värde", value: fmt(totalBookValue) + " kr", icon: Package, iconBg: "bg-emerald-50 dark:bg-emerald-950", iconColor: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-50/60 to-zinc-50 dark:from-emerald-950/30 dark:to-zinc-950/40" },
                        { label: "Ack. avskrivningar", value: fmt(totalDep) + " kr", icon: TrendingDown, iconBg: "bg-amber-50 dark:bg-amber-950", iconColor: "text-amber-600 dark:text-amber-400", gradient: "from-amber-50/60 to-zinc-50 dark:from-amber-950/30 dark:to-zinc-950/40" },
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

                {/* Search */}
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Alla tillgångar</h3>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Sök tillgång..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 w-48 rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Asset Cards */}
                <div className="grid grid-cols-2 gap-3">
                    {filtered.map((asset) => {
                        const Icon = CATEGORY_ICONS[asset.category] || Package
                        const depPercent = Math.round((asset.accumulatedDep / asset.acquisitionValue) * 100)

                        return (
                            <div key={asset.id} className="rounded-xl border p-4 hover:bg-muted/30 transition-colors cursor-pointer space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate">{asset.name}</p>
                                        <p className="text-xs text-muted-foreground">{asset.category} · {asset.account}</p>
                                    </div>
                                </div>

                                {/* Depreciation bar */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">Avskrivning</span>
                                        <span className="font-medium">{depPercent}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-amber-500/70"
                                            style={{ width: `${depPercent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-1 text-xs">
                                    <span className="text-muted-foreground">Inköp</span>
                                    <span className="text-right tabular-nums">{fmt(asset.acquisitionValue)} kr</span>
                                    <span className="text-muted-foreground">Bokfört</span>
                                    <span className="text-right tabular-nums font-medium">{fmt(asset.bookValue)} kr</span>
                                    <span className="text-muted-foreground">Avskr.tid</span>
                                    <span className="text-right">{asset.depreciationYears} år</span>
                                    <span className="text-muted-foreground">Inköpsdatum</span>
                                    <span className="text-right">{asset.purchaseDate}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Inga tillgångar matchar sökningen.</p>
                )}
            </div>
        </div>
    )
}
