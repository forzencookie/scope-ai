import { renderHook, act } from "@testing-library/react"
import { useTableData } from "../use-table-data"

// Mock data for testing
interface TestTransaction {
    id: string
    name: string
    date: string
    amount: string
    status: string
    account: string
}

const mockTransactions: TestTransaction[] = [
    { id: "1", name: "Webflow", date: "May 2, 2024", amount: "-$49.00", status: "pending", account: "Business" },
    { id: "2", name: "Staples", date: "May 10, 2024", amount: "-$124.50", status: "completed", account: "Personal" },
    { id: "3", name: "Delta", date: "May 15, 2024", amount: "-$450.00", status: "pending", account: "Business" },
    { id: "4", name: "Acme Payment", date: "May 7, 2024", amount: "+$4,500.00", status: "completed", account: "Main" },
    { id: "5", name: "Starbucks", date: "May 12, 2024", amount: "-$14.20", status: "completed", account: "Personal" },
]

describe("useTableData", () => {
    const parseAmount = (amount: string): number => {
        return parseFloat(amount.replace(/[^\d.-]/g, ""))
    }

    describe("combined filter and sort", () => {
        it("should filter and sort items together", () => {
            const { result } = renderHook(() =>
                useTableData<TestTransaction>({
                    filter: {
                        searchFields: ["name", "account"],
                    },
                    sort: {
                        initialSortBy: "date",
                        initialSortOrder: "asc",
                        sortHandlers: {
                            date: (a, b) =>
                                new Date(a.date).getTime() - new Date(b.date).getTime(),
                        },
                    },
                })
            )

            // Set search to filter to "Business" account
            act(() => {
                result.current.setSearchQuery("Business")
            })

            const processed = result.current.processItems(mockTransactions)

            // Should only have Business account items
            expect(processed).toHaveLength(2)
            // Should be sorted by date ascending
            expect(processed[0].name).toBe("Webflow") // May 2
            expect(processed[1].name).toBe("Delta") // May 15
        })

        it("should process all items when no filters applied", () => {
            const { result } = renderHook(() =>
                useTableData<TestTransaction>({
                    filter: {
                        searchFields: ["name"],
                    },
                    sort: {
                        initialSortBy: "name",
                        initialSortOrder: "asc",
                    },
                })
            )

            const processed = result.current.processItems(mockTransactions)
            expect(processed).toHaveLength(5)
            // Should be sorted alphabetically by name
            expect(processed[0].name).toBe("Acme Payment")
        })

        it("should expose both filter and sort properties", () => {
            const { result } = renderHook(() =>
                useTableData<TestTransaction>({
                    filter: {
                        searchFields: ["name"],
                    },
                    sort: {
                        initialSortBy: "date",
                    },
                })
            )

            // Filter properties
            expect(result.current.searchQuery).toBeDefined()
            expect(result.current.setSearchQuery).toBeDefined()
            expect(result.current.statusFilter).toBeDefined()
            expect(result.current.toggleStatusFilter).toBeDefined()
            expect(result.current.clearFilters).toBeDefined()
            expect(result.current.filterItems).toBeDefined()
            expect(result.current.hasActiveFilters).toBeDefined()

            // Sort properties
            expect(result.current.sortBy).toBeDefined()
            expect(result.current.setSortBy).toBeDefined()
            expect(result.current.sortOrder).toBeDefined()
            expect(result.current.setSortOrder).toBeDefined()
            expect(result.current.toggleSort).toBeDefined()
            expect(result.current.sortItems).toBeDefined()
            expect(result.current.getSortIndicator).toBeDefined()

            // Combined
            expect(result.current.processItems).toBeDefined()
        })

        it("should apply status filter with sort", () => {
            const { result } = renderHook(() =>
                useTableData<TestTransaction>({
                    filter: {
                        searchFields: ["name"],
                        initialStatusFilter: ["pending"],
                    },
                    sort: {
                        initialSortBy: "amount",
                        initialSortOrder: "desc",
                        sortHandlers: {
                            amount: (a, b) => parseAmount(a.amount) - parseAmount(b.amount),
                        },
                    },
                })
            )

            const processed = result.current.processItems(mockTransactions)

            // Should only have pending items
            expect(processed).toHaveLength(2)
            expect(processed.every(item => item.status === "pending")).toBe(true)
            // Should be sorted by amount descending (less negative first)
            expect(processed[0].amount).toBe("-$49.00")
            expect(processed[1].amount).toBe("-$450.00")
        })
    })

    describe("workflow simulation", () => {
        it("should handle typical user workflow", () => {
            const { result } = renderHook(() =>
                useTableData<TestTransaction>({
                    filter: {
                        searchFields: ["name", "account"],
                    },
                    sort: {
                        initialSortBy: "date",
                        initialSortOrder: "desc",
                        sortHandlers: {
                            date: (a, b) =>
                                new Date(a.date).getTime() - new Date(b.date).getTime(),
                            amount: (a, b) => parseAmount(a.amount) - parseAmount(b.amount),
                        },
                    },
                })
            )

            // Initially all items, sorted by date desc
            let processed = result.current.processItems(mockTransactions)
            expect(processed).toHaveLength(5)
            expect(processed[0].date).toBe("May 15, 2024") // Most recent first

            // User searches
            act(() => {
                result.current.setSearchQuery("Starbucks")
            })
            processed = result.current.processItems(mockTransactions)
            expect(processed).toHaveLength(1)
            expect(processed[0].name).toBe("Starbucks")

            // User clears search
            act(() => {
                result.current.setSearchQuery("")
            })
            processed = result.current.processItems(mockTransactions)
            expect(processed).toHaveLength(5)

            // User filters by status
            act(() => {
                result.current.toggleStatusFilter("completed")
            })
            processed = result.current.processItems(mockTransactions)
            expect(processed).toHaveLength(3)

            // User changes sort
            act(() => {
                result.current.toggleSort("amount")
            })
            processed = result.current.processItems(mockTransactions)
            expect(result.current.sortBy).toBe("amount")
            expect(result.current.sortOrder).toBe("desc")

            // User clears all filters
            act(() => {
                result.current.clearFilters()
            })
            expect(result.current.hasActiveFilters).toBe(false)
            processed = result.current.processItems(mockTransactions)
            expect(processed).toHaveLength(5)
        })
    })
})
