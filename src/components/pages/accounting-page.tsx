"use client"

import { useCallback, Suspense, useMemo, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { transactionService, type TransactionStats } from '@/services/transaction-service'
import { useCachedQuery } from '@/hooks/use-cached-query'
import {
    TooltipProvider,
} from "@/components/ui/tooltip"
import { MonthClosing } from "@/components/bokforing/month-closing"
import { Loader2 } from "lucide-react"

import { PageTabsLayout } from "@/components/shared/layout/page-tabs-layout"
import { PageSidebarSlot } from "@/components/shared/page-sidebar"
import { TransactionsSidebar } from "@/components/bokforing/transactions-sidebar"

import { DataErrorState } from "@/components/ui/data-error-state"
import { SectionErrorBoundary } from "@/components/shared/error-boundary"

import { useFeature } from "@/providers/company-provider"
import {
    LazyTransactionsTable,
    LazyReceiptsTable,
    LazyInventarierTable,
    LazyUnifiedInvoicesView,
} from "@/components/shared"
import { VerifikationerTable } from "@/components/bokforing/verifikationer"
import { useTextMode } from "@/providers/text-mode-provider"

import { useTransactionsPaginated } from "@/hooks"

// Tab configuration with feature requirements and translations
const allTabs = [
    {
        id: "transaktioner",
        labelEnkel: "Transaktioner",
        labelAvancerad: "Transaktioner",
        color: "bg-blue-500",
        feature: null, // Available to all
    },
    {
        id: "fakturor",
        labelEnkel: "Fakturor",
        labelAvancerad: "Fakturor",
        color: "bg-purple-500",
        feature: null, // Available to all
    },
    {
        id: "kvitton",
        labelEnkel: "Kvitton",
        labelAvancerad: "Kvitton",
        color: "bg-amber-500",
        feature: null, // Available to all
    },
    {
        id: "bokslut",
        labelEnkel: "Månadsavslut",
        labelAvancerad: "Månadsavslut",
        color: "bg-rose-500",
        feature: null,
    },

    {
        id: "inventarier",
        labelEnkel: "Inventarier",
        labelAvancerad: "Inventarier",
        color: "bg-indigo-500",
        feature: null,
    },
    {
        id: "verifikationer",
        labelEnkel: "Verifikationer",
        labelAvancerad: "Verifikationer",
        color: "bg-emerald-500",
        feature: 'verifikationer' as const,
    },
]

// ============ MAIN PAGE COMPONENT ============
function AccountingPageContent() {
    // ... no changes to hooks ...
    const searchParams = useSearchParams()
    const router = useRouter()
    const toast = useToast()
    const paramTab = searchParams.get("tab")
    const currentTab = paramTab || "transaktioner"

    // State for transactions and UI
    // Use paginated hook
    const {
        transactions,
        isLoading: _isLoading,
        error: fetchError,
        page,
        setPage,
        total,
        pageSize,
        refetch: handleRefresh
    } = useTransactionsPaginated(50) // Default 50 items per page

    const { data: transactionStats } = useCachedQuery<TransactionStats>({
        cacheKey: 'transaction-stats',
        queryFn: () => transactionService.getStats(),
        ttlMs: 2 * 60 * 1000, // 2 min cache
    })

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

    // Handle transaction booking - update the transaction status
    const handleTransactionBooked = useCallback(async (transactionId: string, bookingData: { category: string; debitAccount: string; creditAccount: string; description?: string }) => {
        try {
            const response = await fetch(`/api/transactions/${transactionId}/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            })

            if (!response.ok) throw new Error('Failed to book')

            /* 
            // NOTE: Optimistic updates are handled internally by the hook or we rely on re-fetch
            // But for now, since we don't have a setTransactions exposed from the hook easily for this specific mutation,
            // we will just trigger a refresh or let the hook handle it if we switch to Mutation hook later.
            // For immediate feedback, we can relay on the toast.
             */
            handleRefresh()
            toast.success('Transaktion bokförd', `Bokförd på konto ${bookingData.debitAccount}`)
        } catch (err) {
            console.error(err)
            toast.error('Fel vid bokföring', 'Kunde inte bokföra transaktionen')
        }
    }, [handleRefresh, toast])

    // Feature checks for conditional tabs
    const hasVerifikationer = useFeature('verifikationer')

    // Text mode for Enkel/Avancerad labels
    const { isEnkel } = useTextMode()

    // Filter tabs based on available features AND map to PageTabsLayout format
    const tabs = useMemo(() => {
        return allTabs
            .filter(tab => {
                if (!tab.feature) return true
                if (tab.feature === 'verifikationer') return hasVerifikationer
                return true
            })
            .map(tab => ({
                ...tab,
                label: isEnkel ? tab.labelEnkel : tab.labelAvancerad
            }))
    }, [hasVerifikationer, isEnkel])

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/bokforing?tab=${tab}`, { scroll: false })
    }, [router])

    return (
        <TooltipProvider>
            <div className="flex flex-col min-h-svh">
                {/* Tab Content */}
                <div className="px-4 md:px-6 pt-6">
                    <PageTabsLayout
                        tabs={tabs}
                        currentTab={currentTab}
                        onTabChange={setCurrentTab}
                        lastUpdated={
                            <span>Senaste uppdaterad: {lastRefresh.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</span>
                        }
                    />
                </div>

                <main className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                    <div className="flex gap-6">
                        <div className="flex-1 min-w-0 max-w-6xl space-y-6">
                            {/* Content */}
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
                                            stats={transactionStats ?? undefined}
                                            onTransactionBooked={handleTransactionBooked}
                                            page={page}
                                            pageSize={pageSize}
                                            total={total}
                                            onPageChange={setPage}
                                        />
                                        {/* Sidebar widgets - portals to PageSidebarSlot on xl+ */}
                                        <TransactionsSidebar 
                                            transactions={transactions}
                                            stats={transactionStats ?? undefined}
                                        />
                                    </SectionErrorBoundary>
                                )
                            )}
                            {currentTab === "fakturor" && (
                                <LazyUnifiedInvoicesView />
                            )}
                            {currentTab === "kvitton" && (
                                <LazyReceiptsTable />
                            )}

                            {currentTab === "inventarier" && (
                                <LazyInventarierTable />
                            )}

                            {currentTab === "bokslut" && (
                                <MonthClosing />
                            )}

                            {currentTab === "verifikationer" && (
                                <VerifikationerTable />
                            )}
                        </div>
                        
                        {/* Right sidebar slot for contextual widgets */}
                        <PageSidebarSlot className="hidden xl:block w-80 shrink-0 space-y-4" />
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
