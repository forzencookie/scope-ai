/**
 * Invoice Processor Service
 * 
 * Takes NAKED invoices (raw invoice data) and "clothes" them:
 * - Adds display properties
 * - Adds status tracking
 * - Calculates due dates and overdue status
 */

import { INVOICE_STATUSES, type InvoiceStatus } from "@/lib/status-types"
import { formatCurrency as formatCurrencyBase, formatDate } from "@/lib/utils"

// Custom date format for invoices (e.g., "15 dec 2024")
const invoiceDateFormat: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short', 
  year: 'numeric'
}

// Format currency without decimals for invoice display
function formatCurrency(amount: number): string {
  return formatCurrencyBase(amount, "sv-SE", "SEK", 0)
}

// ============================================================================
// Types
// ============================================================================

/**
 * Raw invoice data - "naked"
 */
export interface NakedInvoice {
  id: string
  invoiceNumber: string    // "2024-001"
  customerName: string     // "Acme AB"
  customerEmail?: string   // "faktura@acme.se"
  amount: number           // 25000.00
  issueDate: string        // "2025-12-01" ISO date
  dueDate: string          // "2025-12-31" ISO date
  description?: string     // "Konsulttjänster december"
}

/**
 * Naked supplier invoice (leverantörsfaktura)
 */
export interface NakedSupplierInvoice {
  id: string
  invoiceNumber: string    // "F2024-1234"
  supplierName: string     // "Leverantör AB"
  amount: number           // 15000.00
  issueDate: string        // "2025-12-01"
  dueDate: string          // "2025-12-30"
  description?: string
  ocrNumber?: string       // OCR payment reference
}

/**
 * Fully processed customer invoice
 */
export interface ProcessedInvoice {
  id: string
  invoiceNumber: string
  customer: string
  email?: string
  date: string
  dueDate: string
  amount: string
  amountValue: number
  status: InvoiceStatus
  isOverdue: boolean
  daysUntilDue: number
  description?: string
}

/**
 * Fully processed supplier invoice
 */
export interface ProcessedSupplierInvoice {
  id: string
  invoiceNumber: string
  supplier: string
  date: string
  dueDate: string
  amount: string
  amountValue: number
  status: 'mottagen' | 'attesterad' | 'betald' | 'förfallen' | 'tvist'
  isOverdue: boolean
  daysUntilDue: number
  ocrNumber?: string
  description?: string
}

// ============================================================================
// Helpers
// ============================================================================

function calculateDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date()
  const diffTime = due.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function determineInvoiceStatus(dueDate: string, isPaid: boolean = false): InvoiceStatus {
  if (isPaid) return INVOICE_STATUSES.PAID as InvoiceStatus
  
  const daysUntilDue = calculateDaysUntilDue(dueDate)
  if (daysUntilDue < 0) return INVOICE_STATUSES.OVERDUE as InvoiceStatus
  if (daysUntilDue <= 7) return INVOICE_STATUSES.SENT as InvoiceStatus // Sent, due soon
  return INVOICE_STATUSES.DRAFT as InvoiceStatus
}

function determineSupplierInvoiceStatus(
  dueDate: string, 
  isPaid: boolean = false
): ProcessedSupplierInvoice['status'] {
  if (isPaid) return 'betald'
  
  const daysUntilDue = calculateDaysUntilDue(dueDate)
  if (daysUntilDue < 0) return 'förfallen'
  return 'mottagen'
}

// ============================================================================
// Main Processors
// ============================================================================

export function processInvoice(naked: NakedInvoice): ProcessedInvoice {
  const daysUntilDue = calculateDaysUntilDue(naked.dueDate)
  
  return {
    id: naked.id,
    invoiceNumber: naked.invoiceNumber,
    customer: naked.customerName,
    email: naked.customerEmail,
    date: formatDate(naked.issueDate, invoiceDateFormat),
    dueDate: formatDate(naked.dueDate, invoiceDateFormat),
    amount: formatCurrency(naked.amount),
    amountValue: naked.amount,
    status: determineInvoiceStatus(naked.dueDate),
    isOverdue: daysUntilDue < 0,
    daysUntilDue,
    description: naked.description,
  }
}

export function processInvoices(naked: NakedInvoice[]): ProcessedInvoice[] {
  return naked.map(processInvoice)
}

export function processSupplierInvoice(naked: NakedSupplierInvoice): ProcessedSupplierInvoice {
  const daysUntilDue = calculateDaysUntilDue(naked.dueDate)
  
  return {
    id: naked.id,
    invoiceNumber: naked.invoiceNumber,
    supplier: naked.supplierName,
    date: formatDate(naked.issueDate, invoiceDateFormat),
    dueDate: formatDate(naked.dueDate, invoiceDateFormat),
    amount: formatCurrency(naked.amount),
    amountValue: naked.amount,
    status: determineSupplierInvoiceStatus(naked.dueDate),
    isOverdue: daysUntilDue < 0,
    daysUntilDue,
    ocrNumber: naked.ocrNumber,
    description: naked.description,
  }
}

export function processSupplierInvoices(naked: NakedSupplierInvoice[]): ProcessedSupplierInvoice[] {
  return naked.map(processSupplierInvoice)
}
