// ============================================
// Account Balances Hook
// Aggregates transaction data by BAS account
// ============================================

import { useMemo } from "react"
import { useTransactions } from "./use-transactions"
import { basAccounts, type Account } from "@/data/accounts"

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
  const { transactions, isLoading, error } = useTransactions()

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    if (!transactions) return []

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    return transactions.filter((txn) => {
      if (dateRange === "allTime") return true

      const txnDate = txn.timestamp instanceof Date ? txn.timestamp : new Date(txn.timestamp)

      if (dateRange === "thisMonth") {
        return txnDate >= startOfMonth
      }
      if (dateRange === "thisYear") {
        return txnDate >= startOfYear
      }
      return true
    })
  }, [transactions, dateRange])

  // Aggregate transactions by account number
  const accountBalances = useMemo((): AccountActivity[] => {
    if (!filteredTransactions || filteredTransactions.length === 0) return []

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

    filteredTransactions.forEach((txn) => {
      // Get account number from AI suggestion or try to infer from category
      const accountNumber = txn.aiSuggestion?.account || inferAccountFromCategory(txn.category)
      if (!accountNumber) return

      const existing = accountMap.get(accountNumber) || {
        balance: 0,
        count: 0,
        lastDate: null,
        transactions: [],
      }

      const txnDate = txn.timestamp instanceof Date ? txn.timestamp : new Date(txn.timestamp)
      const amount = txn.amountValue || 0

      existing.balance += amount
      existing.count += 1
      if (!existing.lastDate || txnDate > existing.lastDate) {
        existing.lastDate = txnDate
      }
      existing.transactions.push({
        id: txn.id,
        date: txnDate.toISOString().split("T")[0],
        description: txn.name,
        amount: amount,
      })

      accountMap.set(accountNumber, existing)
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
  }, [filteredTransactions])

  // Get all accounts with activity
  const activeAccounts = useMemo(() => {
    return accountBalances.filter((a) => a.transactionCount > 0)
  }, [accountBalances])

  // Calculate totals
  const totals = useMemo(() => {
    const assets = accountBalances
      .filter((a) => a.account?.type === "asset")
      .reduce((sum, a) => sum + a.balance, 0)
    const liabilities = accountBalances
      .filter((a) => a.account?.type === "liability")
      .reduce((sum, a) => sum + a.balance, 0)
    const revenue = accountBalances
      .filter((a) => a.account?.type === "revenue")
      .reduce((sum, a) => sum + a.balance, 0)
    const expenses = accountBalances
      .filter((a) => a.account?.type === "expense")
      .reduce((sum, a) => sum + a.balance, 0)

    return {
      assets,
      liabilities,
      equity: assets - liabilities,
      revenue,
      expenses,
      netIncome: revenue + expenses, // expenses are negative
    }
  }, [accountBalances])

  return {
    accountBalances,
    activeAccounts,
    totals,
    isLoading,
    error,
  }
}

/**
 * Infer BAS account number from transaction category
 * This is a fallback when AI suggestion is not available
 */
function inferAccountFromCategory(category: string | undefined): string | null {
  if (!category) return null

  const categoryMap: Record<string, string> = {
    // Expenses
    Programvara: "5420",
    "IT & Programvara": "5420",
    Material: "5410",
    Kontorsmaterial: "5410",
    Resor: "5800",
    Representation: "6072",
    Lokalhyra: "5010",
    Hyra: "5010",
    Telefon: "6212",
    // Revenue
    Intäkter: "3040",
    Försäljning: "3010",
    // Assets/Liabilities are typically not inferred from category
  }

  return categoryMap[category] || null
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
