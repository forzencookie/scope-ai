
import { useMemo } from "react"
import { useVerifications } from "@/hooks/use-verifications"
import { FinancialReportProcessor, FinancialSection } from "@/services/reports-processor"

export function useFinancialReports() {
    const { verifications, isLoading } = useVerifications()

    const incomeStatement = useMemo(() => {
        if (isLoading || !verifications.length) return null
        return FinancialReportProcessor.calculateIncomeStatement(verifications)
    }, [verifications, isLoading])

    const balanceSheet = useMemo(() => {
        if (isLoading || !verifications.length) return null
        return FinancialReportProcessor.calculateBalanceSheet(verifications)
    }, [verifications, isLoading])

    // Sectioned data for CollapsibleTableSection components
    const incomeStatementSections = useMemo(() => {
        if (isLoading || !verifications.length) return null
        return FinancialReportProcessor.calculateIncomeStatementSections(verifications)
    }, [verifications, isLoading])

    const balanceSheetSections = useMemo(() => {
        if (isLoading || !verifications.length) return null
        return FinancialReportProcessor.calculateBalanceSheetSections(verifications)
    }, [verifications, isLoading])

    return {
        incomeStatement,
        balanceSheet,
        incomeStatementSections,
        balanceSheetSections,
        isLoading
    }
}
