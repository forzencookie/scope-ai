// ============================================
// Invoices Types & Constants
// PRODUCTION: No mock data - types only
// ============================================

import { INVOICE_STATUSES, type InvoiceStatus } from "@/lib/status-types"
import type { Invoice } from "@/types"

// Re-export type for convenience
export type { Invoice }

// Re-export status for convenience
export { INVOICE_STATUSES }
export type { InvoiceStatus }
