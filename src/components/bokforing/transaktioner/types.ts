import { TransactionWithAI } from "@/types"
import type { TransactionStats } from '@/services/transactions'
import { BookingData } from "../dialogs/bokforing"

export interface TransactionsTableProps {
    title?: string
    subtitle?: string
    transactions?: TransactionWithAI[]
    stats?: TransactionStats
    onTransactionBooked?: (transactionId: string, bookingData: BookingData) => void
    // Pagination support
    page?: number
    pageSize?: number
    total?: number
    onPageChange?: (page: number) => void
    isLoading?: boolean
}

export interface TransactionsEmptyStateProps {
    hasFilters: boolean
    onAddTransaction: () => void
}
