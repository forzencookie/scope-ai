
import { useState, useCallback } from "react"
import { receiptService, type Receipt } from '@/services/receipt-service'
import { useAsync } from "./use-async"
import { useCachedQuery } from "./use-cached-query"

export function useReceiptsPaginated(
    pageSize: number = 20,
    startDate?: string
) {
    const [page, setPage] = useState(1)
    const [searchQuery, _setSearchQuery] = useState("")
    const [statusFilter, _setStatusFilter] = useState<string[]>([])

    // Total count for pagination
    const [totalCount, setTotalCount] = useState(0)

    const setSearchQuery = useCallback((value: string | ((prev: string) => string)) => {
        _setSearchQuery(value)
        setPage(1)
    }, [])

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

    /* 
    // Old effect caused double render
    useEffect(() => {
        setPage(p => p !== 1 ? 1 : p)
    }, [startDate])
    */

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
            search: searchQuery,
            statuses: statusFilter,
            startDate
        })

        setTotalCount(totalCount)
        return receipts
    }, [] as Receipt[], [page, pageSize, searchQuery, statusFilter, startDate])

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

export function useReceiptStats() {
    const {
        data: stats,
        isLoading,
        error,
        invalidate: refetch
    } = useCachedQuery({
        cacheKey: 'receipt-stats',
        queryFn: () => receiptService.getStats(),
        ttlMs: 60 * 1000, // 1 minute cache
    })

    return { 
        stats: stats ?? { matchedCount: 0, unmatchedCount: 0, total: 0, totalAmount: 0 }, 
        isLoading, 
        error, 
        refetch 
    }
}
