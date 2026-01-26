"use client"

import { useMemo } from "react"
import { 
    ArrowDownLeft, 
    ArrowUpRight, 
    Clock, 
    TrendingUp,
    TrendingDown,
    Wallet,
} from "lucide-react"

import { 
    PageSidebar, 
    ActivityFeed, 
    QuickStats, 
    Sparkline,
    DonutMini,
    type ActivityItem,
    type QuickStat,
    type DonutSegment
} from "@/components/shared/page-sidebar"
import type { TransactionWithAI } from "@/types"
import type { TransactionStats } from "@/services/transaction-service"
import { safeNumber } from "@/lib/utils"

interface TransactionsSidebarProps {
    transactions: TransactionWithAI[]
    stats?: TransactionStats
}

export function TransactionsSidebar({ transactions, stats }: TransactionsSidebarProps) {
    // Convert recent transactions to activity items
    const recentActivities = useMemo<ActivityItem[]>(() => {
        return transactions.slice(0, 5).map(tx => ({
            id: tx.id,
            title: tx.description || tx.name || "Transaktion",
            subtitle: tx.category || undefined,
            timestamp: new Date(tx.date).toLocaleDateString("sv-SE", { 
                day: "numeric", 
                month: "short" 
            }),
            icon: safeNumber(tx.amountValue) >= 0 ? ArrowDownLeft : ArrowUpRight,
            iconColor: safeNumber(tx.amountValue) >= 0 ? "text-green-500" : "text-red-500",
        }))
    }, [transactions])

    // Quick stats from transaction stats
    const quickStats = useMemo<QuickStat[]>(() => {
        if (!stats) return []
        return [
            {
                label: "Totalt",
                value: stats.totalCount,
                icon: Wallet
            },
            {
                label: "Inkomster",
                value: stats.income || 0,
                icon: TrendingUp,
                changeType: "positive" as const
            },
            {
                label: "Utgifter",
                value: Math.abs(stats.expenses || 0),
                icon: TrendingDown,
                changeType: "negative" as const
            },
            {
                label: "Väntar",
                value: stats.pending,
                icon: Clock
            }
        ]
    }, [stats])

    // Donut chart for income vs expenses
    const cashFlowDonut = useMemo<DonutSegment[]>(() => {
        if (!stats) return []
        return [
            { value: stats.income || 0, label: "Inkomster", color: "hsl(142, 76%, 36%)" }, // green
            { value: Math.abs(stats.expenses || 0), label: "Utgifter", color: "hsl(0, 84%, 60%)" }, // red
        ].filter(s => s.value > 0)
    }, [stats])

    // Sparkline data - group transactions by day for trend
    const trendData = useMemo(() => {
        // Group by date and sum amounts
        const byDate = new Map<string, number>()
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (6 - i))
            return d.toISOString().split("T")[0]
        })
        
        // Initialize all days to 0
        last7Days.forEach(date => byDate.set(date, 0))
        
        // Sum transactions per day
        transactions.forEach(tx => {
            const date = tx.date.split("T")[0]
            if (byDate.has(date)) {
                byDate.set(date, (byDate.get(date) || 0) + safeNumber(tx.amountValue))
            }
        })
        
        return last7Days.map(date => ({
            value: byDate.get(date) || 0,
            label: date
        }))
    }, [transactions])

    return (
        <PageSidebar>
            <div className="space-y-4">
                {/* Quick Stats */}
                {quickStats.length > 0 && (
                    <QuickStats 
                        title="Statistik" 
                        stats={quickStats} 
                    />
                )}

                {/* Income vs Expenses */}
                {cashFlowDonut.length > 0 && (
                    <DonutMini
                        title="Kassaflöde"
                        description="Inkomster vs utgifter"
                        data={cashFlowDonut}
                        centerValue={stats?.totalCount}
                        centerLabel="totalt"
                    />
                )}

                {/* 7-day Trend */}
                {trendData.length > 0 && (
                    <Sparkline
                        title="7-dagars trend"
                        description="Nettotransaktioner per dag"
                        data={trendData}
                        height={48}
                        color="hsl(var(--primary))"
                        showArea
                    />
                )}

                {/* Recent Activity */}
                <ActivityFeed
                    title="Senaste transaktioner"
                    items={recentActivities}
                    maxItems={5}
                    emptyMessage="Inga transaktioner"
                />
            </div>
        </PageSidebar>
    )
}
