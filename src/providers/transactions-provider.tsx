"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"
import type { TransactionWithAI } from "@/types"

// PRODUCTION: No mock data
const defaultTransactions: TransactionWithAI[] = []

// ============================================================================
// Transactions Provider Context
// ============================================================================

interface TransactionsContextValue {
    transactions: TransactionWithAI[]
    setTransactions: (transactions: TransactionWithAI[]) => void
    addTransaction: (transaction: TransactionWithAI) => void
    updateTransaction: (id: string, updates: Partial<TransactionWithAI>) => void
    deleteTransaction: (id: string) => void
}

const TransactionsContext = createContext<TransactionsContextValue | undefined>(undefined)

export interface TransactionsProviderProps {
    children: ReactNode
    initialTransactions?: TransactionWithAI[]
}

/**
 * Isolated provider for transactions data
 * Only re-renders components that consume transactions when transactions change
 */
export function TransactionsProvider({
    children,
    initialTransactions = defaultTransactions as TransactionWithAI[],
}: TransactionsProviderProps) {
    const [transactions, setTransactions] = useState<TransactionWithAI[]>(initialTransactions)

    const addTransaction = useCallback((transaction: TransactionWithAI) => {
        setTransactions(prev => [...prev, transaction])
    }, [])

    const updateTransaction = useCallback((id: string, updates: Partial<TransactionWithAI>) => {
        setTransactions(prev =>
            prev.map(t => (t.id === id ? { ...t, ...updates } : t))
        )
    }, [])

    const deleteTransaction = useCallback((id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id))
    }, [])

    const value = useMemo<TransactionsContextValue>(
        () => ({
            transactions,
            setTransactions,
            addTransaction,
            updateTransaction,
            deleteTransaction,
        }),
        [transactions, addTransaction, updateTransaction, deleteTransaction]
    )

    return (
        <TransactionsContext.Provider value={value}>
            {children}
        </TransactionsContext.Provider>
    )
}

export function useTransactionsContext(): TransactionsContextValue {
    const context = useContext(TransactionsContext)
    if (context === undefined) {
        throw new Error("useTransactionsContext must be used within a TransactionsProvider")
    }
    return context
}
