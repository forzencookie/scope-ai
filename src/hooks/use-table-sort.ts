import { useState, useCallback, useRef, useEffect } from "react"
import { parseAmount as utilParseAmount, parseDateSafe } from "@/lib/utils"
import { compareValues } from "@/lib/compare"

export type SortDirection = "asc" | "desc"

export interface SortConfig<T> {
    /** Initial field to sort by */
    initialSortBy: keyof T
    /** Initial sort direction (default: desc) */
    initialSortOrder?: SortDirection
    /** Custom sort handlers for specific fields */
    sortHandlers?: Partial<Record<keyof T, (a: T, b: T) => number>>
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

/**
 * Custom hook for handling table sorting logic
 * Separates sorting concerns from presentation
 * 
 * @param config - Configuration for the sort
 * @returns Sort state and handlers
 * 
 * @example
 * ```tsx
 * const sort = useTableSort<Transaction>({
 *   initialSortBy: 'date',
 *   initialSortOrder: 'desc',
 *   sortHandlers: {
 *     date: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
 *     amount: (a, b) => parseAmount(a.amount) - parseAmount(b.amount)
 *   }
 * })
 * 
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

    // Store config in ref to avoid stale closures
    const configRef = useRef(config)
    useEffect(() => {
        configRef.current = config
    })

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

        // Create a new array to avoid mutating the original
        return [...items].sort((a, b) => {
            let comparison = 0

            // Use custom handler if provided
            const customHandler = sortHandlers?.[sortBy]
            if (customHandler) {
                comparison = customHandler(a, b)
            } else {
                // Default comparison using field values
                const aVal = a[sortBy]
                const bVal = b[sortBy]
                comparison = compareValues(aVal, bVal)
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

/**
 * Utility function to parse date strings safely
 * Uses parseDateSafe from @/lib/utils internally
 */
export function parseDate(dateString: string): Date {
    return parseDateSafe(dateString)
}

/**
 * Common sort handlers for reuse across different tables
 */
export const commonSortHandlers = {
    /** Sort by amount field (handles currency strings) */
    amount: <T extends { amount: string }>(a: T, b: T): number => {
        return utilParseAmount(a.amount) - utilParseAmount(b.amount)
    },
    /** Sort by date field (handles date strings) */
    date: <T extends { date: string }>(a: T, b: T): number => {
        return parseDate(a.date).getTime() - parseDate(b.date).getTime()
    },
    /** Sort by timestamp field (handles Date objects) */
    timestamp: <T extends { timestamp: Date }>(a: T, b: T): number => {
        return a.timestamp.getTime() - b.timestamp.getTime()
    },
    /** Sort by amountValue field (handles numeric values) */
    amountValue: <T extends { amountValue: number }>(a: T, b: T): number => {
        return a.amountValue - b.amountValue
    },
}
