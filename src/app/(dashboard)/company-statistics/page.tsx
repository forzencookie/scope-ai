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
    TooltipProvider 
} from "@/components/ui/tooltip"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { 
    PieChart, 
    Wallet,
    Shield,
    Droplets,
    Percent,
    Scale,
    Package,
    Receipt,
    CreditCard,
    Building2,
    AlertCircle,
    CheckCircle2,
    Clock,
    Users,
    Plane,
    MoreHorizontal,
    FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Swedish accounting term explanations
const termExplanations: Record<string, string> = {
    "Soliditet": "Andel eget kapital i förhållande till totala tillgångar. Högre = stabilare ekonomi. Över 30% anses bra.",
    "Kassalikviditet": "Förmåga att betala kortfristiga skulder med likvida medel. Över 100% = kan täcka alla kortsiktiga skulder.",
    "Skuldsättningsgrad": "Skulder delat med eget kapital. Lägre = mindre finansiell risk.",
    "Vinstmarginal": "Resultat delat med omsättning i procent. Visar hur stor del av försäljningen som blir vinst.",
}

// Financial health KPIs
const financialHealth = [
    { label: "Soliditet", value: "42%", change: "+3%", positive: true, icon: Shield, subtitle: "vs förra året" },
    { label: "Kassalikviditet", value: "156%", change: "-2%", positive: false, icon: Droplets, subtitle: "vs förra året" },
    { label: "Skuldsättningsgrad", value: "0,8", change: "-0,1", positive: true, icon: Scale, subtitle: "vs förra året" },
    { label: "Vinstmarginal", value: "20,5%", change: "+2,3%", positive: true, icon: Percent, subtitle: "vs förra året" },
]

// Transaction overview - matches with transactions data
const transactionStats = {
    total: 156,
    recorded: 128,
    pending: 18,
    missingDocs: 10,
}

// Invoice overview
const invoiceStats = {
    sent: 45,
    paid: 38,
    overdue: 4,
    draft: 3,
    totalValue: 485000,
    overdueValue: 52000,
}

// Expense categories - more detailed breakdown
const expenseCategories = [
    { category: "Personal", amount: 520000, percentage: 37, icon: Users, color: "bg-blue-500" },
    { category: "Lokalkostnader", amount: 180000, percentage: 13, icon: Building2, color: "bg-indigo-500" },
    { category: "Material & Varor", amount: 220000, percentage: 16, icon: Package, color: "bg-violet-500" },
    { category: "IT & Programvara", amount: 125000, percentage: 9, icon: CreditCard, color: "bg-purple-500" },
    { category: "Resor & Representation", amount: 95000, percentage: 7, icon: Plane, color: "bg-pink-500" },
    { category: "Övriga kostnader", amount: 260000, percentage: 18, icon: MoreHorizontal, color: "bg-slate-500" },
]

// Account balances
const accounts = [
    { name: "Företagskonto", balance: 245000, change: "+12 500" },
    { name: "Skattekonto", balance: 38000, change: "-5 200" },
    { name: "Sparkonto", balance: 150000, change: "0" },
]

export default function CompanyStatisticsPage() {
    const totalExpenses = expenseCategories.reduce((sum, cat) => sum + cat.amount, 0)
    
    return (
        <TooltipProvider delayDuration={400}>
            <div className="flex flex-col min-h-svh">
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

                <main className="p-6">
                    <div className="max-w-6xl w-full space-y-6">
                        {/* Financial Health KPIs */}
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground mb-3">Finansiell hälsa</h2>
                            <StatCardGrid columns={4}>
                                {financialHealth.map((kpi) => (
                                    <StatCard
                                        key={kpi.label}
                                        label={kpi.label}
                                        value={kpi.value}
                                        icon={kpi.icon}
                                        tooltip={termExplanations[kpi.label]}
                                        change={kpi.change}
                                        changeType={kpi.positive ? "positive" : "negative"}
                                        subtitle={kpi.subtitle}
                                    />
                                ))}
                            </StatCardGrid>
                        </div>

                        {/* Account Balances */}
                        <div className="grid grid-cols-3 gap-4">
                            {accounts.map((account) => (
                                <div key={account.name} className="border-2 border-border/60 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">{account.name}</span>
                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="mt-2">
                                        <span className="text-2xl font-semibold">{account.balance.toLocaleString("sv-SE")} kr</span>
                                        {account.change !== "0" && (
                                            <span className={cn(
                                                "ml-2 text-sm",
                                                account.change.startsWith("+") ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                {account.change} kr
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Transaction & Invoice Overview */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Transactions Status */}
                            <div className="border-2 border-border/60 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-medium">Transaktioner</h2>
                                    <span className="text-sm text-muted-foreground">{transactionStats.total} totalt</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            <span className="text-sm">Bokförda</span>
                                        </div>
                                        <span className="font-medium">{transactionStats.recorded}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-amber-500" />
                                            <span className="text-sm">Att bokföra</span>
                                        </div>
                                        <span className="font-medium">{transactionStats.pending}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-rose-500" />
                                            <span className="text-sm">Saknar underlag</span>
                                        </div>
                                        <span className="font-medium">{transactionStats.missingDocs}</span>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden flex">
                                    <div 
                                        className="bg-emerald-500 h-full" 
                                        style={{ width: `${(transactionStats.recorded / transactionStats.total) * 100}%` }} 
                                    />
                                    <div 
                                        className="bg-amber-500 h-full" 
                                        style={{ width: `${(transactionStats.pending / transactionStats.total) * 100}%` }} 
                                    />
                                    <div 
                                        className="bg-rose-500 h-full" 
                                        style={{ width: `${(transactionStats.missingDocs / transactionStats.total) * 100}%` }} 
                                    />
                                </div>
                            </div>

                            {/* Invoices Status */}
                            <div className="border-2 border-border/60 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-medium">Fakturor</h2>
                                    <span className="text-sm text-muted-foreground">{invoiceStats.sent} skickade</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            <span className="text-sm">Betalda</span>
                                        </div>
                                        <span className="font-medium">{invoiceStats.paid}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-rose-500" />
                                            <span className="text-sm">Förfallna</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-medium">{invoiceStats.overdue}</span>
                                            <span className="text-xs text-rose-500 ml-2">({invoiceStats.overdueValue.toLocaleString("sv-SE")} kr)</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">Utkast</span>
                                        </div>
                                        <span className="font-medium">{invoiceStats.draft}</span>
                                    </div>
                                </div>
                                {/* Total value */}
                                <div className="mt-4 pt-3 border-t-2 border-border/60">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Totalt fakturerat</span>
                                        <span className="font-semibold">{invoiceStats.totalValue.toLocaleString("sv-SE")} kr</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t-2 border-border/60" />

                        {/* Expense Breakdown */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-medium">Kostnadsfördelning</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{totalExpenses.toLocaleString("sv-SE")} kr</span>
                                    <PieChart className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                {expenseCategories.map((cat) => {
                                    const Icon = cat.icon
                                    return (
                                        <div key={cat.category}>
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                    <span>{cat.category}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium w-24 text-right">{cat.amount.toLocaleString("sv-SE")} kr</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-1.5">
                                                <div
                                                    className={cn("h-1.5 rounded-full", cat.color)}
                                                    style={{ width: `${cat.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </TooltipProvider>
    )
}
