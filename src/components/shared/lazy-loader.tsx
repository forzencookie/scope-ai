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

// --- Bokföring ---
export const LazyTransactionsTable = createLazyComponent(
    () => import("@/components/bokforing").then(m => ({ default: m.TransactionsTable })),
    "Laddar transaktioner..."
)

export const LazyReceiptsTable = createLazyComponent(
    () => import("@/components/bokforing").then(m => ({ default: m.ReceiptsTable })),
    "Laddar kvitton..."
)

export const LazyInventarierTable = createLazyComponent(
    () => import("@/components/bokforing").then(m => ({ default: m.InventarierTable })),
    "Laddar inventarier..."
)

export const LazyUnifiedInvoicesView = createLazyComponent(
    () => import("@/components/bokforing").then(m => ({ default: m.UnifiedInvoicesView })),
    "Laddar fakturor..."
)

// --- Skatt ---
export const LazyMomsdeklaration = createLazyComponent(
    () => import("@/components/rapporter").then(m => ({ default: m.MomsdeklarationContent })),
    "Laddar momsdeklaration..."
)

export const LazyInkomstdeklaration = createLazyComponent(
    () => import("@/components/rapporter").then(m => ({ default: m.InkomstdeklarationContent })),
    "Laddar inkomstdeklaration..."
)

export const LazyAGI = createLazyComponent(
    () => import("@/components/rapporter").then(m => ({ default: m.AGIContent })),
    "Laddar arbetsgivardeklaration..."
)

export const LazyArsredovisning = createLazyComponent(
    () => import("@/components/rapporter").then(m => ({ default: m.ArsredovisningContent })),
    "Laddar årsredovisning..."
)

export const LazyArsbokslut = createLazyComponent(
    () => import("@/components/rapporter").then(m => ({ default: m.ArsbokslutContent })),
    "Laddar årsbokslut..."
)

export const LazyK10 = createLazyComponent(
    () => import("@/components/rapporter").then(m => ({ default: m.K10Content })),
    "Laddar K10..."
)

// --- Rapporter ---
export const LazyResultatrakning = createLazyComponent(
    () => import("@/components/rapporter").then(m => ({ default: m.ResultatrakningContent })),
    "Laddar resultaträkning..."
)

export const LazyBalansrakning = createLazyComponent(
    () => import("@/components/rapporter").then(m => ({ default: m.BalansrakningContent })),
    "Laddar balansräkning..."
)

// --- Löner ---
export const LazyLonebesked = createLazyComponent(
    () => import("@/components/loner/payslips").then(m => ({ default: m.LonesbeskContent })),
    "Laddar lönebesked..."
)

export const LazyTeamTab = createLazyComponent(
    () => import("@/components/loner/team"),
    "Laddar personal..."
)

export const LazyBenefitsTab = createLazyComponent(
    () => import("@/components/loner/benefits").then(m => ({ default: m.BenefitsTab })),
    "Laddar förmåner..."
)

// --- Ägare & Styrning ---
export const LazyUtdelning = createLazyComponent(
    () => import("@/components/agare").then(m => ({ default: m.UtdelningContent })),
    "Laddar utdelning..."
)

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

export const LazyStyrelseprotokoll = createLazyComponent(
    () => import("@/components/agare").then(m => ({ default: m.Styrelseprotokoll })),
    "Laddar styrelseprotokoll..."
)

export const LazyBolagsstamma = createLazyComponent(
    () => import("@/components/agare").then(m => ({ default: m.Bolagsstamma })),
    "Laddar bolagsstämma..."
)

export const LazyArsmote = createLazyComponent(
    () => import("@/components/agare").then(m => ({ default: m.Arsmote })),
    "Laddar årsmöte..."
)

export const LazyFirmatecknare = createLazyComponent(
    () => import("@/components/agare").then(m => ({ default: m.Firmatecknare })),
    "Laddar firmatecknare..."
)

export const LazyMyndigheter = createLazyComponent(
    () => import("@/components/agare").then(m => ({ default: m.Myndigheter })),
    "Laddar myndigheter..."
)

export const LazyEgenavgifter = createLazyComponent(
    () => import("@/components/loner").then(m => ({ default: m.Egenavgifter })),
    "Laddar egenavgifter..."
)

export const LazyDelagaruttag = createLazyComponent(
    () => import("@/components/loner").then(m => ({ default: m.Delagaruttag })),
    "Laddar delägaruttag..."
)

// --- Företagsstatistik ---
export const LazyEkonomiskOversikt = createLazyComponent(
    () => import("@/components/foretagsstatistik/oversikt").then(m => ({ default: m.EkonomiskOversikt })),
    "Laddar ekonomisk översikt..."
)

export const LazyTransaktionsrapport = createLazyComponent(
    () => import("@/components/foretagsstatistik/transaktionsrapport").then(m => ({ default: m.Transaktionsrapport })),
    "Laddar transaktionsrapport..."
)

export const LazyKostnadsanalys = createLazyComponent(
    () => import("@/components/foretagsstatistik/kostnadsanalys").then(m => ({ default: m.Kostnadsanalys })),
    "Laddar kostnadsanalys..."
)

// --- Onboarding ---
export const LazyOnboardingWizard = createLazyComponent(
    () => import("@/components/onboarding/onboarding-wizard").then(m => ({ default: m.OnboardingWizard })),
    "Laddar guide..."
)
