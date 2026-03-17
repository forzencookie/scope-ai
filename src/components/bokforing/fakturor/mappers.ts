import { type Invoice, type InvoiceStatus } from "@/data/invoices"
import { type SupplierInvoice } from "@/types/ownership"
import { type UnifiedInvoice } from "./types"

interface RawCustomerInvoice {
    id: string
    customer: string
    email?: string
    issueDate: string
    dueDate: string
    amount: number
    vatAmount?: number
    totalAmount?: number
    status: string
}

interface RawSupplierInvoice {
    id: string
    invoiceNumber?: string
    supplierName: string
    amount: number
    vatAmount?: number
    totalAmount: number
    dueDate: string
    invoiceDate?: string
    status: string
    currency?: string
}

export const mapCustomerInvoices = (apiInvoices: RawCustomerInvoice[]): Invoice[] => {
    return apiInvoices.map(inv => ({
        id: inv.id,
        customer: inv.customer,
        email: inv.email,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        amount: inv.amount,
        vatAmount: inv.vatAmount,
        totalAmount: inv.totalAmount,
        status: inv.status as InvoiceStatus,
    }))
}

export const mapSupplierInvoices = (apiInvoices: RawSupplierInvoice[]): SupplierInvoice[] => {
    return apiInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber ?? inv.id,
        supplierName: inv.supplierName,
        amount: inv.amount,
        vatAmount: inv.vatAmount ?? 0,
        totalAmount: inv.totalAmount,
        dueDate: inv.dueDate,
        invoiceDate: inv.invoiceDate ?? inv.dueDate,
        status: inv.status as SupplierInvoice['status'],
        currency: (inv.currency || 'SEK') as 'SEK' | 'EUR' | 'USD',
    }))
}

export const mapToUnifiedInvoices = (customerInvoices: Invoice[], supplierInvoices: SupplierInvoice[]): UnifiedInvoice[] => {
    const customer: UnifiedInvoice[] = customerInvoices.map(inv => ({
        id: `c-${inv.id}`,
        direction: "in" as const,
        number: inv.id,
        counterparty: inv.customer,
        amount: inv.amount,
        vatAmount: inv.vatAmount,
        totalAmount: inv.amount + (inv.vatAmount || 0),
        dueDate: inv.dueDate,
        issueDate: inv.issueDate,
        status: inv.status,
        originalCustomerInvoice: inv,
    }))

    const supplier: UnifiedInvoice[] = supplierInvoices.map(inv => ({
        id: `s-${inv.id}`,
        direction: "out" as const,
        number: inv.invoiceNumber || inv.id,
        counterparty: inv.supplierName,
        amount: inv.amount,
        vatAmount: inv.vatAmount,
        totalAmount: inv.totalAmount || inv.amount,
        dueDate: inv.dueDate,
        issueDate: inv.invoiceDate, // Note: using invoiceDate as issueDate
        status: inv.status,
        originalSupplierInvoice: inv,
    }))

    return [...customer, ...supplier].sort((a, b) => 
        new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    )
}
