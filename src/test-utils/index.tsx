import { ReactElement, ReactNode } from "react"
import { render, RenderOptions } from "@testing-library/react"
import { DataProvider, DataProviderProps } from "@/providers"
import { TextModeProvider } from "@/providers/text-mode-provider"
import { ToastProvider } from "@/components/ui/toast"
import type { Transaction, Invoice, Receipt, QuickStat, PendingTask } from "@/types"
import { TRANSACTION_STATUS_LABELS, INVOICE_STATUS_LABELS, RECEIPT_STATUS_LABELS } from "@/lib/localization"

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Creates a mock transaction for testing
 */
export function createMockTransaction(overrides?: Partial<Transaction>): Transaction {
    return {
        id: `test-${Math.random().toString(36).substr(2, 9)}`,
        name: "Test Transaction",
        date: "May 1, 2024",
        timestamp: new Date("2024-05-01"),
        amount: "-$100.00",
        amountValue: -100.00,
        status: TRANSACTION_STATUS_LABELS.TO_RECORD,
        category: "Software",
        iconName: "Tag",
        iconColor: "text-blue-500",
        account: "Test Account",
        ...overrides,
    }
}

/**
 * Creates multiple mock transactions for testing
 */
export function createMockTransactions(count: number): Transaction[] {
    return Array.from({ length: count }, (_, i) =>
        createMockTransaction({
            id: `test-${i + 1}`,
            name: `Transaction ${i + 1}`,
            amount: `${i % 2 === 0 ? "-" : "+"}$${(i + 1) * 100}.00`,
        })
    )
}

/**
 * Creates a mock invoice for testing
 */
export function createMockInvoice(overrides?: Partial<Invoice>): Invoice {
    return {
        id: `invoice-${Math.random().toString(36).substr(2, 9)}`,
        customer: "Test Customer",
        issueDate: "2024-05-01",
        dueDate: "2024-05-31",
        amount: "1000.00",
        status: INVOICE_STATUS_LABELS.DRAFT,
        ...overrides,
    } as Invoice
}

/**
 * Creates multiple mock invoices for testing
 */
export function createMockInvoices(count: number): Invoice[] {
    return Array.from({ length: count }, (_, i) =>
        createMockInvoice({
            id: `invoice-${i + 1}`,
            customer: `Customer ${i + 1}`,
        })
    )
}

/**
 * Creates a mock receipt for testing
 */
export function createMockReceipt(overrides?: Partial<Receipt>): Receipt {
    return {
        id: `receipt-${Math.random().toString(36).substr(2, 9)}`,
        supplier: "Test Vendor",
        date: "2024-05-01",
        amount: "250.00",
        status: RECEIPT_STATUS_LABELS.PENDING,
        category: "Supplies",
        attachment: "",
        ...overrides,
    } as Receipt
}

/**
 * Creates multiple mock receipts for testing
 */
export function createMockReceipts(count: number): Receipt[] {
    return Array.from({ length: count }, (_, i) =>
        createMockReceipt({
            id: `receipt-${i + 1}`,
            supplier: `Vendor ${i + 1}`,
        })
    )
}

/**
 * Creates a mock quick stat for testing
 */
export function createMockQuickStat(overrides?: Partial<QuickStat>): QuickStat {
    return {
        title: "Test Stat",
        value: "100",
        change: "+10%",
        trend: "up",
        ...overrides,
    } as QuickStat
}

/**
 * Creates a mock pending task for testing
 */
export function createMockPendingTask(overrides?: Partial<PendingTask>): PendingTask {
    return {
        id: `task-${Math.random().toString(36).substr(2, 9)}`,
        title: "Test Task",
        description: "Test task description",
        priority: "medium",
        dueDate: "2024-05-31",
        ...overrides,
    } as PendingTask
}

/**
 * Creates a mock user for testing
 */
export function createMockUser(overrides?: Record<string, unknown>) {
    return {
        id: `user-${Math.random().toString(36).substr(2, 9)}`,
        email: "test@example.com",
        name: "Test User",
        created_at: new Date().toISOString(),
        ...overrides,
    }
}

/**
 * Creates a mock API response
 */
export function createMockApiResponse<T>(data: T, success = true) {
    return {
        data,
        success,
        timestamp: new Date(),
        error: success ? undefined : "Mock error",
    }
}

// ============================================================================
// Custom Render with Providers
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
    providerProps?: Partial<DataProviderProps>
}

/**
 * Custom render function that wraps components with necessary providers
 * Use this for testing components that depend on context
 */
export function renderWithProviders(
    ui: ReactElement,
    { providerProps, ...renderOptions }: CustomRenderOptions = {}
) {
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <TextModeProvider>
            <ToastProvider>
                <DataProvider
                    initialTransactions={providerProps?.initialTransactions ?? []}
                    initialInvoices={providerProps?.initialInvoices ?? []}
                    initialReceipts={providerProps?.initialReceipts ?? []}
                >
                    {children}
                </DataProvider>
            </ToastProvider>
        </TextModeProvider>
    )

    return {
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    }
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Waits for a condition to be true
 */
export async function waitFor(
    condition: () => boolean,
    timeout = 5000
): Promise<void> {
    const startTime = Date.now()
    while (!condition()) {
        if (Date.now() - startTime > timeout) {
            throw new Error("Timeout waiting for condition")
        }
        await new Promise(resolve => setTimeout(resolve, 50))
    }
}

/**
 * Creates a mock function that tracks calls
 */
export function createMockFn<T extends (...args: unknown[]) => unknown>() {
    const calls: Parameters<T>[] = []
    const fn = ((...args: Parameters<T>) => {
        calls.push(args)
    }) as T & { calls: Parameters<T>[] }
    fn.calls = calls
    return fn
}

// ============================================================================
// Re-export testing library utilities
// ============================================================================

export * from "@testing-library/react"
export { default as userEvent } from "@testing-library/user-event"
