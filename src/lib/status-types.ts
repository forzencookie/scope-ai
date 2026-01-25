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
    SUPPLIER_INVOICE_STATUS_LABELS,
    STOCK_TRANSACTION_TYPE_LABELS,
    MEMBERSHIP_STATUS_LABELS,
    MEMBERSHIP_CHANGE_TYPE_LABELS,
    MEETING_STATUS_LABELS,
    BENEFIT_STATUS_LABELS,
} from "./localization"

// =============================================================================
// Status Variants (for UI styling)
// =============================================================================

export type StatusVariant = "success" | "warning" | "error" | "info" | "neutral" | "violet" | "purple"

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
    "Makulerad": "neutral",
    "Bokförd": "violet",
    "Mottagen": "info",
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
    "Matchad": "success",
    "Avvisad": "error",
    "Bokförd": "violet",
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
    // Verifikationer statuses
    "Transaktion kopplad": "success",
    "Transaktion saknas": "error",
    "Underlag finns": "success",
    "Underlag saknas": "warning",
    // Account type labels
    "Tillgång": "info",
    "Skuld": "error",
    "Eget kapital": "purple",
    "Intäkt": "success",
    "Kostnad": "warning",
    // Partner types (HB/KB)
    "Komplementär": "info",
    "Kommanditdelägare": "neutral",
    // Withdrawal types
    "Uttag": "error",
    "Insättning": "success",
    "Lön": "violet",
}

// =============================================================================
// Supplier Invoice Status (Leverantörsfakturor)
// =============================================================================

export const SUPPLIER_INVOICE_STATUSES = SUPPLIER_INVOICE_STATUS_LABELS

export type SupplierInvoiceStatus = (typeof SUPPLIER_INVOICE_STATUSES)[keyof typeof SUPPLIER_INVOICE_STATUSES]

export const SUPPLIER_INVOICE_STATUS_VARIANT: Record<SupplierInvoiceStatus, StatusVariant> = {
    "Mottagen": "violet",
    "Attesterad": "warning",
    "Betald": "success",
    "Förfallen": "error",
    "Tvist": "purple",
    "Bokförd": "violet",
}

// =============================================================================
// Stock Transaction Types (Aktiebok)
// =============================================================================

export const STOCK_TRANSACTION_TYPES = STOCK_TRANSACTION_TYPE_LABELS

export type StockTransactionType = (typeof STOCK_TRANSACTION_TYPES)[keyof typeof STOCK_TRANSACTION_TYPES]

export const STOCK_TRANSACTION_TYPE_VARIANT: Record<StockTransactionType, StatusVariant> = {
    "Nyemission": "success",
    "Köp": "violet",
    "Försäljning": "warning",
    "Gåva": "purple",
    "Arv": "neutral",
    "Split": "info",
}

// =============================================================================
// Membership Status (Medlemsregister)
// =============================================================================

export const MEMBERSHIP_STATUSES = MEMBERSHIP_STATUS_LABELS

export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[keyof typeof MEMBERSHIP_STATUSES]

export const MEMBERSHIP_STATUS_VARIANT: Record<MembershipStatus, StatusVariant> = {
    "Aktiv": "success",
    "Vilande": "warning",
    "Avslutad": "neutral",
}

// =============================================================================
// Membership Change Types (Medlemsregister)
// =============================================================================

export const MEMBERSHIP_CHANGE_TYPES = MEMBERSHIP_CHANGE_TYPE_LABELS

export type MembershipChangeType = (typeof MEMBERSHIP_CHANGE_TYPES)[keyof typeof MEMBERSHIP_CHANGE_TYPES]

export const MEMBERSHIP_CHANGE_TYPE_VARIANT: Record<MembershipChangeType, StatusVariant> = {
    "Gått med": "success",
    "Lämnat": "error",
    "Statusändring": "violet",
    "Rollbyte": "purple",
}

// =============================================================================
// Meeting Status (Styrelseprotokoll/Bolagsstämma)
// =============================================================================

export const MEETING_STATUSES = MEETING_STATUS_LABELS

export type MeetingStatus = (typeof MEETING_STATUSES)[keyof typeof MEETING_STATUSES]

export const MEETING_STATUS_VARIANT: Record<MeetingStatus, StatusVariant> = {
    "Planerad": "info",
    "Kallad": "warning",
    "Genomförd": "violet",
    "Signerat": "success",
}

// =============================================================================
// Benefit Status (Förmåner)
// =============================================================================

export const BENEFIT_STATUSES = BENEFIT_STATUS_LABELS

export type BenefitStatus = (typeof BENEFIT_STATUSES)[keyof typeof BENEFIT_STATUSES]

export const BENEFIT_STATUS_VARIANT: Record<BenefitStatus, StatusVariant> = {
    "Skattefri": "success",
    "Skattepliktig": "warning",
    "Löneväxling": "info",
}

// =============================================================================
// Combined Status Type (for StatusBadge component)
// =============================================================================

export type AppStatus =
    | TransactionStatus
    | InvoiceStatus
    | ReceiptStatus
    | GeneralStatus
    | SupplierInvoiceStatus
    | StockTransactionType
    | MembershipStatus
    | MembershipChangeType
    | MeetingStatus
    | BenefitStatus

export const ALL_STATUS_VARIANTS: Record<AppStatus, StatusVariant> = {
    ...TRANSACTION_STATUS_VARIANT,
    ...INVOICE_STATUS_VARIANT,
    ...RECEIPT_STATUS_VARIANT,
    ...GENERAL_STATUS_VARIANT,
    ...SUPPLIER_INVOICE_STATUS_VARIANT,
    ...STOCK_TRANSACTION_TYPE_VARIANT,
    ...MEMBERSHIP_STATUS_VARIANT,
    ...MEMBERSHIP_CHANGE_TYPE_VARIANT,
    ...MEETING_STATUS_VARIANT,
    ...BENEFIT_STATUS_VARIANT,
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
