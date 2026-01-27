import { type Invoice } from "@/data/invoices"
import { type SupplierInvoice } from "@/types/ownership"

export type InvoiceDirection = "in" | "out"
export type ViewFilter = "all" | "kundfakturor" | "leverantorsfakturor"
export type PeriodFilter = "week" | "month" | "quarter" | "all"

export interface UnifiedInvoice {
    id: string
    direction: InvoiceDirection
    number: string
    counterparty: string
    amount: number
    vatAmount?: number
    totalAmount: number
    dueDate: string
    issueDate: string
    status: string
    // Original data for actions
    originalCustomerInvoice?: Invoice
    originalSupplierInvoice?: SupplierInvoice
}

export interface InvoiceStats {
    incoming: number
    outgoing: number
    overdue: number
    overdueCount: number
    paid: number
}
