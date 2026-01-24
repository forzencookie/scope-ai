// @ts-nocheck
import { useMemo, useState, useEffect } from "react"
import { getSupabaseClient } from '@/lib/database/supabase'
import { Shield, Droplets, Scale, Percent, Users, Building2, Package, CreditCard, Plane, MoreHorizontal } from "lucide-react"

export function useCompanyStatistics() {
    const [isLoading, setIsLoading] = useState(true)
    const [monthlyFlow, setMonthlyFlow] = useState<any[]>([])
    const [dashboardCounts, setDashboardCounts] = useState<any>({
        transactions: { total: 0, unbooked: 0 },
        invoices: { sent: 0, overdue: 0, totalValue: 0 }
    })

    // We still need account balances for Financial Health (Solidity etc)
    // But we can fetch them via RPC internally instead of full hook if we want to isolate
    // Or just fetch the minimal 'totals' needed. 
    // For now, let's fetch account balances via RPC to keep it efficient (already implemented in Phase 2.1)
    const [accountBalances, setAccountBalances] = useState<any[]>([])

    useEffect(() => {
        async function fetchStats() {
            setIsLoading(true)
            const supabase = getSupabaseClient()
            try {
                const year = new Date().getFullYear()

                // Parallel fetch
                const [flowRes, countsRes, balancesRes] = await Promise.all([
                    supabase.rpc('get_monthly_cashflow', { p_year: year }),
                    supabase.rpc('get_dashboard_counts'),
                    supabase.rpc('get_account_balances', {
                        date_from: '2000-01-01',
                        date_to: new Date().toISOString().split('T')[0]
                    })
                ])

                if (flowRes.error) console.error('Flow Error:', flowRes.error)
                if (countsRes.error) console.error('Counts Error:', countsRes.error)
                if (balancesRes.error) console.error('Balances Error:', balancesRes.error)

                setMonthlyFlow(flowRes.data || [])
                setDashboardCounts(countsRes.data || {
                    transactions: { total: 0, unbooked: 0 },
                    invoices: { sent: 0, overdue: 0, totalValue: 0 }
                })
                setAccountBalances(balancesRes.data || [])

            } catch (err) {
                console.error('Failed to fetch dashboard stats', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [])

    // Calculate totals from account balances for KPIs
    const totals = useMemo(() => {
        let assets = 0, liabilities = 0, equity = 0, revenue = 0, expenses = 0

        accountBalances.forEach(b => {
            const acc = parseInt(b.account)
            const val = b.balance
            // Logic from reports-processor/use-account-balances
            if (acc >= 1000 && acc <= 1999) assets += (val * -1) // Flip for Asset
            else if (acc >= 2000 && acc <= 2099) equity += val
            else if (acc >= 2100 && acc <= 2999) liabilities += val
            else if (acc >= 3000 && acc <= 3999) revenue += val // Credit (neg)
            else if (acc >= 4000 && acc <= 8999) expenses += val // Debit (pos)
        })

        // Net Income = (Revenue (neg) + Expenses (pos)) * -1
        // Example: Rev -100, Exp 80 -> Net -20. Inverted -> 20 Profit.
        return {
            assets,
            liabilities,
            equity: assets - liabilities, // Simplified Equity check? Or just use booked equity.
            // Let's use booked equity + current result for "Total Equity" in KPIs usually.
            // But strict booked equity is safer.
            bookedEquity: equity,
            revenue: Math.abs(revenue),
            netIncome: (revenue + expenses) * -1
        }
    }, [accountBalances])

    // 1. Financial KPIs
    const financialHealth = useMemo(() => {
        // Get raw values
        const assets = totals.assets || 0
        const liabilities = Math.abs(totals.liabilities) || 0
        const equity = totals.equity || 0
        const revenue = Math.abs(totals.revenue) || 0
        const netIncome = totals.netIncome || 0

        // Check which account classes have data
        const hasAssets = accountBalances.some(a => a.accountNumber.startsWith('1') && a.balance !== 0)
        const hasEquity = accountBalances.some(a => a.accountNumber.startsWith('20') && a.balance !== 0)
        const hasLiabilities = accountBalances.some(a =>
            a.accountNumber.startsWith('2') &&
            !a.accountNumber.startsWith('20') &&
            a.balance !== 0
        )
        const hasCash = accountBalances.some(a => a.accountNumber.startsWith('19') && a.balance !== 0)
        const hasReceivables = accountBalances.some(a => a.accountNumber.startsWith('15') && a.balance !== 0)
        const hasRevenue = accountBalances.some(a => a.accountNumber.startsWith('3') && a.balance !== 0)
        const hasExpenses = accountBalances.some(a =>
            ['4', '5', '6', '7', '8'].some(prefix => a.accountNumber.startsWith(prefix)) &&
            a.balance !== 0
        )

        // Calculate values only if we have required data
        // Soliditet (Equity / Assets) - needs both equity and assets
        const canCalcSolidity = hasAssets && hasEquity
        const solidity = canCalcSolidity && assets > 0 ? (equity / assets) * 100 : null

        // Kassalikviditet (Current Assets / Current Liabilities)
        const cashAccounts = accountBalances.filter(a => a.accountNumber.startsWith('19')).reduce((sum, a) => sum + a.balance, 0)
        const receivableAccounts = accountBalances.filter(a => a.accountNumber.startsWith('15')).reduce((sum, a) => sum + a.balance, 0)
        const currentAssets = cashAccounts + receivableAccounts
        const canCalcLiquidity = (hasCash || hasReceivables) && hasLiabilities
        const liquidity = canCalcLiquidity && liabilities > 0 ? (currentAssets / liabilities) * 100 : null

        // Skuldsättningsgrad (Liabilities / Equity)
        const canCalcDebtEquity = hasLiabilities && hasEquity
        const debtEquityRatio = canCalcDebtEquity && equity !== 0 ? liabilities / equity : null

        // Vinstmarginal (Net Income / Revenue)
        const canCalcMargin = hasRevenue && hasExpenses
        const profitMargin = canCalcMargin && revenue > 0 ? (netIncome / revenue) * 100 : null

        return [
            {
                label: "Soliditet",
                value: solidity !== null ? `${Math.round(solidity)}%` : "-",
                change: solidity !== null ? "+0%" : null,
                positive: solidity !== null ? true : null,
                icon: Shield,
                subtitle: solidity !== null ? "vs förra året" : "Saknar data"
            },
            {
                label: "Kassalikviditet",
                value: liquidity !== null ? `${Math.round(liquidity)}%` : "-",
                change: liquidity !== null ? "+0%" : null,
                positive: liquidity !== null ? liquidity > 100 : null,
                icon: Droplets,
                subtitle: liquidity !== null ? "vs förra året" : "Saknar data"
            },
            {
                label: "Skuldsättningsgrad",
                value: debtEquityRatio !== null ? debtEquityRatio.toFixed(1) : "-",
                change: debtEquityRatio !== null ? "0.0" : null,
                positive: debtEquityRatio !== null ? true : null,
                icon: Scale,
                subtitle: debtEquityRatio !== null ? "vs förra året" : "Saknar data"
            },
            {
                label: "Vinstmarginal",
                value: profitMargin !== null ? `${profitMargin.toFixed(1)}%` : "-",
                change: profitMargin !== null ? "+0%" : null,
                positive: profitMargin !== null ? profitMargin > 0 : null,
                icon: Percent,
                subtitle: profitMargin !== null ? "vs förra året" : "Saknar data"
            },
        ]
    }, [totals, accountBalances]) // Re-calc when RPC data returns

    // 2. Transaction Stats (from RPC)
    const transactionStats = useMemo(() => {
        return {
            total: dashboardCounts.transactions.total,
            recorded: 0, // Not currently returned by RPC, adding simplified
            pending: dashboardCounts.transactions.unbooked,
            missingDocs: 0,
        }
    }, [dashboardCounts])

    // 3. Invoice Stats (from RPC)
    const invoiceStats = useMemo(() => {
        return {
            sent: dashboardCounts.invoices.sent,
            paid: 0, // Not needed for Dash summary cards usually, or add to RPC
            overdue: dashboardCounts.invoices.overdue,
            draft: 0,
            totalValue: dashboardCounts.invoices.totalValue,
            overdueValue: 0,
        }
    }, [dashboardCounts])

    // 4. Monthly Revenue (Trends) from RPC
    const monthlyRevenueData = useMemo(() => {
        return monthlyFlow.map(m => ({
            month: new Date(m.month + '-01').toLocaleDateString('sv-SE', { month: 'short', year: 'numeric' }),
            intäkter: m.revenue,
            kostnader: m.expenses,
            resultat: m.result
        }))
    }, [monthlyFlow])

    const expenseCategories = useMemo(() => {
        // Group expenses by category
        // We can map Account Group to categories
        const categories = new Map<string, number>()

        accountBalances.forEach(acc => {
            if (acc.account?.type === 'expense') {
                const group = acc.account.group || 'Övrigt'
                const current = categories.get(group) || 0
                categories.set(group, current + acc.balance)
            }
        })

        const totalExpenses = Array.from(categories.values()).reduce((a, b) => a + b, 0)

        const colors = ["bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-pink-500", "bg-slate-500"]
        const icons = [Users, Building2, Package, CreditCard, Plane, MoreHorizontal]

        return Array.from(categories.entries()).map(([cat, amount], idx) => ({
            category: cat,
            amount,
            percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
            icon: icons[idx % icons.length] || MoreHorizontal,
            color: colors[idx % colors.length] || "bg-slate-500"
        })).sort((a, b) => b.amount - a.amount)

    }, [accountBalances])

    return {
        isLoading,
        financialHealth,
        transactionStats,
        invoiceStats,
        monthlyRevenueData,
        expenseCategories,
        accountBalances,
    }
}
