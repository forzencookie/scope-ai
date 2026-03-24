import { TransactionWithAI } from "@/types"
import type { TransactionStats } from '@/services/accounting/transactions'

export interface TransactionsTableProps {
    title?: string
    subtitle?: string
    transactions?: TransactionWithAI[]
    stats?: TransactionStats
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
