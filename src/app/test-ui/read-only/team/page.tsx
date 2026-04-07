"use client"

/**
 * Test page: Team (Employees)
 *
 * Data display: employee card grid with status, role, salary, kommun.
 * Statuses: Aktiv (success), Inaktiv (neutral).
 * Each card shows balance (utlägg) and mileage.
 */

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    Search,
    User,
    MapPin,
    Briefcase,
    Coins,
    Car,
    Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"

function fmt(n: number) {
    return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })
}

type EmpStatus = "Aktiv" | "Inaktiv"

const STATUS_STYLE: Record<EmpStatus, string> = {
    "Aktiv": "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
    "Inaktiv": "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
}

const EMPLOYEES = [
    { id: "e1", name: "Anna Lindberg", role: "Frontend-utvecklare", salary: 42000, kommun: "Stockholm", taxRate: 30.62, status: "Aktiv" as EmpStatus, startDate: "2024-01-15", balance: -1250, mileage: 340 },
    { id: "e2", name: "Johan Berg", role: "Backend-utvecklare", salary: 38000, kommun: "Göteborg", taxRate: 32.89, status: "Aktiv" as EmpStatus, startDate: "2024-03-01", balance: 0, mileage: 0 },
    { id: "e3", name: "Maria Svensson", role: "Projektledare", salary: 45000, kommun: "Malmö", taxRate: 32.23, status: "Aktiv" as EmpStatus, startDate: "2023-08-15", balance: -3400, mileage: 1250 },
    { id: "e4", name: "Erik Johansson", role: "UX-designer", salary: 40000, kommun: "Uppsala", taxRate: 31.85, status: "Inaktiv" as EmpStatus, startDate: "2023-01-10", balance: 0, mileage: 0 },
]

export default function TestTeamPage() {
    const [search, setSearch] = useState("")

    const filtered = EMPLOYEES.filter(e =>
        !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase())
    )

    const activeCount = EMPLOYEES.filter(e => e.status === "Aktiv").length
    const totalSalary = EMPLOYEES.filter(e => e.status === "Aktiv").reduce((s, e) => s + e.salary, 0)

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <Link href="/test-ui/read-only" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Read Only UIs
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Team</h1>
                    <p className="text-sm text-muted-foreground mt-1">Anställda, utlägg och milersättning.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: "Aktiva anställda", value: String(activeCount), icon: User, iconBg: "bg-emerald-50 dark:bg-emerald-950", iconColor: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-50/60 to-zinc-50 dark:from-emerald-950/30 dark:to-zinc-950/40" },
                        { label: "Total lönekostnad / mån", value: fmt(totalSalary) + " kr", icon: Coins, iconBg: "bg-blue-50 dark:bg-blue-950", iconColor: "text-blue-600 dark:text-blue-400", gradient: "from-blue-50/60 to-zinc-50 dark:from-blue-950/30 dark:to-zinc-950/40" },
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

                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Alla anställda</h3>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input type="text" placeholder="Sök anställd..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="h-8 w-48 rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                </div>

                {/* Employee Cards */}
                <div className="grid grid-cols-2 gap-3">
                    {filtered.map((emp) => (
                        <div key={emp.id} className="rounded-xl border p-4 hover:bg-muted/30 transition-colors cursor-pointer space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                        <User className="h-4.5 w-4.5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{emp.name}</p>
                                        <p className="text-xs text-muted-foreground">{emp.role}</p>
                                    </div>
                                </div>
                                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", STATUS_STYLE[emp.status])}>
                                    {emp.status}
                                </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Coins className="h-3 w-3 shrink-0" />
                                    <span>{fmt(emp.salary)} kr / mån</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    <span>{emp.kommun} ({emp.taxRate}%)</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Briefcase className="h-3 w-3 shrink-0" />
                                    <span>Sedan {emp.startDate}</span>
                                </div>
                            </div>

                            {(emp.balance !== 0 || emp.mileage > 0) && (
                                <div className="flex gap-3 pt-1 border-t border-border/60">
                                    {emp.balance !== 0 && (
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Receipt className="h-3 w-3 text-muted-foreground" />
                                            <span className={emp.balance < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
                                                {fmt(emp.balance)} kr
                                            </span>
                                        </div>
                                    )}
                                    {emp.mileage > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Car className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-muted-foreground">{fmt(emp.mileage)} km</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
