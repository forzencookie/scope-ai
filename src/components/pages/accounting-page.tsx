"use client"

import { useCallback, Suspense, useMemo, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    TooltipProvider,
} from "@/components/ui/tooltip"
import { Loader2 } from "lucide-react"

import { PageTabsLayout } from "@/components/shared/layout/page-tabs-layout"
import { DataErrorState } from "@/components/ui/data-error-state"
import { SectionErrorBoundary } from "@/components/shared/error-boundary"

import { nullToUndefined } from "@/lib/utils"
import { useFeature } from "@/providers/company-provider"
import {
    LazyTransactionsTable,
    LazyUnifiedInvoicesView,
    LazyInventarierTable,
} from "@/components/shared"
import { VerifikationerTable } from "@/components/bokforing/verifikationer"

import { useTransactionsPaginated, useTransactionStats } from "@/hooks"

// Tab configuration with feature requirements and translations
const allTabs = [
    {
        id: "transaktioner",
        label: "Transaktioner",
        color: "bg-blue-500",
        feature: null, // Available to all
    },
    {
        id: "fakturor",
        label: "Fakturor",
        color: "bg-purple-500",
        feature: null, // Available to all
    },
    {
        id: "verifikationer",
        label: "Huvudbok",
        color: "bg-emerald-500",
        feature: 'verifikationer' as const,
    },
    {
        id: "inventarier",
        label: "Inventarier",
        color: "bg-orange-500",
        feature: 'inventarier' as const,
    },
]

// ============ MAIN PAGE COMPONENT ============
function AccountingPageContent() {
    // ... no changes to hooks ...
    const searchParams = useSearchParams()
    const router = useRouter()
    const paramTab = searchParams.get("tab")
    const currentTab = paramTab || "transaktioner"

    // State for transactions and UI
    // Use paginated hook
    const {
        transactions,
        isLoading: transactionsLoading,
        error: fetchError,
        page,
        setPage,
        total,
        pageSize,
        refetch: handleRefresh
    } = useTransactionsPaginated(50) // Default 50 items per page

    const { stats: transactionStats } = useTransactionStats()

    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

    // Update last refresh when transactions update
    useEffect(() => {
        setLastRefresh(new Date())
    }, [transactions])


    // Manual refresh function
    // handleRefresh is now from the hook

    // Listen for global refresh event from toolbar
    useEffect(() => {
        const onPageRefresh = () => handleRefresh()
        window.addEventListener("page-refresh", onPageRefresh)
        return () => window.removeEventListener("page-refresh", onPageRefresh)
    }, [handleRefresh])

    // Use only api transactions (no mock data)
    // const transactions = apiTransactions // Already destructured from hook


    // Feature checks for conditional tabs
    const hasVerifikationer = useFeature('verifikationer')

    // Filter tabs based on available features
    const tabs = useMemo(() => {
        return allTabs
            .filter(tab => {
                if (!tab.feature) return true
                if (tab.feature === 'verifikationer') return hasVerifikationer
                return true
            })
    }, [hasVerifikationer])

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/bokforing?tab=${tab}`, { scroll: false })
    }, [router])

    return (
        <TooltipProvider>
            <div className="flex flex-col min-h-svh">
                <PageTabsLayout
                    tabs={tabs}
                    currentTab={currentTab}
                    onTabChange={setCurrentTab}
                />

                <main className="flex-1 flex flex-col p-4 md:p-6 min-w-0">
                    <div className="space-y-6">
                        {currentTab === "transaktioner" && (
                            fetchError ? (
                                <DataErrorState
                                    message={fetchError instanceof Error ? fetchError.message : String(fetchError)}
                                    onRetry={handleRefresh}
                                />
                            ) : (
                                <SectionErrorBoundary sectionName="Transaktioner">
                                    <LazyTransactionsTable
                                        title="Transaktioner"
                                        transactions={transactions}
                                        stats={nullToUndefined(transactionStats)}
                                        page={page}
                                        pageSize={pageSize}
                                        total={total}
                                        onPageChange={setPage}
                                        isLoading={transactionsLoading}
                                    />
                                </SectionErrorBoundary>
                            )
                        )}
                        {currentTab === "fakturor" && (
                            <LazyUnifiedInvoicesView />
                        )}
                        {currentTab === "verifikationer" && (
                            <VerifikationerTable />
                        )}
                        {currentTab === "inventarier" && (
                            <LazyInventarierTable />
                        )}
                    </div>
                </main>
            </div>
        </TooltipProvider>
    )
}

// Loading fallback for Suspense
function AccountingPageLoading() {
    return (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Laddar bokföring...
        </div>
    )
}

// Export wrapped in Suspense for useSearchParams
export default function AccountingPage() {
    return (
        <Suspense fallback={<AccountingPageLoading />}>
            <AccountingPageContent />
        </Suspense>
    )
}
