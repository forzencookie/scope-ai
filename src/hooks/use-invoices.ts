
import { useState, useEffect, useCallback } from "react"
import { type Invoice } from "@/types"
import { invoiceService, type CustomerInvoice, type SupplierInvoice } from "@/lib/services/invoice-service"
import { useAsync } from "./use-async"

export function useInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchInvoices = useCallback(async () => {
        try {
            const response = await fetch('/api/invoices', { cache: 'no-store' })
            const data = await response.json()

            if (data.invoices && Array.isArray(data.invoices)) {
                // Ensure proper typing
                const mapped: Invoice[] = data.invoices.map((inv: any) => ({
                    id: inv.id || inv.invoiceNumber,
                    customer: inv.customer,
                    email: inv.email,
                    issueDate: inv.issueDate || inv.date,
                    dueDate: inv.dueDate,
                    amount: typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount,
                    vatAmount: typeof inv.vatAmount === 'string' ? parseFloat(inv.vatAmount) : inv.vatAmount,
                    status: inv.status,
                }))
                setInvoices(mapped)
            } else {
                setInvoices([])
            }
        } catch (err) {
            console.error(err)
            setError('Failed to load invoices')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchInvoices()
    }, [fetchInvoices])

    return { invoices, isLoading, error, refresh: fetchInvoices }
}

export function useInvoicesPaginated(
    pageSize: number = 20,
    initialViewFilter: 'all' | 'kundfakturor' | 'leverantorsfakturor' = 'all',
    startDate?: string
) {
    const [page, setPage] = useState(1)
    const [viewFilter, setViewFilter] = useState(initialViewFilter)
    const [totalCount, setTotalCount] = useState({ customer: 0, supplier: 0 })

    // Sync external view filter if it changes
    useEffect(() => {
        setViewFilter(initialViewFilter)
    }, [initialViewFilter])

    const {
        data,
        isLoading,
        error,
        refetch
    } = useAsync(async () => {
        const offset = (page - 1) * pageSize

        const [customerResult, supplierResult] = await Promise.all([
            (viewFilter === 'all' || viewFilter === 'kundfakturor')
                ? invoiceService.getCustomerInvoices({ limit: pageSize, offset, startDate })
                : Promise.resolve({ invoices: [], totalCount: 0 }),
            (viewFilter === 'all' || viewFilter === 'leverantorsfakturor')
                ? invoiceService.getSupplierInvoices({ limit: pageSize, offset, startDate })
                : Promise.resolve({ invoices: [], totalCount: 0 })
        ])

        setTotalCount({
            customer: customerResult.totalCount,
            supplier: supplierResult.totalCount
        })

        return {
            customerInvoices: customerResult.invoices,
            supplierInvoices: supplierResult.invoices
        }
    }, { customerInvoices: [], supplierInvoices: [] }, [page, pageSize, viewFilter, startDate])

    // Reset page when filter changes
    useEffect(() => {
        setPage(1)
    }, [viewFilter, startDate])

    return {
        customerInvoices: data.customerInvoices,
        supplierInvoices: data.supplierInvoices,
        isLoading,
        error,
        page,
        setPage,
        pageSize,
        viewFilter,
        setViewFilter,
        totalCustomerCount: totalCount.customer,
        totalSupplierCount: totalCount.supplier,
        refetch
    }
}
