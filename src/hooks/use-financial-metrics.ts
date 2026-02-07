
import { useMemo } from "react"
import { useVerifications, type Verification, type VerificationRow } from "./use-verifications"

export interface MonthlyMetric {
    month: string
    revenue: number
    expenses: number
    profit: number
    accumulatedProfit: number
}

export interface KPI {
    label: string
    value: string
    change: string
    positive: boolean
    raw: number
}

export interface ExpenseCategory {
    category: string // e.g. "Materials"
    amount: number
    percentage: number
}

export function useFinancialMetrics() {
    const { verifications, isLoading } = useVerifications()

    // Helper to determine if an account is revenue/expense
    const getAccountType = (account: string) => {
        const acc = parseInt(account)
        if (isNaN(acc)) return 'other'
        if (acc >= 3000 && acc <= 3999) return 'revenue'
        if (acc >= 4000 && acc <= 7999) return 'expense' // 8000+ is financial, tax etc, usually expense too
        if (acc >= 8000 && acc <= 8999) return 'financial'
        return 'other'
    }

    const monthlyMetrics = useMemo(() => {
        if (!verifications) return []

        const months = new Map<string, { revenue: number; expenses: number }>()

        // Initialize last 12 months
        for (let i = 11; i >= 0; i--) {
            // Initialize if not exists (though we iterate verifications, we want consistent x-axis)
            // Actually, simpler to just map data we have, but chart needs fixed axis usually.
            // Let's stick to dynamically filling based on available data for now, or fixed list.
            // The chart in Foretagsstatistik uses "Jan", "Feb" etc.
        }

        // Group by month
        verifications.forEach((v: Verification) => {
            const date = new Date(v.date)
            const monthKey = date.toLocaleString('sv-SE', { month: 'short' })
            // Filter for current year or rolling? Let's assume current year (2024 in context)
            // Or 12 rolling months. Let's do 12 rolling months for charts.

            if (!months.has(monthKey)) {
                months.set(monthKey, { revenue: 0, expenses: 0 })
            }

            const current = months.get(monthKey)!

            v.rows.forEach((row: VerificationRow) => {
                const type = getAccountType(row.account)
                // Revenue (Class 3) is Credit (-). We want positive number for chart.
                // Expenses (Class 4-8) is Debit (+). We want positive number for chart.

                if (type === 'revenue') {
                    // Revenue increases with Credit. Net is negative. 
                    // Add absolute value of Credit-heavy net to Revenue.
                    // Actually, strictly: Revenue += (Credit - Debit).
                    current.revenue += (row.credit - row.debit)
                } else if (type === 'expense' || type === 'financial') {
                    // Expense increases with Debit. Net is positive.
                    current.expenses += (row.debit - row.credit)
                }
            })
        })

        // Convert to array and sort (simple sort by month index)
        // For now, let's map hardcoded months to ensure order if we want "Jan-Dec" of current year.
        // The previous mocked data was for "Current Year".
        const monthNames = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]

        let accumulated = 0
        return monthNames.map(m => {
            const data = months.get(m) || { revenue: 0, expenses: 0 }
            const profit = data.revenue - data.expenses
            accumulated += profit
            return {
                month: m,
                revenue: data.revenue,
                expenses: data.expenses,
                profit: profit,
                accumulatedProfit: accumulated
            }
        })
    }, [verifications])

    const expenseDistribution = useMemo(() => {
        if (!verifications) return []

        // Categories:
        // 4000-4999: Material/Varor
        // 5000-6999: Övriga externa
        // 7000-7999: Personal
        // 8000+: Finansiella/Avskrivningar

        const cats = {
            "Varor & Material": 0,
            "Övriga externa": 0,
            "Personal": 0,
            "Avskrivningar/Finans": 0
        }

        let totalExp = 0

        verifications.forEach((v) => {
            v.rows.forEach((row) => {
                const acc = parseInt(row.account)
                const amount = row.debit - row.credit
                if (amount > 0) { // Only count debits as expenses roughly
                    if (acc >= 4000 && acc <= 4999) { cats["Varor & Material"] += amount; totalExp += amount; }
                    else if (acc >= 5000 && acc <= 6999) { cats["Övriga externa"] += amount; totalExp += amount; }
                    else if (acc >= 7000 && acc <= 7999) { cats["Personal"] += amount; totalExp += amount; }
                    else if (acc >= 8000) { cats["Avskrivningar/Finans"] += amount; totalExp += amount; }
                }
            })
        })

        return Object.entries(cats).map(([name, value]) => ({
            category: name,
            amount: value,
            percentage: totalExp > 0 ? (value / totalExp) * 100 : 0
        })).sort((a, b) => b.amount - a.amount)

    }, [verifications])

    // Compute previous year totals for YoY comparison
    const prevYearTotals = useMemo(() => {
        if (!verifications) return { revenue: 0, profit: 0, assets: 0, equity: 0 }
        const prevYear = new Date().getFullYear() - 1

        let revenue = 0
        let expenses = 0
        let assets = 0
        let equity = 0

        verifications.forEach((v: Verification) => {
            const year = new Date(v.date).getFullYear()
            if (year !== prevYear) return

            v.rows.forEach((row: VerificationRow) => {
                const type = getAccountType(row.account)
                if (type === 'revenue') revenue += (row.credit - row.debit)
                else if (type === 'expense' || type === 'financial') expenses += (row.debit - row.credit)

                const acc = parseInt(row.account)
                const val = row.debit - row.credit
                if (acc >= 1000 && acc <= 1999) assets += val
                if (acc >= 2000 && acc <= 2099) equity -= val
            })
        })

        return { revenue, profit: revenue - expenses, assets, equity }
    }, [verifications])

    const kpis = useMemo(() => {
        const totalRevenue = monthlyMetrics.reduce((sum, m) => sum + m.revenue, 0)
        const totalProfit = monthlyMetrics.reduce((sum, m) => sum + m.profit, 0)

        // Calculate balance sheet metrics from current year verifications
        let assets = 0
        let equity = 0

        if (verifications) {
            verifications.forEach(v => {
                v.rows.forEach(r => {
                    const acc = parseInt(r.account)
                    const val = r.debit - r.credit
                    if (acc >= 1000 && acc <= 1999) assets += val
                    if (acc >= 2000 && acc <= 2099) equity -= val
                })
            })
        }

        const adjustedEquity = equity + totalProfit
        const solidity = assets > 0 ? (adjustedEquity / assets) * 100 : 0
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

        // Compute real YoY changes
        const prevAdjustedEquity = prevYearTotals.equity + prevYearTotals.profit
        const prevSolidity = prevYearTotals.assets > 0 ? (prevAdjustedEquity / prevYearTotals.assets) * 100 : 0
        const prevProfitMargin = prevYearTotals.revenue > 0 ? (prevYearTotals.profit / prevYearTotals.revenue) * 100 : 0

        const formatChange = (current: number, previous: number): { change: string; positive: boolean } => {
            if (previous === 0 && current === 0) return { change: '—', positive: true }
            if (previous === 0) return { change: 'nytt', positive: current >= 0 }
            const pct = ((current - previous) / Math.abs(previous)) * 100
            const sign = pct >= 0 ? '+' : ''
            return { change: `${sign}${pct.toFixed(0)}%`, positive: pct >= 0 }
        }

        const revenueChange = formatChange(totalRevenue, prevYearTotals.revenue)
        const profitChange = formatChange(totalProfit, prevYearTotals.profit)
        const solidityDelta = solidity - prevSolidity
        const marginDelta = profitMargin - prevProfitMargin

        return [
            {
                label: "Omsättning",
                value: `${(totalRevenue / 1000000).toFixed(2)} mkr`,
                change: revenueChange.change,
                positive: revenueChange.positive,
                raw: totalRevenue
            },
            {
                label: "Resultat",
                value: `${(totalProfit / 1000).toFixed(0)} tkr`,
                change: profitChange.change,
                positive: profitChange.positive,
                raw: totalProfit
            },
            {
                label: "Soliditet",
                value: `${solidity.toFixed(0)}%`,
                change: prevSolidity > 0 ? `${solidityDelta >= 0 ? '+' : ''}${solidityDelta.toFixed(0)}%` : '—',
                positive: solidityDelta >= 0,
                raw: solidity
            },
            {
                label: "Vinstmarginal",
                value: totalRevenue > 0 ? `${profitMargin.toFixed(1)}%` : "0%",
                change: prevProfitMargin > 0 ? `${marginDelta >= 0 ? '+' : ''}${marginDelta.toFixed(1)}%` : '—',
                positive: marginDelta >= 0,
                raw: totalRevenue > 0 ? (totalProfit / totalRevenue) : 0
            },
        ]
    }, [monthlyMetrics, verifications, prevYearTotals])

    return {
        monthlyMetrics,
        expenseDistribution,
        kpis,
        isLoading
    }
}
