import { useState, useMemo } from "react"
import { useInvoicesPaginated } from "@/hooks/use-invoices"
import { INVOICE_STATUS_LABELS, SUPPLIER_INVOICE_STATUS_LABELS } from "@/lib/localization"
import { mapCustomerInvoices, mapSupplierInvoices, mapToUnifiedInvoices } from "./mappers"
import { Invoice } from "@/data/invoices"
import { SupplierInvoice } from "@/types/ownership"
import { ViewFilter, PeriodFilter, UnifiedInvoice } from "./types"

export function useInvoicesLogic() {

    // Local State
    const [viewFilter, setViewFilter] = useState<ViewFilter>("all")
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")
    const [customerDialogOpen, setCustomerDialogOpen] = useState(false)

    // Derived State: Start Date
    const startDate = useMemo(() => {
        const now = new Date()
        switch (periodFilter) {
            case "week": {
                const start = new Date(now)
                start.setDate(now.getDate() - 7)
                return start.toISOString().split('T')[0]
            }
            case "month": {
                const start = new Date(now.getFullYear(), now.getMonth(), 1)
                return start.toISOString().split('T')[0]
            }
            case "quarter": {
                const quarterMonth = Math.floor(now.getMonth() / 3) * 3
                const start = new Date(now.getFullYear(), quarterMonth, 1)
                return start.toISOString().split('T')[0]
            }
            default:
                return undefined
        }
    }, [periodFilter])

    // Data Fetching
    const {
        customerInvoices: apiCustomerInvoices,
        supplierInvoices: apiSupplierInvoices,
        isLoading,
        page,
        setPage,
        pageSize,
        totalCustomerCount,
        totalSupplierCount,
        refetch: fetchInvoices
    } = useInvoicesPaginated(25, viewFilter, startDate)

    // Data Mapping
    const customerInvoices = useMemo<Invoice[]>(() => 
        mapCustomerInvoices(apiCustomerInvoices), 
    [apiCustomerInvoices])

    const supplierInvoices = useMemo<SupplierInvoice[]>(() => 
        mapSupplierInvoices(apiSupplierInvoices), 
    [apiSupplierInvoices])

    const unifiedInvoices = useMemo<UnifiedInvoice[]>(() => 
        mapToUnifiedInvoices(customerInvoices, supplierInvoices), 
    [customerInvoices, supplierInvoices])

    // Statistics
    const stats = useMemo(() => {
        const incoming = customerInvoices
            .filter(i => i.status === INVOICE_STATUS_LABELS.SENT)
            .reduce((sum, start) => sum + (start.amount + (start.vatAmount || 0)), 0)

        const outgoing = supplierInvoices
            .filter(i => i.status !== SUPPLIER_INVOICE_STATUS_LABELS.PAID)
            .reduce((sum, i) => sum + (i.totalAmount || i.amount), 0)

        const today = new Date().toISOString().split('T')[0]
        const overdueCustomer = customerInvoices.filter(i => i.status === INVOICE_STATUS_LABELS.SENT && i.dueDate < today)
        const overdueSupplier = supplierInvoices.filter(i => i.status !== SUPPLIER_INVOICE_STATUS_LABELS.PAID && i.dueDate < today)

        const overdueCount = overdueCustomer.length + overdueSupplier.length
        const overdueAmount = overdueCustomer.reduce((sum, i) => sum + (i.amount + (i.vatAmount || 0)), 0) + overdueSupplier.reduce((sum, i) => sum + (i.totalAmount || 0), 0)

        const paidCustomer = customerInvoices
            .filter(i => i.status === INVOICE_STATUS_LABELS.PAID)
            .reduce((sum, i) => sum + (i.amount + (i.vatAmount || 0)), 0)

        const paidSupplier = supplierInvoices
            .filter(i => i.status === SUPPLIER_INVOICE_STATUS_LABELS.PAID)
            .reduce((sum, i) => sum + (i.totalAmount || 0), 0)

        return {
            incoming,
            outgoing,
            overdue: overdueAmount,
            overdueCount,
            paid: paidCustomer + paidSupplier,
        }
    }, [customerInvoices, supplierInvoices])

    return {
        // State
        viewFilter, setViewFilter,
        periodFilter, setPeriodFilter,
        customerDialogOpen, setCustomerDialogOpen,
        isLoading,

        // Pagination
        page, setPage, pageSize,
        totalCustomerCount, totalSupplierCount,

        // Data
        customerInvoices,
        supplierInvoices,
        unifiedInvoices,
        stats,
    }
}
