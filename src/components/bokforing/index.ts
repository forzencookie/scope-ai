// Bokforing - Main exports (cleaned up)

// Core views

export { UnifiedInvoicesView, UnifiedInvoicesView as InvoicesTable } from "./fakturor"
export { ReceiptsTable } from "./kvitton"
export { TransactionsTable } from "./transaktioner"
export { VerifikationerTable } from "./verifikationer"
export { InventarierTable } from "./inventarier"

// Shared transaction components
// Shared constants
export { ICON_MAP } from "./constants"


// Re-export shared types
export type { BookingData } from "@/types"
