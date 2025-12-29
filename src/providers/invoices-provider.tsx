"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"
import type { Invoice } from "@/types"

// PRODUCTION: No mock data
const defaultInvoices: Invoice[] = []

// ============================================================================
// Invoices Provider Context
// ============================================================================

interface InvoicesContextValue {
    invoices: Invoice[]
    setInvoices: (invoices: Invoice[]) => void
    addInvoice: (invoice: Invoice) => void
    updateInvoice: (id: string, updates: Partial<Invoice>) => void
    deleteInvoice: (id: string) => void
}

const InvoicesContext = createContext<InvoicesContextValue | undefined>(undefined)

export interface InvoicesProviderProps {
    children: ReactNode
    initialInvoices?: Invoice[]
}

/**
 * Isolated provider for invoices data
 * Only re-renders components that consume invoices when invoices change
 */
export function InvoicesProvider({
    children,
    initialInvoices = defaultInvoices,
}: InvoicesProviderProps) {
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)

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

    const value = useMemo<InvoicesContextValue>(
        () => ({
            invoices,
            setInvoices,
            addInvoice,
            updateInvoice,
            deleteInvoice,
        }),
        [invoices, addInvoice, updateInvoice, deleteInvoice]
    )

    return (
        <InvoicesContext.Provider value={value}>
            {children}
        </InvoicesContext.Provider>
    )
}

export function useInvoicesContext(): InvoicesContextValue {
    const context = useContext(InvoicesContext)
    if (context === undefined) {
        throw new Error("useInvoicesContext must be used within an InvoicesProvider")
    }
    return context
}
