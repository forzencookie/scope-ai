// Shared Utility Components
export { ErrorBoundary } from "./error-boundary"
export { BulkActionToolbar, useBulkSelection } from "./bulk-action-toolbar"
export type { BulkAction } from "./bulk-action-toolbar"

export { AiProcessingState } from "./ai-processing-state"
export { KanbanBoard, KanbanColumn, KanbanCard } from "./kanban"
export type { KanbanColumnConfig, KanbanCardProps, KanbanColumnProps, KanbanBoardProps } from "./kanban"

// Shared components for DRY refactoring
export { TableToolbar } from "./table-toolbar"
export type { StatusOption, SortOption } from "./table-toolbar"
export { DeleteConfirmDialog, useDeleteConfirmation } from "./delete-confirm-dialog"

// Layout components
export { PageHeader, PageHeaderActions } from "./layout/page-header"
export { PageTabsLayout } from "./layout/page-tabs-layout"
export type { TabConfig } from "./layout/page-tabs-layout"
export { ReportLayout } from "./layout/report-layout"
export { TaxReportLayout } from "./layout/tax-report-layout"
export type { TaxReportStat, TaxReportLayoutProps } from "./layout/tax-report-layout"

// Demo mode components
export { DemoBanner } from "./demo-banner"
export { TierBadge, TierIndicator } from "./tier-badge"
export { UpgradePrompt, UpgradeButton, FeatureGate } from "./upgrade-prompt"

// Real-time collaboration components
export { OnlineUsers, OnlineUsersBadge, EditConflictWarning } from "./online-users"

// Activity log / audit trail
export { ActivityFeed, ActivityItem, ActivityTimeline } from "./activity-feed"

// Lazy Loading with Spinner (Golden Standard)
export {
    LoadingSpinner,
    createLazyComponent,
    // Bokföring
    LazyTransactionsTable,
    LazyReceiptsTable,
    LazyInventarierTable,
    LazyUnifiedInvoicesView,
    // Skatt
    LazyMomsdeklaration,
    LazyInkomstdeklaration,
    LazyAGI,
    LazyArsredovisning,
    LazyArsbokslut,
    LazyK10,
    // Rapporter
    LazyResultatrakning,
    LazyBalansrakning,
    // Löner
    LazyLonebesked,
    LazyTeamTab,
    LazyBenefitsTab,
    // Parter
    LazyUtdelning,
    LazyAktiebok,
    LazyDelagare,
    LazyMedlemsregister,
    LazyStyrelseprotokoll,
    LazyBolagsstamma,
    LazyArsmote,
    LazyFirmatecknare,
    LazyMyndigheter,
    LazyEgenavgifter,
    LazyDelagaruttag,
    // Statistik
    LazyEkonomiskOversikt,
    LazyTransaktionsrapport,
    LazyKostnadsanalys,
    // Onboarding
    LazyOnboardingWizard,
} from "./lazy-loader"
