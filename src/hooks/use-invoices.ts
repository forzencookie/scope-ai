
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { type Invoice } from "@/types"
import { invoiceService } from '@/services/invoice-service'

export const invoiceQueryKeys = {
    all: ["invoices"] as const,
    list: () => [...invoiceQueryKeys.all, "list"] as const,
    paginated: (viewFilter: string, page: number, pageSize: number, startDate?: string) =>
        [...invoiceQueryKeys.all, "paginated", viewFilter, page, pageSize, startDate] as const,
}

export function useInvoices() {
    const {
        data: invoices = [],
        isLoading,
        error,
        refetch,
    } = useQuery<Invoice[]>({
        queryKey: invoiceQueryKeys.list(),
        queryFn: async () => {
            const response = await fetch('/api/invoices')
            const data = await response.json()

            if (data.invoices && Array.isArray(data.invoices)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return data.invoices.map((inv: any) => ({
                    id: inv.id || inv.invoiceNumber,
                    customer: inv.customer,
                    email: inv.email,
                    issueDate: inv.issueDate || inv.date,
                    dueDate: inv.dueDate,
                    amount: typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount,
                    vatAmount: typeof inv.vatAmount === 'string' ? parseFloat(inv.vatAmount) : inv.vatAmount,
                    status: inv.status,
                })) as Invoice[]
            }
            return []
        },
        staleTime: 5 * 60 * 1000,
    })

    return { invoices, isLoading, error: error ? String(error) : null, refresh: refetch }
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

    // Reset page when filter changes
    useEffect(() => {
        setPage(1)
    }, [viewFilter, startDate])

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: invoiceQueryKeys.paginated(viewFilter, page, pageSize, startDate),
        queryFn: async () => {
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
        },
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    })

    return {
        customerInvoices: data?.customerInvoices || [],
        supplierInvoices: data?.supplierInvoices || [],
        isLoading,
        error: error ? String(error) : null,
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
