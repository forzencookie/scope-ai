import { INVOICE_STATUS_LABELS } from "@/lib/localization"

// Unified columns for mixed view
export const UNIFIED_COLUMNS = [
    { id: "pending", title: "Att hantera", statuses: [INVOICE_STATUS_LABELS.SENT, "mottagen", "attesterad"] },
    { id: "overdue", title: "Förfallna", statuses: [INVOICE_STATUS_LABELS.OVERDUE, "förfallen"] },
    { id: "paid", title: "Betalda", statuses: [INVOICE_STATUS_LABELS.PAID, "betald"] },
    { id: "draft", title: "Utkast", statuses: [INVOICE_STATUS_LABELS.DRAFT] },
]

// Customer invoice columns
export const CUSTOMER_COLUMNS = [
    { id: "draft", title: "Utkast", status: INVOICE_STATUS_LABELS.DRAFT },
    { id: "sent", title: "Skickade", status: INVOICE_STATUS_LABELS.SENT },
    { id: "overdue", title: "Förfallna", status: INVOICE_STATUS_LABELS.OVERDUE },
    { id: "paid", title: "Betalda", status: INVOICE_STATUS_LABELS.PAID },
]

// Supplier invoice columns
export const SUPPLIER_COLUMNS = [
    { id: "mottagen", title: "Mottagna", status: "mottagen" },
    { id: "attesterad", title: "Attesterade", status: "attesterad" },
    { id: "forfallen", title: "Förfallna", status: "förfallen" },
    { id: "betald", title: "Betalda", status: "betald" },
]
