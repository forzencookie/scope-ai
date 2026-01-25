import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { InvoicesTable } from "../bokforing/fakturor"
import { INVOICE_STATUSES } from "@/lib/status-types"

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}))

describe("InvoicesTable", () => {
    describe("rendering", () => {
        it("should render the invoices table", () => {
            render(<InvoicesTable />)

            // Check for table headers or content
            expect(screen.getByRole("table")).toBeInTheDocument()
        })

        it("should render invoice data", () => {
            render(<InvoicesTable />)

            // Check for known invoice customers from default data
            expect(screen.getByText("Acme Corp")).toBeInTheDocument()
            expect(screen.getByText("Globex Inc.")).toBeInTheDocument()
        })

        it("should render invoice amounts", () => {
            render(<InvoicesTable />)

            expect(screen.getByText("12,500.00 kr")).toBeInTheDocument()
        })
    })

    describe("search functionality", () => {
        it("should render search input", () => {
            render(<InvoicesTable />)

            expect(screen.getByPlaceholderText(/sök/i)).toBeInTheDocument()
        })

        it("should filter invoices by customer name", async () => {
            const user = userEvent.setup()
            render(<InvoicesTable />)

            const searchInput = screen.getByPlaceholderText(/sök/i)
            await user.type(searchInput, "Acme")

            expect(screen.getByText("Acme Corp")).toBeInTheDocument()
            expect(screen.queryByText("Globex Inc.")).not.toBeInTheDocument()
        })

        it("should filter invoices by invoice ID", async () => {
            const user = userEvent.setup()
            render(<InvoicesTable />)

            const searchInput = screen.getByPlaceholderText(/sök/i)
            await user.type(searchInput, "INV-2024-001")

            expect(screen.getByText("Acme Corp")).toBeInTheDocument()
        })
    })

    describe("status badges", () => {
        it("should render status badges", () => {
            render(<InvoicesTable />)

            // Use Swedish status strings from INVOICE_STATUSES
            const statusValues = Object.values(INVOICE_STATUSES)
            const statusRegex = new RegExp(statusValues.join("|"), "i")
            expect(screen.getAllByText(statusRegex).length).toBeGreaterThan(0)
        })
    })

    describe("accessibility", () => {
        it("should have proper table structure", () => {
            render(<InvoicesTable />)

            expect(screen.getByRole("table")).toBeInTheDocument()
        })
    })
})
