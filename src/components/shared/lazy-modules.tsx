"use client"

import { Suspense, lazy, type ComponentType, type ReactNode } from "react"
import { Card } from "@/components/ui/card"

// ============================================================================
// Loading Components - Simple grey block skeletons
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
        <Card className="h-32 bg-muted animate-pulse" />
    )
}

// Simple card row skeleton (e.g., 3-4 stat cards)
function CardRowSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className={`grid gap-4 grid-cols-2 md:grid-cols-${count}`}>
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="h-24 bg-muted animate-pulse" />
            ))}
        </div>
    )
}

// Table skeleton - just a card row + big table card
function TableLoadingSkeleton() {
    return (
        <div className="w-full space-y-6">
            {/* Top row cards */}
            <CardRowSkeleton count={4} />

            {/* Section separator */}
            <div className="border-b-2 border-border/60" />

            {/* Table placeholder */}
            <Card className="h-96 bg-muted animate-pulse" />
        </div>
    )
}

// Chart/Stats skeleton for reports
function ChartLoadingSkeleton() {
    return (
        <div className="w-full space-y-6">
            {/* Top row cards */}
            <CardRowSkeleton count={4} />

            {/* Charts grid */}
            <div className="grid grid-cols-2 gap-6">
                <Card className="h-48 bg-muted animate-pulse" />
                <Card className="h-48 bg-muted animate-pulse" />
            </div>

            {/* Bottom section */}
            <Card className="h-32 bg-muted animate-pulse" />
        </div>
    )
}

// Payroll content skeleton
function PayrollLoadingSkeleton() {
    return (
        <div className="w-full space-y-6">
            {/* Top row cards */}
            <CardRowSkeleton count={4} />

            {/* Info banner */}
            <Card className="h-20 bg-muted animate-pulse" />

            {/* Two column layout */}
            <div className="grid grid-cols-2 gap-6">
                <Card className="h-48 bg-muted animate-pulse" />
                <Card className="h-48 bg-muted animate-pulse" />
            </div>
        </div>
    )
}

// ============================================================================
// Lazy Loading Factory
// ============================================================================

export type LoadingVariant = 'spinner' | 'card' | 'table' | 'chart' | 'payroll'

const loadingComponents: Record<LoadingVariant, ComponentType> = {
    spinner: ModuleLoadingSpinner,
    card: ModuleLoadingCard,
    table: TableLoadingSkeleton,
    chart: ChartLoadingSkeleton,
    payroll: PayrollLoadingSkeleton,
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
        const { TransactionsTable } = await import('@/components/bokforing');
        return { default: TransactionsTable };
    },
    'table'
)

// Invoices module
export const LazyInvoicesTable = createLazyComponent(
    async () => {
        const { InvoicesTable } = await import('../bokforing/invoices-table');
        return { default: InvoicesTable };
    },
    'table'
)

// Receipts module
export const LazyReceiptsTable = createLazyComponent(
    async () => {
        const { ReceiptsTable } = await import('../bokforing/receipts-table');
        return { default: ReceiptsTable };
    },
    'table'
)

// Verifikationer module
export const LazyVerifikationerTable = createLazyComponent(
    async () => {
        const { VerifikationerTable } = await import('../bokforing/verifikationer-table');
        return { default: VerifikationerTable };
    },
    'table'
)

// Journal Calendar
export const LazyJournalCalendar = createLazyComponent(
    async () => {
        const { JournalCalendar } = await import('../bokforing/journal-calendar');
        return { default: JournalCalendar };
    },
    'chart'
)

// Onboarding wizard
export const LazyOnboardingWizard = createLazyComponent(
    async () => {
        const { OnboardingWizard } = await import('../onboarding/onboarding-wizard');
        return { default: OnboardingWizard };
    },
    'card'
)

// ============================================================================
// Reports Tab Components (Lazy Loaded)
// ============================================================================

// Momsdeklaration tab
export const LazyMomsdeklarationContent = createLazyComponent(
    async () => {
        const { MomsdeklarationContent } = await import('@/components/skatt/momsdeklaration-content');
        return { default: MomsdeklarationContent };
    },
    'table'
)

// Inkomstdeklaration tab
export const LazyInkomstdeklarationContent = createLazyComponent(
    async () => {
        const { InkomstdeklarationContent } = await import('@/components/skatt/inkomstdeklaration-content');
        return { default: InkomstdeklarationContent };
    },
    'table'
)

