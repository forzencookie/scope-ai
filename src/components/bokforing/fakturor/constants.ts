import { INVOICE_STATUS_LABELS, SUPPLIER_INVOICE_STATUS_LABELS } from "@/lib/localization"

// Unified columns for mixed view
export const UNIFIED_COLUMNS = [
    { id: "pending", title: "Att hantera", statuses: [INVOICE_STATUS_LABELS.SENT, SUPPLIER_INVOICE_STATUS_LABELS.RECEIVED, SUPPLIER_INVOICE_STATUS_LABELS.APPROVED] },
    { id: "paid", title: "Betalda", statuses: [INVOICE_STATUS_LABELS.PAID, SUPPLIER_INVOICE_STATUS_LABELS.PAID] },
    { id: "draft", title: "Utkast", statuses: [INVOICE_STATUS_LABELS.DRAFT] },
]

// Customer invoice columns
export const CUSTOMER_COLUMNS = [
    { id: "draft", title: "Utkast", status: INVOICE_STATUS_LABELS.DRAFT },
    { id: "sent", title: "Skickade", status: INVOICE_STATUS_LABELS.SENT },
    { id: "paid", title: "Betalda", status: INVOICE_STATUS_LABELS.PAID },
]

// Supplier invoice columns
export const SUPPLIER_COLUMNS = [
    { id: "mottagen", title: "Mottagna", status: SUPPLIER_INVOICE_STATUS_LABELS.RECEIVED },
    { id: "godkand", title: "Godkända", status: SUPPLIER_INVOICE_STATUS_LABELS.APPROVED },
    { id: "betald", title: "Betalda", status: SUPPLIER_INVOICE_STATUS_LABELS.PAID },
]
