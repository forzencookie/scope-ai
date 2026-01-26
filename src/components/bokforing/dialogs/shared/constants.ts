/**
 * Shared constants for bokforing dialog components
 */

// Category options for invoices
export const CATEGORY_OPTIONS = [
    { value: "Övriga kostnader", label: "Övriga kostnader" },
    { value: "Kontorsmaterial", label: "Kontorsmaterial" },
    { value: "Programvara", label: "Programvara" },
    { value: "Konsulttjänster", label: "Konsulttjänster" },
    { value: "Hyra", label: "Hyra" },
    { value: "Inköp material", label: "Inköp material" },
] as const

// Contract type options
export const CONTRACT_TYPE_OPTIONS = [
    { value: "tillsvidare", label: "Tillsvidare" },
    { value: "visstid", label: "Visstid" },
    { value: "engangs", label: "Projekt / Engångs" },
] as const

// Notice period options
export const NOTICE_PERIOD_OPTIONS = [
    { value: "0", label: "Ingen" },
    { value: "1", label: "1 månad" },
    { value: "3", label: "3 månader" },
    { value: "6", label: "6 månader" },
    { value: "12", label: "12 månader" },
] as const

// VAT rate options
export const VAT_RATE_OPTIONS = [
    { value: "25", label: "25%" },
    { value: "12", label: "12%" },
    { value: "6", label: "6%" },
    { value: "0", label: "0%" },
] as const

// Payment terms options
export const PAYMENT_TERMS_OPTIONS = [
    { value: "10", label: "10 dagar" },
    { value: "15", label: "15 dagar" },
    { value: "30", label: "30 dagar" },
    { value: "45", label: "45 dagar" },
    { value: "60", label: "60 dagar" },
] as const

// AI processing states
export type AiState = 'idle' | 'processing' | 'preview' | 'error'
