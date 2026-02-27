/**
 * Dividends Hook — Ägare → Utdelning data layer
 *
 * AB only: calculates distributable equity (fritt eget kapital) per ABL 17 kap.
 * Free equity = Total equity (class 20) - Restricted equity (aktiekapital 2011, reservfond 2013)
 */

import { useMemo } from 'react'
import { useAccountBalances } from './use-account-balances'
import { normalizeBalances } from './use-normalized-balances'
import { useCompany } from '@/providers/company-provider'
import { EQUITY_ACCOUNTS } from '@/data/account-constants'

export interface DividendData {
  /** Total booked equity (class 20xx) — positive when company has net worth */
  totalEquity: number
  /** Restricted equity: aktiekapital (2011) + reservfond (2013) */
  restrictedEquity: number
  /** Free equity available for distribution */
  freeEquity: number
  /** Whether the company can legally distribute dividends */
  canDistribute: boolean
  /** Current year net income (affects distributable amount) */
  netIncome: number
  /** Company type */
  companyType: string
  isLoading: boolean
}

export function useDividends(): DividendData {
  const { companyType } = useCompany()
  const { accountBalances, isLoading } = useAccountBalances()

  const data = useMemo((): Omit<DividendData, 'isLoading'> => {
    // Only AB can distribute dividends
    if (companyType !== 'ab') {
      return {
        totalEquity: 0,
        restrictedEquity: 0,
        freeEquity: 0,
        canDistribute: false,
        netIncome: 0,
        companyType,
      }
    }

    const normalized = normalizeBalances(accountBalances)

    // Restricted equity accounts (credit-normal, flipped to positive by normalizeBalances logic)
    let aktiekapital = 0
    let reservfond = 0

    for (const entry of accountBalances) {
      const acc = entry.accountNumber
      if (!acc) continue
      // Raw balance is debit - credit. For credit-normal 2xxx, flip to positive.
      const displayAmount = entry.balance * -1

      if (acc === EQUITY_ACCOUNTS.AKTIEKAPITAL) {
        aktiekapital += displayAmount
      } else if (acc === EQUITY_ACCOUNTS.RESERVFOND) {
        reservfond += displayAmount
      }
    }

    const restrictedEquity = aktiekapital + reservfond
    // Free equity includes current year result
    const freeEquity = normalized.equity - restrictedEquity + normalized.netIncome

    return {
      totalEquity: normalized.equity,
      restrictedEquity,
      freeEquity,
      canDistribute: freeEquity > 0,
      netIncome: normalized.netIncome,
      companyType,
    }
  }, [accountBalances, companyType])

  return { ...data, isLoading }
}
