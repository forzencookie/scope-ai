// ============================================
// Invoices Mock Data
// ============================================

import { INVOICE_STATUSES, type InvoiceStatus } from "@/lib/status-types"
import type { Invoice } from "@/types"

// Re-export type for convenience
export type { Invoice }

export const mockInvoices: Invoice[] = [
    {
        id: "inv-001",
        invoiceNumber: "2024-001",
        customer: "Teknikbolaget AB",
        issueDate: "2024-11-15",
        dueDate: "2024-12-15",
        amount: 45000,
        status: "Betald",
    },
    {
        id: "inv-002",
        invoiceNumber: "2024-002",
        customer: "Konsultfirman Stockholm",
        issueDate: "2024-11-20",
        dueDate: "2024-12-20",
        amount: 87500,
        status: "Skickad",
    },
    {
        id: "inv-003",
        invoiceNumber: "2024-003",
        customer: "Byggservice Norr AB",
        issueDate: "2024-11-25",
        dueDate: "2024-12-25",
        amount: 125000,
        status: "Utkast",
    },
    {
        id: "inv-004",
        invoiceNumber: "2024-004",
        customer: "Digitalbyråerna i Malmö",
        issueDate: "2024-10-30",
        dueDate: "2024-11-30",
        amount: 62500,
        status: "Förfallen",
    },
    {
        id: "inv-005",
        invoiceNumber: "2024-005",
        customer: "Restaurang Smak & Doft",
        issueDate: "2024-11-28",
        dueDate: "2024-12-28",
        amount: 18750,
        status: "Skickad",
    },
    {
        id: "inv-006",
        invoiceNumber: "2024-006",
        customer: "IT-Partner Göteborg",
        issueDate: "2024-12-01",
        dueDate: "2024-12-31",
        amount: 156000,
        status: "Utkast",
    },
    {
        id: "inv-007",
        invoiceNumber: "2024-007",
        customer: "Advokatbyrån Justitia",
        issueDate: "2024-10-15",
        dueDate: "2024-11-15",
        amount: 93750,
        status: "Betald",
    },
    {
        id: "inv-008",
        invoiceNumber: "2024-008",
        customer: "Eventbolaget Stor & Liten",
        issueDate: "2024-12-05",
        dueDate: "2025-01-05",
        amount: 34500,
        status: "Skickad",
    },
    {
        id: "inv-009",
        invoiceNumber: "2024-009",
        customer: "Redovisning & Ekonomi HB",
        issueDate: "2024-09-20",
        dueDate: "2024-10-20",
        amount: 28000,
        status: "Makulerad",
    },
    {
        id: "inv-010",
        invoiceNumber: "2024-010",
        customer: "Fastighetsförvaltning Centrum",
        issueDate: "2024-12-08",
        dueDate: "2025-01-08",
        amount: 212500,
        status: "Utkast",
    },
]

// Re-export status for convenience
export { INVOICE_STATUSES }
export type { InvoiceStatus }
