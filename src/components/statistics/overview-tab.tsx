"use client"

import * as React from "react"
import { Wallet, TrendingUp, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { Card } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"
import {
    AreaChart,
    Area,
    XAxis,
    CartesianGrid,
} from "recharts"
import {
    termExplanations,
    revenueChartConfig,
    timeRangeOptions,
} from "./statistics-data"
import { useCompanyStatistics } from "@/hooks/use-company-statistics"

export function OverviewTab() {
    const [timeRange, setTimeRange] = React.useState("12m")

    // Use the hook
    const { financialHealth, monthlyRevenueData, isLoading, accountBalances } = useCompanyStatistics()

    const filteredRevenueData = React.useMemo(() => {
        if (!monthlyRevenueData || monthlyRevenueData.length === 0) return []

        // Simple slicing based on timeRange
        // Assuming data is sorted ASC
        let slice = -12
        switch (timeRange) {
            case "3m": slice = -3; break;
            case "6m": slice = -6; break;
            case "12m": slice = -12; break;
            case "2y": slice = -24; break;
            case "4y": slice = -48; break;
            case "6y": slice = 0; break; // All
        }

        // Try to handle if data length is less than request scice
        if (Math.abs(slice) > monthlyRevenueData.length) slice = 0;

        return slice === 0 ? monthlyRevenueData : monthlyRevenueData.slice(slice)
    }, [monthlyRevenueData, timeRange])

    // Filter for Bank Accounts (19xx)
    const bankAccounts = React.useMemo(() => {
        // Accounts 1900-1999 are typically Liquid Assets / Cash / Bank
        return accountBalances.filter(a => a.accountNumber.startsWith('19'))
    }, [accountBalances])

    // Calculate total result from displayed data for the summary text
    const yearlyResult = React.useMemo(() => {
        return filteredRevenueData.reduce((sum, item) => sum + item.resultat, 0)
    }, [filteredRevenueData])

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Stat cards skeleton */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 rounded-lg bg-muted" />
                    ))}
                </div>
                {/* Chart skeleton */}
                <div className="pt-6 border-t-2 border-border/60">
                    <div className="h-6 w-48 rounded bg-muted mb-4" />
                    <div className="h-[250px] rounded-lg bg-muted" />
                </div>
                {/* Account balances skeleton */}
                <div className="pt-6 border-t-2 border-border/60">
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 rounded-lg bg-muted" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Financial Health KPIs */}
            <div>
                <StatCardGrid columns={4}>
                    {financialHealth.map((kpi) => (
                        <StatCard
                            key={kpi.label}
                            label={kpi.label}
                            value={kpi.value}
                            headerIcon={kpi.icon}
                            tooltip={termExplanations[kpi.label]}
                            change={kpi.change}
                            changeType={kpi.positive ? "positive" : "negative"}
                            subtitle={kpi.subtitle}
                        />
                    ))}
                </StatCardGrid>
            </div>

            {/* Revenue Trend Chart */}
            <div className="pt-6 border-t-2 border-border/60">
                <div className="flex items-center gap-2 space-y-0 pb-5 sm:flex-row">
                    <div className="grid flex-1 gap-1">
                        <h3 className="font-semibold leading-none tracking-tight">Intäkter & Kostnader</h3>
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
                        <SelectContent className="rounded-lg border-2 border-border/60">
                            {timeRangeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="rounded-lg">
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="pt-4">
                    {filteredRevenueData.length > 0 ? (
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
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                            Ingen data tillgänglig för denna period
                        </div>
                    )}
                </div>
                <div className="flex-col gap-2 text-sm pt-4 flex items-center">
                    <div className="flex items-center gap-2 font-medium leading-none">
                        Periodens resultat: {yearlyResult.toLocaleString()} kr <TrendingUp className={cn("h-4 w-4", yearlyResult >= 0 ? "text-emerald-500" : "text-rose-500")} />
                    </div>
                </div>
            </div>

            {/* Account Balances */}
            <div className="pt-6 border-t-2 border-border/60">
                <div className="grid grid-cols-3 gap-4">
                    {bankAccounts.map((account) => (
                        <Card key={account.accountNumber} className="p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-muted-foreground">{account.account?.name || account.accountNumber}</span>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="mt-2">
                                <span className="text-2xl font-bold">{account.balance.toLocaleString("sv-SE")} kr</span>
                            </div>
                        </Card>
                    ))}
                    {bankAccounts.length === 0 && (
                        <div className="col-span-3 text-center py-8 text-muted-foreground">
                            Inga bankkonton hittades.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
