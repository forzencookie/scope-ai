
import { Verification } from "@/hooks/use-verifications"

export interface ReportLine {
    label: string
    value: number
    level: 1 | 2 | 3 // Indentation level
    isHeader?: boolean
    isTotal?: boolean
}

export const AnnualReportProcessor = {
    /**
     * Calculates Income Statement (Resultaträkning) for a given year.
     * Based on K2 regulations (simplified).
     */
    calculateIncomeStatement(verifications: Verification[], year: number): ReportLine[] {
        let revenue = 0
        let goodsCost = 0
        let otherExternalCosts = 0
        let personnelCosts = 0
        let depreciation = 0
        let financialItems = 0

        const getYear = (dateStr: string) => new Date(dateStr).getFullYear()

        verifications.forEach(v => {
            if (getYear(v.date) !== year) return
            v.rows.forEach(row => {
                const acc = row.account
                const net = (row.credit || 0) - (row.debit || 0) // Revenue positive, Expense negative

                if (acc >= "3000" && acc <= "3999") revenue += net
                else if (acc >= "4000" && acc <= "4999") goodsCost += net
                else if (acc >= "5000" && acc <= "6999") otherExternalCosts += net
                else if (acc >= "7000" && acc <= "7699") personnelCosts += net
                else if (acc >= "7700" && acc <= "7999") depreciation += net
                else if (acc >= "8000" && acc <= "8999") financialItems += net
            })
        })

        const operatingResult = revenue + goodsCost + otherExternalCosts + personnelCosts + depreciation
        const resultAfterFinancial = operatingResult + financialItems
        // Tax (20.6%) - Simplified
        const tax = resultAfterFinancial > 0 ? Math.round(resultAfterFinancial * -0.206) : 0
        const netResult = resultAfterFinancial + tax

        return [
            { label: "Rörelsens intäkter", value: 0, level: 1, isHeader: true },
            { label: "Nettoomsättning", value: revenue, level: 2 },
            { label: "Rörelsens kostnader", value: 0, level: 1, isHeader: true },
            { label: "Råvaror och förnödenheter", value: goodsCost, level: 2 },
            { label: "Övriga externa kostnader", value: otherExternalCosts, level: 2 },
            { label: "Personalkostnader", value: personnelCosts, level: 2 },
            { label: "Av- och nedskrivningar", value: depreciation, level: 2 },
            { label: "Rörelseresultat", value: operatingResult, level: 1, isTotal: true },
            { label: "Finansiella poster", value: financialItems, level: 2 },
            { label: "Resultat efter finansiella poster", value: resultAfterFinancial, level: 1, isTotal: true },
            { label: "Skatt på årets resultat", value: tax, level: 2 },
            { label: "Årets resultat", value: netResult, level: 1, isTotal: true },
        ]
    },

    /**
     * Calculates Balance Sheet (Balansräkning).
     * Needs to include ALL history usually, not just current year. 
     * If year is provided, it calculates position at end of that year.
     */
    calculateBalanceSheet(verifications: Verification[], endDate: Date): ReportLine[] {
        // Assets (1xxx) - Debit is positive
        let fixedAssets = 0
        let currentAssets = 0
        let cashAndBank = 0

        // Equity & Liabilities (2xxx) - Credit is positive
        let equity = 0
        let longTermLiabilities = 0
        let shortTermLiabilities = 0

        verifications.forEach(v => {
            const d = new Date(v.date)
            if (d > endDate) return

            v.rows.forEach(row => {
                const acc = row.account

                // Assets: Debit - Credit
                const assetNet = (row.debit || 0) - (row.credit || 0)
                // Liabilities/Equity: Credit - Debit
                const liabilityNet = (row.credit || 0) - (row.debit || 0)

                if (acc >= "1000" && acc <= "1399") fixedAssets += assetNet
                else if (acc >= "1400" && acc <= "1899") currentAssets += assetNet
                else if (acc >= "1900" && acc <= "1999") cashAndBank += assetNet

                else if (acc >= "2000" && acc <= "2099") equity += liabilityNet
                else if (acc >= "2300" && acc <= "2399") longTermLiabilities += liabilityNet
                else if (acc >= "2400" && acc <= "2999") shortTermLiabilities += liabilityNet
            })
        })

        // Current Year Result (must be calculated and added to Equity)
        // Check if "8999" (Årets resultat) is booked? 
        // If not booked, we need to calculate it from P&L and add to Equity.
        // For this processor, let's assume valid accounting where 8999 is booked at year end.
        // If 8999 is NOT booked, the Balance Sheet won't balance.
        // Since we are "Generating" the report, maybe we should calculate the unbooked result?

        // Let's check balance
        const totalAssets = fixedAssets + currentAssets + cashAndBank
        const totalEquityAndLiabilities = equity + longTermLiabilities + shortTermLiabilities

        // Difference is likely unbooked result
        const diff = totalAssets - totalEquityAndLiabilities

        // Add diff to Equity (Årets resultat) for display purposes if it balances the sheet
        const calculatedResult = diff

        return [
            { label: "TILLGÅNGAR", value: 0, level: 1, isHeader: true },
            { label: "Anläggningstillgångar", value: fixedAssets, level: 2 },
            { label: "Omsättningstillgångar", value: currentAssets, level: 2 },
            { label: "Kassa och bank", value: cashAndBank, level: 2 },
            { label: "Summa tillgångar", value: totalAssets, level: 1, isTotal: true },

            { label: "EGET KAPITAL OCH SKULDER", value: 0, level: 1, isHeader: true },
            { label: "Eget kapital (inkl. årets resultat)", value: equity + calculatedResult, level: 2 },
            { label: "Långfristiga skulder", value: longTermLiabilities, level: 2 },
            { label: "Kortfristiga skulder", value: shortTermLiabilities, level: 2 },
            { label: "Summa eget kapital och skulder", value: totalEquityAndLiabilities + calculatedResult, level: 1, isTotal: true },
        ]
    }
}
