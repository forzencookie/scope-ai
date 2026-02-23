// ============================================
// Account Balances Hook
// Aggregates verification data by BAS account
// ============================================

import { useMemo } from "react"
import { useVerifications } from "./use-verifications"
import { basAccounts, type Account } from "@/data/accounts"
import { normalizeBalances } from "./use-normalized-balances"

// Account activity with balance information
export interface AccountActivity {
  accountNumber: string
  account: Account | null
  balance: number
  transactionCount: number
  lastTransactionDate: string | null
  transactions: AccountTransaction[]
}

// Simplified transaction for account view
export interface AccountTransaction {
  id: string
  date: string
  description: string
  amount: number
}

// Date range filter options
export type DateRangeFilter = "thisMonth" | "thisYear" | "allTime"

interface UseAccountBalancesOptions {
  dateRange?: DateRangeFilter
}

/**
 * Hook that aggregates transactions by BAS account number
 * Returns account balances, transaction counts, and recent activity
 */
export function useAccountBalances(options: UseAccountBalancesOptions = {}) {
  const { dateRange = "allTime" } = options
  const { verifications, isLoading, error } = useVerifications()

  // Filter verifications by date range
  const filteredVerifications = useMemo(() => {
    if (!verifications) return []

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    return verifications.filter((v) => {
      if (dateRange === "allTime") return true

      const vDate = new Date(v.date)

      if (dateRange === "thisMonth") {
        return vDate >= startOfMonth
      }
      if (dateRange === "thisYear") {
        return vDate >= startOfYear
      }
      return true
    })
  }, [verifications, dateRange])

  // Aggregate verifications by account number
  const accountBalances = useMemo((): AccountActivity[] => {
    if (!filteredVerifications || filteredVerifications.length === 0) return []

    // Map to aggregate by account number
    const accountMap = new Map<
      string,
      {
        balance: number
        count: number
        lastDate: Date | null
        transactions: AccountTransaction[]
      }
    >()

    filteredVerifications.forEach((v) => {
      // Each verification has multiple rows.
      v.rows.forEach(row => {
        if (!row.account) return

        const accountNumber = row.account

        const existing = accountMap.get(accountNumber) || {
          balance: 0,
          count: 0,
          lastDate: null,
          transactions: [],
        }

        const vDate = new Date(v.date)
        // Debit is +, Credit is -
        const amount = (row.debit || 0) - (row.credit || 0)

        existing.balance += amount
        existing.count += 1
        if (!existing.lastDate || vDate > existing.lastDate) {
          existing.lastDate = vDate
        }
        existing.transactions.push({
          id: v.id,
          date: v.date, // already string YYYY-MM-DD
          description: row.description || v.description,
          amount: amount,
        })

        accountMap.set(accountNumber, existing)
      })
    })

    // Convert map to array with account metadata
    const result: AccountActivity[] = []
    accountMap.forEach((data, accountNumber) => {
      const account = basAccounts.find((a) => a.number === accountNumber) || null

      // Sort transactions by date descending
      const sortedTransactions = data.transactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      result.push({
        accountNumber,
        account,
        balance: data.balance,
        transactionCount: data.count,
        lastTransactionDate: data.lastDate?.toISOString().split("T")[0] || null,
        transactions: sortedTransactions,
      })
    })

    // Sort by most recent activity
    return result.sort((a, b) => {
      if (!a.lastTransactionDate) return 1
      if (!b.lastTransactionDate) return -1
      return new Date(b.lastTransactionDate).getTime() - new Date(a.lastTransactionDate).getTime()
    })
  }, [filteredVerifications])

  // Get all accounts with activity
  const activeAccounts = useMemo(() => {
    return accountBalances.filter((a) => a.transactionCount > 0)
  }, [accountBalances])

  // Calculate totals using normalized sign convention
  // Raw balances stay as debit-credit for drill-down; totals are display-friendly
  const totals = useMemo(() => normalizeBalances(accountBalances), [accountBalances])

  return {
    accountBalances,
    activeAccounts,
    totals,
    isLoading,
    error,
  }
}

/**
 * Hook to get a specific account's activity
 */
export function useAccountActivity(accountNumber: string) {
  const { accountBalances, isLoading, error } = useAccountBalances()

  const accountActivity = useMemo(() => {
    return accountBalances.find((a) => a.accountNumber === accountNumber) || null
  }, [accountBalances, accountNumber])

  return {
    accountActivity,
    isLoading,
    error,
  }
}
