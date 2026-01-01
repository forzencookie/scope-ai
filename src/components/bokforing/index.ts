// Bokföring Components - Consolidated from accounting, transactions, revenue, invoices, expenses, assets

// Original accounting exports
export { Huvudbok } from "./huvudbok"
export { JournalCalendar } from "./journal-calendar"
export { VerifikationerTable } from "./verifikationer-table"
export { Calendar } from "./calendar"
export { BookkeepingView } from "./bookkeeping-view"

// From transactions/
export { TransactionsTable } from "./table"
export { BookingDialog } from "./BookingDialog"
export { AIBookingChat } from "./AIBookingChat"
export { TransactionsToolbar } from "./TransactionsToolbar"
export {
    ICON_MAP,
    TransactionRow,
    TransactionsEmptyState,
    NewTransactionDialog,
    TransactionDetailsDialog,
} from "./components"
export type { TransactionRowProps } from "./components"

// From revenue/ (invoices table & kanban)
export { InvoicesTable } from "./invoices-table"
export { InvoicesKanban } from "./invoices-kanban"
export { InvoiceCreateDialog } from "./invoice-create-dialog"
export { InvoiceDocument } from "./invoice-document"
export { InvoiceSummaryPanel } from "./invoice-summary-panel"
export { InvoicesDashboardLayout } from "./invoices-dashboard-layout"

// From invoices/
export { UnifiedInvoicesView } from "./unified-invoices-view"

// From expenses/
export { ReceiptsTable } from "./receipts-table"
export { LeverantorsfakturorTable } from "./leverantorsfakturor-table"
export { ReceiptDocument } from "./receipt-document"
export { SupplierInvoiceDialog } from "./supplier-invoice-dialog"
export { SupplierInvoicesKanban } from "./supplier-invoices-kanban"
export { UnderlagDialog } from "./underlag-dialog"

// From assets/
export { InventarierTable } from "./inventarier-table"
