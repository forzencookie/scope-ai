/**
 * Centralized Status Types
 * 
 * This file is the single source of truth for all status types in the application.
 * All status-related types should be imported from here.
 * 
 * Note: Swedish display labels are defined in @/lib/localization.ts
 * This file uses those labels to maintain a single source of truth.
 */

import { 
    TRANSACTION_STATUS_LABELS,
    INVOICE_STATUS_LABELS,
    RECEIPT_STATUS_LABELS,
    GENERAL_STATUS_LABELS,
} from "./localization"

// =============================================================================
// Status Variants (for UI styling)
// =============================================================================

export type StatusVariant = "success" | "warning" | "error" | "info" | "neutral"

// =============================================================================
// Transaction Status (Bokföring)
// =============================================================================

export const TRANSACTION_STATUSES = TRANSACTION_STATUS_LABELS

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[keyof typeof TRANSACTION_STATUSES]

export const TRANSACTION_STATUS_VARIANT: Record<TransactionStatus, StatusVariant> = {
    "Att bokföra": "warning",
    "Bokförd": "success",
    "Saknar underlag": "error",
    "Ignorerad": "neutral",
}

// =============================================================================
// Invoice Status (Fakturor)
// =============================================================================

export const INVOICE_STATUSES = INVOICE_STATUS_LABELS

export type InvoiceStatus = (typeof INVOICE_STATUSES)[keyof typeof INVOICE_STATUSES]

export const INVOICE_STATUS_VARIANT: Record<InvoiceStatus, StatusVariant> = {
    "Betald": "success",
    "Skickad": "info",
    "Utkast": "neutral",
    "Förfallen": "error",
}

// =============================================================================
// Receipt Status (Underlag/Kvitton)
// =============================================================================

export const RECEIPT_STATUSES = RECEIPT_STATUS_LABELS

export type ReceiptStatus = (typeof RECEIPT_STATUSES)[keyof typeof RECEIPT_STATUSES]

export const RECEIPT_STATUS_VARIANT: Record<ReceiptStatus, StatusVariant> = {
    "Verifierad": "success",
    "Väntar": "warning",
    "Bearbetar": "neutral",
    "Granskning krävs": "error",
    "Behandlad": "success",
    "Avvisad": "error",
}

// =============================================================================
// General/Shared Statuses
// =============================================================================

export const GENERAL_STATUSES = GENERAL_STATUS_LABELS

export type GeneralStatus = (typeof GENERAL_STATUSES)[keyof typeof GENERAL_STATUSES]

export const GENERAL_STATUS_VARIANT: Record<GeneralStatus, StatusVariant> = {
    "Inskickad": "success",
    "Kommande": "warning",
    "Klar": "success",
    "Ofullständig": "warning",
    "Planerad": "info",
    "Utbetald": "success",
    "Godkänd": "success",
}

// =============================================================================
// Combined Status Type (for StatusBadge component)
// =============================================================================

export type AppStatus = TransactionStatus | InvoiceStatus | ReceiptStatus | GeneralStatus

export const ALL_STATUS_VARIANTS: Record<AppStatus, StatusVariant> = {
    ...TRANSACTION_STATUS_VARIANT,
    ...INVOICE_STATUS_VARIANT,
    ...RECEIPT_STATUS_VARIANT,
    ...GENERAL_STATUS_VARIANT,
}

// =============================================================================
// Helper function to get variant for any status
// =============================================================================

export function getStatusVariant(status: AppStatus): StatusVariant {
    return ALL_STATUS_VARIANTS[status] ?? "neutral"
}

// =============================================================================
// Type guards
// =============================================================================

export function isTransactionStatus(status: string): status is TransactionStatus {
    return Object.values(TRANSACTION_STATUSES).includes(status as TransactionStatus)
}

export function isInvoiceStatus(status: string): status is InvoiceStatus {
    return Object.values(INVOICE_STATUSES).includes(status as InvoiceStatus)
}

export function isReceiptStatus(status: string): status is ReceiptStatus {
    return Object.values(RECEIPT_STATUSES).includes(status as ReceiptStatus)
}

export function isAppStatus(status: string): status is AppStatus {
    return status in ALL_STATUS_VARIANTS
}
