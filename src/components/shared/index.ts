// Shared Utility Components
export { ErrorBoundary, SectionErrorBoundary } from "./error-boundary"
export { BulkActionToolbar, useBulkSelection } from "./bulk-action-toolbar"
export { ActionEmptyState } from "./empty-state"
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
export { ReportWizardShell } from "./report-wizard-shell"
export type { ReportWizardShellProps, ReportStatus } from "./report-wizard-shell"

// Tier components
export { TierBadge, TierIndicator } from "./tier-badge"
export { UpgradePrompt, UpgradeButton, FeatureGate } from "./upgrade-prompt"

// Year navigation
export { YearSlider } from "./year-slider"

// Activity log / audit trail
export { ActivityFeed, ActivityItem, ActivityTimeline } from "./activity-feed"

// Lazy Loading with Spinner (Golden Standard)
export {
    LoadingSpinner,
    createLazyComponent,
    // Bokföring
    LazyTransactionsTable,
    LazyUnifiedInvoicesView,
    LazyInventarierTable,
    // Löner
    LazyLonebesked,
    LazyTeamTab,
    LazyFormaner,
    LazyEgenavgifter,
    LazyDelagaruttag,
    // Ägare & Styrning
    LazyAktiebok,
    LazyDelagare,
    LazyMedlemsregister,
    LazyBolagsstamma,
    LazyArsmote,
    // Onboarding
    LazyOnboardingWizard,
} from "./lazy-loader"
export { PageOverlay } from './page-overlay'
