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
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { 
    Wallet,
    Shield,
    Droplets,
    Percent,
    Scale,
    Package,
    CreditCard,
    Building2,
    Users,
    Plane,
    MoreHorizontal,
    LayoutDashboard,
    ArrowLeftRight,
    TrendingDown,
    TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import * as React from "react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    PieChart,
    Pie,
    BarChart,
    Bar,
} from "recharts"

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

// Monthly revenue data for line chart (6 years of data for extended views)
const monthlyRevenueData = [
    // 2019
    { month: "Jan 2019", intäkter: 85000, kostnader: 62000, resultat: 23000 },
    { month: "Feb 2019", intäkter: 88000, kostnader: 65000, resultat: 23000 },
    { month: "Mar 2019", intäkter: 92000, kostnader: 68000, resultat: 24000 },
    { month: "Apr 2019", intäkter: 90000, kostnader: 66000, resultat: 24000 },
    { month: "Maj 2019", intäkter: 95000, kostnader: 70000, resultat: 25000 },
    { month: "Jun 2019", intäkter: 98000, kostnader: 72000, resultat: 26000 },
    { month: "Jul 2019", intäkter: 88000, kostnader: 65000, resultat: 23000 },
    { month: "Aug 2019", intäkter: 92000, kostnader: 68000, resultat: 24000 },
    { month: "Sep 2019", intäkter: 100000, kostnader: 74000, resultat: 26000 },
    { month: "Okt 2019", intäkter: 105000, kostnader: 78000, resultat: 27000 },
    { month: "Nov 2019", intäkter: 108000, kostnader: 80000, resultat: 28000 },
    { month: "Dec 2019", intäkter: 112000, kostnader: 82000, resultat: 30000 },
    // 2020
    { month: "Jan 2020", intäkter: 95000, kostnader: 70000, resultat: 25000 },
    { month: "Feb 2020", intäkter: 98000, kostnader: 72000, resultat: 26000 },
    { month: "Mar 2020", intäkter: 75000, kostnader: 65000, resultat: 10000 },
    { month: "Apr 2020", intäkter: 68000, kostnader: 60000, resultat: 8000 },
    { month: "Maj 2020", intäkter: 72000, kostnader: 62000, resultat: 10000 },
    { month: "Jun 2020", intäkter: 85000, kostnader: 68000, resultat: 17000 },
    { month: "Jul 2020", intäkter: 92000, kostnader: 72000, resultat: 20000 },
    { month: "Aug 2020", intäkter: 98000, kostnader: 75000, resultat: 23000 },
    { month: "Sep 2020", intäkter: 105000, kostnader: 78000, resultat: 27000 },
    { month: "Okt 2020", intäkter: 110000, kostnader: 82000, resultat: 28000 },
    { month: "Nov 2020", intäkter: 115000, kostnader: 85000, resultat: 30000 },
    { month: "Dec 2020", intäkter: 120000, kostnader: 88000, resultat: 32000 },
    // 2021
    { month: "Jan 2021", intäkter: 100000, kostnader: 72000, resultat: 28000 },
    { month: "Feb 2021", intäkter: 108000, kostnader: 78000, resultat: 30000 },
    { month: "Mar 2021", intäkter: 115000, kostnader: 82000, resultat: 33000 },
    { month: "Apr 2021", intäkter: 112000, kostnader: 80000, resultat: 32000 },
    { month: "Maj 2021", intäkter: 125000, kostnader: 88000, resultat: 37000 },
    { month: "Jun 2021", intäkter: 135000, kostnader: 95000, resultat: 40000 },
    { month: "Jul 2021", intäkter: 118000, kostnader: 82000, resultat: 36000 },
    { month: "Aug 2021", intäkter: 128000, kostnader: 90000, resultat: 38000 },
    { month: "Sep 2021", intäkter: 142000, kostnader: 98000, resultat: 44000 },
    { month: "Okt 2021", intäkter: 150000, kostnader: 105000, resultat: 45000 },
    { month: "Nov 2021", intäkter: 158000, kostnader: 110000, resultat: 48000 },
    { month: "Dec 2021", intäkter: 165000, kostnader: 115000, resultat: 50000 },
    // 2022
    { month: "Jan 2022", intäkter: 108000, kostnader: 78000, resultat: 30000 },
    { month: "Feb 2022", intäkter: 118000, kostnader: 85000, resultat: 33000 },
    { month: "Mar 2022", intäkter: 128000, kostnader: 90000, resultat: 38000 },
    { month: "Apr 2022", intäkter: 125000, kostnader: 88000, resultat: 37000 },
    { month: "Maj 2022", intäkter: 140000, kostnader: 98000, resultat: 42000 },
    { month: "Jun 2022", intäkter: 152000, kostnader: 105000, resultat: 47000 },
    { month: "Jul 2022", intäkter: 135000, kostnader: 92000, resultat: 43000 },
    { month: "Aug 2022", intäkter: 145000, kostnader: 100000, resultat: 45000 },
    { month: "Sep 2022", intäkter: 160000, kostnader: 110000, resultat: 50000 },
    { month: "Okt 2022", intäkter: 170000, kostnader: 118000, resultat: 52000 },
    { month: "Nov 2022", intäkter: 178000, kostnader: 122000, resultat: 56000 },
    { month: "Dec 2022", intäkter: 188000, kostnader: 128000, resultat: 60000 },
    // 2023
    { month: "Jan 2023", intäkter: 115000, kostnader: 82000, resultat: 33000 },
    { month: "Feb 2023", intäkter: 125000, kostnader: 88000, resultat: 37000 },
    { month: "Mar 2023", intäkter: 138000, kostnader: 95000, resultat: 43000 },
    { month: "Apr 2023", intäkter: 135000, kostnader: 92000, resultat: 43000 },
    { month: "Maj 2023", intäkter: 155000, kostnader: 105000, resultat: 50000 },
    { month: "Jun 2023", intäkter: 168000, kostnader: 112000, resultat: 56000 },
    { month: "Jul 2023", intäkter: 148000, kostnader: 98000, resultat: 50000 },
    { month: "Aug 2023", intäkter: 158000, kostnader: 105000, resultat: 53000 },
    { month: "Sep 2023", intäkter: 175000, kostnader: 115000, resultat: 60000 },
    { month: "Okt 2023", intäkter: 188000, kostnader: 125000, resultat: 63000 },
    { month: "Nov 2023", intäkter: 198000, kostnader: 132000, resultat: 66000 },
    { month: "Dec 2023", intäkter: 210000, kostnader: 140000, resultat: 70000 },
    // 2024
    { month: "Jan", intäkter: 120000, kostnader: 85000, resultat: 35000 },
    { month: "Feb", intäkter: 135000, kostnader: 92000, resultat: 43000 },
    { month: "Mar", intäkter: 148000, kostnader: 98000, resultat: 50000 },
    { month: "Apr", intäkter: 142000, kostnader: 95000, resultat: 47000 },
    { month: "Maj", intäkter: 165000, kostnader: 105000, resultat: 60000 },
    { month: "Jun", intäkter: 178000, kostnader: 112000, resultat: 66000 },
    { month: "Jul", intäkter: 155000, kostnader: 98000, resultat: 57000 },
    { month: "Aug", intäkter: 168000, kostnader: 108000, resultat: 60000 },
    { month: "Sep", intäkter: 185000, kostnader: 118000, resultat: 67000 },
    { month: "Okt", intäkter: 195000, kostnader: 125000, resultat: 70000 },
    { month: "Nov", intäkter: 210000, kostnader: 135000, resultat: 75000 },
    { month: "Dec", intäkter: 225000, kostnader: 142000, resultat: 83000 },
]

