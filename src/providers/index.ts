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
