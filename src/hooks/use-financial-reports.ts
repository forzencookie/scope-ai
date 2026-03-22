
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { accountService } from "@/services/accounting/account-service"
import { FinancialReportProcessor, AccountBalance, FinancialSection } from "@/services/processors/reports"
import { useCompany } from "@/providers/company-provider"
import { getFiscalYearRange } from "@/lib/bookkeeping/utils"

interface BalanceData {
    bsBalances: AccountBalance[]
    plBalances: AccountBalance[]
    prevBsBalances: AccountBalance[]
    prevPlBalances: AccountBalance[]
}

async function fetchAllBalances(fiscalYearEnd: string): Promise<BalanceData> {
    const now = new Date()
    const currentFY = getFiscalYearRange(fiscalYearEnd, now)

    // Previous fiscal year: reference a date one year before the current FY start
    const prevRefDate = new Date(currentFY.start)
    prevRefDate.setFullYear(prevRefDate.getFullYear() - 1)
    const previousFY = getFiscalYearRange(fiscalYearEnd, prevRefDate)

    const [bsBalances, plBalances, prevBsBalances, prevPlBalances] = await Promise.all([
        // Balance Sheet: All time to current FY end
        accountService.getBalancesForPeriod('2000-01-01', currentFY.endStr),
        // P&L: Current Fiscal Year
        accountService.getBalancesForPeriod(currentFY.startStr, currentFY.endStr),
        // Balance Sheet: All time to previous FY end
        accountService.getBalancesForPeriod('2000-01-01', previousFY.endStr),
        // P&L: Previous Fiscal Year
        accountService.getBalancesForPeriod(previousFY.startStr, previousFY.endStr),
    ])

    return { bsBalances, plBalances, prevBsBalances, prevPlBalances }
}

export function useFinancialReports() {
    const { company } = useCompany()
    const fiscalYearEnd = company?.fiscalYearEnd || '12-31'

    const { data: balances, isLoading } = useQuery<BalanceData>({
        queryKey: ['financial-reports', fiscalYearEnd, new Date().getFullYear()],
        queryFn: () => fetchAllBalances(fiscalYearEnd),
        staleTime: 3 * 60 * 1000, // 3 minutes — balances don't change frequently
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

    // Fiscal year display values
    const currentFY = getFiscalYearRange(fiscalYearEnd, new Date())
    const prevRefDate = new Date(currentFY.start)
    prevRefDate.setFullYear(prevRefDate.getFullYear() - 1)
    const previousFY = getFiscalYearRange(fiscalYearEnd, prevRefDate)

    // For calendar year, show just the year; for broken FY, show range
    const formatFYLabel = (fy: { start: Date; end: Date }) => {
        const startYear = fy.start.getFullYear()
        const endYear = fy.end.getFullYear()
        return startYear === endYear ? String(endYear) : `${startYear}/${endYear}`
    }

    const currentYear = formatFYLabel(currentFY)
    const previousYear = formatFYLabel(previousFY)

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

    // Build a lookup map for previous sections by title
    const prevByTitle = new Map(previousSections.map(s => [s.title, s]))

    return currentSections.map((section) => {
        const prevSection = prevByTitle.get(section.title)

        // Build a lookup map for previous items by account id
        const prevItemById = new Map(
            (prevSection?.items ?? [])
                .filter(i => i.id)
                .map(i => [i.id!, i])
        )

        return {
            ...section,
            previousTotal: prevSection?.total ?? 0,
            items: section.items.map((item) => ({
                ...item,
                previousValue: (item.id ? prevItemById.get(item.id)?.value : undefined) ?? 0
            }))
        }
    })
}
