"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useTableFilter, useTableSort, commonSortHandlers } from "@/hooks/use-table"
import { useBulkSelection, type BulkAction } from "@/components/shared/bulk-action-toolbar"
import { BookOpen } from "lucide-react"
import { parseAmount } from "@/lib/utils"
import { TRANSACTION_STATUSES, type TransactionWithAI, type AISuggestion } from "@/types"
import { type BookingData } from "../dialogs/bokforing"
import type { TransactionsTableProps } from "./types"
import { fetchAiBookingSuggestion } from "@/lib/ai-suggestion"

export function useTransactionsLogic({
    transactions = [],
    stats: externalStats,
    onTransactionBooked,
    isLoading,
}: TransactionsTableProps) {
    const [newTransactionDialogOpen, setNewTransactionDialogOpen] = useState(false)
    const [selectedTransactions, setSelectedTransactions] = useState<TransactionWithAI[]>([])
    const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
    const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null)
    const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false)

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
        // Click opens booking dialog directly for unbooked transactions
        if (transaction.status !== TRANSACTION_STATUSES.RECORDED) {
            setSelectedTransactions([transaction])
            setBookingDialogOpen(true)
        }
    }, [])

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

    // Fetch AI suggestion when booking dialog opens
    useEffect(() => {
        if (!bookingDialogOpen || selectedTransactions.length === 0) {
            setAiSuggestion(null)
            return
        }

        const tx = selectedTransactions[0]
        let cancelled = false
        setAiSuggestionLoading(true)
        setAiSuggestion(null)

        fetchAiBookingSuggestion({
            id: tx.id,
            name: tx.name,
            amount: tx.amount,
            date: tx.date,
        }).then((suggestion) => {
            if (!cancelled) setAiSuggestion(suggestion)
        }).catch(() => {
            // Silently fail — user can still book manually
        }).finally(() => {
            if (!cancelled) setAiSuggestionLoading(false)
        })

        return () => { cancelled = true }
    }, [bookingDialogOpen, selectedTransactions])

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
        aiSuggestion,
        aiSuggestionLoading,

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
        handleBook
    }
}
