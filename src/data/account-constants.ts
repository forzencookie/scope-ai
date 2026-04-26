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
export { VAT_ACCOUNTS, PAYMENT_ACCOUNTS, DEFAULT_ACCOUNTS } from '@/services/accounting'

// =============================================================================
// Equity accounts (from use-dividends.ts, use-dividend-logic.ts)
// =============================================================================

export const EQUITY_ACCOUNTS = {
  /** Aktiekapital (BAS 2011) */
  AKTIEKAPITAL: '2011',
  /** Överkursfond (BAS 2019) */
  OVERKURSFOND: '2019',
  /** Reservfond (BAS 2085) — AB restricted equity */
  RESERVFOND: '2085',
  /** Balanserat resultat (BAS 2080) — retained earnings from prior years */
  BALANSERAT_RESULTAT: '2080',
  /** Årets resultat (BAS 2099) */
  ARETS_RESULTAT: '2099',
  /** Vinst föregående år (BAS 2098) */
  VINST_FOREGAENDE_AR: '2098',
  /** Utdelningsskuld (BAS 2898) */
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
  /** Löner till företagsledare (BAS 7012) — NOT 7210 which is Styrelsearvoden */
  OWNER_SALARY: '7012',
  /**
   * Privata uttag — company-type-dependent:
   * - EF: 2013 (Eget kapital, privata uttag)
   * - HB/KB: 2070 range per partner
   * - AB: N/A (use salary or dividend, not withdrawals)
   * Default here is EF. Use getWithdrawalAccount(companyType) for correct mapping.
   */
  PRIVATE_WITHDRAWAL_EF: '2013',
  PRIVATE_WITHDRAWAL_HB: '2070',
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
