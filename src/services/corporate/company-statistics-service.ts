import { createBrowserClient } from '@/lib/database/client'
import { accountService } from '@/services/accounting/account-service'

/**
 * Dashboard data shape consumed by use-company-statistics hook
 */
export interface MonthlyFlowEntry {
    month: string
    revenue: number
    expenses: number
    result: number
}

export interface DashboardRpcData {
    monthlyFlow: MonthlyFlowEntry[]
    dashboardCounts: {
        transactions: { total: number; unbooked: number }
        invoices: { sent: number; overdue: number; totalValue: number }
    }
    accountBalances: Array<{ account: string; balance: number }>
    prevYearBalances: Array<{ account: string; balance: number }>
}

/**
 * Company-wide statistics aggregated from multiple tables
 */
export interface CompanyStatistics {
    // Financial overview
    revenue: number
    expenses: number
    netResult: number
    cashBalance: number

    // Transaction stats
    transactionCount: number
    pendingTransactionCount: number
    uncategorizedCount: number

    // Invoice stats
    invoicesTotalAmount: number
    invoicesOutstandingAmount: number
    invoicesOverdueCount: number

    // Receipt stats
    receiptCount: number
    unmatchedReceiptCount: number

    // Employee stats
    employeeCount: number
    totalPayrollCost: number

    // Asset stats
    totalAssetValue: number
    assetCount: number

    // Period info
    currentPeriod: string
    fiscalYear: number
}

/**
 * Monthly financial summary
 */
export interface MonthlyFinancialSummary {
    month: string // YYYY-MM
    revenue: number
    expenses: number
    netResult: number
    transactionCount: number
}

/**
 * Cash flow summary
 */
export interface CashFlowSummary {
    operatingCashFlow: number
    investingCashFlow: number
    financingCashFlow: number
    netCashFlow: number
    openingBalance: number
    closingBalance: number
}

