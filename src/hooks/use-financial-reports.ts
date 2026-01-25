
import { useMemo, useState, useEffect } from "react"
import { getSupabaseClient } from '@/lib/database/supabase'
import { FinancialReportProcessor, AccountBalance } from "@/services/processors/reports-processor"

export function useFinancialReports() {
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchBalances() {
            setIsLoading(true)
            const supabase = getSupabaseClient()
            const year = new Date().getFullYear()

            // Fetch balances for P&L (Current Year)
            // Ideally we'd fetch two sets: one for P&L (year only) and one for BalanceSheet (all time).
            // But get_account_balances is flexible.
            // For now, let's just fetch EVERYTHING from 2000-01-01 to End of Year to cover Balance Sheet needs.
            // For P&L, we might need a separate call or filter in processor if we want strict period matching.
            // Actually, the new Processor logic expects aggregated input.
            // Let's make TWO calls to be precise.

            try {
                // 1. Balance Sheet: All time (effectively)
                const { data: balanceSheetData, error: bsError } = await supabase
                    .rpc('get_account_balances', {
                        date_from: '2000-01-01',
                        date_to: new Date(year, 11, 31).toISOString().split('T')[0]
                    })

                // 2. P&L: Current Year
                const { data: incomeData, error: plError } = await supabase
                    .rpc('get_account_balances', {
                        date_from: new Date(year, 0, 1).toISOString().split('T')[0],
                        date_to: new Date(year, 11, 31).toISOString().split('T')[0]
                    })

                if (bsError) throw bsError
                if (plError) throw plError

                // We return both sets or handle them. 
                // Currently the hook interface just exposes the final calculations.
                // Let's store them separately in state.
                setBsBalances(balanceSheetData || [])
                setPlBalances(incomeData || [])
            } catch (error) {
                console.error('Failed to fetch financial reports:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchBalances()
    }, [])

    const [bsBalances, setBsBalances] = useState<AccountBalance[]>([])
    const [plBalances, setPlBalances] = useState<AccountBalance[]>([])

    const incomeStatement = useMemo(() => {
        if (isLoading || !plBalances.length) return null
        return FinancialReportProcessor.calculateIncomeStatement(plBalances)
    }, [plBalances, isLoading])

    const balanceSheet = useMemo(() => {
        if (isLoading || !bsBalances.length) return null
        return FinancialReportProcessor.calculateBalanceSheet(bsBalances)
    }, [bsBalances, isLoading])

    // Sectioned data for CollapsibleTableSection components
    const incomeStatementSections = useMemo(() => {
        if (isLoading || !plBalances.length) return null
        return FinancialReportProcessor.calculateIncomeStatementSections(plBalances)
    }, [plBalances, isLoading])

    const balanceSheetSections = useMemo(() => {
        if (isLoading || !bsBalances.length) return null
        return FinancialReportProcessor.calculateBalanceSheetSections(bsBalances)
    }, [bsBalances, isLoading])

    return {
        incomeStatement,
        balanceSheet,
        incomeStatementSections,
        balanceSheetSections,
        isLoading
    }
}
