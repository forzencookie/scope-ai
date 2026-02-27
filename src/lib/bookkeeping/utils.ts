/**
 * Utility functions for bookkeeping operations
 */

import { basAccounts } from '@/data/accounts'
import type { JournalEntry } from './types'

/**
 * Generate a unique entry ID
 * Format: VER-{timestamp}-{random}
 */
export function generateEntryId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `VER-${timestamp}-${random}`
}

/**
 * Get the next verification number for a series
 * In production, this would query the database
 */
export function getNextVerificationNumber(
  series: string,
  existingEntries: JournalEntry[]
): number {
  const seriesEntries = existingEntries.filter(e => e.series === series)
  const maxNumber = seriesEntries.reduce(
    (max, e) => Math.max(max, e.number || 0),
    0
  )
  return maxNumber + 1
}

/**
 * Finalize an entry (lock it from editing)
 */
export function finalizeEntry(entry: JournalEntry): JournalEntry {
  return {
    ...entry,
    finalized: true,
  }
}

/**
 * Check if an account number exists in the BAS kontoplan
 */
export function isValidAccount(accountNumber: string): boolean {
  return basAccounts.some(a => a.number === accountNumber)
}

/**
 * Get account name from BAS account number
 */
export function getAccountName(accountNumber: string): string {
  const account = basAccounts.find(a => a.number === accountNumber)
  return account?.name || `Konto ${accountNumber}`
}

/**
 * Get account balance from a list of entries
 * Returns positive for assets/expenses (debit accounts)
 * Returns negative for liabilities/income (credit accounts)
 */
export function getAccountBalance(
  accountNumber: string,
  entries: JournalEntry[]
): number {
  let balance = 0

  entries.forEach(entry => {
    entry.rows.forEach(row => {
      if (row.account === accountNumber) {
        // Debit increases assets/expenses, decreases liabilities/income
        // Credit decreases assets/expenses, increases liabilities/income
        balance += row.debit - row.credit
      }
    })
  })

  return balance
}

/**
 * Format Swedish date (YYYY-MM-DD)
 */
export function formatSwedishDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get fiscal year date range for a given reference date and fiscal year end (MM-DD).
 * Supports broken fiscal years (e.g., "06-30" = July 1 to June 30).
 *
 * @param fiscalYearEnd - MM-DD format, e.g. "12-31" or "06-30"
 * @param referenceDate - Date to determine which fiscal year we're in (defaults to now)
 * @returns { start, end } as Date objects
 *
 * @example
 * // Calendar year (fiscal year ends Dec 31)
 * getFiscalYearRange('12-31', new Date('2025-03-15'))
 * // → { start: 2025-01-01, end: 2025-12-31 }
 *
 * // Broken fiscal year (ends June 30)
 * getFiscalYearRange('06-30', new Date('2025-03-15'))
 * // → { start: 2024-07-01, end: 2025-06-30 }
 *
 * // After fiscal year end month
 * getFiscalYearRange('06-30', new Date('2025-09-15'))
 * // → { start: 2025-07-01, end: 2026-06-30 }
 */
export function getFiscalYearRange(
  fiscalYearEnd: string = '12-31',
  referenceDate: Date = new Date()
): { start: Date; end: Date; startStr: string; endStr: string } {
  const [endMonthStr, endDayStr] = fiscalYearEnd.split('-')
  const endMonth = parseInt(endMonthStr) // 1-12
  const endDay = parseInt(endDayStr)

  const refYear = referenceDate.getFullYear()
  const refMonth = referenceDate.getMonth() + 1 // 1-12

  // Determine which fiscal year the reference date falls into
  // If fiscal year ends in December (calendar year), it's straightforward
  if (endMonth === 12) {
    return {
      start: new Date(refYear, 0, 1),
      end: new Date(refYear, 11, endDay),
      startStr: `${refYear}-01-01`,
      endStr: `${refYear}-${endMonthStr}-${endDayStr}`,
    }
  }

  // Broken fiscal year: FY ends in month X, starts in month X+1 of the previous calendar year
  // If ref date is after FY end month → we're in the NEW fiscal year (starts this year)
  // If ref date is on or before FY end month → we're in the OLD fiscal year (started last year)
  const fyEndYear = refMonth > endMonth ? refYear + 1 : refYear
  const fyStartYear = fyEndYear - 1
  const startMonth = endMonth + 1 // Month after FY end

  return {
    start: new Date(fyStartYear, startMonth - 1, 1),
    end: new Date(fyEndYear, endMonth - 1, endDay),
    startStr: `${fyStartYear}-${String(startMonth).padStart(2, '0')}-01`,
    endStr: `${fyEndYear}-${endMonthStr}-${endDayStr}`,
  }
}

/**
 * Get current fiscal year (default calendar year for Swedish companies).
 * @deprecated Use getFiscalYearRange(fiscalYearEnd) instead for broken fiscal year support.
 */
export function getCurrentFiscalYear(): { start: Date; end: Date } {
  const { start, end } = getFiscalYearRange('12-31')
  return { start, end }
}

/**
 * Determine account class from account number
 * Swedish BAS plan:
 * 1xxx - Assets (Tillgångar)
 * 2xxx - Equity & Liabilities (Eget kapital och skulder)
 * 3xxx - Revenue (Intäkter)
 * 4xxx - Cost of goods (Varuinköp)
 * 5xxx - External costs (Övriga externa kostnader)
 * 6xxx - Other external costs (Övriga externa kostnader forts.)
 * 7xxx - Personnel costs (Personalkostnader)
 * 8xxx - Financial items & taxes (Finansiella poster, skatter)
 */
export function getAccountClass(accountNumber: string): {
  class: number
  category: string
  type: 'balance' | 'result'
  normalBalance: 'debit' | 'credit'
} {
  const classNum = parseInt(accountNumber.charAt(0))
  
  const classInfo: Record<number, { category: string; type: 'balance' | 'result'; normalBalance: 'debit' | 'credit' }> = {
    1: { category: 'Tillgångar', type: 'balance', normalBalance: 'debit' },
    2: { category: 'Eget kapital och skulder', type: 'balance', normalBalance: 'credit' },
    3: { category: 'Intäkter', type: 'result', normalBalance: 'credit' },
    4: { category: 'Varuinköp', type: 'result', normalBalance: 'debit' },
    5: { category: 'Övriga externa kostnader', type: 'result', normalBalance: 'debit' },
    6: { category: 'Övriga externa kostnader', type: 'result', normalBalance: 'debit' },
    7: { category: 'Personalkostnader', type: 'result', normalBalance: 'debit' },
    8: { category: 'Finansiella poster', type: 'result', normalBalance: 'debit' },
  }
  
  const info = classInfo[classNum] || { 
    category: 'Okänd', 
    type: 'result' as const, 
    normalBalance: 'debit' as const 
  }
  
  return {
    class: classNum,
    ...info,
  }
}

/**
 * Check if an account is a balance sheet account (1xxx, 2xxx)
 */
export function isBalanceSheetAccount(accountNumber: string): boolean {
  const classNum = parseInt(accountNumber.charAt(0))
  return classNum === 1 || classNum === 2
}

/**
 * Check if an account is an income statement account (3xxx-8xxx)
 */
export function isIncomeStatementAccount(accountNumber: string): boolean {
  const classNum = parseInt(accountNumber.charAt(0))
  return classNum >= 3 && classNum <= 8
}

/**
 * Format currency in Swedish format
 */
export function formatSEK(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
