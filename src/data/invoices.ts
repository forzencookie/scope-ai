// ============================================
// Invoices Mock Data
// ============================================

import { INVOICE_STATUSES, type InvoiceStatus } from "@/lib/status-types"
import type { Invoice } from "@/types"

// Re-export type for convenience
export type { Invoice }

export const mockInvoices: Invoice[] = []

// Re-export status for convenience
export { INVOICE_STATUSES }
export type { InvoiceStatus }
