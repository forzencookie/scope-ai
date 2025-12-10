import { useState, useMemo, useCallback, useRef } from "react"
import { parseAmount as utilParseAmount, parseDateSafe } from "@/lib/utils"
import { compareValues } from "@/lib/compare"

// ============================================================================
// Types
// ============================================================================

export type SortDirection = "asc" | "desc"

export interface FilterConfig<T> {
    /** Fields to search within when filtering */
    searchFields: (keyof T)[]
    /** Initial status filter values */
    initialStatusFilter?: string[]
    /** Optional custom filter function for advanced filtering */
    customFilter?: (item: T, searchQuery: string) => boolean
}

export interface SortConfig<T> {
    /** Initial field to sort by */
    initialSortBy: keyof T
    /** Initial sort direction (default: desc) */
    initialSortOrder?: SortDirection
    /** Custom sort handlers for specific fields */
    sortHandlers?: Partial<Record<keyof T, (a: T, b: T) => number>>
}

export interface UseTableFilterResult<T> {
    searchQuery: string
    setSearchQuery: (query: string) => void
    statusFilter: string[]
    setStatusFilter: (filter: string[]) => void
    toggleStatusFilter: (status: string) => void
    clearFilters: () => void
    filterItems: (items: T[]) => T[]
    hasActiveFilters: boolean
}

export interface UseTableSortResult<T> {
    sortBy: keyof T
    setSortBy: (field: keyof T) => void
    sortOrder: SortDirection
    setSortOrder: (order: SortDirection) => void
    toggleSort: (field: keyof T) => void
    sortItems: (items: T[]) => T[]
    getSortIndicator: (field: keyof T) => SortDirection | null
}

export type UseTableDataConfig<T> = {
    filter: FilterConfig<T>
    sort: SortConfig<T>
}

export type UseTableDataResult<T> = UseTableFilterResult<T> &
    UseTableSortResult<T> & {
        processItems: (items: T[]) => T[]
    }

// ============================================================================
// Filter Hook
// ============================================================================

/**
 * Custom hook for handling table filtering logic
 * 
 * @example
 * ```tsx
 * const filter = useTableFilter<Transaction>({
 *   searchFields: ['name', 'account', 'amount'],
 *   initialStatusFilter: []
 * })
 * const filteredData = filter.filterItems(transactions)
 * ```
 */
export function useTableFilter<T extends object>(
    config: FilterConfig<T>
): UseTableFilterResult<T> {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string[]>(
        config.initialStatusFilter ?? []
    )

    const configRef = useRef(config)
    configRef.current = config

    const toggleStatusFilter = useCallback((status: string) => {
        setStatusFilter(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        )
    }, [])

    const clearFilters = useCallback(() => {
        setSearchQuery("")
        setStatusFilter([])
    }, [])

    const hasActiveFilters = useMemo(() => {
        return searchQuery.length > 0 || statusFilter.length > 0
    }, [searchQuery, statusFilter])

    const filterItems = useCallback((items: T[]): T[] => {
        if (!items.length) return items
        
        const { searchFields, customFilter } = configRef.current
        let result = items

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(item => {
                if (customFilter) return customFilter(item, searchQuery)
                return searchFields.some(field => {
                    const value = item[field]
                    if (typeof value === "string") return value.toLowerCase().includes(query)
                    if (typeof value === "number") return value.toString().includes(query)
                    return false
                })
            })
        }

        if (statusFilter.length > 0) {
            result = result.filter(item => {
                const status = (item as { status?: unknown }).status
                return typeof status === "string" && statusFilter.includes(status)
            })
        }

        return result
    }, [searchQuery, statusFilter])

    return {
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        toggleStatusFilter,
        clearFilters,
        filterItems,
        hasActiveFilters,
    }
}

// ============================================================================
// Sort Hook
// ============================================================================

/**
 * Custom hook for handling table sorting logic
 * 
 * @example
 * ```tsx
 * const sort = useTableSort<Transaction>({
 *   initialSortBy: 'date',
 *   initialSortOrder: 'desc',
 *   sortHandlers: { date: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() }
 * })
 * const sortedData = sort.sortItems(transactions)
 * ```
 */
export function useTableSort<T extends object>(
    config: SortConfig<T>
): UseTableSortResult<T> {
    const [sortBy, setSortBy] = useState<keyof T>(config.initialSortBy)
    const [sortOrder, setSortOrder] = useState<SortDirection>(
        config.initialSortOrder ?? "desc"
    )

    const configRef = useRef(config)
    configRef.current = config

    const toggleSort = useCallback((field: keyof T) => {
        if (field === sortBy) {
            setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
        } else {
            setSortBy(field)
            setSortOrder("desc")
        }
    }, [sortBy])

    const getSortIndicator = useCallback((field: keyof T): SortDirection | null => {
        return sortBy === field ? sortOrder : null
    }, [sortBy, sortOrder])

    const sortItems = useCallback((items: T[]): T[] => {
        if (!items.length) return items

        const { sortHandlers } = configRef.current

        return [...items].sort((a, b) => {
            let comparison = 0
            const customHandler = sortHandlers?.[sortBy]
            if (customHandler) {
                comparison = customHandler(a, b)
            } else {
                comparison = compareValues(a[sortBy], b[sortBy])
            }
            return sortOrder === "asc" ? comparison : -comparison
        })
    }, [sortBy, sortOrder])

    return {
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        toggleSort,
        sortItems,
        getSortIndicator,
    }
}

// ============================================================================
// Combined Table Data Hook
// ============================================================================

/**
 * Combined hook for handling both filtering and sorting of table data
 * 
 * @example
 * ```tsx
 * const tableData = useTableData<Transaction>({
 *   filter: { searchFields: ['name', 'account', 'amount'] },
 *   sort: { initialSortBy: 'date', sortHandlers: { date: (a, b) => ... } }
 * })
 * const processedData = tableData.processItems(transactions)
 * ```
 */
export function useTableData<T extends object>(
    config: UseTableDataConfig<T>
): UseTableDataResult<T> {
    const filterResult = useTableFilter<T>(config.filter)
    const sortResult = useTableSort<T>(config.sort)

    const processItems = useMemo(() => {
        return (items: T[]): T[] => {
            const filtered = filterResult.filterItems(items)
            return sortResult.sortItems(filtered)
        }
    }, [filterResult.filterItems, sortResult.sortItems])

    return {
        ...filterResult,
        ...sortResult,
        processItems,
    }
}

// ============================================================================
// Utilities
// ============================================================================

/** Utility function to parse date strings safely */
export function parseDate(dateString: string): Date {
    return parseDateSafe(dateString)
}

/** Common sort handlers for reuse across different tables */
export const commonSortHandlers = {
    amount: <T extends { amount: string }>(a: T, b: T): number => {
        return utilParseAmount(a.amount) - utilParseAmount(b.amount)
    },
    date: <T extends { date: string }>(a: T, b: T): number => {
        return parseDate(a.date).getTime() - parseDate(b.date).getTime()
    },
    timestamp: <T extends { timestamp: Date }>(a: T, b: T): number => {
        return a.timestamp.getTime() - b.timestamp.getTime()
    },
    amountValue: <T extends { amountValue: number }>(a: T, b: T): number => {
        return a.amountValue - b.amountValue
    },
}