// Årsredovisning tab
export const LazyArsredovisningContent = createLazyComponent(
    async () => {
        const { ArsredovisningContent } = await import('@/components/skatt/arsredovisning-content');
        return { default: ArsredovisningContent };
    },
    'table'
)

// Resultaträkning tab
export const LazyResultatrakningContent = createLazyComponent(
    async () => {
        const { ResultatrakningContent } = await import('@/components/rapporter/financial-statements');
        return { default: ResultatrakningContent };
    },
    'table'
)

// Balansräkning tab
export const LazyBalansrakningContent = createLazyComponent(
    async () => {
        const { BalansrakningContent } = await import('@/components/rapporter/financial-statements');
        return { default: BalansrakningContent };
    },
    'table'
)

// Företagsstatistik tab
export const LazyForetagsstatistikContent = createLazyComponent(
    async () => {
        const { ForetagsstatistikContent } = await import('@/components/rapporter/foretagsstatistik-content');
        return { default: ForetagsstatistikContent };
    },
    'chart'
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
    transactions: () => import('@/components/bokforing'),
    invoices: () => import('../bokforing/invoices-table'),
    receipts: () => import('../bokforing/receipts-table'),
} as const

/**
 * Reports modules to preload when user hovers over reports nav
 */
export const reportsModulePreloaders = {
    momsdeklaration: () => import('@/components/skatt/momsdeklaration-content'),
    inkomstdeklaration: () => import('@/components/skatt/inkomstdeklaration-content'),
    arsredovisning: () => import('@/components/skatt/arsredovisning-content'),
    financialStatements: () => import('@/components/rapporter/financial-statements'),
    foretagsstatistik: () => import('@/components/rapporter/foretagsstatistik-content'),
} as const

/**
 * Preload a specific reports tab module
 */
export function preloadReportsTab(tabId: string): void {
    const preloaders: Record<string, () => Promise<unknown>> = {
        momsdeklaration: reportsModulePreloaders.momsdeklaration,
        inkomstdeklaration: reportsModulePreloaders.inkomstdeklaration,
        arsredovisning: reportsModulePreloaders.arsredovisning,
        arsbokslut: reportsModulePreloaders.arsredovisning,
        resultatrakning: reportsModulePreloaders.financialStatements,
        balansrakning: reportsModulePreloaders.financialStatements,
    }

    const preloader = preloaders[tabId]
    if (preloader) {
        preloadModule(preloader)
    }
}

// ============================================================================
// Payroll Tab Components (Lazy Loaded)
// ============================================================================

// Lönebesked tab
export const LazyLonesbeskContent = createLazyComponent(
    async () => {
        const { LonesbeskContent } = await import('@/components/loner/lonebesked-content');
        return { default: LonesbeskContent };
    },
    'payroll'
)

// AGI tab
export const LazyAGIContent = createLazyComponent(
    async () => {
        const { AGIContent } = await import('@/components/skatt/agi-content');
        return { default: AGIContent };
    },
    'payroll'
)

// Utdelning tab
export const LazyUtdelningContent = createLazyComponent(
    async () => {
        const { UtdelningContent } = await import('@/components/parter/utdelning-content');
        return { default: UtdelningContent };
    },
    'payroll'
)

/**
 * Payroll modules to preload when user hovers over payroll nav
 */
export const payrollModulePreloaders = {
    lonebesked: () => import('@/components/loner/lonebesked-content'),
    agi: () => import('@/components/skatt/agi-content'),
    utdelning: () => import('@/components/parter/utdelning-content'),
    egenavgifter: () => import('@/components/parter/egenavgifter'),
    delagaruttag: () => import('@/components/parter/delagaruttag'),
} as const

/**
 * Preload a specific payroll tab module
 */
export function preloadPayrollTab(tabId: string): void {
    const preloaders: Record<string, () => Promise<unknown>> = {
        lonebesked: payrollModulePreloaders.lonebesked,
        agi: payrollModulePreloaders.agi,
        utdelning: payrollModulePreloaders.utdelning,
        egenavgifter: payrollModulePreloaders.egenavgifter,
        delagaruttag: payrollModulePreloaders.delagaruttag,
    }

    const preloader = preloaders[tabId]
    if (preloader) {
        preloadModule(preloader)
    }
}

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
