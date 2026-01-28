// ============================================
// Hooks - Central Export
// ============================================

// Mobile hook
export { useIsMobile } from "./use-mobile"

// Generic async hooks
export { useAsync, useAsyncMutation } from "./use-async"

// Cached query hook (reduces API calls with TTL-based caching)
export { useCachedQuery } from "./use-cached-query"

// AI usage tracking
export { useAIUsage, formatTokens } from "./use-ai-usage"
export type { AIUsageStats } from "./use-ai-usage"

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

// Real-time collaboration
export { useRealtime, usePagePresence, useEditLock } from "./use-realtime"
export type { PresenceUser, RealtimeEvent } from "./use-realtime"

// Activity log / audit trail
export { useActivityLog, logActivity, formatActivity, formatActivityTime } from "./use-activity-log"
export type { ActivityLogEntry, ActivityAction, EntityType } from "./use-activity-log"

// Last updated timestamp hook
export { useLastUpdated, useLastUpdatedTime, formatLastUpdated } from "./use-last-updated"

// User preferences (settings persistence)
export { usePreferences } from "./use-preferences"
export type { UserPreferences } from "./use-preferences"