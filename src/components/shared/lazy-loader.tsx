"use client"

import { Suspense, lazy, type ComponentType } from "react"
import { Loader2 } from "lucide-react"

// ============================================================================
// Golden Standard Loading Spinner
// ============================================================================

interface LoadingSpinnerProps {
    message?: string
}

export function LoadingSpinner({ message = "Laddar..." }: LoadingSpinnerProps) {
    return (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            {message}
        </div>
    )
}

// ============================================================================
// Lazy Loading Factory
// ============================================================================

/**
 * Create a lazily loaded component with spinner fallback
 * 
 * @example
 * const LazyTransactions = createLazyComponent(
 *     () => import("@/components/bokforing").then(m => ({ default: m.TransactionsTable })),
 *     "Laddar transaktioner..."
 * )
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    loadingMessage?: string
): ComponentType<React.ComponentProps<T>> {
    const LazyComponent = lazy(importFn)

    return function LazyWrapper(props: React.ComponentProps<T>) {
        return (
            <Suspense fallback={<LoadingSpinner message={loadingMessage} />}>
                <LazyComponent {...props} />
            </Suspense>
        )
    }
}

// ============================================================================
// Pre-defined Lazy Components
// ============================================================================

// --- Bokföring (active — used by accounting-page.tsx) ---
export const LazyTransactionsTable = createLazyComponent(
    () => import("@/components/bokforing").then(m => ({ default: m.TransactionsTable })),
    "Laddar transaktioner..."
)

export const LazyUnifiedInvoicesView = createLazyComponent(
    () => import("@/components/bokforing").then(m => ({ default: m.UnifiedInvoicesView })),
    "Laddar fakturor..."
)

// --- Löner (active — used by payroll-page.tsx) ---
export const LazyLonebesked = createLazyComponent(
    () => import("@/components/loner/payslips").then(m => ({ default: m.LonesbeskContent })),
    "Laddar lönebesked..."
)

export const LazyTeamTab = createLazyComponent(
    () => import("@/components/loner/team"),
    "Laddar personal..."
)

// --- Ägare & Styrning (active — used by ownership-page.tsx) ---
export const LazyAktiebok = createLazyComponent(
    () => import("@/components/agare").then(m => ({ default: m.Aktiebok })),
    "Laddar aktiebok..."
)

export const LazyDelagare = createLazyComponent(
    () => import("@/components/agare").then(m => ({ default: m.Delagare })),
    "Laddar delägare..."
)

export const LazyMedlemsregister = createLazyComponent(
    () => import("@/components/agare").then(m => ({ default: m.Medlemsregister })),
    "Laddar medlemsregister..."
)

export const LazyBolagsstamma = createLazyComponent(
    () => import("@/components/agare").then(m => ({ default: m.Bolagsstamma })),
    "Laddar bolagsstämma..."
)

export const LazyArsmote = createLazyComponent(
    () => import("@/components/agare").then(m => ({ default: m.Arsmote })),
    "Laddar årsmöte..."
)

// --- Onboarding ---
export const LazyOnboardingWizard = createLazyComponent(
    () => import("@/components/onboarding/onboarding-wizard").then(m => ({ default: m.OnboardingWizard })),
    "Laddar guide..."
)
