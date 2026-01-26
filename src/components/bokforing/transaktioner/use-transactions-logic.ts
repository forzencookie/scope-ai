"use client"

import { useState, useMemo, useCallback } from "react"
import { useTableFilter, useTableSort, commonSortHandlers } from "@/hooks/use-table"
import { useBulkSelection, type BulkAction } from "@/components/shared/bulk-action-toolbar"
import { BookOpen } from "lucide-react"
import { parseAmount } from "@/lib/utils"
import { TRANSACTION_STATUSES, type TransactionWithAI } from "@/types"
import { type BookingData } from "../dialogs/bokforing"
import type { TransactionsTableProps } from "./types"

export function useTransactionsLogic({
    transactions = [],
    stats: externalStats,
    onTransactionBooked
}: TransactionsTableProps) {
    const [newTransactionDialogOpen, setNewTransactionDialogOpen] = useState(false)
    const [selectedTransactions, setSelectedTransactions] = useState<TransactionWithAI[]>([])
    const [bookingDialogOpen, setBookingDialogOpen] = useState(false)

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
        selection.toggleItem(transaction.id)
    }, [selection])

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

        return { income, expenses, pending, totalCount: transactions.length }
    }, [transactions, externalStats])

    // Booking Handlers
    const handleBook = useCallback(async (bookingData: BookingData) => {
        if (onTransactionBooked) {
            await onTransactionBooked(bookingData.entityId, bookingData)
        }
        setBookingDialogOpen(false)
        setSelectedTransactions([])
        selection.clearSelection()
    }, [onTransactionBooked, selection])

    const handleBulkBooking = useCallback((ids: string[]) => {
        const selected = transactions.filter(t => ids.includes(t.id))
        if (selected.length > 0) {
            setSelectedTransactions(selected)
            setBookingDialogOpen(true)
        }
    }, [transactions])

    const bulkActions: BulkAction[] = useMemo(() => [
        {
            id: "book",
            label: "Bokför",
            icon: BookOpen,
            onClick: handleBulkBooking,
        },
    ], [handleBulkBooking])

    return {
        // State
        newTransactionDialogOpen, setNewTransactionDialogOpen,
        bookingDialogOpen, setBookingDialogOpen,
        selectedTransactions,
        
        // Hooks
        filter,
        sort,
        selection,
        
        // Data
        filteredTransactions,
        stats,
        bulkActions,
        
        // Handlers
        handleTransactionClick,
        handleBook
    }
}
