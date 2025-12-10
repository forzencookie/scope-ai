// ============================================
// Hooks - Central Export
// ============================================

// Mobile hook
export { useIsMobile } from "./use-mobile"

// Generic async hooks
export { useAsync, useAsyncMutation } from "./use-async"

// Table hooks (consolidated)
export {
    useTableFilter,
    useTableSort,
    useTableData,
    parseDate,
    commonSortHandlers,
} from "./use-table"
export type {
    FilterConfig,
    UseTableFilterResult,
    SortConfig,
    UseTableSortResult,
    SortDirection,
    UseTableDataConfig,
    UseTableDataResult,
} from "./use-table"

// Data layer hooks
export * from "./use-navigation"
export * from "./use-dashboard"
export * from "./use-inbox"
export * from "./use-transactions"

// React Query based hooks (recommended for new code)
export {
    queryKeys,
    useTransactionsQuery,
    useTransactionsPaginatedQuery,
    useUpdateTransactionStatus,
    useDeleteTransaction,
    prefetchTransactions,
    invalidateTransactions,
} from "./use-query-data"

