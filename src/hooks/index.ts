// ============================================
// Hooks - Central Export
// ============================================

// Mobile hook
export { useIsMobile } from "./use-mobile"

// Generic async hooks
export { useAsync, useAsyncMutation } from "./use-async"

// Cached query hook (reduces API calls with TTL-based caching)
export { useCachedQuery } from "./use-cached-query"

// Dynamic tasks hook (generates actionable tasks from real data)
export { useDynamicTasks } from "./use-dynamic-tasks"
export type { DynamicTask, DynamicGoal } from "./use-dynamic-tasks"

// Highlight hook (for highlighting AI-created content)
export { useHighlight, useHighlightState } from "./use-highlight"

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

export * from "./use-transactions"
export * from "./use-account-balances"

// Bank transactions hook (connects to bank simulator)
export { 
  useBankTransactions, 
  suggestCategory, 
  getCategoryAccountNumber, 
  getBankAccountNumber,
} from "./use-bank-transactions"
export type { UseBankTransactionsReturn } from "./use-bank-transactions"

// Last updated timestamp hook
export { useLastUpdated, useLastUpdatedTime, formatLastUpdated } from "./use-last-updated"

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

// Agent Chat Hook
export { useAgentChat } from "./use-agent-chat"
export type { UseAgentChatReturn } from "./use-agent-chat"