"use client"

/**
 * Test page: Förmåner (Benefits)
 *
 * Data display: stats + benefit sections grouped by type.
 * Statuses: Skattefri (success), Skattepliktig (warning), Löneväxling (info).
 * Shows which employees have which benefits.
 */

import Link from "next/link"
import {
    ArrowLeft,
    Gift,
    Heart,
    Dumbbell,
    Car,
    Utensils,
    Laptop,
    Banknote,
    Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

function fmt(n: number) {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })
}

type BenefitStatus = "Skattefri" | "Skattepliktig" | "Löneväxling"

const STATUS_STYLE: Record<BenefitStatus, string> = {
    "Skattefri": "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    "Skattepliktig": "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
    "Löneväxling": "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
}

interface Benefit {
    id: string
    name: string
    icon: LucideIcon
    status: BenefitStatus
    maxAmount: number
    employees: Array<{ name: string; used: number }>
}

const BENEFITS: Benefit[] = [
    {
        id: "b1", name: "Friskvårdsbidrag", icon: Dumbbell, status: "Skattefri", maxAmount: 5000,
        employees: [
            { name: "Anna Lindberg", used: 3200 },
            { name: "Johan Berg", used: 0 },
            { name: "Maria Svensson", used: 5000 },
        ],
    },
    {
        id: "b2", name: "Sjukvårdsförsäkring", icon: Heart, status: "Skattepliktig", maxAmount: 12000,
        employees: [
            { name: "Anna Lindberg", used: 12000 },
            { name: "Maria Svensson", used: 12000 },
        ],
    },
    {
        id: "b3", name: "Tjänstebil", icon: Car, status: "Skattepliktig", maxAmount: 0,
        employees: [
            { name: "Maria Svensson", used: 4500 },
        ],
    },
    {
        id: "b4", name: "Lunch-subvention", icon: Utensils, status: "Skattefri", maxAmount: 0,
        employees: [
            { name: "Anna Lindberg", used: 0 },
            { name: "Johan Berg", used: 0 },
            { name: "Maria Svensson", used: 0 },
        ],
    },
    {
        id: "b5", name: "Dator (löneväxling)", icon: Laptop, status: "Löneväxling", maxAmount: 20000,
        employees: [
            { name: "Anna Lindberg", used: 15000 },
        ],
    },
]

export default function TestFormanerPage() {
    const totalCost = BENEFITS.reduce((s, b) => s + b.employees.reduce((es, e) => es + e.used, 0), 0)
    const totalEmployeesWithBenefits = new Set(BENEFITS.flatMap(b => b.employees.map(e => e.name))).size
    const unusedPotential = BENEFITS.reduce((s, b) => {
        if (!b.maxAmount) return s
        return s + b.employees.reduce((es, e) => es + Math.max(0, b.maxAmount - e.used), 0)
    }, 0)

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <Link href="/test-ui/read-only" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Read Only UIs
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Förmåner</h1>
                    <p className="text-sm text-muted-foreground mt-1">Personalförmåner och skattefria avdrag.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Total kostnad i år", value: fmt(totalCost) + " kr", icon: Banknote, iconBg: "bg-blue-50 dark:bg-blue-950", iconColor: "text-blue-600 dark:text-blue-400", gradient: "from-blue-50/60 to-zinc-50 dark:from-blue-950/30 dark:to-zinc-950/40" },
                        { label: "Anställda med förmåner", value: String(totalEmployeesWithBenefits), icon: Check, iconBg: "bg-emerald-50 dark:bg-emerald-950", iconColor: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-50/60 to-zinc-50 dark:from-emerald-950/30 dark:to-zinc-950/40" },
                        { label: "Outnyttjat", value: fmt(unusedPotential) + " kr", icon: Gift, iconBg: "bg-amber-50 dark:bg-amber-950", iconColor: "text-amber-600 dark:text-amber-400", gradient: "from-amber-50/60 to-zinc-50 dark:from-amber-950/30 dark:to-zinc-950/40" },
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

                {/* Benefit Sections */}
                <div className="space-y-6">
                    {BENEFITS.map((benefit) => {
                        const Icon = benefit.icon
                        return (
                            <div key={benefit.id} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{benefit.name}</p>
                                            {benefit.maxAmount > 0 && (
                                                <p className="text-xs text-muted-foreground">Max {fmt(benefit.maxAmount)} kr / år</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", STATUS_STYLE[benefit.status])}>
                                        {benefit.status}
                                    </span>
                                </div>

                                <div className="space-y-1 pl-10.5">
                                    {benefit.employees.map((emp, i) => (
                                        <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                                            <span className="text-muted-foreground">{emp.name}</span>
                                            <span className="tabular-nums font-medium">
                                                {emp.used > 0 ? fmt(emp.used) + " kr" : "Ej nyttjad"}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {benefit.maxAmount > 0 && (
                                    <div className="pl-10.5">
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-emerald-500/70"
                                                style={{ width: `${Math.min(100, (benefit.employees.reduce((s, e) => s + e.used, 0) / (benefit.maxAmount * benefit.employees.length)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
