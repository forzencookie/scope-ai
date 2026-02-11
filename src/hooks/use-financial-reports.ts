
import { useMemo } from "react"
import { getSupabaseClient } from '@/lib/database/supabase'
import { FinancialReportProcessor, AccountBalance, FinancialSection } from "@/services/processors/reports-processor"
import { useCachedQuery } from "./use-cached-query"

interface BalanceData {
    bsBalances: AccountBalance[]
    plBalances: AccountBalance[]
    prevBsBalances: AccountBalance[]
    prevPlBalances: AccountBalance[]
}

async function fetchAllBalances(): Promise<BalanceData> {
    const supabase = getSupabaseClient()
    const year = new Date().getFullYear()
    const prevYear = year - 1

    const [bsResult, plResult, prevBsResult, prevPlResult] = await Promise.all([
        // Balance Sheet: All time to current year end
        supabase.rpc('get_account_balances', {
            p_start_date: '2000-01-01',
            p_end_date: new Date(year, 11, 31).toISOString().split('T')[0]
        }),
        // P&L: Current Year
        supabase.rpc('get_account_balances', {
            p_start_date: new Date(year, 0, 1).toISOString().split('T')[0],
            p_end_date: new Date(year, 11, 31).toISOString().split('T')[0]
        }),
        // Balance Sheet: All time to previous year end
        supabase.rpc('get_account_balances', {
            p_start_date: '2000-01-01',
            p_end_date: new Date(prevYear, 11, 31).toISOString().split('T')[0]
        }),
        // P&L: Previous Year
        supabase.rpc('get_account_balances', {
            p_start_date: new Date(prevYear, 0, 1).toISOString().split('T')[0],
            p_end_date: new Date(prevYear, 11, 31).toISOString().split('T')[0]
        })
    ])

    if (bsResult.error) throw bsResult.error
    if (plResult.error) throw plResult.error
    if (prevBsResult.error) throw prevBsResult.error
    if (prevPlResult.error) throw prevPlResult.error

    const toAccountBalances = (data: typeof bsResult.data): AccountBalance[] =>
        (data || []).map(row => ({
            account: String(row.account_number),
            balance: row.balance
        }))

    return {
        bsBalances: toAccountBalances(bsResult.data),
        plBalances: toAccountBalances(plResult.data),
        prevBsBalances: toAccountBalances(prevBsResult.data),
        prevPlBalances: toAccountBalances(prevPlResult.data),
    }
}

export function useFinancialReports() {
    const { data: balances, isLoading } = useCachedQuery<BalanceData>({
        cacheKey: `financial-reports-${new Date().getFullYear()}`,
        queryFn: fetchAllBalances,
        ttlMs: 3 * 60 * 1000, // 3 minutes — balances don't change frequently
    })

    const bsBalances = balances?.bsBalances ?? []
    const plBalances = balances?.plBalances ?? []
    const prevBsBalances = balances?.prevBsBalances ?? []
    const prevPlBalances = balances?.prevPlBalances ?? []

    const incomeStatement = useMemo(() => {
        if (isLoading || !plBalances.length) return null
        return FinancialReportProcessor.calculateIncomeStatement(plBalances)
    }, [plBalances, isLoading])

    const balanceSheet = useMemo(() => {
        if (isLoading || !bsBalances.length) return null
        return FinancialReportProcessor.calculateBalanceSheet(bsBalances)
    }, [bsBalances, isLoading])

    // Sectioned data with YoY comparison
    const incomeStatementSections = useMemo(() => {
        if (isLoading) return null
        if (!plBalances.length) {
            return FinancialReportProcessor.getEmptyIncomeStatementSections()
        }
        const currentSections = FinancialReportProcessor.calculateIncomeStatementSections(plBalances)
        const previousSections = prevPlBalances.length
            ? FinancialReportProcessor.calculateIncomeStatementSections(prevPlBalances)
            : null

        // Merge previous year data into current sections
        return mergeComparativeData(currentSections, previousSections)
    }, [plBalances, prevPlBalances, isLoading])

    const balanceSheetSections = useMemo(() => {
        if (isLoading) return null
        if (!bsBalances.length) {
            return FinancialReportProcessor.getEmptyBalanceSheetSections()
        }
        const currentSections = FinancialReportProcessor.calculateBalanceSheetSections(bsBalances)
        const previousSections = prevBsBalances.length
            ? FinancialReportProcessor.calculateBalanceSheetSections(prevBsBalances)
            : null

        return mergeComparativeData(currentSections, previousSections)
    }, [bsBalances, prevBsBalances, isLoading])

    // Current and previous year for display
    const currentYear = new Date().getFullYear()
    const previousYear = currentYear - 1

    return {
        incomeStatement,
        balanceSheet,
        incomeStatementSections,
        balanceSheetSections,
        isLoading,
        currentYear,
        previousYear
    }
}

/**
 * Merge previous year data into current sections for YoY comparison
 */
function mergeComparativeData(
    currentSections: FinancialSection[],
    previousSections: FinancialSection[] | null
): FinancialSection[] {
    if (!previousSections) return currentSections

    return currentSections.map((section, sectionIdx) => {
        const prevSection = previousSections[sectionIdx]

        return {
            ...section,
            previousTotal: prevSection?.total ?? 0,
            items: section.items.map((item, itemIdx) => ({
                ...item,
                previousValue: prevSection?.items[itemIdx]?.value ?? 0
            }))
        }
    })
}
