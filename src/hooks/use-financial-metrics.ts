
import { useMemo } from "react"
import { useVerifications, type Verification, type VerificationRow } from "./use-verifications"
import { getAccountClass, getFiscalYearRange } from "@/lib/bookkeeping/utils"
import { useCompany } from "@/providers/company-provider"

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
    const { verifications, isLoading, error } = useVerifications()
    const { company } = useCompany()
    const fiscalYearEnd = company?.fiscalYearEnd || '12-31'

    // Helper to determine if an account is revenue/expense using BAS account class
    const getAccountType = (account: string): 'revenue' | 'expense' | 'other' => {
        const classNum = parseInt(account.charAt(0))
        if (isNaN(classNum)) return 'other'
        if (classNum === 3) return 'revenue'
        if (classNum >= 4 && classNum <= 8) return 'expense'
        return 'other'
    }

    const monthlyMetrics = useMemo(() => {
        if (!verifications) return []

        // Get current fiscal year range for filtering
        const currentFY = getFiscalYearRange(fiscalYearEnd)

        const months = new Map<string, { revenue: number; expenses: number }>()

        // Group by month — only include verifications in the current fiscal year
        verifications.forEach((v: Verification) => {
            if (v.date < currentFY.startStr || v.date > currentFY.endStr) return

            const date = new Date(v.date)
            const monthKey = date.toLocaleString('sv-SE', { month: 'short' })

            if (!months.has(monthKey)) {
                months.set(monthKey, { revenue: 0, expenses: 0 })
            }

            const current = months.get(monthKey)!

            v.rows.forEach((row: VerificationRow) => {
                const type = getAccountType(row.account)
                // Normalize using getAccountClass: credit-normal accounts are flipped
                const rawBalance = row.debit - row.credit
                const { normalBalance } = getAccountClass(row.account)
                const displayAmount = normalBalance === 'credit' ? rawBalance * -1 : rawBalance

                if (type === 'revenue') {
                    current.revenue += displayAmount
                } else if (type === 'expense') {
                    current.expenses += displayAmount
                }
            })
        })

        // Reorder months based on fiscal year start
        const allMonths = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]
        const fyEndMonth = parseInt(fiscalYearEnd.split('-')[0])
        const fyStartIdx = fyEndMonth % 12 // e.g. fyEnd=06 → start=index 6 (jul), fyEnd=12 → start=0 (jan)
        const monthNames = [...allMonths.slice(fyStartIdx), ...allMonths.slice(0, fyStartIdx)]

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
    }, [verifications, fiscalYearEnd])

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

    // Compute previous fiscal year totals for YoY comparison
    const prevYearTotals = useMemo(() => {
        if (!verifications) return { revenue: 0, profit: 0, assets: 0, equity: 0 }

        // Previous fiscal year = shift reference date back by 1 year
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        const prevFY = getFiscalYearRange(fiscalYearEnd, oneYearAgo)

        let revenue = 0
        let expenses = 0
        let assets = 0
        let equity = 0

        verifications.forEach((v: Verification) => {
            // Filter to previous fiscal year date range
            if (v.date < prevFY.startStr || v.date > prevFY.endStr) return

            v.rows.forEach((row: VerificationRow) => {
                const rawBalance = row.debit - row.credit
                const { normalBalance } = getAccountClass(row.account)
                const displayAmount = normalBalance === 'credit' ? rawBalance * -1 : rawBalance
                const type = getAccountType(row.account)

                if (type === 'revenue') revenue += displayAmount
                else if (type === 'expense') expenses += displayAmount

                const classNum = parseInt(row.account.charAt(0))
                if (classNum === 1) assets += displayAmount
                if (parseInt(row.account.substring(0, 2)) === 20) equity += displayAmount
            })
        })

        return { revenue, profit: revenue - expenses, assets, equity }
    }, [verifications, fiscalYearEnd])

    const kpis = useMemo(() => {
        const totalRevenue = monthlyMetrics.reduce((sum, m) => sum + m.revenue, 0)
        const totalProfit = monthlyMetrics.reduce((sum, m) => sum + m.profit, 0)

        // Calculate balance sheet metrics from current year verifications
        let assets = 0
        let equity = 0

        if (verifications) {
            verifications.forEach(v => {
                v.rows.forEach(r => {
                    const rawBalance = r.debit - r.credit
                    const { normalBalance } = getAccountClass(r.account)
                    const displayAmount = normalBalance === 'credit' ? rawBalance * -1 : rawBalance

                    const classNum = parseInt(r.account.charAt(0))
                    if (classNum === 1) assets += displayAmount
                    if (parseInt(r.account.substring(0, 2)) === 20) equity += displayAmount
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
        isLoading,
        error,
    }
}
