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
export function createLazyComponent(
    importFn: () => Promise<{ default: ComponentType<never> }>,
    loadingMessage?: string
): ComponentType<Record<string, unknown>> {
    const LazyComponent = lazy(importFn as unknown as () => Promise<{ default: ComponentType<Record<string, unknown>> }>)

    return function LazyWrapper(props: Record<string, unknown>) {
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

export const LazyInventarierTable = createLazyComponent(
    () => import("@/components/bokforing/inventarier").then(m => ({ default: m.InventarierTable })),
    "Laddar tillgångar..."
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

export const LazyFormaner = createLazyComponent(
    () => import("@/components/loner/benefits").then(m => ({ default: m.BenefitsTab })),
    "Laddar förmåner..."
)

export const LazyEgenavgifter = createLazyComponent(
    () => import("@/components/loner/egenavgifter").then(m => ({ default: m.EgenavgifterCalculator })),
    "Laddar egenavgifter..."
)

export const LazyDelagaruttag = createLazyComponent(
    () => import("@/components/loner/delagaruttag").then(m => ({ default: m.DelagaruttagManager })),
    "Laddar delägaruttag..."
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
