import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { createBrowserClient } from '@/lib/database/client'
import { normalizeBalances } from './use-normalized-balances'
import { useCompany } from '@/providers/company-provider'
import { getAccountClass, isCashAccount } from '@/lib/bookkeeping/utils'
import { Shield, Droplets, Scale, Percent, Users, Building2, Package, CreditCard, Plane, MoreHorizontal } from "lucide-react"

export const companyStatisticsQueryKeys = {
    all: ["company-statistics"] as const,
    dashboard: () => [...companyStatisticsQueryKeys.all, "dashboard"] as const,
}

interface MonthlyFlowEntry {
    month: string
    revenue: number
    expenses: number
    result: number
}

interface DashboardRpcData {
    monthlyFlow: MonthlyFlowEntry[]
    dashboardCounts: {
        transactions: { total: number; unbooked: number }
        invoices: { sent: number; overdue: number; totalValue: number }
    }
    accountBalances: Array<{ account: string; balance: number }>
    prevYearBalances: Array<{ account: string; balance: number }>
}

export function useCompanyStatistics() {
    const { companyType } = useCompany()

    const {
        data: rpcData,
        isLoading,
        error,
    } = useQuery({
        queryKey: companyStatisticsQueryKeys.dashboard(),
        queryFn: async (): Promise<DashboardRpcData> => {
            const supabase = createBrowserClient()
            const year = new Date().getFullYear()
            const prevYearStart = `${year - 1}-01-01`
            const prevYearEnd = `${year - 1}-12-31`

            const [flowRes, countsRes, balancesRes, prevBalancesRes] = await Promise.all([
                supabase.rpc('get_monthly_cashflow', { p_year: year }),
                supabase.rpc('get_dashboard_counts'),
                supabase.rpc('get_account_balances', {
                    p_date_from: '2000-01-01',
                    p_date_to: new Date().toISOString().split('T')[0]
                }),
                supabase.rpc('get_account_balances', {
                    p_date_from: prevYearStart,
                    p_date_to: prevYearEnd
                })
            ])

            if (flowRes.error) console.error('Flow Error:', flowRes.error)
            if (countsRes.error) console.error('Counts Error:', countsRes.error)
            if (balancesRes.error) console.error('Balances Error:', balancesRes.error)
            if (prevBalancesRes.error) console.error('Prev Balances Error:', prevBalancesRes.error)

            // Cast RPC responses to expected shapes (Supabase types return generic Json)
            const counts = (countsRes.data || {
                transactions: { total: 0, unbooked: 0 },
                invoices: { sent: 0, overdue: 0, totalValue: 0 }
            }) as DashboardRpcData['dashboardCounts']

            return {
                monthlyFlow: flowRes.data || [],
                dashboardCounts: counts,
                accountBalances: (balancesRes.data || []).map((row: { account_number: string; balance: number; account_name: string; credit: number; debit: number }) => ({
                    account: String(row.account_number),
                    balance: row.balance
                })),
                prevYearBalances: (prevBalancesRes.data || []).map((row: { account_number: string; balance: number; account_name: string; credit: number; debit: number }) => ({
                    account: String(row.account_number),
                    balance: row.balance
                })),
            }
        },
        staleTime: 5 * 60 * 1000,
    })

    const monthlyFlow = rpcData?.monthlyFlow || []
    const dashboardCounts = rpcData?.dashboardCounts || {
        transactions: { total: 0, unbooked: 0 },
        invoices: { sent: 0, overdue: 0, totalValue: 0 }
    }
    const accountBalances = rpcData?.accountBalances || []
    const prevYearBalances = rpcData?.prevYearBalances || []

    // Calculate totals from account balances using normalized sign convention
    const totals = useMemo(() => {
        const normalized = normalizeBalances(
            accountBalances.map(b => ({ account: b.account, balance: b.balance }))
        )
        return {
            ...normalized,
            bookedEquity: normalized.equity,
        }
    }, [accountBalances])

    // Previous year totals for YoY comparison
    const prevTotals = useMemo(() => {
        return normalizeBalances(
            prevYearBalances.map(b => ({ account: b.account, balance: b.balance }))
        )
    }, [prevYearBalances])

    // 1. Financial KPIs
    const financialHealth = useMemo(() => {
        // Values are already display-friendly (positive) from normalizeBalances
        const assets = totals.assets || 0
        const liabilities = totals.liabilities || 0
        const equity = totals.equity || 0
        const revenue = totals.revenue || 0
        const netIncome = totals.netIncome || 0

        // Check which account classes have data (using getAccountClass for consistency)
        const hasAssets = accountBalances.some(a => getAccountClass(String(a.account)).class === 1 && a.balance !== 0)
        const hasEquity = accountBalances.some(a => String(a.account).startsWith('20') && a.balance !== 0)
        const hasLiabilities = accountBalances.some(a => {
            const cls = getAccountClass(String(a.account))
            return cls.class === 2 && !String(a.account).startsWith('20') && a.balance !== 0
        })
        const hasCash = accountBalances.some(a => isCashAccount(String(a.account)) && a.balance !== 0)
        const hasReceivables = accountBalances.some(a => String(a.account).startsWith('15') && a.balance !== 0)
        const hasRevenue = accountBalances.some(a => getAccountClass(String(a.account)).class === 3 && a.balance !== 0)
        const hasExpenses = accountBalances.some(a => {
            const cls = getAccountClass(String(a.account)).class
            return cls >= 4 && cls <= 8 && a.balance !== 0
        })

        // Calculate values only if we have required data
        const canCalcSolidity = hasAssets && hasEquity
        const solidity = canCalcSolidity && assets > 0 ? (equity / assets) * 100 : null

        const cashAccounts = accountBalances.filter(a => isCashAccount(String(a.account))).reduce((sum, a) => sum + a.balance, 0)
        const receivableAccounts = accountBalances.filter(a => String(a.account).startsWith('15')).reduce((sum, a) => sum + a.balance, 0)
        const currentAssets = cashAccounts + receivableAccounts
        const currentLiabilities = accountBalances
            .filter(a => {
                const num = parseInt(String(a.account).substring(0, 2))
                return num >= 24 && num <= 29
            })
            .reduce((sum, a) => sum + Math.abs(a.balance), 0)
        const hasCurrentLiabilities = currentLiabilities > 0
        const canCalcLiquidity = (hasCash || hasReceivables) && hasCurrentLiabilities
        const liquidity = canCalcLiquidity && currentLiabilities > 0 ? (currentAssets / currentLiabilities) * 100 : null

        const canCalcDebtEquity = hasLiabilities && hasEquity
        const debtEquityRatio = canCalcDebtEquity && equity !== 0 ? liabilities / equity : null

        const canCalcMargin = hasRevenue && hasExpenses
        const profitMargin = canCalcMargin && revenue > 0 ? (netIncome / revenue) * 100 : null

        // YoY comparison using previous year data
        const prevAssets = prevTotals.assets || 0
        const prevEquity = prevTotals.equity || 0
        const prevLiabilities = prevTotals.liabilities || 0
        const prevRevenue = prevTotals.revenue || 0
        const prevNetIncome = prevTotals.netIncome || 0

        const prevSolidity = prevAssets > 0 ? (prevEquity / prevAssets) * 100 : null
        const prevLiquidity = (() => {
            const prevCurrentLiab = prevYearBalances
                .filter(a => { const n = parseInt(String(a.account).substring(0, 2)); return n >= 24 && n <= 29 })
                .reduce((sum, a) => sum + Math.abs(a.balance), 0)
            if (prevCurrentLiab === 0) return null
            const prevCash = prevYearBalances.filter(a => isCashAccount(String(a.account))).reduce((sum, a) => sum + a.balance, 0)
            const prevRecv = prevYearBalances.filter(a => String(a.account).startsWith('15')).reduce((sum, a) => sum + a.balance, 0)
            return ((prevCash + prevRecv) / prevCurrentLiab) * 100
        })()
        const prevDebtEquity = prevEquity !== 0 ? prevLiabilities / prevEquity : null
        const prevProfitMargin = prevRevenue > 0 ? (prevNetIncome / prevRevenue) * 100 : null

        const formatYoY = (current: number | null, previous: number | null): { change: string | null; positive: boolean | null } => {
            if (current === null) return { change: null, positive: null }
            if (previous === null || previous === 0) return { change: 'N/A', positive: null }
            const delta = current - previous
            const sign = delta >= 0 ? '+' : ''
            return { change: `${sign}${delta.toFixed(1)}%`, positive: delta >= 0 }
        }

        const solidityYoY = formatYoY(solidity, prevSolidity)
        const liquidityYoY = formatYoY(liquidity, prevLiquidity)
        const debtEquityYoY = (() => {
            if (debtEquityRatio === null) return { change: null, positive: null }
            if (prevDebtEquity === null || prevDebtEquity === 0) return { change: 'N/A' as string | null, positive: null as boolean | null }
            const delta = debtEquityRatio - prevDebtEquity
            const sign = delta >= 0 ? '+' : ''
            return { change: `${sign}${delta.toFixed(1)}`, positive: delta <= 0 } // lower is better
        })()
        const marginYoY = formatYoY(profitMargin, prevProfitMargin)

        return [
            {
                label: "Soliditet",
                value: solidity !== null ? `${Math.round(solidity)}%` : "-",
                change: solidityYoY.change,
                positive: solidityYoY.positive,
                icon: Shield,
                subtitle: solidity !== null ? "vs förra året" : "Saknar data"
            },
            {
                label: "Kassalikviditet",
                value: liquidity !== null ? `${Math.round(liquidity)}%` : "-",
                change: liquidityYoY.change,
                positive: liquidityYoY.positive !== null ? liquidityYoY.positive : (liquidity !== null ? liquidity > 100 : null),
                icon: Droplets,
                subtitle: liquidity !== null ? "vs förra året" : "Saknar data"
            },
            {
                label: "Skuldsättningsgrad",
                value: debtEquityRatio !== null ? debtEquityRatio.toFixed(1) : "-",
                change: debtEquityYoY.change,
                positive: debtEquityYoY.positive,
                icon: Scale,
                subtitle: debtEquityRatio !== null ? "vs förra året" : "Saknar data"
            },
            {
                label: "Vinstmarginal",
                value: profitMargin !== null ? `${profitMargin.toFixed(1)}%` : "-",
                change: marginYoY.change,
                positive: marginYoY.positive !== null ? marginYoY.positive : (profitMargin !== null ? profitMargin > 0 : null),
                icon: Percent,
                subtitle: profitMargin !== null ? "vs förra året" : "Saknar data"
            },
        ]
    }, [totals, accountBalances, prevTotals, prevYearBalances])

    // 2. Transaction Stats (from RPC)
    const transactionStats = useMemo(() => {
        return {
            total: dashboardCounts.transactions.total,
            recorded: 0,
            pending: dashboardCounts.transactions.unbooked,
            missingDocs: 0,
        }
    }, [dashboardCounts])

    // 3. Invoice Stats (from RPC)
    const invoiceStats = useMemo(() => {
        return {
            sent: dashboardCounts.invoices.sent,
            paid: 0,
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
        const categoryNames: Record<number, string> = {
            4: 'Varuinköp',
            5: 'Övriga externa kostnader',
            6: 'Övriga externa kostnader',
            7: 'Personalkostnader',
            8: 'Finansiellt & Avskrivningar',
        }
        const categories = new Map<string, number>()

        accountBalances.forEach(acc => {
            const accNum = String(acc.account || '')
            const { class: classNum } = getAccountClass(accNum)
            if (classNum >= 4 && classNum <= 8) {
                const group = categoryNames[classNum] || 'Övrigt'
                const current = categories.get(group) || 0
                categories.set(group, current + Math.abs(acc.balance))
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
        error,
        companyType,
        financialHealth,
        transactionStats,
        invoiceStats,
        monthlyRevenueData,
        expenseCategories,
        accountBalances,
    }
}
