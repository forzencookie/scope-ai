"use client"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbAIBadge,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { 
    Tooltip, 
    TooltipContent, 
    TooltipTrigger, 
    TooltipProvider 
} from "@/components/ui/tooltip"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { 
    PieChart, 
    BarChart3,
    TrendingUp,
    Wallet,
    Shield,
    Droplets,
    Percent,
    LineChart,
    Scale,
    Banknote,
} from "lucide-react"

// Swedish accounting term explanations
const termExplanations: Record<string, string> = {
    "Omsättning": "Total försäljning under perioden, exklusive moms. Visar företagets intäkter från kärnverksamheten.",
    "Resultat": "Vinst eller förlust efter att alla kostnader dragits av. Positivt värde = vinst.",
    "Soliditet": "Andel eget kapital i förhållande till totala tillgångar. Högre = stabilare ekonomi. Över 30% anses bra.",
    "Kassalikviditet": "Förmåga att betala kortfristiga skulder med likvida medel. Över 100% = kan täcka alla kortsiktiga skulder.",
    "Bruttovinst": "Intäkter minus direkta kostnader (varor/tjänster). Visar lönsamhet före fasta kostnader.",
    "Vinstmarginal": "Resultat delat med omsättning i procent. Visar hur stor del av försäljningen som blir vinst.",
    "Skuldsättningsgrad": "Skulder delat med eget kapital. Lägre = mindre finansiell risk.",
    "Räntabilitet": "Avkastning på investerat kapital. Visar hur effektivt företaget använder sina resurser.",
}

const kpis = [
    { label: "Omsättning", value: "1,85 mkr", change: "+12%", positive: true, icon: TrendingUp },
    { label: "Resultat", value: "379 tkr", change: "+8%", positive: true, icon: Wallet },
    { label: "Soliditet", value: "42%", change: "+3%", positive: true, icon: Shield },
    { label: "Kassalikviditet", value: "156%", change: "-2%", positive: false, icon: Droplets },
]

const monthlyRevenue = [
    { month: "Jan", revenue: 142000, expenses: 98000, profit: 44000 },
    { month: "Feb", revenue: 156000, expenses: 112000, profit: 44000 },
    { month: "Mar", revenue: 148000, expenses: 105000, profit: 43000 },
    { month: "Apr", revenue: 165000, expenses: 118000, profit: 47000 },
    { month: "Maj", revenue: 172000, expenses: 125000, profit: 47000 },
    { month: "Jun", revenue: 158000, expenses: 108000, profit: 50000 },
    { month: "Jul", revenue: 134000, expenses: 95000, profit: 39000 },
    { month: "Aug", revenue: 145000, expenses: 102000, profit: 43000 },
    { month: "Sep", revenue: 168000, expenses: 120000, profit: 48000 },
    { month: "Okt", revenue: 175000, expenses: 128000, profit: 47000 },
    { month: "Nov", revenue: 162000, expenses: 115000, profit: 47000 },
    { month: "Dec", revenue: 125000, expenses: 88000, profit: 37000 },
]

const expenseCategories = [
    { category: "Personal", amount: 520000, percentage: 37 },
    { category: "Lokalkostnader", amount: 180000, percentage: 13 },
    { category: "Marknadsföring", amount: 95000, percentage: 7 },
    { category: "IT & Teknik", amount: 125000, percentage: 9 },
    { category: "Övriga kostnader", amount: 500000, percentage: 34 },
]

export default function CompanyStatisticsPage() {
    const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue))
    
    // Professional monochromatic blue/gray palette
    const barColors = [
        { solid: '#3b82f6', stripe: '#60a5fa' }, // blue-500/blue-400
        { solid: '#6366f1', stripe: '#818cf8' }, // indigo-500/indigo-400
        { solid: '#3b82f6', stripe: '#60a5fa' }, // blue-500/blue-400
        { solid: '#6366f1', stripe: '#818cf8' }, // indigo-500/indigo-400
        { solid: '#3b82f6', stripe: '#60a5fa' }, // blue-500/blue-400
        { solid: '#6366f1', stripe: '#818cf8' }, // indigo-500/indigo-400
        { solid: '#3b82f6', stripe: '#60a5fa' }, // blue-500/blue-400
        { solid: '#6366f1', stripe: '#818cf8' }, // indigo-500/indigo-400
        { solid: '#3b82f6', stripe: '#60a5fa' }, // blue-500/blue-400
        { solid: '#6366f1', stripe: '#818cf8' }, // indigo-500/indigo-400
        { solid: '#3b82f6', stripe: '#60a5fa' }, // blue-500/blue-400
        { solid: '#6366f1', stripe: '#818cf8' }, // indigo-500/indigo-400
    ]

    return (
        <TooltipProvider delayDuration={400}>
            <div className="flex flex-col h-svh overflow-auto">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Företagsstatistik</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <BreadcrumbAIBadge />
                </header>

                <main className="flex-1 flex flex-col p-6">
                    <div className="max-w-6xl w-full space-y-6">
                        <StatCardGrid columns={4}>
                            {kpis.map((kpi) => (
                                <StatCard
                                    key={kpi.label}
                                    label={kpi.label}
                                    value={kpi.value}
                                    icon={kpi.icon}
                                    tooltip={termExplanations[kpi.label]}
                                    change={kpi.change}
                                    changeType={kpi.positive ? "positive" : "negative"}
                                    subtitle="vs förra året"
                                />
                            ))}
                        </StatCardGrid>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="border border-border/50 rounded-lg p-4 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-medium">Omsättning per månad</h2>
                                    <div className="h-8 w-8 rounded-md flex items-center justify-center">
                                        <BarChart3 className="h-5 w-5 text-muted-foreground" strokeWidth={2.5} />
                                    </div>
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
                                                        {/* Solid bottom portion with rounded top - negative margin to overlap */}
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
                                                                <span className="font-semibold text-green-600 whitespace-nowrap">+{m.profit?.toLocaleString("sv-SE") || 0} kr</span>
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

                            <div className="border border-border/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-medium">Kostnadsfördelning</h2>
                                    <div className="h-8 w-8 rounded-md flex items-center justify-center">
                                        <PieChart className="h-5 w-5 text-muted-foreground" strokeWidth={2.5} />
                                    </div>
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

                        <StatCardGrid columns={4}>
                            <StatCard
                                label="Vinstmarginal"
                                value="20,5%"
                                icon={Percent}
                                subtitle="Andel vinst av omsättning"
                            />
                            <StatCard
                                label="Avkastning på EK"
                                value="28,3%"
                                icon={LineChart}
                                subtitle="Avkastning på eget kapital"
                            />
                            <StatCard
                                label="Skuldsättningsgrad"
                                value="0,8"
                                icon={Scale}
                                subtitle="Skulder / Eget kapital"
                            />
                            <StatCard
                                label="Rörelsekapital"
                                value="245 tkr"
                                icon={Banknote}
                                subtitle="Tillgångar - Skulder"
                            />
                        </StatCardGrid>
                    </div>
                </main>
            </div>
        </TooltipProvider>
    )
}
