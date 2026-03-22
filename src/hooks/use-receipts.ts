
import { useState, useCallback, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { receiptService, type Receipt } from '@/services/accounting/receipt-service'
import { useAsync } from "./use-async"

export function useReceiptsPaginated(
    pageSize: number = 20,
    startDate?: string
) {
    const [page, setPage] = useState(1)
    const [searchQuery, _setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [statusFilter, _setStatusFilter] = useState<string[]>([])
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Total count for pagination
    const [totalCount, setTotalCount] = useState(0)

    const setSearchQuery = useCallback((value: string | ((prev: string) => string)) => {
        _setSearchQuery(value)
        setPage(1)
    }, [])

    // Debounce search to avoid fetching on every keystroke
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 300)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [searchQuery])

    const setStatusFilter = useCallback((value: string[] | ((prev: string[]) => string[])) => {
        _setStatusFilter(value)
        setPage(1)
    }, [])

    // Reset page when startDate prop changes
    const [prevStartDate, setPrevStartDate] = useState(startDate)
    if (startDate !== prevStartDate) {
        setPrevStartDate(startDate)
        setPage(1)
    }

    const {
        data: receipts,
        isLoading,
        error,
        refetch
    } = useAsync(async () => {
        const offset = (page - 1) * pageSize

        const { receipts, totalCount } = await receiptService.getReceipts({
            limit: pageSize,
            offset,
            search: debouncedSearch,
            statuses: statusFilter,
            startDate
        })

        setTotalCount(totalCount)
        return receipts
    }, [] as Receipt[], [page, pageSize, debouncedSearch, statusFilter, startDate])

    return {
        receipts,
        isLoading,
        error,
        page,
        setPage,
        pageSize,
        totalCount,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        refetch
    }
}

const receiptQueryKeys = {
    stats: ['receipt-stats'] as const,
}

export function useReceiptStats() {
    const queryClient = useQueryClient()

    const {
        data: stats,
        isLoading,
        error,
    } = useQuery({
        queryKey: receiptQueryKeys.stats,
        queryFn: () => receiptService.getStats(),
        staleTime: 60 * 1000, // 1 minute cache
    })

    const refetch = () => queryClient.invalidateQueries({ queryKey: receiptQueryKeys.stats })

    return {
        stats: stats ?? { matchedCount: 0, unmatchedCount: 0, total: 0, totalAmount: 0 },
        isLoading,
        error,
        refetch
    }
}
