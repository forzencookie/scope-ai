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

// Data layer hooks - React Query based (caching, optimistic updates, deduplication)
export {
    useTransactions,
    useTransactionsPaginated,
    useTransactionsByStatus,
    useTransactionStats,
    useTransactionAI,
    useTransactionSelection,
    transactionQueryKeys,
    prefetchTransactions,
    useInvalidateTransactions,
} from "./use-transactions-query"

export * from "./use-account-balances"

// Subscription/tier management
export { useSubscription } from "./use-subscription"
export type { SubscriptionTier, GatedFeature } from "./use-subscription"

// Last updated timestamp hook
export { useLastUpdated, useLastUpdatedTime, formatLastUpdated } from "./use-last-updated"