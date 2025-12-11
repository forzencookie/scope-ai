import { renderHook, act } from "@testing-library/react"
import { useTableSort, parseDate, commonSortHandlers } from "../use-table-sort"
import { parseAmount } from "@/lib/utils"

// Mock data for testing
interface TestItem {
    id: string
    name: string
    date: string
    amount: string
    numericValue: number
}

const mockItems: TestItem[] = [
    { id: "1", name: "Charlie", date: "May 15, 2024", amount: "-$200.00", numericValue: 200 },
    { id: "2", name: "Alpha", date: "May 10, 2024", amount: "$100.00", numericValue: 100 },
    { id: "3", name: "Beta", date: "May 20, 2024", amount: "-$300.00", numericValue: 300 },
    { id: "4", name: "Delta", date: "May 5, 2024", amount: "$50.00", numericValue: 50 },
]

describe("useTableSort", () => {
    describe("initialization", () => {
        it("should initialize with provided sortBy field", () => {
            const { result } = renderHook(() =>
                useTableSort<TestItem>({
                    initialSortBy: "name",
                })
            )

            expect(result.current.sortBy).toBe("name")
        })

        it("should initialize with desc sort order by default", () => {
            const { result } = renderHook(() =>
                useTableSort<TestItem>({
                    initialSortBy: "name",
                })
            )

            expect(result.current.sortOrder).toBe("desc")
        })

        it("should initialize with provided sort order", () => {
            const { result } = renderHook(() =>
                useTableSort<TestItem>({
                    initialSortBy: "name",
                    initialSortOrder: "asc",
                })
            )

            expect(result.current.sortOrder).toBe("asc")
        })
    })

    describe("sort by string field", () => {
        it("should sort items by name in ascending order", () => {
            const { result } = renderHook(() =>
                useTableSort<TestItem>({
                    initialSortBy: "name",
                    initialSortOrder: "asc",
                })
            )

            const sorted = result.current.sortItems(mockItems)
            expect(sorted[0].name).toBe("Alpha")
            expect(sorted[1].name).toBe("Beta")
            expect(sorted[2].name).toBe("Charlie")
            expect(sorted[3].name).toBe("Delta")
        })

        it("should sort items by name in descending order", () => {
            const { result } = renderHook(() =>
                useTableSort<TestItem>({
                    initialSortBy: "name",
                    initialSortOrder: "desc",
                })
            )

            const sorted = result.current.sortItems(mockItems)
            expect(sorted[0].name).toBe("Delta")
            expect(sorted[3].name).toBe("Alpha")
        })
    })

    describe("sort by numeric field", () => {
        it("should sort items by numeric value in ascending order", () => {
            const { result } = renderHook(() =>
                useTableSort<TestItem>({
                    initialSortBy: "numericValue",
                    initialSortOrder: "asc",
                })
            )

            const sorted = result.current.sortItems(mockItems)
            expect(sorted[0].numericValue).toBe(50)
            expect(sorted[3].numericValue).toBe(300)
        })
    })

    describe("sort with custom handlers", () => {
        it("should use custom sort handler for date", () => {
            const { result } = renderHook(() =>
                useTableSort<TestItem>({
                    initialSortBy: "date",
                    initialSortOrder: "asc",
                    sortHandlers: {
                        date: (a, b) =>
                            new Date(a.date).getTime() - new Date(b.date).getTime(),
                    },
                })
            )

            const sorted = result.current.sortItems(mockItems)
            expect(sorted[0].date).toBe("May 5, 2024")
            expect(sorted[3].date).toBe("May 20, 2024")
        })

        it("should use custom sort handler for amount strings", () => {
            const { result } = renderHook(() =>
                useTableSort<TestItem>({
                    initialSortBy: "amount",
                    initialSortOrder: "asc",
                    sortHandlers: {
                        amount: (a, b) =>
                            parseAmount(a.amount) - parseAmount(b.amount),
                    },
                })
            )

            const sorted = result.current.sortItems(mockItems)
            expect(sorted[0].amount).toBe("-$300.00")
            expect(sorted[3].amount).toBe("$100.00")
        })
    })

    describe("toggleSort", () => {
        it("should toggle sort order when clicking same field", () => {
            const { result } = renderHook(() =>
                useTableSort<TestItem>({
                    initialSortBy: "name",
                    initialSortOrder: "desc",
                })
            )

            act(() => {
                result.current.toggleSort("name")
            })

            expect(result.current.sortOrder).toBe("asc")
        })

        it("should change sortBy and reset to desc when clicking different field", () => {
            const { result } = renderHook(() =>
                useTableSort<TestItem>({
                    initialSortBy: "name",
                    initialSortOrder: "asc",
                })
            )

            act(() => {
                result.current.toggleSort("date")
            })

            expect(result.current.sortBy).toBe("date")
            expect(result.current.sortOrder).toBe("desc")
        })
    })

    describe("getSortIndicator", () => {
        it("should return sort direction for active field", () => {
            const { result } = renderHook(() =>
                useTableSort<TestItem>({
                    initialSortBy: "name",
                    initialSortOrder: "asc",
                })
            )

            expect(result.current.getSortIndicator("name")).toBe("asc")
        })

        it("should return null for inactive fields", () => {
            const { result } = renderHook(() =>
                useTableSort<TestItem>({
                    initialSortBy: "name",
                })
            )

            expect(result.current.getSortIndicator("date")).toBeNull()
        })
    })
})

describe("parseAmount", () => {
    it("should parse positive amounts", () => {
        expect(parseAmount("$100.00")).toBe(100)
        expect(parseAmount("100.00 kr")).toBe(100)
    })

    it("should parse negative amounts", () => {
        expect(parseAmount("-$200.00")).toBe(-200)
        expect(parseAmount("-200.00 kr")).toBe(-200)
    })

    it("should handle amounts with commas", () => {
        expect(parseAmount("$1,234.56")).toBe(1234.56)
        expect(parseAmount("-12,500.00 kr")).toBe(-12500)
    })
})

describe("parseDate", () => {
    it("should parse date strings", () => {
        const date = parseDate("May 15, 2024")
        expect(date.getFullYear()).toBe(2024)
        expect(date.getMonth()).toBe(4) // May is month 4 (0-indexed)
        expect(date.getDate()).toBe(15)
    })
})

describe("commonSortHandlers", () => {
    it("should compare amounts correctly", () => {
        const itemA = { amount: "$100.00" }
        const itemB = { amount: "$200.00" }

        expect(commonSortHandlers.amount(itemA, itemB)).toBeLessThan(0)
        expect(commonSortHandlers.amount(itemB, itemA)).toBeGreaterThan(0)
    })

    it("should compare dates correctly", () => {
        const itemA = { date: "May 10, 2024" }
        const itemB = { date: "May 20, 2024" }

        expect(commonSortHandlers.date(itemA, itemB)).toBeLessThan(0)
        expect(commonSortHandlers.date(itemB, itemA)).toBeGreaterThan(0)
    })
})
