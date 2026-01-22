// ============================================================================
// Consolidated Provider - All exports from single file
// ============================================================================

export {
    // Main provider
    AppProviders,
    DataProvider, // Legacy alias

    // Hooks
    useData,
    useTransactions,
    useTransactionsContext, // Legacy alias
    useInvoices,
    useInvoicesContext, // Legacy alias
    useReceipts,
    useReceiptsContext, // Legacy alias

    // Query client
    getQueryClient,
    QueryProvider,

    // Convenience providers
    TransactionsOnlyProvider,
    TransactionsProvider, // Legacy alias
    InvoicesOnlyProvider,
    InvoicesProvider, // Legacy alias
    ReceiptsOnlyProvider,
    ReceiptsProvider, // Legacy alias
} from "./app-provider"

// Company provider
export {
    CompanyProvider,
    useCompany,
    useFeature,
    useCompanyType,
} from "./company-provider"

// Text mode provider (Enkel/Avancerad)
export {
    TextModeProvider,
    useTextMode,
    T,
} from "./text-mode-provider"

export type {
    TextMode,
} from "./text-mode-provider"

export type {
    AppProvidersProps,
    DataProviderProps,
    TransactionsProviderProps,
    InvoicesProviderProps,
    ReceiptsProviderProps,
    QueryProviderProps,
    Invoice,
    Receipt,
} from "./app-provider"

// AI Overlay provider
export {
    AIDialogProvider as AIOverlayProvider,
    AIDialogProvider, // Keep legacy export
    useAIDialog as useAIOverlay,
    useAIDialog, // Keep legacy export
    useAIDialogOptional as useAIOverlayOptional,
    useAIDialogOptional, // Keep legacy export
} from "./ai-overlay-provider"

export type {
    AIDialogStatus as AIOverlayStatus,
    AIDialogStatus, // Keep legacy export
    AIDialogOutput as AIOverlayOutput,
    AIDialogOutput, // Keep legacy export
    AIDialogNavigation as AIOverlayNavigation,
    AIDialogNavigation, // Keep legacy export
    AIDialogDisplay as AIOverlayDisplay,
    AIDialogDisplay, // Keep legacy export
} from "./ai-overlay-provider"
