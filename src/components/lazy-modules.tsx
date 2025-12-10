"use client"

import { Suspense, lazy, type ComponentType, type ReactNode } from "react"

// ============================================================================
// Loading Components
// ============================================================================

function ModuleLoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )
}

function ModuleLoadingCard() {
    return (
        <div className="p-6 space-y-4">
            <div className="h-6 bg-muted animate-pulse rounded w-1/3"></div>
            <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-4/6"></div>
            </div>
        </div>
    )
}

function TableLoadingSkeleton() {
    return (
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="h-8 bg-muted animate-pulse rounded w-1/4"></div>
                <div className="flex gap-2">
                    <div className="h-9 bg-muted animate-pulse rounded w-24"></div>
                    <div className="h-9 bg-muted animate-pulse rounded w-24"></div>
                </div>
            </div>
            {/* Table rows */}
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 py-3">
                        <div className="h-5 bg-muted animate-pulse rounded w-8"></div>
                        <div className="h-5 bg-muted animate-pulse rounded flex-1"></div>
                        <div className="h-5 bg-muted animate-pulse rounded w-24"></div>
                        <div className="h-5 bg-muted animate-pulse rounded w-20"></div>
                        <div className="h-5 bg-muted animate-pulse rounded w-16"></div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ChartLoadingSkeleton() {
    return (
        <div className="p-6 space-y-4">
            <div className="h-6 bg-muted animate-pulse rounded w-1/4"></div>
            <div className="h-64 bg-muted animate-pulse rounded"></div>
        </div>
    )
}

// ============================================================================
// Lazy Loading Factory
// ============================================================================

export type LoadingVariant = 'spinner' | 'card' | 'table' | 'chart'

const loadingComponents: Record<LoadingVariant, ComponentType> = {
    spinner: ModuleLoadingSpinner,
    card: ModuleLoadingCard,
    table: TableLoadingSkeleton,
    chart: ChartLoadingSkeleton,
}

/**
 * Create a lazily loaded component with proper Suspense boundary
 * Uses type assertion to handle modules with named exports
 */
export function createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    loadingVariant: LoadingVariant = 'spinner'
): ComponentType<React.ComponentProps<T>> {
    const LazyComponent = lazy(importFn)
    const LoadingComponent = loadingComponents[loadingVariant]

    // Return a wrapper component
    return function LazyWrapper(props: React.ComponentProps<T>) {
        return (
            <Suspense fallback={<LoadingComponent />}>
                <LazyComponent {...props} />
            </Suspense>
        )
    }
}

/**
 * Wrapper component for lazy loading with custom fallback
 */
export function LazyModule({
    children,
    fallback,
    variant = 'spinner',
}: {
    children: ReactNode
    fallback?: ReactNode
    variant?: LoadingVariant
}) {
    const LoadingComponent = loadingComponents[variant]
    
    return (
        <Suspense fallback={fallback ?? <LoadingComponent />}>
            {children}
        </Suspense>
    )
}

// ============================================================================
// Pre-defined Lazy Components for Dashboard Modules
// ============================================================================

// Transactions module
export const LazyTransactionsTable = createLazyComponent(
    async () => {
        const { TransactionsTable } = await import('@/components/transactions');
        return { default: TransactionsTable };
    },
    'table'
)

// Invoices module
export const LazyInvoicesTable = createLazyComponent(
    async () => {
        const { InvoicesTable } = await import('@/components/invoices-table');
        return { default: InvoicesTable };
    },
    'table'
)

// Receipts module
export const LazyReceiptsTable = createLazyComponent(
    async () => {
        const { ReceiptsTable } = await import('@/components/receipts-table');
        return { default: ReceiptsTable };
    },
    'table'
)

// Verifikationer module
export const LazyVerifikationerTable = createLazyComponent(
    async () => {
        const { VerifikationerTable } = await import('@/components/verifikationer-table');
        return { default: VerifikationerTable };
    },
    'table'
)

// Journal Calendar
export const LazyJournalCalendar = createLazyComponent(
    async () => {
        const { JournalCalendar } = await import('@/components/journal-calendar');
        return { default: JournalCalendar };
    },
    'chart'
)

// Onboarding wizard
export const LazyOnboardingWizard = createLazyComponent(
    async () => {
        const { OnboardingWizard } = await import('@/components/onboarding-wizard');
        return { default: OnboardingWizard };
    },
    'card'
)

// ============================================================================
// Route-based Lazy Loading Helpers
// ============================================================================

/**
 * Preload a module (call on hover/focus for faster perceived loading)
 */
export function preloadModule(importFn: () => Promise<unknown>): void {
    // Trigger the import but don't await it
    importFn().catch(() => {
        // Ignore preload errors
    })
}

/**
 * Common modules to preload on dashboard load
 */
export const dashboardModulePreloaders = {
    transactions: () => import('@/components/transactions'),
    invoices: () => import('@/components/invoices-table'),
    receipts: () => import('@/components/receipts-table'),
} as const

/**
 * Preload common dashboard modules
 * Call this on dashboard mount for better UX
 */
export function preloadDashboardModules(): void {
    // Use requestIdleCallback for non-critical preloading
    if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
            Object.values(dashboardModulePreloaders).forEach(preloadModule)
        })
    } else {
        // Fallback for Safari
        setTimeout(() => {
            Object.values(dashboardModulePreloaders).forEach(preloadModule)
        }, 1000)
    }
}
