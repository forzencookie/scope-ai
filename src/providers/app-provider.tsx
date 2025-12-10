"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { Transaction, TransactionWithAI } from "@/types"
import { mockTransactions as defaultTransactions } from "@/data/transactions"
import { type Invoice, mockInvoices as defaultInvoices } from "@/data/invoices"
import { type Receipt, mockReceipts as defaultReceipts } from "@/data/receipts"

// Re-export types
export type { Invoice, Receipt }

// ============================================================================
// Query Client Setup
// ============================================================================

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30 * 1000,
                gcTime: 5 * 60 * 1000,
                refetchOnWindowFocus: true,
                refetchOnMount: true,
                retry: 3,
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            },
            mutations: { retry: 1 },
        },
    })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
    if (typeof window === "undefined") {
        return makeQueryClient()
    } else {
        if (!browserQueryClient) browserQueryClient = makeQueryClient()
        return browserQueryClient
    }
}

// ============================================================================
// Data Context Types
// ============================================================================

interface DataContextValue {
    // Transactions
    transactions: TransactionWithAI[]
    setTransactions: (transactions: TransactionWithAI[]) => void
    addTransaction: (transaction: TransactionWithAI) => void
    updateTransaction: (id: string, updates: Partial<TransactionWithAI>) => void
    deleteTransaction: (id: string) => void
    // Invoices
    invoices: Invoice[]
    setInvoices: (invoices: Invoice[]) => void
    addInvoice: (invoice: Invoice) => void
    updateInvoice: (id: string, updates: Partial<Invoice>) => void
    deleteInvoice: (id: string) => void
    // Receipts
    receipts: Receipt[]
    setReceipts: (receipts: Receipt[]) => void
    addReceipt: (receipt: Receipt) => void
    updateReceipt: (id: string, updates: Partial<Receipt>) => void
    deleteReceipt: (id: string) => void
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

// ============================================================================
// Provider Props
// ============================================================================

export interface AppProvidersProps {
    children: ReactNode
    initialTransactions?: TransactionWithAI[]
    initialInvoices?: Invoice[]
    initialReceipts?: Receipt[]
}

// Legacy alias
export type DataProviderProps = AppProvidersProps

// ============================================================================
// Main Provider Component
// ============================================================================

export function AppProviders({
    children,
    initialTransactions = defaultTransactions as TransactionWithAI[],
    initialInvoices = defaultInvoices,
    initialReceipts = defaultReceipts,
}: AppProvidersProps) {
    const [queryClient] = useState(() => getQueryClient())
    const [transactions, setTransactions] = useState<TransactionWithAI[]>(initialTransactions)
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
    const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts)

    // Transaction actions
    const addTransaction = useCallback((transaction: TransactionWithAI) => {
        setTransactions(prev => [...prev, transaction])
    }, [])

    const updateTransaction = useCallback((id: string, updates: Partial<TransactionWithAI>) => {
        setTransactions(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)))
    }, [])

    const deleteTransaction = useCallback((id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id))
    }, [])

    // Invoice actions
    const addInvoice = useCallback((invoice: Invoice) => {
        setInvoices(prev => [...prev, invoice])
    }, [])

    const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
        setInvoices(prev => prev.map(inv => (inv.id === id ? { ...inv, ...updates } : inv)))
    }, [])

    const deleteInvoice = useCallback((id: string) => {
        setInvoices(prev => prev.filter(inv => inv.id !== id))
    }, [])

    // Receipt actions
    const addReceipt = useCallback((receipt: Receipt) => {
        setReceipts(prev => [...prev, receipt])
    }, [])

    const updateReceipt = useCallback((id: string, updates: Partial<Receipt>) => {
        setReceipts(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)))
    }, [])

    const deleteReceipt = useCallback((id: string) => {
        setReceipts(prev => prev.filter(r => r.id !== id))
    }, [])

    const value = useMemo<DataContextValue>(() => ({
        transactions, setTransactions, addTransaction, updateTransaction, deleteTransaction,
        invoices, setInvoices, addInvoice, updateInvoice, deleteInvoice,
        receipts, setReceipts, addReceipt, updateReceipt, deleteReceipt,
    }), [
        transactions, addTransaction, updateTransaction, deleteTransaction,
        invoices, addInvoice, updateInvoice, deleteInvoice,
        receipts, addReceipt, updateReceipt, deleteReceipt,
    ])

    return (
        <QueryClientProvider client={queryClient}>
            <DataContext.Provider value={value}>
                {children}
            </DataContext.Provider>
        </QueryClientProvider>
    )
}

// Legacy alias for backwards compatibility
export const DataProvider = AppProviders

// ============================================================================
// Hooks
// ============================================================================

/** Full data context access */
export function useData(): DataContextValue {
    const context = useContext(DataContext)
    if (context === undefined) {
        throw new Error("useData must be used within AppProviders")
    }
    return context
}

/** Transactions only */
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

// Legacy alias
export const useTransactionsContext = useTransactions

/** Invoices only */
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

// Legacy alias
export const useInvoicesContext = useInvoices

/** Receipts only */
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

// Legacy alias
export const useReceiptsContext = useReceipts

// ============================================================================
// Convenience Providers (Optional - for specific routes)
// ============================================================================

export function TransactionsOnlyProvider({ children, initialTransactions }: { children: ReactNode; initialTransactions?: TransactionWithAI[] }) {
    return <AppProviders initialTransactions={initialTransactions}>{children}</AppProviders>
}

export function InvoicesOnlyProvider({ children, initialInvoices }: { children: ReactNode; initialInvoices?: Invoice[] }) {
    return <AppProviders initialInvoices={initialInvoices}>{children}</AppProviders>
}

export function ReceiptsOnlyProvider({ children, initialReceipts }: { children: ReactNode; initialReceipts?: Receipt[] }) {
    return <AppProviders initialReceipts={initialReceipts}>{children}</AppProviders>
}

// Legacy exports for backwards compatibility
export type TransactionsProviderProps = { children: ReactNode; initialTransactions?: TransactionWithAI[] }
export type InvoicesProviderProps = { children: ReactNode; initialInvoices?: Invoice[] }
export type ReceiptsProviderProps = { children: ReactNode; initialReceipts?: Receipt[] }
export type QueryProviderProps = { children: ReactNode }

export const TransactionsProvider = TransactionsOnlyProvider
export const InvoicesProvider = InvoicesOnlyProvider
export const ReceiptsProvider = ReceiptsOnlyProvider
export const QueryProvider = ({ children }: QueryProviderProps) => {
    const [queryClient] = useState(() => getQueryClient())
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
