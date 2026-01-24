import { useState, useMemo, useCallback } from "react"
import { useToast } from "@/components/ui/toast"
import { useInvoicesPaginated } from "@/hooks/use-invoices"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { mapCustomerInvoices, mapSupplierInvoices, mapToUnifiedInvoices } from "./mappers"
import { Invoice } from "@/data/invoices"
import { SupplierInvoice } from "@/data/ownership"
import { ViewFilter, PeriodFilter, UnifiedInvoice } from "./types"

export function useInvoicesLogic() {
    const toast = useToast()

    // Local State
    const [viewFilter, setViewFilter] = useState<ViewFilter>("all")
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")
    const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
    const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)

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
        error: fetchError,
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
            .filter(i => i.status === INVOICE_STATUS_LABELS.SENT || i.status === INVOICE_STATUS_LABELS.OVERDUE)
            .reduce((sum, start) => sum + (start.amount + (start.vatAmount || 0)), 0)

        const outgoing = supplierInvoices
            .filter(i => i.status !== 'betald')
            .reduce((sum, i) => sum + (i.totalAmount || i.amount), 0)

        const today = new Date().toISOString().split('T')[0]
        const overdueCustomer = customerInvoices.filter(i => i.status === INVOICE_STATUS_LABELS.OVERDUE || (i.status === INVOICE_STATUS_LABELS.SENT && i.dueDate < today))
        const overdueSupplier = supplierInvoices.filter(i => i.status === 'förfallen' || (i.status !== 'betald' && i.dueDate < today))

        const overdueCount = overdueCustomer.length + overdueSupplier.length
        const overdueAmount = overdueCustomer.reduce((sum, i) => sum + (i.amount + (i.vatAmount || 0)), 0) + overdueSupplier.reduce((sum, i) => sum + (i.totalAmount || 0), 0)

        const paidCustomer = customerInvoices
            .filter(i => i.status === INVOICE_STATUS_LABELS.PAID)
            .reduce((sum, i) => sum + (i.amount + (i.vatAmount || 0)), 0)

        const paidSupplier = supplierInvoices
            .filter(i => i.status === 'betald')
            .reduce((sum, i) => sum + (i.totalAmount || 0), 0)

        return {
            incoming,
            outgoing,
            overdue: overdueAmount,
            overdueCount,
            paid: paidCustomer + paidSupplier,
        }
    }, [customerInvoices, supplierInvoices])

    // Actions
    const handleSendInvoice = useCallback(async (id: string) => {
        try {
            await fetch(`/api/invoices/${id}/book`, { method: "POST" })
            fetchInvoices()
            toast.success("Faktura skickad!", "Fakturan har bokförts och skickats")
        } catch {
            toast.error("Kunde inte skicka faktura", "Ett fel uppstod")
        }
    }, [fetchInvoices, toast])

    const handleMarkCustomerPaid = useCallback(async (id: string) => {
        try {
            await fetch(`/api/invoices/${id}/pay`, { method: "POST" })
            fetchInvoices()
            toast.success("Betalning registrerad!", "Fakturan har markerats som betald")
        } catch {
            toast.error("Kunde inte registrera betalning", "Ett fel uppstod")
        }
    }, [fetchInvoices, toast])

    const handleApproveSupplier = useCallback(async (id: string) => {
        try {
            await fetch(`/api/supplier-invoices/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Attesterad" })
            })
            fetchInvoices()
            toast.success("Faktura attesterad", "Fakturan har godkänts för betalning")
        } catch {
            toast.error("Kunde inte attestera", "Ett fel uppstod")
        }
    }, [fetchInvoices, toast])

    const handleMarkSupplierPaid = useCallback(async (id: string) => {
        try {
            await fetch(`/api/supplier-invoices/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Betald" })
            })
            fetchInvoices()
            toast.success("Betalning registrerad", "Fakturan har markerats som betald")
        } catch {
            toast.error("Kunde inte registrera betalning", "Ett fel uppstod")
        }
    }, [fetchInvoices, toast])

    const handleInvoiceCreated = useCallback(() => {
        fetchInvoices()
    }, [fetchInvoices])

    return {
        // State
        viewFilter, setViewFilter,
        periodFilter, setPeriodFilter,
        customerDialogOpen, setCustomerDialogOpen,
        supplierDialogOpen, setSupplierDialogOpen,
        isLoading,
        
        // Pagination
        page, setPage, pageSize,
        totalCustomerCount, totalSupplierCount,
        
        // Data
        customerInvoices,
        supplierInvoices,
        unifiedInvoices,
        stats,
        
        // Handlers
        handleSendInvoice,
        handleMarkCustomerPaid,
        handleApproveSupplier,
        handleMarkSupplierPaid,
        handleInvoiceCreated
    }
}
