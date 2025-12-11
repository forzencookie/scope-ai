"use client"

import { type ReactNode } from "react"
import { QueryProvider } from "./query-provider"
import { TransactionsProvider, type TransactionsProviderProps } from "./transactions-provider"
import { InvoicesProvider, type InvoicesProviderProps } from "./invoices-provider"
import { ReceiptsProvider, type ReceiptsProviderProps } from "./receipts-provider"

// ============================================================================
// Composite Provider
// ============================================================================

/**
 * Composite provider that wraps all data providers with optimized structure
 * 
 * Architecture benefits:
 * - Split contexts: Changes to transactions don't re-render invoice components
 * - React Query: Automatic caching, deduplication, and background refetching
 * - Lazy initialization: Providers only initialize when first consumed
 * 
 * Usage:
 * ```tsx
 * <AppProviders>
 *   <YourApp />
 * </AppProviders>
 * ```
 */
export interface AppProvidersProps {
    children: ReactNode
    /** Initial transactions for testing/SSR */
    initialTransactions?: TransactionsProviderProps['initialTransactions']
    /** Initial invoices for testing/SSR */
    initialInvoices?: InvoicesProviderProps['initialInvoices']
    /** Initial receipts for testing/SSR */
    initialReceipts?: ReceiptsProviderProps['initialReceipts']
}

export function AppProviders({
    children,
    initialTransactions,
    initialInvoices,
    initialReceipts,
}: AppProvidersProps) {
    return (
        <QueryProvider>
            <TransactionsProvider initialTransactions={initialTransactions}>
                <InvoicesProvider initialInvoices={initialInvoices}>
                    <ReceiptsProvider initialReceipts={initialReceipts}>
                        {children}
                    </ReceiptsProvider>
                </InvoicesProvider>
            </TransactionsProvider>
        </QueryProvider>
    )
}

// ============================================================================
// Selective Providers (for routes that only need specific data)
// ============================================================================

/**
 * Provider for routes that only need transactions
 * Use this for transaction-heavy routes to minimize context overhead
 */
export function TransactionsOnlyProvider({
    children,
    initialTransactions,
}: {
    children: ReactNode
    initialTransactions?: TransactionsProviderProps['initialTransactions']
}) {
    return (
        <QueryProvider>
            <TransactionsProvider initialTransactions={initialTransactions}>
                {children}
            </TransactionsProvider>
        </QueryProvider>
    )
}

/**
 * Provider for routes that only need invoices
 */
export function InvoicesOnlyProvider({
    children,
    initialInvoices,
}: {
    children: ReactNode
    initialInvoices?: InvoicesProviderProps['initialInvoices']
}) {
    return (
        <QueryProvider>
            <InvoicesProvider initialInvoices={initialInvoices}>
                {children}
            </InvoicesProvider>
        </QueryProvider>
    )
}

/**
 * Provider for routes that only need receipts
 */
export function ReceiptsOnlyProvider({
    children,
    initialReceipts,
}: {
    children: ReactNode
    initialReceipts?: ReceiptsProviderProps['initialReceipts']
}) {
    return (
        <QueryProvider>
            <ReceiptsProvider initialReceipts={initialReceipts}>
                {children}
            </ReceiptsProvider>
        </QueryProvider>
    )
}
