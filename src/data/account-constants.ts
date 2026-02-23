/**
 * Centralized BAS account constants.
 *
 * Consolidates magic account numbers scattered across hooks, components,
 * and API routes into a single source of truth.
 *
 * Re-exports from bookkeeping/types.ts where they already exist,
 * and adds domain-specific groupings.
 */

// Re-export existing constants from bookkeeping types
export { VAT_ACCOUNTS, PAYMENT_ACCOUNTS, DEFAULT_ACCOUNTS } from '@/lib/bookkeeping/types'

// =============================================================================
// Equity accounts (from use-dividends.ts, use-dividend-logic.ts)
// =============================================================================

export const EQUITY_ACCOUNTS = {
  /** Aktiekapital */
  AKTIEKAPITAL: '2081',
  /** Reservfond */
  RESERVFOND: '2086',
  /** Balanserat resultat */
  BALANSERAT_RESULTAT: '2091',
  /** Årets resultat */
  ARETS_RESULTAT: '2099',
  /** Vinst föregående år */
  VINST_FOREGAENDE_AR: '2098',
  /** Utdelningsskuld */
  UTDELNINGSSKULD: '2898',
} as const

// =============================================================================
// Salary accounts (from payroll API route, salary entry builder)
// =============================================================================

export const SALARY_ACCOUNTS = {
  /** Löner till tjänstemän */
  GROSS_SALARY: '7010',
  /** Arbetsgivaravgifter */
  EMPLOYER_FEE: '7510',
  /** Personalens källskatt */
  TAX_LIABILITY: '2710',
  /** Arbetsgivaravgifter skuld */
  EMPLOYER_FEE_LIABILITY: '2730',
  /** Upplupna löner / Nettolön att betala */
  NET_PAYABLE: '2920',
  /** Bank (utbetalning) */
  BANK: '1930',
} as const

// =============================================================================
// Owner/partner accounts (from owner-payroll.ts, use-owner-withdrawals.ts)
// =============================================================================

export const OWNER_ACCOUNTS = {
  /** Löner till ägare */
  OWNER_SALARY: '7210',
  /** Privata uttag */
  PRIVATE_WITHDRAWAL: '2013',
  /** Vinst föregående år (utdelning) */
  RETAINED_EARNINGS: '2098',
} as const

// =============================================================================
// Free equity account range (ABL 17:3 — distributable equity)
// =============================================================================

export const FREE_EQUITY_RANGE = {
  START: 2090,
  END: 2099,
} as const
