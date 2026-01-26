"use client"

import {
    PieChart,
    BarChart3,
    TrendingUp,
    Wallet,
    Shield,
    Droplets,
} from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Card } from "@/components/ui/card"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { monthlyRevenue, expenseCategories } from "./data"
import { useFinancialMetrics, type MonthlyMetric, type ExpenseCategory, type KPI } from "@/hooks/use-financial-metrics"

// Map icon names to actual icons
// const kpiIcons = {
//     TrendingUp,
//     Wallet,
//     Shield,
//     Droplets,
// }

// KPIs with resolved icons
const kpis = [
    { label: "Omsättning", value: "1,85 mkr", change: "+12%", positive: true, icon: TrendingUp },
    { label: "Resultat", value: "379 tkr", change: "+8%", positive: true, icon: Wallet },
    { label: "Soliditet", value: "42%", change: "+3%", positive: true, icon: Shield },
    { label: "Kassalikviditet", value: "156%", change: "-2%", positive: false, icon: Droplets },
]

// Professional monochromatic blue/gray palette for bar charts
const barColors = [
    { solid: '#3b82f6', stripe: '#60a5fa' },
    { solid: '#6366f1', stripe: '#818cf8' },
    { solid: '#3b82f6', stripe: '#60a5fa' },
    { solid: '#6366f1', stripe: '#818cf8' },
    { solid: '#3b82f6', stripe: '#60a5fa' },
    { solid: '#6366f1', stripe: '#818cf8' },
    { solid: '#3b82f6', stripe: '#60a5fa' },
    { solid: '#6366f1', stripe: '#818cf8' },
    { solid: '#3b82f6', stripe: '#60a5fa' },
    { solid: '#6366f1', stripe: '#818cf8' },
    { solid: '#3b82f6', stripe: '#60a5fa' },
    { solid: '#6366f1', stripe: '#818cf8' },
]

export function Foretagsstatistik() {
    const { monthlyMetrics, kpis: liveKpis, expenseDistribution, isLoading } = useFinancialMetrics()

    // Fallback/Empty state handling if no data yet (optional, or just show 0s)
    // Ensure fallback data matches MonthlyMetric interface
    const fallbackMetrics: MonthlyMetric[] = monthlyRevenue.map(m => ({
        ...m,
        accumulatedProfit: 0 // Add missing property
    }))

    const displayMetrics = monthlyMetrics.length > 0 ? monthlyMetrics : fallbackMetrics
    const maxRevenue = Math.max(...displayMetrics.map(m => m.revenue)) || 1 // Avoid divide by zero

    // Map live KPIs to icons
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const displayKpis: (KPI & { icon: any })[] = liveKpis.length > 0 ? [
        { ...liveKpis[0], icon: TrendingUp }, // Omsättning
        { ...liveKpis[1], icon: Wallet },     // Resultat
        { ...liveKpis[2], icon: Shield },     // Soliditet
        { ...liveKpis[3], icon: Droplets },   // Likviditet/Vinstmarginal mapping
    ] : kpis.map(k => ({ ...k, raw: 0 })) // Add 'raw' property to fallback to match interface

    const displayExpenses = expenseDistribution.length > 0 ? expenseDistribution : expenseCategories

    if (isLoading) {
        return <div className="p-12 text-center text-muted-foreground">Laddar statistik...</div>
    }

    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
                <StatCardGrid columns={4}>
                    {displayKpis.map((kpi) => (
                        <StatCard
                            key={kpi.label}
                            label={kpi.label}
                            value={kpi.value}
                            change={`${kpi.change} vs förra året`}
                            changeType={kpi.positive ? "positive" : "negative"}
                            headerIcon={kpi.icon}
                            variant="filled"
                        />
                    ))}
                </StatCardGrid>

                <div className="grid grid-cols-2 gap-6">
                    <Card className="p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-medium">Omsättning per månad</h2>
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex items-end gap-1 flex-1 min-h-[144px]">
                            {displayMetrics.map((m: MonthlyMetric, index: number) => {
                                const colors = barColors[index % barColors.length]
                                const heightPercentage = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0

                                return (
                                    <Tooltip key={m.month}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="flex-1 flex flex-col rounded-t-lg min-h-[4px] overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                                style={{ height: `${Math.max(heightPercentage, 2)}%` }} // Min height for visibility
                                            >
                                                {/* Striped top portion */}
                                                <div
                                                    className="flex-[2]"
                                                    style={{
                                                        background: `repeating-linear-gradient(
                                                            -45deg,
                                                            ${colors.solid},
                                                            ${colors.solid} 2px,
                                                            ${colors.stripe} 2px,
                                                            ${colors.stripe} 4px
                                                        )`
                                                    }}
                                                />
                                                {/* Solid bottom portion with rounded top */}
                                                <div
                                                    className="flex-[3] rounded-t-lg -mt-2 relative z-10"
                                                    style={{ backgroundColor: colors.solid }}
                                                />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            className="bg-white dark:bg-neutral-900 shadow-lg rounded-lg p-3 border-2 border-dashed"
                                            style={{ borderColor: colors.solid }}
                                        >
                                            <div>
                                                <p className="font-medium text-xs mb-2" style={{ color: colors.solid }}>{m.month}</p>
                                                <div className="space-y-1.5 text-xs">
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-muted-foreground">Intäkter</span>
                                                        <span className="font-medium text-foreground whitespace-nowrap">{m.revenue?.toLocaleString("sv-SE") || 0} kr</span>
                                                    </div>
                                                    <div className="flex justify-between gap-4">
                                                        <span className="text-muted-foreground">Kostnader</span>
                                                        <span className="font-medium text-foreground whitespace-nowrap">-{m.expenses?.toLocaleString("sv-SE") || 0} kr</span>
                                                    </div>
                                                    <div className="border-t border-dashed pt-1.5 mt-1.5 flex justify-between gap-4" style={{ borderColor: colors.solid }}>
                                                        <span className="text-muted-foreground">Resultat</span>
                                                        <span className="font-semibold text-green-600 dark:text-green-500/70 whitespace-nowrap">
                                                            {m.profit > 0 ? "+" : ""}{m.profit?.toLocaleString("sv-SE") || 0} kr
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            })}
                        </div>
                        <div className="flex gap-1 mt-2">
                            {displayMetrics.map((m: MonthlyMetric) => (
                                <span key={m.month} className="flex-1 text-xs text-muted-foreground text-center capitalize">{m.month}</span>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-medium">Kostnadsfördelning</h2>
                            <PieChart className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-3">
                            {displayExpenses.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8 text-sm">Inga kostnader registrerade</div>
                            ) : displayExpenses.map((cat: ExpenseCategory) => (
                                <div key={cat.category}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span>{cat.category}</span>
                                        <span className="text-muted-foreground">{cat.amount.toLocaleString("sv-SE")} kr</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${cat.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <Card className="overflow-hidden">
                    <div className="px-4 py-3 border-b-2 border-border/60">
                        <h2 className="font-medium">Nyckeltal</h2>
                    </div>
                    <div className="grid grid-cols-4 divide-x-2 divide-border/60">
                        {displayKpis.map((kpi) => (
                            <div key={kpi.label} className="p-4 text-center">
                                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                                <p className="text-xl font-semibold mt-1">{kpi.value}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </main>
    )
}
