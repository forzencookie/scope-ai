import { renderHook, act } from "@testing-library/react"
import { useTableFilter } from "../use-table-filter"

// Mock data for testing
interface TestItem {
    id: string
    name: string
    status: string
    amount: number
}

const mockItems: TestItem[] = [
    { id: "1", name: "Alpha Item", status: "active", amount: 100 },
    { id: "2", name: "Beta Item", status: "inactive", amount: 200 },
    { id: "3", name: "Gamma Item", status: "active", amount: 300 },
    { id: "4", name: "Delta Test", status: "pending", amount: 400 },
]

describe("useTableFilter", () => {
    describe("initialization", () => {
        it("should initialize with empty search query", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name"],
                })
            )

            expect(result.current.searchQuery).toBe("")
        })

        it("should initialize with empty status filter by default", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name"],
                })
            )

            expect(result.current.statusFilter).toEqual([])
        })

        it("should initialize with provided initial status filter", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name"],
                    initialStatusFilter: ["active"],
                })
            )

            expect(result.current.statusFilter).toEqual(["active"])
        })

        it("should indicate no active filters initially", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name"],
                })
            )

            expect(result.current.hasActiveFilters).toBe(false)
        })
    })

    describe("search filtering", () => {
        it("should update search query", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name"],
                })
            )

            act(() => {
                result.current.setSearchQuery("Alpha")
            })

            expect(result.current.searchQuery).toBe("Alpha")
            expect(result.current.hasActiveFilters).toBe(true)
        })

        it("should filter items by search query (case-insensitive)", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name"],
                })
            )

            act(() => {
                result.current.setSearchQuery("alpha")
            })

            const filtered = result.current.filterItems(mockItems)
            expect(filtered).toHaveLength(1)
            expect(filtered[0].name).toBe("Alpha Item")
        })

        it("should filter items by multiple search fields", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name", "status"],
                })
            )

            act(() => {
                result.current.setSearchQuery("pending")
            })

            const filtered = result.current.filterItems(mockItems)
            expect(filtered).toHaveLength(1)
            expect(filtered[0].id).toBe("4")
        })

        it("should return all items when search query is empty", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name"],
                })
            )

            const filtered = result.current.filterItems(mockItems)
            expect(filtered).toHaveLength(4)
        })
    })

    describe("status filtering", () => {
        it("should toggle status filter on", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name"],
                })
            )

            act(() => {
                result.current.toggleStatusFilter("active")
            })

            expect(result.current.statusFilter).toContain("active")
            expect(result.current.hasActiveFilters).toBe(true)
        })

        it("should toggle status filter off", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name"],
                    initialStatusFilter: ["active"],
                })
            )

            act(() => {
                result.current.toggleStatusFilter("active")
            })

            expect(result.current.statusFilter).not.toContain("active")
        })

        it("should filter items by status", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name"],
                    initialStatusFilter: ["active"],
                })
            )

            const filtered = result.current.filterItems(mockItems)
            expect(filtered).toHaveLength(2)
            expect(filtered.every(item => item.status === "active")).toBe(true)
        })

        it("should filter by multiple statuses", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name"],
                })
            )

            act(() => {
                result.current.toggleStatusFilter("active")
                result.current.toggleStatusFilter("pending")
            })

            const filtered = result.current.filterItems(mockItems)
            expect(filtered).toHaveLength(3)
        })
    })

    describe("combined filtering", () => {
        it("should apply both search and status filters", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name"],
                    initialStatusFilter: ["active"],
                })
            )

            act(() => {
                result.current.setSearchQuery("Gamma")
            })

            const filtered = result.current.filterItems(mockItems)
            expect(filtered).toHaveLength(1)
            expect(filtered[0].name).toBe("Gamma Item")
        })
    })

    describe("clearFilters", () => {
        it("should clear all filters", () => {
            const { result } = renderHook(() =>
                useTableFilter<TestItem>({
                    searchFields: ["name"],
                })
            )

            act(() => {
                result.current.setSearchQuery("test")
                result.current.toggleStatusFilter("active")
            })

            expect(result.current.hasActiveFilters).toBe(true)

            act(() => {
                result.current.clearFilters()
            })

            expect(result.current.searchQuery).toBe("")
            expect(result.current.statusFilter).toEqual([])
            expect(result.current.hasActiveFilters).toBe(false)
        })
    })
})
