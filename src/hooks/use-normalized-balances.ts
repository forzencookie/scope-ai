/**
 * Normalized Balances — Single source of truth for account totals
 *
 * Uses getAccountClass() normalBalance to ensure consistent sign handling:
 * - Debit-normal accounts (1xxx assets, 4-8xxx expenses): positive = normal
 * - Credit-normal accounts (2xxx equity/liabilities, 3xxx revenue): flipped to positive for display
 *
 * All consumer hooks should use these totals instead of inline sign logic.
 */

import { useMemo } from 'react'
import { getAccountClass } from '@/lib/bookkeeping/utils'
import { useAccountBalances, type AccountActivity } from './use-account-balances'

export interface NormalizedTotals {
  assets: number       // Class 1 — positive when company owns things
  liabilities: number  // Class 21-29 — positive when company owes
  equity: number       // Class 20 — positive when net worth is positive
  revenue: number      // Class 3 — positive when company earns
  expenses: number     // Class 4-8 — positive when company spends
  netIncome: number    // revenue - expenses
}

/**
 * Pure function: normalize raw debit-credit balances into display-friendly totals.
 * Raw balance convention: debit - credit (positive for debit-normal accounts).
 *
 * Accepts various shapes: { accountNumber, balance } from useAccountBalances,
 * or { account, balance } from RPC results.
 */
export function normalizeBalances(
  accountBalances: Array<{ accountNumber?: string; account?: unknown; balance: number }>
): NormalizedTotals {
  let assets = 0
  let liabilities = 0
  let equity = 0
  let revenue = 0
  let expenses = 0

  for (const entry of accountBalances) {
    const accountNum = entry.accountNumber || (typeof entry.account === 'string' ? entry.account : '') || ''
    if (!accountNum) continue

    const classNum = parseInt(accountNum.charAt(0))
    if (isNaN(classNum)) continue

    const { normalBalance } = getAccountClass(accountNum)
    // Flip credit-normal accounts so positive = "has more of this"
    const displayAmount = normalBalance === 'credit' ? entry.balance * -1 : entry.balance

    if (classNum === 1) {
      assets += displayAmount
    } else if (classNum === 2) {
      const subClass = parseInt(accountNum.substring(0, 2))
      if (subClass === 20) {
        // 20xx = Eget kapital
        equity += displayAmount
      } else {
        // 21xx-29xx = Skulder
        liabilities += displayAmount
      }
    } else if (classNum === 3) {
      revenue += displayAmount
    } else if (classNum >= 4 && classNum <= 8) {
      expenses += displayAmount
    }
  }

  return {
    assets,
    liabilities,
    equity,
    revenue,
    expenses,
    netIncome: revenue - expenses,
  }
}

/**
 * Hook wrapper: normalizes balances from useAccountBalances.
 */
export function useNormalizedBalances(options?: { dateRange?: 'thisMonth' | 'thisYear' | 'allTime' }) {
  const { accountBalances, isLoading, error } = useAccountBalances(options)

  const totals = useMemo(
    () => normalizeBalances(accountBalances),
    [accountBalances]
  )

  return { totals, accountBalances, isLoading, error }
}
