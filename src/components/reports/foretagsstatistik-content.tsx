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
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { monthlyRevenue, expenseCategories } from "./constants"

// Map icon names to actual icons
const kpiIcons = {
    TrendingUp,
    Wallet,
    Shield,
    Droplets,
}

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

export function ForetagsstatistikContent() {
    const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue))

    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
                <StatCardGrid columns={4}>
                    {kpis.map((kpi) => (
                        <StatCard
                            key={kpi.label}
                            label={kpi.label}
                            value={kpi.value}
                            change={`${kpi.change} vs förra året`}
                            changeType={kpi.positive ? "positive" : "negative"}
                            icon={kpi.icon}
                            variant="filled"
                        />
                    ))}
                </StatCardGrid>

                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-card border-2 border-border/60 rounded-lg p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-medium">Omsättning per månad</h2>
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex items-end gap-1 flex-1 min-h-[144px]">
                            {monthlyRevenue.map((m, index) => {
                                const colors = barColors[index % barColors.length]
                                return (
                                    <Tooltip key={m.month}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="flex-1 flex flex-col rounded-t-lg min-h-[4px] overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                                style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
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
                                                <p className="font-medium text-xs mb-2" style={{ color: colors.solid }}>{m.month} 2024</p>
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
                                                        <span className="font-semibold text-green-600 dark:text-green-500/70 whitespace-nowrap">+{m.profit?.toLocaleString("sv-SE") || 0} kr</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            })}
                        </div>
                        <div className="flex gap-1 mt-2">
                            {monthlyRevenue.map((m) => (
                                <span key={m.month} className="flex-1 text-xs text-muted-foreground text-center">{m.month}</span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-card border-2 border-border/60 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-medium">Kostnadsfördelning</h2>
                            <PieChart className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-3">
                            {expenseCategories.map((cat) => (
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
                    </div>
                </div>

                <div className="bg-card border-2 border-border/60 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b-2 border-border/60">
                        <h2 className="font-medium">Nyckeltal</h2>
                    </div>
                    <div className="grid grid-cols-4 divide-x-2 divide-border/60">
                        <div className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Vinstmarginal</p>
                            <p className="text-xl font-semibold mt-1">20,5%</p>
                        </div>
                        <div className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Avkastning på EK</p>
                            <p className="text-xl font-semibold mt-1">28,3%</p>
                        </div>
                        <div className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Skuldsättningsgrad</p>
                            <p className="text-xl font-semibold mt-1">0,8</p>
                        </div>
                        <div className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Rörelsekapital</p>
                            <p className="text-xl font-semibold mt-1">245 tkr</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