// Chart configuration for shadcn charts - using CSS variables
const revenueChartConfig = {
    intäkter: {
        label: "Intäkter",
        color: "var(--chart-1)",
    },
    kostnader: {
        label: "Kostnader",
        color: "var(--chart-5)",
    },
    resultat: {
        label: "Resultat",
        color: "var(--chart-3)",
    },
} satisfies ChartConfig

const barChartConfig = {
    intäkter: {
        label: "Intäkter",
        color: "var(--chart-1)",
    },
    kostnader: {
        label: "Kostnader",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig

// Transaction status pie chart data and config
const transactionPieData = [
    { name: "bokförda", value: 128, fill: "var(--chart-1)" },
    { name: "attBokföra", value: 18, fill: "var(--chart-2)" },
    { name: "saknarUnderlag", value: 10, fill: "var(--chart-5)" },
]

const transactionPieConfig = {
    bokförda: { label: "Bokförda", color: "var(--chart-1)" },
    attBokföra: { label: "Att bokföra", color: "var(--chart-2)" },
    saknarUnderlag: { label: "Saknar underlag", color: "var(--chart-5)" },
} satisfies ChartConfig

// Invoice status pie chart data and config
const invoicePieData = [
    { name: "betalda", value: 38, fill: "var(--chart-1)" },
    { name: "förfallna", value: 4, fill: "var(--chart-5)" },
    { name: "utkast", value: 3, fill: "var(--chart-4)" },
]

const invoicePieConfig = {
    betalda: { label: "Betalda", color: "var(--chart-1)" },
    förfallna: { label: "Förfallna", color: "var(--chart-5)" },
    utkast: { label: "Utkast", color: "var(--chart-4)" },
} satisfies ChartConfig

// Expense pie chart colors and config - using CSS variables
const expensePieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"]

const expensePieConfig = {
    personal: { label: "Personal", color: "var(--chart-1)" },
    lokalkostnader: { label: "Lokalkostnader", color: "var(--chart-2)" },
    material: { label: "Material & Varor", color: "var(--chart-3)" },
    it: { label: "IT & Programvara", color: "var(--chart-4)" },
    resor: { label: "Resor & Representation", color: "var(--chart-5)" },
    övrigt: { label: "Övriga kostnader", color: "var(--muted-foreground)" },
} satisfies ChartConfig

export default function CompanyStatisticsPage() {
    const totalExpenses = expenseCategories.reduce((sum, cat) => sum + cat.amount, 0)
    const [timeRange, setTimeRange] = React.useState("12m")
    
    // Filter data based on selected time range
    const filteredRevenueData = React.useMemo(() => {
        const totalMonths = monthlyRevenueData.length
        switch (timeRange) {
            case "3m": return monthlyRevenueData.slice(-3)
            case "6m": return monthlyRevenueData.slice(-6)
            case "12m": return monthlyRevenueData.slice(-12)
            case "2y": return monthlyRevenueData.slice(-24)
            case "4y": return monthlyRevenueData.slice(-48)
            case "6y": return monthlyRevenueData
            default: return monthlyRevenueData.slice(-12)
        }
    }, [timeRange])
    
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
                    <div className="max-w-6xl w-full">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="bg-transparent rounded-none h-auto p-0 mb-6 flex gap-2 border-b-2 border-border/60 pb-2 w-full justify-start">
                                <TabsTrigger 
                                    value="overview" 
                                    className="gap-2 data-[state=active]:bg-secondary data-[state=active]:shadow-none rounded-md px-3 py-1.5 text-sm font-medium"
                                >
                                    <LayoutDashboard className="h-3.5 w-3.5" />
                                    Översikt
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="transactions" 
                                    className="gap-2 data-[state=active]:bg-secondary data-[state=active]:shadow-none rounded-md px-3 py-1.5 text-sm font-medium"
                                >
                                    <ArrowLeftRight className="h-3.5 w-3.5" />
                                    Transaktioner & Fakturor
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="expenses" 
                                    className="gap-2 data-[state=active]:bg-secondary data-[state=active]:shadow-none rounded-md px-3 py-1.5 text-sm font-medium"
                                >
                                    <TrendingDown className="h-3.5 w-3.5" />
                                    Kostnader
                                </TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="space-y-6">
                                {/* Financial Health KPIs */}
                                <div>
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

                                {/* Revenue Trend Chart - Open Style */}
                                <div className="pt-6 border-t-2 border-border/60">
                                    <div className="flex items-center gap-2 space-y-0 pb-5 sm:flex-row">
                                        <div className="grid flex-1 gap-1">
                                            <h3 className="font-semibold leading-none tracking-tight">Intäkter & Kostnader 2024</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Visar intäkter och kostnader över tid
                                            </p>
                                        </div>
                                        <Select value={timeRange} onValueChange={setTimeRange}>
                                            <SelectTrigger
                                                className="hidden w-[180px] rounded-lg border-2 border-border/60 sm:ml-auto sm:flex"
                                                aria-label="Välj tidsperiod"
                                            >
                                                <SelectValue placeholder="Senaste 12 månader" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-2 border-border/60">
                                                <SelectItem value="3m" className="rounded-lg">
                                                    Senaste 3 månader
                                                </SelectItem>
                                                <SelectItem value="6m" className="rounded-lg">
                                                    Senaste 6 månader
                                                </SelectItem>
                                                <SelectItem value="12m" className="rounded-lg">
                                                    Senaste 12 månader
                                                </SelectItem>
                                                <SelectItem value="2y" className="rounded-lg">
                                                    Senaste 2 år
                                                </SelectItem>
                                                <SelectItem value="4y" className="rounded-lg">
                                                    Senaste 4 år
                                                </SelectItem>
                                                <SelectItem value="6y" className="rounded-lg">
                                                    Senaste 6 år
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="pt-4">
                                        <ChartContainer config={revenueChartConfig} className="aspect-auto h-[250px] w-full">
                                            <AreaChart data={filteredRevenueData}>
                                                <defs>
                                                    <linearGradient id="fillIntakter" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="var(--color-intäkter)" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="var(--color-intäkter)" stopOpacity={0.1} />
                                                    </linearGradient>
                                                    <linearGradient id="fillKostnader" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="var(--color-kostnader)" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="var(--color-kostnader)" stopOpacity={0.1} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid vertical={false} />
                                                <XAxis 
                                                    dataKey="month" 
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={8}
                                                    minTickGap={32}
                                                />
                                                <ChartTooltip 
                                                    cursor={false} 
                                                    content={
                                                        <ChartTooltipContent 
                                                            labelFormatter={(value) => value}
                                                            indicator="dot"
                                                        />
                                                    } 
                                                />
                                                <Area 
                                                    dataKey="kostnader"
                                                    type="natural" 
                                                    fill="url(#fillKostnader)"
                                                    stroke="var(--color-kostnader)" 
                                                    stackId="a"
                                                />
                                                <Area 
                                                    dataKey="intäkter"
                                                    type="natural" 
                                                    fill="url(#fillIntakter)"
                                                    stroke="var(--color-intäkter)" 
                                                    stackId="a"
                                                />
                                                <ChartLegend content={<ChartLegendContent />} />
                                            </AreaChart>
                                        </ChartContainer>
                                    </div>
                                    <div className="flex-col gap-2 text-sm pt-4 flex items-center">
                                        <div className="flex items-center gap-2 font-medium leading-none">
                                            Årsresultat: +713 000 kr <TrendingUp className="h-4 w-4 text-emerald-500" />
                                        </div>
                                        <div className="leading-none text-muted-foreground">
                                            +18% jämfört med förra året
                                        </div>
                                    </div>
                                </div>

                                {/* Account Balances */}
                                <div className="pt-6 border-t-2 border-border/60">
                                    <div className="grid grid-cols-3 gap-4">
                                        {accounts.map((account) => (
                                            <div key={account.name} className="border-2 border-border/60 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-muted-foreground">{account.name}</span>
                                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="mt-2">
                                                    <span className="text-2xl font-bold">{account.balance.toLocaleString("sv-SE")} kr</span>
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
                                </div>
                            </TabsContent>

                            {/* Transactions & Invoices Tab */}
                            <TabsContent value="transactions" className="space-y-6">
                                {/* Pie Charts Row */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Transaction Pie Chart */}
                                    <Card className="flex flex-col">
                                        <CardHeader className="items-center pb-0">
                                            <CardTitle>Transaktionsstatus</CardTitle>
                                            <CardDescription>{transactionStats.total} transaktioner totalt</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1 pb-0">
                                            <ChartContainer config={transactionPieConfig} className="mx-auto aspect-square max-h-[250px]">
                                                <PieChart>
                                                    <ChartTooltip 
                                                        cursor={false} 
                                                        content={<ChartTooltipContent hideLabel />} 
                                                    />
                                                    <Pie
                                                        data={transactionPieData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        stroke="0"
                                                    />
                                                </PieChart>
                                            </ChartContainer>
                                        </CardContent>
                                        <CardFooter className="flex-col gap-2 text-sm">
                                            <div className="flex items-center gap-2 font-medium leading-none">
                                                {transactionStats.recorded} bokförda ({Math.round((transactionStats.recorded / transactionStats.total) * 100)}%)
                                            </div>
                                            <div className="leading-none text-muted-foreground">
                                                {transactionStats.pending} att bokföra · {transactionStats.missingDocs} saknar underlag
                                            </div>
                                        </CardFooter>
                                    </Card>

                                    {/* Invoice Pie Chart */}
                                    <Card className="flex flex-col">
                                        <CardHeader className="items-center pb-0">
                                            <CardTitle>Fakturastatus</CardTitle>
                                            <CardDescription>{invoiceStats.sent} fakturor skickade</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1 pb-0">
                                            <ChartContainer config={invoicePieConfig} className="mx-auto aspect-square max-h-[250px]">
                                                <PieChart>
                                                    <ChartTooltip 
                                                        cursor={false} 
                                                        content={<ChartTooltipContent hideLabel />} 
                                                    />
                                                    <Pie
                                                        data={invoicePieData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        stroke="0"
                                                    />
                                                </PieChart>
                                            </ChartContainer>
                                        </CardContent>
                                        <CardFooter className="flex-col gap-2 text-sm">
                                            <div className="flex items-center gap-2 font-medium leading-none">
                                                {invoiceStats.totalValue.toLocaleString("sv-SE")} kr fakturerat <TrendingUp className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <div className="leading-none text-muted-foreground">
                                                {invoiceStats.paid} betalda · {invoiceStats.overdue} förfallna
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </div>

                                {/* Monthly Bar Chart */}
                                <div className="pt-6 border-t-2 border-border/60">
                                    <div className="flex items-center gap-2 space-y-0 pb-5 sm:flex-row">
                                        <div className="grid flex-1 gap-1">
                                            <h3 className="font-semibold leading-none tracking-tight">Månatlig jämförelse</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Intäkter och kostnader per månad
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <ChartContainer config={barChartConfig} className="aspect-auto h-[240px] w-full [&_.recharts-bar-rectangle]:transition-all [&_.recharts-bar-rectangle]:duration-150 [&_.recharts-active-bar]:!stroke-foreground [&_.recharts-active-bar]:!stroke-2">
                                            <BarChart data={monthlyRevenueData} barGap={2}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis 
                                                    dataKey="month" 
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={10}
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={10}
                                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                                    width={45}
                                                />
                                                <ChartTooltip 
                                                    cursor={false}
                                                    content={<ChartTooltipContent indicator="dashed" />} 
                                                />
                                                <Bar 
                                                    dataKey="intäkter" 
                                                    fill="var(--color-intäkter)" 
                                                    radius={4}
                                                    activeBar={<rect stroke="hsl(var(--foreground))" strokeWidth={2} rx={4} />}
                                                />
                                                <Bar 
                                                    dataKey="kostnader" 
                                                    fill="var(--color-kostnader)" 
                                                    radius={4}
                                                    activeBar={<rect stroke="hsl(var(--foreground))" strokeWidth={2} rx={4} />}
                                                />
                                                <ChartLegend content={<ChartLegendContent />} />
                                            </BarChart>
                                        </ChartContainer>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Expenses Tab */}
                            <TabsContent value="expenses" className="space-y-6">
                                {/* Pie Chart and Categories */}
                                <div className="grid grid-cols-3 gap-6">
                                    {/* Large Pie Chart */}
                                    <Card className="flex flex-col">
                                        <CardHeader className="items-center pb-0">
                                            <CardTitle>Kostnadsfördelning</CardTitle>
                                            <CardDescription>Januari - December 2024</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1 pb-0">
                                            <ChartContainer config={expensePieConfig} className="mx-auto aspect-square max-h-[250px]">
                                                <PieChart>
                                                    <ChartTooltip 
                                                        cursor={false} 
                                                        content={<ChartTooltipContent hideLabel />} 
                                                    />
                                                    <Pie
                                                        data={expenseCategories.map((cat, index) => ({
                                                            name: Object.keys(expensePieConfig)[index],
                                                            value: cat.amount,
                                                            fill: expensePieColors[index]
                                                        }))}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        stroke="0"
                                                    />
                                                </PieChart>
                                            </ChartContainer>
                                        </CardContent>
                                        <CardFooter className="flex-col gap-2 text-sm">
                                            <div className="flex items-center gap-2 font-medium leading-none">
                                                {totalExpenses.toLocaleString("sv-SE")} kr totalt <TrendingDown className="h-4 w-4" />
                                            </div>
                                            <div className="leading-none text-muted-foreground">
                                                Visar totala kostnader för hela året
                                            </div>
                                        </CardFooter>
                                    </Card>

                                    {/* Category Details */}
                                    <div className="col-span-2 space-y-3">
                                        <h2 className="text-sm font-medium text-muted-foreground mb-3">Kostnadsfördelning per kategori</h2>
                                        {expenseCategories.map((cat, index) => {
                                            const Icon = cat.icon
                                            return (
                                                <div key={cat.category} className="border-2 border-border/60 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div 
                                                                className="h-10 w-10 rounded-lg flex items-center justify-center"
                                                                style={{ backgroundColor: `${expensePieColors[index]}20` }}
                                                            >
                                                                <Icon className="h-5 w-5" style={{ color: expensePieColors[index] }} />
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">{cat.category}</span>
                                                                <p className="text-xs text-muted-foreground">{cat.percentage}% av totala kostnader</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xl font-semibold">{cat.amount.toLocaleString("sv-SE")} kr</span>
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-2">
                                                        <div
                                                            className="h-2 rounded-full transition-all"
                                                            style={{ 
                                                                width: `${cat.percentage}%`,
                                                                backgroundColor: expensePieColors[index]
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </TooltipProvider>
    )
}