export const companyStatisticsService = {
    /**
     * Get comprehensive company statistics
     */
    async getStatistics(year?: number): Promise<CompanyStatistics> {
        const supabase = createBrowserClient()
        const targetYear = year || new Date().getFullYear()
        const yearStart = `${targetYear}-01-01`
        const yearEnd = `${targetYear}-12-31`

        // Run multiple queries in parallel
        const [
            transactionStats,
            invoiceStats,
            receiptStats,
            employeeStats,
            assetStats,
            accountBalances
        ] = await Promise.all([
            // Transaction statistics
            supabase
                .from('transactions')
                .select('id, amount, status', { count: 'exact' })
                .gte('date', yearStart)
                .lte('date', yearEnd),

            // Invoice statistics (customer invoices)
            supabase
                .from('customer_invoices')
                .select('id, total_amount, status, due_date', { count: 'exact' })
                .gte('invoice_date', yearStart)
                .lte('invoice_date', yearEnd),

            // Receipt statistics
            supabase
                .from('receipts')
                .select('id, amount, status', { count: 'exact' })
                .gte('captured_at', yearStart),

            // Employee count
            supabase
                .from('employees')
                .select('id, monthly_salary', { count: 'exact' })
                .eq('status', 'active'),

            // Asset statistics (inventarier uses Swedish column names)
            supabase
                .from('inventarier')
                .select('id, inkopspris, restvarde, status')
                .eq('status', 'aktiv'),

            // Account balances for revenue/expenses
            supabase
                .from('account_balances')
                .select('account_number, balance')
                .eq('year', targetYear)
        ])

        // Calculate transaction metrics
        let pendingCount = 0
        let uncategorizedCount = 0
        const transactions = transactionStats.data || []
        for (const t of transactions) {
            if (t.status === 'Obokförd') pendingCount++
            if (t.status === 'Obokförd') uncategorizedCount++
        }

        // Calculate invoice metrics
        let invoicesTotal = 0
        let invoicesOutstanding = 0
        let overdueCount = 0
        const today = new Date().toISOString().split('T')[0]
        const invoices = invoiceStats.data || []
        for (const inv of invoices) {
            invoicesTotal += inv.total_amount || 0
            if (inv.status !== 'Betald') {
                invoicesOutstanding += inv.total_amount || 0
                if (inv.due_date && inv.due_date < today) {
                    overdueCount++
                }
            }
        }

        // Calculate receipt metrics
        let unmatchedReceipts = 0
        const receipts = receiptStats.data || []
        for (const r of receipts) {
            if (r.status === 'Ny') {
                unmatchedReceipts++
            }
        }

        // Calculate payroll cost
        let totalPayroll = 0
        const employees = employeeStats.data || []
        for (const emp of employees) {
            totalPayroll += (emp.monthly_salary || 0) * 12 // Annual cost
        }

        // Calculate asset value (Swedish column names: restvarde = book value, inkopspris = purchase price)
        let assetValue = 0
        const assets = assetStats.data || []
        for (const a of assets) {
            assetValue += a.restvarde || a.inkopspris || 0
        }

        // Calculate revenue and expenses from account balances
        let revenue = 0
        let expenses = 0
        let cashBalance = 0
        const balances = accountBalances.data || []
        for (const b of balances) {
            const accNum = b.account_number
            const balance = b.balance || 0
            const firstDigit = accNum.charAt(0)

            if (accNum.startsWith('19')) {
                // Cash accounts
                cashBalance += balance
            } else if (firstDigit === '3') {
                // Revenue
                revenue += balance
            } else if (['4', '5', '6', '7', '8'].includes(firstDigit)) {
                // Expenses
                expenses += balance
            }
        }

        const currentMonth = new Date().toISOString().slice(0, 7)

        return {
            revenue,
            expenses,
            netResult: revenue - expenses,
            cashBalance,

            transactionCount: transactionStats.count || 0,
            pendingTransactionCount: pendingCount,
            uncategorizedCount,

            invoicesTotalAmount: invoicesTotal,
            invoicesOutstandingAmount: invoicesOutstanding,
            invoicesOverdueCount: overdueCount,

            receiptCount: receiptStats.count || 0,
            unmatchedReceiptCount: unmatchedReceipts,

            employeeCount: employeeStats.count || 0,
            totalPayrollCost: totalPayroll,

            totalAssetValue: assetValue,
            assetCount: assets.length,

            currentPeriod: currentMonth,
            fiscalYear: targetYear
        }
    },

    /**
     * Get monthly financial summary for the year
     */
    async getMonthlyBreakdown(year?: number): Promise<MonthlyFinancialSummary[]> {
        const supabase = createBrowserClient()
        const targetYear = year || new Date().getFullYear()

        // Get all transactions for the year grouped by month
        const { data: transactions } = await supabase
            .from('transactions')
            .select('date, amount_value, status')
            .gte('date', `${targetYear}-01-01`)
            .lte('date', `${targetYear}-12-31`)

        // Group by month
        const monthlyData: Record<string, { revenue: number; expenses: number; count: number }> = {}

        for (let m = 1; m <= 12; m++) {
            const monthKey = `${targetYear}-${String(m).padStart(2, '0')}`
            monthlyData[monthKey] = { revenue: 0, expenses: 0, count: 0 }
        }

        for (const t of transactions || []) {
            if (!t.date) continue
            const monthKey = t.date.slice(0, 7)
            if (!monthlyData[monthKey]) continue

            const amount = t.amount_value || 0
            monthlyData[monthKey].count++
            
            if (amount > 0) {
                monthlyData[monthKey].revenue += amount
            } else {
                monthlyData[monthKey].expenses += Math.abs(amount)
            }
        }

        return Object.entries(monthlyData).map(([month, data]) => ({
            month,
            revenue: data.revenue,
            expenses: data.expenses,
            netResult: data.revenue - data.expenses,
            transactionCount: data.count
        }))
    },

    /**
     * Get key performance indicators
     */
    async getKPIs(year?: number): Promise<{
        grossMargin: number
        operatingMargin: number
        currentRatio: number
        quickRatio: number
        debtToEquity: number
        returnOnEquity: number
    }> {
        const supabase = createBrowserClient()
        const targetYear = year || new Date().getFullYear()

        const { data: balances } = await supabase
            .from('account_balances')
            .select('account_number, balance')
            .eq('year', targetYear)

        let revenue = 0
        let costOfGoods = 0
        let operatingExpenses = 0
        let currentAssets = 0
        let currentLiabilities = 0
        let inventory = 0
        let totalLiabilities = 0
        let equity = 0

        for (const b of balances || []) {
            const accNum = b.account_number
            const balance = b.balance || 0
            const prefix = accNum.substring(0, 2)

            // Revenue (3xxx)
            if (accNum.startsWith('3')) {
                revenue += balance
            }
            // Cost of goods sold (4xxx)
            else if (accNum.startsWith('4')) {
                costOfGoods += balance
            }
            // Operating expenses (5xxx-7xxx)
            else if (['5', '6', '7'].includes(accNum.charAt(0))) {
                operatingExpenses += balance
            }
            // Current assets (14xx-19xx)
            else if (prefix >= '14' && prefix <= '19') {
                currentAssets += balance
                // Inventory (14xx)
                if (prefix === '14') {
                    inventory += balance
                }
            }
            // Current liabilities (24xx-29xx)
            else if (prefix >= '24' && prefix <= '29') {
                currentLiabilities += balance
            }
            // All liabilities (22xx-29xx)
            else if (prefix >= '22' && prefix <= '29') {
                totalLiabilities += balance
            }
            // Equity (20xx-21xx)
            else if (prefix >= '20' && prefix <= '21') {
                equity += balance
            }
        }

        const grossProfit = revenue - costOfGoods
        const operatingProfit = grossProfit - operatingExpenses

        return {
            grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
            operatingMargin: revenue > 0 ? (operatingProfit / revenue) * 100 : 0,
            currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
            quickRatio: currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0,
            debtToEquity: equity > 0 ? totalLiabilities / equity : 0,
            returnOnEquity: equity > 0 ? (operatingProfit / equity) * 100 : 0
        }
    },

    /**
     * Get dashboard counts for quick overview
     */
    async getDashboardCounts(): Promise<{
        transactions: { total: number; pending: number }
        invoices: { total: number; overdue: number }
        receipts: { total: number; unmatched: number }
        employees: { total: number }
    }> {
        const supabase = createBrowserClient()
        const today = new Date().toISOString().split('T')[0]

        const [transactions, invoices, receipts, employees] = await Promise.all([
            supabase.from('transactions').select('status', { count: 'exact' }),
            supabase.from('customer_invoices').select('status, due_date', { count: 'exact' }),
            supabase.from('receipts').select('status', { count: 'exact' }),
            supabase.from('employees').select('id', { count: 'exact' }).eq('status', 'Aktiv')
        ])

        const pendingTx = (transactions.data || []).filter(t => t.status === 'Obokförd').length
        const overdueInv = (invoices.data || []).filter(i => i.status !== 'Betald' && i.due_date != null && i.due_date < today).length
        const unmatchedRec = (receipts.data || []).filter(r => r.status === 'Ny').length

        return {
            transactions: { total: transactions.count || 0, pending: pendingTx },
            invoices: { total: invoices.count || 0, overdue: overdueInv },
            receipts: { total: receipts.count || 0, unmatched: unmatchedRec },
            employees: { total: employees.count || 0 }
        }
    },

    /**
     * Get monthly cashflow via RPC
     */
    async getMonthlyCashflow(year: number): Promise<MonthlyFlowEntry[]> {
        const supabase = createBrowserClient()
        const { data, error } = await supabase.rpc('get_monthly_cashflow', { p_year: year })
        if (error) console.error('Flow Error:', error)
        return (data || []) as MonthlyFlowEntry[]
    },

    /**
     * Get dashboard counts via RPC (transactions + invoices)
     */
    async getRpcDashboardCounts(): Promise<DashboardRpcData['dashboardCounts']> {
        const supabase = createBrowserClient()
        const { data, error } = await supabase.rpc('get_dashboard_counts')
        if (error) console.error('Counts Error:', error)

        const fallback: DashboardRpcData['dashboardCounts'] = {
            transactions: { total: 0, unbooked: 0 },
            invoices: { sent: 0, overdue: 0, totalValue: 0 },
        }
        return (data || fallback) as DashboardRpcData['dashboardCounts']
    },

    /**
     * Get combined dashboard data for the statistics hook.
     * Runs all 4 RPC calls in parallel and returns the DashboardRpcData shape.
     */
    async getDashboardData(year: number): Promise<DashboardRpcData> {
        const today = new Date().toISOString().split('T')[0]
        const prevYearStart = `${year - 1}-01-01`
        const prevYearEnd = `${year - 1}-12-31`

        const [monthlyFlow, dashboardCounts, accountBalances, prevYearBalances] = await Promise.all([
            this.getMonthlyCashflow(year),
            this.getRpcDashboardCounts(),
            accountService.getBalancesForPeriod('2000-01-01', today),
            accountService.getBalancesForPeriod(prevYearStart, prevYearEnd),
        ])

        return {
            monthlyFlow,
            dashboardCounts,
            accountBalances,
            prevYearBalances,
        }
    },
}
