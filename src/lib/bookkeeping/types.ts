/**
 * Core types for Swedish double-entry bookkeeping system
 * Based on BAS account plan (Baskontoplan)
 */

/**
 * A single line in a journal entry (verifikationsrad)
 * Each line represents either a debit or credit to a specific account
 */
export interface JournalEntryLine {
  /** BAS account number (4-digit, e.g., "1930" for bank account) */
  account: string
  /** Amount debited to this account (assets increase, liabilities decrease) */
  debit: number
  /** Amount credited to this account (assets decrease, liabilities increase) */
  credit: number
  /** Optional description for this specific line */
  description?: string
}

/**
 * A complete journal entry (verifikation)
 * Must be balanced: total debits = total credits
 */
export interface JournalEntry {
  /** Unique identifier for the entry */
  id: string
  /** Entry date in YYYY-MM-DD format */
  date: string
  /** Description of the transaction */
  description: string
  /** Series identifier (e.g., "A" for customer invoices, "B" for supplier invoices) */
  series?: string
  /** Sequential number within the series */
  number?: number
  /** Individual debit/credit lines */
  rows: JournalEntryLine[]
  /** Optional attachments (receipt images, invoices) */
  attachments?: string[]
  /** Whether the entry has been finalized (locked from editing) */
  finalized?: boolean
  /** User who created the entry */
  createdBy?: string
  /** Timestamp of creation */
  createdAt?: string
}

/**
 * Result of validating a journal entry
 */
export interface ValidationResult {
  /** Whether the entry is valid */
  valid: boolean
  /** List of validation errors if invalid */
  errors: string[]
  /** List of warnings (entry is valid but has potential issues) */
  warnings: string[]
}

/**
 * Template for common transaction types
 * Used to quickly create journal entries from common patterns
 */
export interface TransactionTemplate {
  /** Template identifier */
  id: string
  /** Display name for the template */
  name: string
  /** Category for grouping templates */
  category: 'expense' | 'income' | 'transfer' | 'salary' | 'tax'
  /** Keywords that trigger this template in AI matching */
  keywords: string[]
  /** Default account for the main transaction side */
  defaultAccount: string
  /** Default counter-account (often bank or cash) */
  counterAccount: string
  /** Default VAT rate (0, 6, 12, or 25 percent) */
  vatRate: 0 | 6 | 12 | 25
  /** Optional description template */
  descriptionTemplate?: string
}

/**
 * VAT rates used in Swedish accounting
 */
export type SwedishVatRate = 0 | 6 | 12 | 25

/**
 * Common Swedish VAT account mappings
 */
export const VAT_ACCOUNTS = {
  /** Utgående moms 25% */
  OUTPUT_25: '2610',
  /** Utgående moms 12% */
  OUTPUT_12: '2620',
  /** Utgående moms 6% */
  OUTPUT_6: '2630',
  /** Ingående moms */
  INPUT: '2640',
} as const

/**
 * Common Swedish bank/cash accounts
 */
export const PAYMENT_ACCOUNTS = {
  /** Bank account (main) */
  BANK: '1930',
  /** Cash register */
  CASH: '1910',
  /** Stripe/Payment processor */
  STRIPE: '1580',
} as const
