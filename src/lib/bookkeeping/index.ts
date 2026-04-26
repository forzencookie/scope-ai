/**
 * Swedish Bookkeeping Module
 * 
 * Comprehensive double-entry bookkeeping system for Swedish companies
 * following BAS account plan (Baskontoplan) standards.
 * 
 * @module bookkeeping
 * 
 * @example
 * // Create a simple expense entry
 * import { createPurchaseEntry } from '@/lib/bookkeeping'
 * 
 * const entry = createPurchaseEntry({
 *   date: '2024-01-15',
 *   description: 'Office supplies from Dustin',
 *   grossAmount: 1250,
 *   expenseAccount: '6110',
 *   vatRate: 25,
 *   paidImmediately: true,
 * })
 * 
 * @example
 * // Validate a journal entry
 * import { validateJournalEntry } from '@/lib/bookkeeping'
 * 
 * const result = validateJournalEntry(entry)
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors)
 * }
 * 
 */

// ============================================================================
// Types
// ============================================================================

export type {
  JournalEntry,
  JournalEntryLine,
  ValidationResult,
  SwedishVatRate,
} from './types'

export { VAT_ACCOUNTS, PAYMENT_ACCOUNTS, DEFAULT_ACCOUNTS } from './types'

// ============================================================================
// Validation
// ============================================================================

export {
  validateJournalEntry,
  validateLine,
  isBalanced,
  canSave,
  roundToOre,
} from './validation'

// ============================================================================
// VAT Utilities
// ============================================================================

export {
  VAT_RATES,
  calculateVat,
  calculateGross,
  calculateNet,
  extractVat,
  inferVatRateFromAccount,
  getVatAccount,
  splitGrossAmount,
  formatVat,
} from './vat'

// ============================================================================
// Entry Creators
// ============================================================================

export {
  // Simple entries
  createSimpleEntry,
  type SimpleEntryParams,
  
  // Purchase entries
  createPurchaseEntry,
  createSupplierPayment,
  type PurchaseEntryParams,
  
  // Sales entries
  createSalesEntry,
  createMultiVatSalesEntry,
  createPaymentReceivedEntry,
  createCreditNoteEntry,
  type SalesEntryParams,
  type MultiVatSalesEntryParams,
  type InvoiceLineItem,
  
  // Salary entries
  createSalaryEntry,
  createPayrollTaxPayment,
  createSalaryAccrual,
  createVacationAccrual,
  calculateEmployerContributions,
  type SalaryEntryParams,
  type SalaryComponents,
} from './entries'

// ============================================================================
// Utilities
// ============================================================================

export {
  generateEntryId,
  getNextVerificationNumber,
  finalizeEntry,
  isValidAccount,
  getAccountName,
  getAccountBalance,
  formatSwedishDate,
  getCurrentFiscalYear,
  getAccountClass,
  isBalanceSheetAccount,
  isIncomeStatementAccount,
  formatSEK,
} from './utils'
