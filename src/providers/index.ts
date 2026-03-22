// ============================================================================
// Providers Layer - Central Export
// ============================================================================

// Query provider (React Query wrapper)
export { QueryProvider, getQueryClient } from "./query-provider"
export type { QueryProviderProps } from "./query-provider"

// Company provider (company type, feature gating, company data)
export {
    CompanyProvider,
    useCompany,
    useFeature,
    useCompanyType,
} from "./company-provider"

// AI overlay provider (Scooby dialog state)
export {
    AIDialogProvider,
    useAIDialog,
    useAIDialogOptional,
} from "./ai-overlay-provider"

// Model provider (AI model selection)
export { ModelProvider, useModel } from "./model-provider"

// Types
export type {
    AIDialogStatus,
    AIDialogOutput,
    AIDialogNavigation,
    AIDialogDisplay,
} from "./ai-overlay-provider"
