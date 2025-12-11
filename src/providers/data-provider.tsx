"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"
import { type Transaction, allTransactions as defaultTransactions } from "@/lib/transaction-data"
import { type Invoice, mockInvoices as defaultInvoices } from "@/data/invoices"
import { type Receipt, mockReceipts as defaultReceipts } from "@/data/receipts"

// Re-export types for convenience
export type { Invoice, Receipt }

// ============================================================================
// Data Provider Context
// ============================================================================

interface DataProviderState {
    transactions: Transaction[]
    invoices: Invoice[]
    receipts: Receipt[]
}

interface DataProviderActions {
    // Transaction actions
    setTransactions: (transactions: Transaction[]) => void
    addTransaction: (transaction: Transaction) => void
    updateTransaction: (id: string, updates: Partial<Transaction>) => void
    deleteTransaction: (id: string) => void
    
    // Invoice actions
    setInvoices: (invoices: Invoice[]) => void
    addInvoice: (invoice: Invoice) => void
    updateInvoice: (id: string, updates: Partial<Invoice>) => void
    deleteInvoice: (id: string) => void
    
    // Receipt actions
    setReceipts: (receipts: Receipt[]) => void
    addReceipt: (receipt: Receipt) => void
    updateReceipt: (id: string, updates: Partial<Receipt>) => void
    deleteReceipt: (id: string) => void
}

interface DataProviderContextValue extends DataProviderState, DataProviderActions {}

const DataProviderContext = createContext<DataProviderContextValue | undefined>(undefined)

// ============================================================================
// Default Data
// ============================================================================

// ============================================================================
// Provider Props
// ============================================================================

export interface DataProviderProps {
    children: ReactNode
    /** Override default transactions for testing/mocking */
    initialTransactions?: Transaction[]
    /** Override default invoices for testing/mocking */
    initialInvoices?: Invoice[]
    /** Override default receipts for testing/mocking */
    initialReceipts?: Receipt[]
}

// ============================================================================
// Provider Component
// ============================================================================

export function DataProvider({
    children,
    initialTransactions = defaultTransactions,
    initialInvoices = defaultInvoices,
    initialReceipts = defaultReceipts,
}: DataProviderProps) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
    const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts)

    // Transaction actions
    const addTransaction = useCallback((transaction: Transaction) => {
        setTransactions(prev => [...prev, transaction])
    }, [])

    const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
        setTransactions(prev =>
            prev.map(t => (t.id === id ? { ...t, ...updates } : t))
        )
    }, [])

    const deleteTransaction = useCallback((id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id))
    }, [])

    // Invoice actions
    const addInvoice = useCallback((invoice: Invoice) => {
        setInvoices(prev => [...prev, invoice])
    }, [])

    const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
        setInvoices(prev =>
            prev.map(inv => (inv.id === id ? { ...inv, ...updates } : inv))
        )
    }, [])

    const deleteInvoice = useCallback((id: string) => {
        setInvoices(prev => prev.filter(inv => inv.id !== id))
    }, [])

    // Receipt actions
    const addReceipt = useCallback((receipt: Receipt) => {
        setReceipts(prev => [...prev, receipt])
    }, [])

    const updateReceipt = useCallback((id: string, updates: Partial<Receipt>) => {
        setReceipts(prev =>
            prev.map(r => (r.id === id ? { ...r, ...updates } : r))
        )
    }, [])

    const deleteReceipt = useCallback((id: string) => {
        setReceipts(prev => prev.filter(r => r.id !== id))
    }, [])

    const value = useMemo<DataProviderContextValue>(
        () => ({
            // State
            transactions,
            invoices,
            receipts,
            // Transaction actions
            setTransactions,
            addTransaction,
            updateTransaction,
            deleteTransaction,
            // Invoice actions
            setInvoices,
            addInvoice,
            updateInvoice,
            deleteInvoice,
            // Receipt actions
            setReceipts,
            addReceipt,
            updateReceipt,
            deleteReceipt,
        }),
        // Note: useCallback hooks with [] deps are stable, but included for correctness
        // Setter functions from useState are stable and don't need to be listed
        [transactions, invoices, receipts, addTransaction, updateTransaction, deleteTransaction, addInvoice, updateInvoice, deleteInvoice, addReceipt, updateReceipt, deleteReceipt]
    )

    return (
        <DataProviderContext.Provider value={value}>
            {children}
        </DataProviderContext.Provider>
    )
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the data provider context
 * @throws Error if used outside of DataProvider
 */
export function useData(): DataProviderContextValue {
    const context = useContext(DataProviderContext)
    if (context === undefined) {
        throw new Error("useData must be used within a DataProvider")
    }
    return context
}

/**
 * Hook to access only transactions data and actions
 * Returns a stable object reference when underlying data hasn't changed
 */
export function useTransactions() {
    const ctx = useData()
    return useMemo(() => ({
        transactions: ctx.transactions,
        setTransactions: ctx.setTransactions,
        addTransaction: ctx.addTransaction,
        updateTransaction: ctx.updateTransaction,
        deleteTransaction: ctx.deleteTransaction,
    }), [ctx.transactions, ctx.setTransactions, ctx.addTransaction, ctx.updateTransaction, ctx.deleteTransaction])
}

/**
 * Hook to access only invoices data and actions
 * Returns a stable object reference when underlying data hasn't changed
 */
export function useInvoices() {
    const ctx = useData()
    return useMemo(() => ({
        invoices: ctx.invoices,
        setInvoices: ctx.setInvoices,
        addInvoice: ctx.addInvoice,
        updateInvoice: ctx.updateInvoice,
        deleteInvoice: ctx.deleteInvoice,
    }), [ctx.invoices, ctx.setInvoices, ctx.addInvoice, ctx.updateInvoice, ctx.deleteInvoice])
}

/**
 * Hook to access only receipts data and actions
 * Returns a stable object reference when underlying data hasn't changed
 */
export function useReceipts() {
    const ctx = useData()
    return useMemo(() => ({
        receipts: ctx.receipts,
        setReceipts: ctx.setReceipts,
        addReceipt: ctx.addReceipt,
        updateReceipt: ctx.updateReceipt,
        deleteReceipt: ctx.deleteReceipt,
    }), [ctx.receipts, ctx.setReceipts, ctx.addReceipt, ctx.updateReceipt, ctx.deleteReceipt])
}
