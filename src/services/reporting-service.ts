import { createBrowserClient } from '@/lib/database/client'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import { accountService, type Account } from './account-service'

/**
 * Internal helper to get the correct Supabase client (passed in or default browser).
 */
function getSupabase(client?: SupabaseClient<Database>) {
    return client || createBrowserClient()
}

export interface FinancialItem {
    label: string
    value: number
    isHeader?: boolean
    isTotal?: boolean
    level?: number // 1, 2, 3
}

export interface FinancialSection {
    title: string
    items: { id?: string; label: string; value: number }[]
    total: number
    isHighlight?: boolean
}

export interface FinancialReport {
    incomeStatement: FinancialSection[]
    balanceSheet: FinancialSection[]
    summary: {
        revenue: number
        result: number
        assets: number
        equity: number
    }
}

/**
 * Reporting Service - The "Deterministic Oracle" for all financial math.
 * Consolidated from legacy processors to ensure AI and UI consistency.
 */
export const reportingService = {
    /**
     * Get a full financial report for a given date range.
     * Uses optimized RPC for account balances.
     */
    async getFinancialReport(startDate: string, endDate: string, client?: SupabaseClient<Database>): Promise<FinancialReport> {
        const balances = await accountService.getAccountBalances(startDate, endDate, client)
        
        return {
            incomeStatement: this.calculateIncomeStatement(balances),
            balanceSheet: this.calculateBalanceSheet(balances, endDate),
            summary: this.calculateSummary(balances)
        }
    },

    /**
     * Internal: Calculate Income Statement sections from balances.
     */
    calculateIncomeStatement(balances: Account[]): FinancialSection[] {
        const getItemsInRange = (start: number, end: number) => {
            return balances
                .filter(b => {
                    const num = parseInt(b.accountNumber)
                    return num >= start && num <= end && Math.abs(b.balance) > 0.01
                })
                .map(b => ({
                    id: b.accountNumber,
                    label: b.accountName,
                    value: b.balance // RPC returns credit - debit for result accounts
                }))
                .sort((a, b) => a.id!.localeCompare(b.id!))
        }

        const revenueItems = getItemsInRange(3000, 3999)
        const materialItems = getItemsInRange(4000, 4999)
        const otherExternalItems = getItemsInRange(5000, 6999)
        const personnelItems = getItemsInRange(7000, 7699)
        const depreciationItems = getItemsInRange(7700, 7999)
        const financialItems = getItemsInRange(8000, 8899)
        const taxItems = getItemsInRange(8900, 8999)

        const totalRevenue = revenueItems.reduce((sum, item) => sum + item.value, 0)
        const materialTotal = materialItems.reduce((sum, i) => sum + i.value, 0)
        const externalTotal = otherExternalItems.reduce((sum, i) => sum + i.value, 0)
        const personnelTotal = personnelItems.reduce((sum, i) => sum + i.value, 0)
        const depreciationTotal = depreciationItems.reduce((sum, i) => sum + i.value, 0)
        const financialTotal = financialItems.reduce((sum, i) => sum + i.value, 0)
        const taxTotal = taxItems.reduce((sum, i) => sum + i.value, 0)

        // RPC returns (credit - debit)
        // Profit = Revenue (3xxx) + Costs (4xxx-8xxx)
        // Since costs are debit heavy, they will be negative in the RPC result.
        const ebit = totalRevenue + materialTotal + externalTotal + personnelTotal + depreciationTotal
        const ebt = ebit + financialTotal
        const netIncome = ebt + taxTotal

        return [
            { title: "Rörelseintäkter", items: revenueItems, total: totalRevenue },
            { title: "Kostnader för material och varor", items: materialItems, total: materialTotal },
            { title: "Övriga externa kostnader", items: otherExternalItems, total: externalTotal },
            { title: "Personalkostnader", items: personnelItems, total: personnelTotal },
            { title: "Avskrivningar", items: depreciationItems, total: depreciationTotal },
            { title: "Rörelseresultat (EBIT)", items: [], total: ebit, isHighlight: true },
            { title: "Finansiella poster", items: financialItems, total: financialTotal },
            { title: "Resultat före skatt", items: [], total: ebt, isHighlight: true },
            { title: "Skatt", items: taxItems, total: taxTotal },
            { title: "Årets resultat", items: [{ label: "Nettoresultat", value: netIncome }], total: netIncome, isHighlight: true },
        ]
    },

    /**
     * Internal: Calculate Balance Sheet sections from balances.
     */
    calculateBalanceSheet(balances: Account[], endDate: string): FinancialSection[] {
        const getItemsInRange = (start: number, end: number, flipSign: boolean = false) => {
            return balances
                .filter(b => {
                    const num = parseInt(b.accountNumber)
                    return num >= start && num <= end && Math.abs(b.balance) > 0.01
                })
                .map(b => ({
                    id: b.accountNumber,
                    label: b.accountName,
                    value: flipSign ? -b.balance : b.balance
                }))
                .sort((a, b) => a.id!.localeCompare(b.id!))
        }

        // Assets (1xxx): RPC returns credit - debit, so assets are negative. Flip sign.
        const fixedAssets = getItemsInRange(1000, 1399, true)
        const currentAssets = getItemsInRange(1400, 1999, true)
        
        // Equity & Liabilities (2xxx): RPC returns credit - debit, so they are positive.
        const equityItems = getItemsInRange(2000, 2099)
        const untaxedItems = getItemsInRange(2100, 2199)
        const provisionItems = getItemsInRange(2200, 2299)
        const longLiabilities = getItemsInRange(2300, 2399)
        const shortLiabilities = getItemsInRange(2400, 2999)

        // Calculate unbooked YTD result if it's not already in 2099
        // This is necessary for a "live" balance sheet
        const plItems = balances.filter(b => parseInt(b.accountNumber) >= 3000)
        const ytdResult = plItems.reduce((sum, b) => sum + b.balance, 0)

        const fixedTotal = fixedAssets.reduce((sum, i) => sum + i.value, 0)
        const currentTotal = currentAssets.reduce((sum, i) => sum + i.value, 0)
        const equityTotal = equityItems.reduce((sum, i) => sum + i.value, 0) + ytdResult
        const untaxedTotal = untaxedItems.reduce((sum, i) => sum + i.value, 0)
        const provisionTotal = provisionItems.reduce((sum, i) => sum + i.value, 0)
        const longTotal = longLiabilities.reduce((sum, i) => sum + i.value, 0)
        const shortTotal = shortLiabilities.reduce((sum, i) => sum + i.value, 0)

        const totalAssets = fixedTotal + currentTotal
        const totalEqLiab = equityTotal + untaxedTotal + provisionTotal + longTotal + shortTotal

        return [
            { title: "Anläggningstillgångar", items: fixedAssets, total: fixedTotal },
            { title: "Omsättningstillgångar", items: currentAssets, total: currentTotal },
            { title: "SUMMA TILLGÅNGAR", items: [], total: totalAssets, isHighlight: true },
            { title: "Eget kapital (inkl. årets resultat)", items: [...equityItems, { label: "Beräknat resultat YTD", value: ytdResult }], total: equityTotal },
            { title: "Obeskattade reserver", items: untaxedItems, total: untaxedTotal },
            { title: "Avsättningar", items: provisionItems, total: provisionTotal },
            { title: "Långfristiga skulder", items: longLiabilities, total: longTotal },
            { title: "Kortfristiga skulder", items: shortLiabilities, total: shortTotal },
            { title: "SUMMA EGET KAPITAL OCH SKULDER", items: [], total: totalEqLiab, isHighlight: true },
        ]
    },

    /**
     * Internal: Calculate high-level summary.
     */
    calculateSummary(balances: Account[]) {
        let revenue = 0
        let expenses = 0
        let assets = 0
        let equityAndLiab = 0

        balances.forEach(b => {
            const acc = parseInt(b.accountNumber)
            if (acc >= 3000 && acc <= 3999) revenue += b.balance
            else if (acc >= 4000 && acc <= 8999) expenses += b.balance
            else if (acc >= 1000 && acc <= 1999) assets += -b.balance
            else if (acc >= 2000 && acc <= 2999) equityAndLiab += b.balance
        })

        return {
            revenue,
            result: revenue + expenses,
            assets,
            equity: equityAndLiab + (revenue + expenses)
        }
    }
}
