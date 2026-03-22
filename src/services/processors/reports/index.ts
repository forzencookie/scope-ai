/**
 * Financial Reports Module
 * 
 * Comprehensive financial reporting for Swedish accounting
 * 
 * @module reports
 * 
 * @example
 * import { FinancialReportCalculator, type AccountBalance } from '@/services/processors/reports'
 * 
 * const incomeStatement = FinancialReportCalculator.calculateIncomeStatement(balances)
 * const balanceSheet = FinancialReportCalculator.calculateBalanceSheet(balances)
 */

// Types
export type {
  NakedVATPeriod,
  NakedFinancialItem,
  NakedReportSection,
  ProcessedVATPeriod,
  ProcessedFinancialItem,
  ProcessedReportSection,
  AccountBalance,
  FinancialSectionItem,
  FinancialSection,
} from './types'

// Processors
export {
  processVATPeriod,
  processFinancialItem,
  processReportSection,
  processVATPeriods,
  processFinancialItems,
  processReportSections,
} from './processors'

// Calculator
export { FinancialReportCalculator } from './calculator'

// Legacy compatibility - FinancialReportProcessor matching old API
import { FinancialReportCalculator } from './calculator'

/**
 * @deprecated Use FinancialReportCalculator directly
 * Maintained for backward compatibility
 */
export const FinancialReportProcessor = {
  calculateIncomeStatement: FinancialReportCalculator.calculateIncomeStatement,
  calculateBalanceSheet: FinancialReportCalculator.calculateBalanceSheet,
  calculateIncomeStatementSections: FinancialReportCalculator.calculateIncomeStatementSections,
  calculateBalanceSheetSections: FinancialReportCalculator.calculateBalanceSheetSections,
  getEmptyIncomeStatementSections: FinancialReportCalculator.getEmptyIncomeStatementSections,
  getEmptyBalanceSheetSections: FinancialReportCalculator.getEmptyBalanceSheetSections,
}
