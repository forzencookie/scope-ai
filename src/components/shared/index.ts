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
