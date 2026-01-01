"use client"

import { TrendingUp, Loader2 } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"
import {
    PieChart,
    Pie,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Cell
} from "recharts"
import {
    transactionPieConfig,
    invoicePieConfig,
    barChartConfig,
} from "./statistics-data"
import { useCompanyStatistics } from "@/hooks/use-company-statistics"

export function TransactionsTab() {
    const { transactionStats, invoiceStats, monthlyRevenueData, isLoading } = useCompanyStatistics()

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Pie charts skeleton */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="h-[360px] rounded-lg bg-muted" />
                    <div className="h-[360px] rounded-lg bg-muted" />
                </div>
                {/* Bar chart skeleton */}
                <div className="pt-6 border-t-2 border-border/60">
                    <div className="h-6 w-48 rounded bg-muted mb-4" />
                    <div className="h-[240px] rounded-lg bg-muted" />
                </div>
            </div>
        )
    }

    const transactionPieDataRaw = [
        { name: "bokförda", value: transactionStats.recorded, fill: "var(--chart-1)" },
        { name: "attBokföra", value: transactionStats.pending, fill: "var(--chart-2)" },
        { name: "saknarUnderlag", value: transactionStats.missingDocs, fill: "var(--chart-5)" },
    ]
    const transactionPieData = transactionPieDataRaw.filter(d => d.value > 0)
    const hasTransactionData = transactionPieData.length > 0

    const invoicePieDataRaw = [
        { name: "betalda", value: invoiceStats.paid, fill: "var(--chart-1)" },
        { name: "förfallna", value: invoiceStats.overdue, fill: "var(--chart-5)" },
        { name: "utkast", value: invoiceStats.draft, fill: "var(--chart-4)" },
    ]
    const invoicePieData = invoicePieDataRaw.filter(d => d.value > 0)
    const hasInvoiceData = invoicePieData.length > 0

    const percentageBooked = transactionStats.total > 0
        ? Math.round((transactionStats.recorded / transactionStats.total) * 100)
        : 0

    return (
        <div className="space-y-6">
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
                                    data={hasTransactionData ? transactionPieData : [{ name: "Ingen data", value: 1 }]}
                                    dataKey="value"
                                    nameKey="name"
                                    stroke="0"
                                >
                                    {hasTransactionData ? transactionPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    )) : (
                                        <Cell fill="var(--muted)" />
                                    )}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2 font-medium leading-none">
                            {transactionStats.recorded} bokförda ({percentageBooked}%)
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
                                    data={hasInvoiceData ? invoicePieData : [{ name: "Ingen data", value: 1 }]}
                                    dataKey="value"
                                    nameKey="name"
                                    stroke="0"
                                >
                                    {hasInvoiceData ? invoicePieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    )) : (
                                        <Cell fill="var(--muted)" />
                                    )}
                                </Pie>
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
                    {monthlyRevenueData.length > 0 ? (
                        <ChartContainer config={barChartConfig} className="aspect-auto h-[240px] w-full [&_.recharts-bar-rectangle]:transition-all [&_.recharts-bar-rectangle]:duration-150 [&_.recharts-active-bar]:!stroke-foreground [&_.recharts-active-bar]:!stroke-2">
                            <BarChart data={monthlyRevenueData.slice(-12)} barGap={2}>
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
                                />
                                <Bar
                                    dataKey="kostnader"
                                    fill="var(--color-kostnader)"
                                    radius={4}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[240px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                            Ingen data tillgänglig
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
