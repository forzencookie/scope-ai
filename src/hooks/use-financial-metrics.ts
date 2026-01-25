
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
        const now = new Date()
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

    const kpis = useMemo(() => {
        // Calculate totals
        const totalRevenue = monthlyMetrics.reduce((sum, m) => sum + m.revenue, 0)
        const totalProfit = monthlyMetrics.reduce((sum, m) => sum + m.profit, 0)

        // We would need previous year for "change" calculation. 
        // For now, we'll keep static change % or calculate if we had last year data.
        // Let's just mock change for now based on some heuristic or keep it static.

        // Calculate Solidity (Eget Kapital / Totalt Kapital)
        // Need Balance Sheet Data.
        // Eget Kapital (Class 20xx)
        // Assets (Class 1xxx)

        let assets = 0
        let equity = 0

        if (verifications) {
            verifications.forEach(v => {
                v.rows.forEach(r => {
                    const acc = parseInt(r.account)
                    const val = r.debit - r.credit
                    if (acc >= 1000 && acc <= 1999) assets += val
                    if (acc >= 2000 && acc <= 2099) equity -= val // Equity is Credit normal
                    // Note: Current year profit is also Equity but usually booked at end of year.
                    // Ideally: Equity = Start Equity + Profit.
                    // Simple version: Equity account balance + totalProfit
                })
            })
        }

        // Basic solidity approximation: (Reported Equity + Current Result) / Assets
        // Since specific Equity booking might happen only at year end, we add totalProfit to equity base.
        const adjustedEquity = equity + totalProfit
        const solidity = assets > 0 ? (adjustedEquity / assets) * 100 : 0

        // Treasury (Liquid assets)
        // 19xx accounts
        // Liquidity = Current Assets / Current Liabilities

        return [
            {
                label: "Omsättning",
                value: `${(totalRevenue / 1000000).toFixed(2)} mkr`,
                change: "+12%",
                positive: true,
                raw: totalRevenue
            },
            {
                label: "Resultat",
                value: `${(totalProfit / 1000).toFixed(0)} tkr`,
                change: "+8%",
                positive: true,
                raw: totalProfit
            },
            {
                label: "Soliditet",
                value: `${solidity.toFixed(0)}%`,
                change: "+3%",
                positive: true,
                raw: solidity
            },
            {
                label: "Vinstmarginal",
                value: totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%` : "0%",
                change: "-2%",
                positive: totalProfit > 0,
                raw: totalRevenue > 0 ? (totalProfit / totalRevenue) : 0
            },
        ]
    }, [monthlyMetrics, verifications])

    return {
        monthlyMetrics,
        expenseDistribution,
        kpis,
        isLoading
    }
}
