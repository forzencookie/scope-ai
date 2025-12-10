import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TransactionsTable } from "../transactions-table"
import type { Transaction } from "@/types"
import { TRANSACTION_STATUSES } from "@/types"

// Mock transactions for testing
const mockTransactions: Transaction[] = [
    {
        id: "1",
        name: "Webflow Subscription",
        date: "May 2, 2024",
        amount: "-$49.00",
        status: TRANSACTION_STATUSES.TO_RECORD,
        category: "Software",
        iconName: "Smartphone",
        iconColor: "text-blue-500",
        account: "Business Amex",
        timestamp: new Date("2024-05-02"),
        amountValue: -49,
    },
    {
        id: "2",
        name: "Office Supplies - Staples",
        date: "May 10, 2024",
        amount: "-$124.50",
        status: TRANSACTION_STATUSES.TO_RECORD,
        category: "Supplies",
        iconName: "Tag",
        iconColor: "text-orange-500",
        account: "Business Amex",
        timestamp: new Date("2024-05-10"),
        amountValue: -124.5,
    },
    {
        id: "3",
        name: "Client Payment - Acme Corp",
        date: "May 7, 2024",
        amount: "+$4,500.00",
        status: TRANSACTION_STATUSES.RECORDED,
        category: "Income",
        iconName: "Briefcase",
        iconColor: "text-green-500",
        account: "Main Checking",
        timestamp: new Date("2024-05-07"),
        amountValue: 4500,
    },
]

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}))

describe("TransactionsTable", () => {
    describe("rendering", () => {
        it("should render the table with title", () => {
            render(<TransactionsTable transactions={mockTransactions} />)
            
            expect(screen.getByText("Alla transaktioner")).toBeInTheDocument()
        })

        it("should render custom title when provided", () => {
            render(
                <TransactionsTable 
                    transactions={mockTransactions} 
                    title="Custom Title" 
                />
            )
            
            expect(screen.getByText("Custom Title")).toBeInTheDocument()
        })

        it("should render subtitle when provided", () => {
            render(
                <TransactionsTable 
                    transactions={mockTransactions} 
                    subtitle="Test subtitle" 
                />
            )
            
            expect(screen.getByText("Test subtitle")).toBeInTheDocument()
        })

        it("should render all transactions", () => {
            render(<TransactionsTable transactions={mockTransactions} />)
            
            expect(screen.getByText("Webflow Subscription")).toBeInTheDocument()
            expect(screen.getByText("Office Supplies - Staples")).toBeInTheDocument()
            expect(screen.getByText("Client Payment - Acme Corp")).toBeInTheDocument()
        })

        it("should render transaction amounts", () => {
            render(<TransactionsTable transactions={mockTransactions} />)
            
            expect(screen.getByText("-$49.00")).toBeInTheDocument()
            expect(screen.getByText("-$124.50")).toBeInTheDocument()
            expect(screen.getByText("+$4,500.00")).toBeInTheDocument()
        })

        it("should render transaction dates", () => {
            render(<TransactionsTable transactions={mockTransactions} />)
            
            expect(screen.getByText("May 2, 2024")).toBeInTheDocument()
            expect(screen.getByText("May 10, 2024")).toBeInTheDocument()
            expect(screen.getByText("May 7, 2024")).toBeInTheDocument()
        })
    })

    describe("search functionality", () => {
        it("should render search input", () => {
            render(<TransactionsTable transactions={mockTransactions} />)
            
            expect(screen.getByPlaceholderText("Sök transaktioner...")).toBeInTheDocument()
        })

        it("should filter transactions by search query", async () => {
            const user = userEvent.setup()
            render(<TransactionsTable transactions={mockTransactions} />)
            
            const searchInput = screen.getByPlaceholderText("Sök transaktioner...")
            await user.type(searchInput, "Webflow")
            
            expect(screen.getByText("Webflow Subscription")).toBeInTheDocument()
            expect(screen.queryByText("Office Supplies - Staples")).not.toBeInTheDocument()
        })

        it("should be case-insensitive", async () => {
            const user = userEvent.setup()
            render(<TransactionsTable transactions={mockTransactions} />)
            
            const searchInput = screen.getByPlaceholderText("Sök transaktioner...")
            await user.type(searchInput, "webflow")
            
            expect(screen.getByText("Webflow Subscription")).toBeInTheDocument()
        })

        it("should search by account name", async () => {
            const user = userEvent.setup()
            render(<TransactionsTable transactions={mockTransactions} />)
            
            const searchInput = screen.getByPlaceholderText("Sök transaktioner...")
            await user.type(searchInput, "Main Checking")
            
            expect(screen.getByText("Client Payment - Acme Corp")).toBeInTheDocument()
            expect(screen.queryByText("Webflow Subscription")).not.toBeInTheDocument()
        })
    })

    describe("empty states", () => {
        it("should handle empty transactions array", () => {
            render(<TransactionsTable transactions={[]} />)
            
            // Table should still render
            expect(screen.getByText("Alla transaktioner")).toBeInTheDocument()
        })
    })

    describe("accessibility", () => {
        it("should have accessible table structure", () => {
            render(<TransactionsTable transactions={mockTransactions} />)
            
            expect(screen.getByRole("table")).toBeInTheDocument()
        })
    })

    describe("props interface", () => {
        it("should accept transactions as prop for dependency injection", () => {
            const customTransactions: Transaction[] = [
                {
                    id: "custom-1",
                    name: "Custom Transaction",
                    date: "Jan 1, 2024",
                    amount: "$100.00",
                    status: TRANSACTION_STATUSES.RECORDED,
                    category: "Custom",
                    iconName: "Tag",
                    iconColor: "text-red-500",
                    account: "Custom Account",
                    timestamp: new Date("2024-01-01"),
                    amountValue: 100,
                },
            ]
            
            render(<TransactionsTable transactions={customTransactions} />)
            
            expect(screen.getByText("Custom Transaction")).toBeInTheDocument()
            expect(screen.queryByText("Webflow Subscription")).not.toBeInTheDocument()
        })
    })
})
