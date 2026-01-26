/**
 * Tax Processor Module
 * 
 * Swedish tax declaration processing for INK2/SRU format
 * 
 * @module tax
 * 
 * @example
 * import { INK2SRUProcessor, type CompanyInfo } from '@/services/processors/tax'
 * 
 * const company: CompanyInfo = {
 *   orgnr: '556000-0000',
 *   name: 'Test AB',
 *   fiscalYearStart: new Date('2024-01-01'),
 *   fiscalYearEnd: new Date('2024-12-31'),
 * }
 * 
 * const result = INK2SRUProcessor.calculateAll(verifications, company, taxPeriod)
 * const declarations = INK2SRUProcessor.generateDeclarations(verifications, company, taxPeriod)
 */

// Types
export type {
  AccountBalance,
  CompanyInfo,
  INK2CalculationResult,
} from './types'

export { calculateAccountBalances, sumAccountRange } from './types'

// Field Calculators
export { calculateBalanceSheet } from './balance-sheet'
export { calculateIncomeStatement } from './income-statement'
export { calculateTaxAdjustments } from './tax-adjustments'

// Main Processor
export { INK2SRUProcessor } from './ink2-processor'
