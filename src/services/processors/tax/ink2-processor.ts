/**
 * INK2 SRU Main Processor
 * Calculates complete INK2/INK2R/INK2S declarations
 */

import type { Verification } from "@/hooks/use-verifications"
import type { SRUDeclaration, SRUField, TaxPeriod } from "@/types/sru"
import type { CompanyInfo, INK2CalculationResult, AccountBalance } from './types'
import { calculateAccountBalances } from './types'
import { calculateBalanceSheet } from './balance-sheet'
import { calculateIncomeStatement } from './income-statement'
import { calculateTaxAdjustments } from './tax-adjustments'

export const INK2SRUProcessor = {
  /**
   * Calculate all INK2 fields from verifications
   */
  calculateAll(
    verifications: Verification[],
    company: CompanyInfo,
    _taxPeriod: TaxPeriod
  ): INK2CalculationResult {
    // Calculate account balances for the fiscal year
    const balances = calculateAccountBalances(
      verifications,
      company.fiscalYearStart,
      company.fiscalYearEnd
    )

    // Calculate each section
    const balanceSheet = calculateBalanceSheet(balances)
    const incomeStatement = calculateIncomeStatement(balances)
    const taxAdjustments = calculateTaxAdjustments(incomeStatement, balances)

    // Format dates for main form
    const formatDate = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

    // Main form fields
    const mainForm: SRUField[] = [
      { code: 7011, value: formatDate(company.fiscalYearStart) },
      { code: 7012, value: formatDate(company.fiscalYearEnd) },
    ]

    // Transfer result to main form
    const profit = taxAdjustments.find(f => f.code === 7670)
    const loss = taxAdjustments.find(f => f.code === 7770)

    if (profit) mainForm.push({ code: 7104, value: profit.value })
    if (loss) mainForm.push({ code: 7114, value: loss.value })

    // Calculate summary
    const totalAssets = balanceSheet
      .filter(f => typeof f.code === 'number' && f.code >= 7201 && f.code <= 7281)
      .reduce((sum, f) => sum + (typeof f.value === 'number' ? f.value : 0), 0)

    const totalEquityAndLiabilities = balanceSheet
      .filter(f => typeof f.code === 'number' && f.code >= 7301 && f.code <= 7370)
      .reduce((sum, f) => sum + (typeof f.value === 'number' ? f.value : 0), 0)

    const revenue = incomeStatement
      .filter(f => [7410, 7413, 7417, 7419].includes(f.code as number))
      .reduce((sum, f) => sum + (typeof f.value === 'number' ? f.value : 0), 0)

    const expenses = incomeStatement
      .filter(f => [7511, 7512, 7513, 7514, 7515, 7517, 7522, 7528].includes(f.code as number))
      .reduce((sum, f) => sum + (typeof f.value === 'number' ? f.value : 0), 0)

    return {
      mainForm,
      balanceSheet,
      incomeStatement,
      taxAdjustments,
      summary: {
        totalAssets,
        totalEquityAndLiabilities,
        revenue,
        expenses,
        profit: typeof profit?.value === 'number' ? profit.value : 0,
        taxableIncome: (typeof profit?.value === 'number' ? profit.value : 0) - 
          (typeof loss?.value === 'number' ? loss.value : 0),
      },
    }
  },

  /**
   * Generate complete SRU declarations
   */
  generateDeclarations(
    verifications: Verification[],
    company: CompanyInfo,
    taxPeriod: TaxPeriod
  ): SRUDeclaration[] {
    const result = this.calculateAll(verifications, company, taxPeriod)

    const baseDecl = {
      orgnr: company.orgnr,
      name: company.name,
    }

    return [
      // INK2 Main form
      {
        ...baseDecl,
        blankettType: 'INK2' as const,
        period: taxPeriod,
        fields: result.mainForm,
      },
      // INK2R (both balance sheet and income statement combined)
      {
        ...baseDecl,
        blankettType: 'INK2R' as const,
        period: taxPeriod,
        fields: [
          { code: 7011, value: result.mainForm.find(f => f.code === 7011)?.value || '' },
          { code: 7012, value: result.mainForm.find(f => f.code === 7012)?.value || '' },
          ...result.balanceSheet,
          ...result.incomeStatement,
        ],
      },
      // INK2S
      {
        ...baseDecl,
        blankettType: 'INK2S' as const,
        period: taxPeriod,
        fields: [
          { code: 7011, value: result.mainForm.find(f => f.code === 7011)?.value || '' },
          { code: 7012, value: result.mainForm.find(f => f.code === 7012)?.value || '' },
          ...result.taxAdjustments,
        ],
      },
    ]
  },
}
