import { TransactionWithAI } from "@/types"
import { TransactionStats } from "@/lib/services/transaction-service"
import { BookingData } from "../dialogs/bokforing"

export interface TransactionsTableProps {
    title?: string
    subtitle?: string
    transactions?: TransactionWithAI[]
    stats?: TransactionStats
    onTransactionBooked?: (transactionId: string, bookingData: BookingData) => void
}

export interface TransactionsEmptyStateProps {
    hasFilters: boolean
    onAddTransaction: () => void
}
