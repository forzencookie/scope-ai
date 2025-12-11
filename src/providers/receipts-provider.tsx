"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"
import { type Receipt, mockReceipts as defaultReceipts } from "@/data/receipts"

// ============================================================================
// Receipts Provider Context
// ============================================================================

interface ReceiptsContextValue {
    receipts: Receipt[]
    setReceipts: (receipts: Receipt[]) => void
    addReceipt: (receipt: Receipt) => void
    updateReceipt: (id: string, updates: Partial<Receipt>) => void
    deleteReceipt: (id: string) => void
}

const ReceiptsContext = createContext<ReceiptsContextValue | undefined>(undefined)

export interface ReceiptsProviderProps {
    children: ReactNode
    initialReceipts?: Receipt[]
}

/**
 * Isolated provider for receipts data
 * Only re-renders components that consume receipts when receipts change
 */
export function ReceiptsProvider({
    children,
    initialReceipts = defaultReceipts,
}: ReceiptsProviderProps) {
    const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts)

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

    const value = useMemo<ReceiptsContextValue>(
        () => ({
            receipts,
            setReceipts,
            addReceipt,
            updateReceipt,
            deleteReceipt,
        }),
        [receipts, addReceipt, updateReceipt, deleteReceipt]
    )

    return (
        <ReceiptsContext.Provider value={value}>
            {children}
        </ReceiptsContext.Provider>
    )
}

export function useReceiptsContext(): ReceiptsContextValue {
    const context = useContext(ReceiptsContext)
    if (context === undefined) {
        throw new Error("useReceiptsContext must be used within a ReceiptsProvider")
    }
    return context
}
