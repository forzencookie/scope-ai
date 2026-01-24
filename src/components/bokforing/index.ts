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


// Dialogs
export { BookingDialog, type BookingData } from "./dialogs/bokforing"
export { InvoiceCreateDialog } from "./dialogs/faktura"
export { SupplierInvoiceDialog } from "./dialogs/leverantor"
export { UnderlagDialog } from "./dialogs/underlag"
export { VerifikationDialog } from "./dialogs/verifikation"
export { TinkPaymentDialog } from "./dialogs/betalning"
