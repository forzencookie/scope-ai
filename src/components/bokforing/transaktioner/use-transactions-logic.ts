"use client"

import { useMemo, useCallback } from "react"
import { useTableFilter, useTableSort, commonSortHandlers } from "@/hooks/use-table"
import { useBulkSelection, type BulkAction } from "@/components/shared/bulk-action-toolbar"
import { parseAmount } from "@/lib/utils"
import { TRANSACTION_STATUSES, type TransactionWithAI } from "@/types"
import type { TransactionsTableProps } from "./types"
import { useChatNavigation } from "@/hooks/use-chat-navigation"

export function useTransactionsLogic({
    transactions = [],
    stats: externalStats,
    isLoading,
}: TransactionsTableProps) {
    const { navigateToAI } = useChatNavigation()

    // Table Logic
    const filter = useTableFilter<TransactionWithAI>({
        searchFields: ["name", "account", "amount"],
        initialStatusFilter: []
    })

    const sort = useTableSort<TransactionWithAI>({
        initialSortBy: "date",
        initialSortOrder: "desc",
        sortHandlers: {
            date: commonSortHandlers.date,
            amount: commonSortHandlers.amount,
            name: (a, b) => a.name.localeCompare(b.name)
        }
    })

    const filteredTransactions = useMemo(() => {
        const filtered = filter.filterItems(transactions)
        return sort.sortItems(filtered)
    }, [transactions, filter, sort])

    // Selection Logic
    const selection = useBulkSelection(filteredTransactions)

    const handleTransactionClick = useCallback((transaction: TransactionWithAI) => {
        // If unbooked, ask Scooby to handle it
        const isUnbooked = transaction.status === TRANSACTION_STATUSES.TO_RECORD || 
                          transaction.status === TRANSACTION_STATUSES.MISSING_DOCUMENTATION
        
        if (isUnbooked) {
            navigateToAI({ 
                prompt: `Hjälp mig att bokföra transaktionen "${transaction.name}" på ${transaction.amount} från ${transaction.date}.` 
            })
        } else {
            // For booked items, we just show details (future: open Page Overlay)
            console.log("View booked transaction:", transaction.id)
        }
    }, [navigateToAI])

    // Stats Logic
    const stats = useMemo(() => {
        if (externalStats) return externalStats

        const income = transactions
            .filter(t => parseAmount(t.amount) > 0)
            .reduce((sum, t) => sum + parseAmount(t.amount), 0)

        const expenses = transactions
            .filter(t => parseAmount(t.amount) < 0)
            .reduce((sum, t) => sum + Math.abs(parseAmount(t.amount)), 0)

        const pending = transactions.filter(t =>
            t.status === TRANSACTION_STATUSES.TO_RECORD ||
            t.status === TRANSACTION_STATUSES.MISSING_DOCUMENTATION
        ).length

        const booked = transactions.filter(t =>
            t.status === TRANSACTION_STATUSES.RECORDED
        ).length

        return { income, expenses, pending, booked, totalCount: transactions.length }
    }, [transactions, externalStats])

    const bulkActions: BulkAction[] = useMemo(() => [], [])

    return {
        // Hooks
        filter,
        sort,
        selection,

        // Data
        filteredTransactions,
        stats,
        bulkActions,
        isLoading,

        // Handlers
        handleTransactionClick,
    }
}
