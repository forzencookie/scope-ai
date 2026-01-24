import { useState, useMemo, useCallback, useRef, useEffect } from "react"

export interface FilterConfig<T> {
    /** Fields to search within when filtering */
    searchFields: (keyof T)[]
    /** Initial status filter values */
    initialStatusFilter?: string[]
    /** Optional custom filter function for advanced filtering */
    customFilter?: (item: T, searchQuery: string) => boolean
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

/**
 * Custom hook for handling table filtering logic
 * Separates filtering concerns from presentation
 * 
 * @param config - Configuration for the filter
 * @returns Filter state and handlers
 * 
 * @example
 * ```tsx
 * const filter = useTableFilter<Transaction>({
 *   searchFields: ['name', 'account', 'amount'],
 *   initialStatusFilter: []
 * })
 * 
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

    // Store config in ref to avoid stale closures without causing re-renders
    const configRef = useRef(config)
    useEffect(() => {
        configRef.current = config
    })

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

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            
            result = result.filter(item => {
                // Use custom filter if provided
                if (customFilter) {
                    return customFilter(item, searchQuery)
                }
                
                // Default: search in specified fields
                return searchFields.some(field => {
                    const value = item[field]
                    if (typeof value === "string") {
                        return value.toLowerCase().includes(query)
                    }
                    if (typeof value === "number") {
                        return value.toString().includes(query)
                    }
                    return false
                })
            })
        }

        // Apply status filter (only if items have status property)
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
