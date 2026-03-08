
import { Verification } from "@/hooks/use-verifications"
import type { TaxRates } from '@/services/tax-service'

export interface ReportLine {
    label: string
    value: number
    level: 1 | 2 | 3 // Indentation level
    isHeader?: boolean
    isTotal?: boolean
}

export interface FiscalYearRange {
    start: string // YYYY-MM-DD
    end: string   // YYYY-MM-DD
    year: number  // Primary year label (e.g. 2025)
}

export const AnnualReportProcessor = {
    /**
     * Calculates Income Statement (Resultaträkning) for a fiscal year.
     * Based on K2 regulations (simplified).
     * @param taxRates Required — caller must fetch from taxService.getAllTaxRates()
     */
    calculateIncomeStatement(
        verifications: Verification[],
        fiscalYear: FiscalYearRange | number,
        taxRates?: TaxRates | null
    ): ReportLine[] {
        // Support both old (number) and new (range) API
        const range = typeof fiscalYear === 'number'
            ? { start: `${fiscalYear}-01-01`, end: `${fiscalYear}-12-31`, year: fiscalYear }
            : fiscalYear

        let revenue = 0
        let goodsCost = 0
        let otherExternalCosts = 0
        let personnelCosts = 0
        let depreciation = 0
        let financialItems = 0
        let bokslutsdispositioner = 0

        verifications.forEach(v => {
            if (v.date < range.start || v.date > range.end) return
            v.rows.forEach(row => {
                const acc = row.account
                const net = (row.credit || 0) - (row.debit || 0)

                if (acc >= "3000" && acc <= "3999") revenue += net
                else if (acc >= "4000" && acc <= "4999") goodsCost += net
                else if (acc >= "5000" && acc <= "6999") otherExternalCosts += net
                else if (acc >= "7000" && acc <= "7699") personnelCosts += net
                else if (acc >= "7700" && acc <= "7999") depreciation += net
                else if (acc >= "8800" && acc <= "8899") bokslutsdispositioner += net
                else if (acc >= "8000" && acc <= "8799") financialItems += net
                else if (acc >= "8900" && acc <= "8989") financialItems += net // Exclude 8999 (årets resultat)
            })
        })

        const operatingResult = revenue + goodsCost + otherExternalCosts + personnelCosts + depreciation
        const resultAfterFinancial = operatingResult + financialItems
        const resultAfterBokslut = resultAfterFinancial + bokslutsdispositioner
        const corporateTaxRate = taxRates?.corporateTaxRate ?? 0
        const tax = (resultAfterBokslut > 0 && corporateTaxRate > 0)
            ? Math.round(resultAfterBokslut * -corporateTaxRate)
            : 0
        const netResult = resultAfterBokslut + tax

        const lines: ReportLine[] = [
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
        ]

        // Only show bokslutsdispositioner if they exist
        if (bokslutsdispositioner !== 0) {
            lines.push({ label: "Bokslutsdispositioner", value: bokslutsdispositioner, level: 2 })
            lines.push({ label: "Resultat före skatt", value: resultAfterBokslut, level: 1, isTotal: true })
        }

        lines.push({ label: "Skatt på årets resultat", value: tax, level: 2 })
        lines.push({ label: "Årets resultat", value: netResult, level: 1, isTotal: true })

        return lines
    },

    /**
     * Calculates Balance Sheet (Balansräkning).
     * Includes ALL verifications up to endDate.
     * Properly handles year-end result by calculating P&L separately.
     */
    calculateBalanceSheet(
        verifications: Verification[],
        endDate: Date,
        options?: { taxRates?: TaxRates | null; fiscalYearStart?: string }
    ): ReportLine[] {
        // Assets (1xxx)
        let fixedAssets = 0
        let currentAssets = 0
        let cashAndBank = 0

        // Equity & Liabilities (2xxx)
        let equity = 0
        let untaxedReserves = 0
        let provisions = 0
        let longTermLiabilities = 0
        let shortTermLiabilities = 0

        verifications.forEach(v => {
            const d = new Date(v.date)
            if (d > endDate) return

            v.rows.forEach(row => {
                const acc = row.account
                const assetNet = (row.debit || 0) - (row.credit || 0)
                const liabilityNet = (row.credit || 0) - (row.debit || 0)

                if (acc >= "1000" && acc <= "1399") fixedAssets += assetNet
                else if (acc >= "1400" && acc <= "1899") currentAssets += assetNet
                else if (acc >= "1900" && acc <= "1999") cashAndBank += assetNet
                else if (acc >= "2000" && acc <= "2099") equity += liabilityNet
                else if (acc >= "2100" && acc <= "2199") untaxedReserves += liabilityNet
                else if (acc >= "2200" && acc <= "2299") provisions += liabilityNet
                else if (acc >= "2300" && acc <= "2399") longTermLiabilities += liabilityNet
                else if (acc >= "2400" && acc <= "2999") shortTermLiabilities += liabilityNet
            })
        })

        // Calculate unbooked year-end result from P&L accounts
        // This covers the case where 8999 (årets resultat) hasn't been booked yet
        const fiscalStart = options?.fiscalYearStart || `${endDate.getFullYear()}-01-01`
        const endStr = endDate.toISOString().split('T')[0]

        let plResult = 0
        verifications.forEach(v => {
            if (v.date < fiscalStart || v.date > endStr) return
            v.rows.forEach(row => {
                const acc = row.account
                if (acc >= "3000" && acc <= "8999") {
                    plResult += (row.credit || 0) - (row.debit || 0)
                }
            })
        })

        // Apply tax if we have rates and result is positive
        const corporateTaxRate = options?.taxRates?.corporateTaxRate ?? 0
        const tax = (plResult > 0 && corporateTaxRate > 0)
            ? Math.round(plResult * corporateTaxRate)
            : 0
        const yearResult = plResult - tax

        const totalAssets = fixedAssets + currentAssets + cashAndBank
        const totalEqLiab = equity + yearResult + untaxedReserves + provisions + longTermLiabilities + shortTermLiabilities

        const lines: ReportLine[] = [
            { label: "TILLGÅNGAR", value: 0, level: 1, isHeader: true },
            { label: "Anläggningstillgångar", value: fixedAssets, level: 2 },
            { label: "Omsättningstillgångar", value: currentAssets, level: 2 },
            { label: "Kassa och bank", value: cashAndBank, level: 2 },
            { label: "Summa tillgångar", value: totalAssets, level: 1, isTotal: true },
            { label: "EGET KAPITAL OCH SKULDER", value: 0, level: 1, isHeader: true },
            { label: "Eget kapital (inkl. årets resultat)", value: equity + yearResult, level: 2 },
        ]

        if (untaxedReserves !== 0) {
            lines.push({ label: "Obeskattade reserver", value: untaxedReserves, level: 2 })
        }
        if (provisions !== 0) {
            lines.push({ label: "Avsättningar", value: provisions, level: 2 })
        }

        lines.push(
            { label: "Långfristiga skulder", value: longTermLiabilities, level: 2 },
            { label: "Kortfristiga skulder", value: shortTermLiabilities, level: 2 },
            { label: "Summa eget kapital och skulder", value: totalEqLiab, level: 1, isTotal: true },
        )

        return lines
    }
}
