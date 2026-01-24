import { useMemo } from "react"
import { useTableFilter, type FilterConfig, type UseTableFilterResult } from "./use-table-filter"
import { useTableSort, type SortConfig, type UseTableSortResult } from "./use-table-sort"

export type UseTableDataConfig<T> = {
    filter: FilterConfig<T>
    sort: SortConfig<T>
}

export type UseTableDataResult<T> = UseTableFilterResult<T> &
    UseTableSortResult<T> & {
        processItems: (items: T[]) => T[]
    }

/**
 * Combined hook for handling both filtering and sorting of table data
 * This is the main hook to use for tables that need both capabilities
 * 
 * @param config - Configuration for both filter and sort
 * @returns Combined filter and sort state, handlers, and a processItems function
 * 
 * @example
 * ```tsx
 * const tableData = useTableData<Transaction>({
 *   filter: {
 *     searchFields: ['name', 'account', 'amount'],
 *   },
 *   sort: {
 *     initialSortBy: 'date',
 *     sortHandlers: {
 *       date: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
 *       amount: (a, b) => parseAmount(a.amount) - parseAmount(b.amount)
 *     }
 *   }
 * })
 * 
 * const processedData = tableData.processItems(transactions)
 * ```
 */
export function useTableData<T extends object>(
    config: UseTableDataConfig<T>
): UseTableDataResult<T> {
    const filterResult = useTableFilter<T>(config.filter)
    const sortResult = useTableSort<T>(config.sort)

    const { filterItems } = filterResult
    const { sortItems } = sortResult

    const processItems = useMemo(() => {
        return (items: T[]): T[] => {
            const filtered = filterItems(items)
            return sortItems(filtered)
        }
    }, [filterItems, sortItems])

    return {
        ...filterResult,
        ...sortResult,
        processItems,
    }
}
