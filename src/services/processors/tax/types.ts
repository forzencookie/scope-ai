/**
 * Tax Declaration Types
 * For Swedish INK2/SRU tax declarations
 */

import type { Verification } from "@/hooks/use-verifications"
import type { SRUField, TaxPeriod } from "@/types/sru"

/**
 * Account balance for tax calculations
 */
export interface AccountBalance {
  account: string
  debit: number
  credit: number
  balance: number  // Credit - Debit (standard accounting sign)
}

/**
 * Company information for tax filing
 */
export interface CompanyInfo {
  orgnr: string
  name: string
  fiscalYearStart: Date
  fiscalYearEnd: Date
}

/**
 * Result of INK2 calculation
 */
export interface INK2CalculationResult {
  mainForm: SRUField[]       // INK2
  balanceSheet: SRUField[]   // INK2R balance
  incomeStatement: SRUField[] // INK2R income
  taxAdjustments: SRUField[] // INK2S
  summary: {
    totalAssets: number
    totalEquityAndLiabilities: number
    revenue: number
    expenses: number
    profit: number
    taxableIncome: number
  }
}

/**
 * Calculate account balances from verifications for a specific period
 */
export function calculateAccountBalances(
  verifications: Verification[],
  startDate: Date,
  endDate: Date
): Map<string, AccountBalance> {
  const balances = new Map<string, AccountBalance>()

  verifications.forEach(v => {
    const vDate = new Date(v.date)
    if (vDate < startDate || vDate > endDate) return

    v.rows.forEach(row => {
      const existing = balances.get(row.account) || {
        account: row.account,
        debit: 0,
        credit: 0,
        balance: 0,
      }

      existing.debit += row.debit || 0
      existing.credit += row.credit || 0
      existing.balance = existing.credit - existing.debit

      balances.set(row.account, existing)
    })
  })

  return balances
}

/**
 * Sum accounts matching a range
 */
export function sumAccountRange(
  balances: Map<string, AccountBalance>,
  start: number,
  end: number
): number {
  let total = 0

  balances.forEach((bal, account) => {
    const accNum = parseInt(account.slice(0, 4))
    if (accNum >= start && accNum <= end) {
      total += bal.balance
    }
  })

  return total
}
