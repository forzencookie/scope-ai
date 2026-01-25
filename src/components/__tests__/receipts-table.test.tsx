import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderWithProviders } from "@/test-utils"
import { ReceiptsTable } from "../bokforing/kvitton"
import { RECEIPT_STATUSES } from "@/lib/status-types"

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}))

describe("ReceiptsTable", () => {
    describe("rendering", () => {
        it("should render the receipts table", () => {
            renderWithProviders(<ReceiptsTable />)

            expect(screen.getByRole("table")).toBeInTheDocument()
        })

        it("should render receipt data", () => {
            renderWithProviders(<ReceiptsTable />)

            // Check for known receipt suppliers from default data
            expect(screen.getByText("Adobe Systems")).toBeInTheDocument()
            expect(screen.getByText("Uber Receipts")).toBeInTheDocument()
        })

        it("should render receipt amounts", () => {
            renderWithProviders(<ReceiptsTable />)

            expect(screen.getByText("-239.00 kr")).toBeInTheDocument()
        })

        it("should render receipt categories", () => {
            renderWithProviders(<ReceiptsTable />)

            expect(screen.getByText("Software")).toBeInTheDocument()
            expect(screen.getByText("Travel")).toBeInTheDocument()
        })
    })

    describe("search functionality", () => {
        it("should render search input", () => {
            renderWithProviders(<ReceiptsTable />)

            expect(screen.getByPlaceholderText(/sök/i)).toBeInTheDocument()
        })

        it("should filter receipts by supplier name", async () => {
            const user = userEvent.setup()
            renderWithProviders(<ReceiptsTable />)

            const searchInput = screen.getByPlaceholderText(/sök/i)
            await user.type(searchInput, "Adobe")

            expect(screen.getByText("Adobe Systems")).toBeInTheDocument()
            expect(screen.queryByText("Uber Receipts")).not.toBeInTheDocument()
        })

        it("should filter receipts by category", async () => {
            const user = userEvent.setup()
            renderWithProviders(<ReceiptsTable />)

            const searchInput = screen.getByPlaceholderText(/sök/i)
            await user.type(searchInput, "Software")

            expect(screen.getByText("Adobe Systems")).toBeInTheDocument()
        })
    })

    describe("status badges", () => {
        it("should render status badges", () => {
            renderWithProviders(<ReceiptsTable />)

            // Use Swedish status strings from RECEIPT_STATUSES
            const statusValues = Object.values(RECEIPT_STATUSES)
            const statusRegex = new RegExp(statusValues.join("|"), "i")
            expect(screen.getAllByText(statusRegex).length).toBeGreaterThan(0)
        })
    })

    describe("accessibility", () => {
        it("should have proper table structure", () => {
            renderWithProviders(<ReceiptsTable />)

            expect(screen.getByRole("table")).toBeInTheDocument()
        })
    })
})
