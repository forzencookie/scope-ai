"use client"

import { useCallback, Suspense, useMemo, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import type { TransactionWithAI } from "@/types"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbAIBadge,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
    BookOpen,
    Receipt,
    ClipboardCheck,
    FileText,
    List,
    RefreshCw,
    Monitor,
    Plus,
    X,
    Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

import { TRANSACTION_STATUS_LABELS } from "@/lib/localization"
import { transactionService, type TransactionStats } from "@/lib/services/transaction-service"

import { useFeature } from "@/providers/company-provider"
import {
    LazyTransactionsTable,
    LazyReceiptsTable,
    LazyInventarierTable,
    LazyUnifiedInvoicesView,
} from "@/components/shared"
import { useTextMode } from "@/providers/text-mode-provider"

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
        id: "inventarier",
        labelEnkel: "Inventarier",
        color: "bg-indigo-500",
        feature: null,
    },
]

// ============ MAIN PAGE COMPONENT ============
function AccountingPageContent() {
    // ... no changes to hooks ...
    const searchParams = useSearchParams()
    const router = useRouter()
    const toast = useToast()
    const paramTab = searchParams.get("tab")
    // Handle legacy/alternate URL mapping: 'verifikationer' -> 'transaktioner'
    const currentTab = (paramTab === "verifikationer" ? "transaktioner" : paramTab) || "transaktioner"

    // State for transactions and UI
    const [apiTransactions, setApiTransactions] = useState<TransactionWithAI[]>([])
    const [transactionStats, setTransactionStats] = useState<TransactionStats | undefined>()
    const [isLoading, setIsLoading] = useState(true)
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
    const [showAllTabs, setShowAllTabs] = useState(false)

    const fetchTransactions = async () => {
        try {
            // Fetch stats and list in parallel using the service
            const [listData, statsData] = await Promise.all([
                transactionService.getTransactions({ limit: 50 }),
                transactionService.getStats()
            ])

            setApiTransactions(listData.transactions as TransactionWithAI[])
            setTransactionStats(statsData)
        } catch (error) {
            console.error('Failed to fetch transactions:', error)
        } finally {
            setIsLoading(false)
            setLastRefresh(new Date())
        }
    }

    // Initial fetch
    useEffect(() => {
        fetchTransactions()
    }, [])

    // Auto-refresh every 5 seconds when on transactions tab
    useEffect(() => {
        if (currentTab !== "transaktioner") return
    }, [currentTab])

    // Manual refresh function
    const handleRefresh = () => {
        setIsLoading(true)
        fetchTransactions()
    }

    // Use only API transactions (no mock data)
    const transactions = apiTransactions

    // Handle transaction booking - update the transaction status
    const handleTransactionBooked = useCallback(async (transactionId: string, bookingData: { category: string; debitAccount: string; creditAccount: string; description?: string }) => {
        try {
            const response = await fetch(`/api/transactions/${transactionId}/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            })

            if (!response.ok) throw new Error('Failed to book')

            setApiTransactions(prev =>
                prev.map(t =>
                    t.id === transactionId
                        ? {
                            ...t,
                            status: TRANSACTION_STATUS_LABELS.RECORDED,
                            category: bookingData.category,
                            account: `${bookingData.debitAccount} / ${bookingData.creditAccount}`,
                        }
                        : t
                )
            )
            toast.success('Transaktion bokförd', `Bokförd på konto ${bookingData.debitAccount}`)
        } catch (err) {
            console.error(err)
            toast.error('Fel vid bokföring', 'Kunde inte bokföra transaktionen')
        }
    }, [toast])

    // Feature checks for conditional tabs
    const hasVerifikationer = useFeature('verifikationer')

    // Text mode for Enkel/Avancerad labels
    const { isEnkel } = useTextMode()

    // Filter tabs based on available features
    const tabs = useMemo(() => {
        return allTabs.filter(tab => {
            if (!tab.feature) return true
            if (tab.feature === 'verifikationer') return hasVerifikationer
            return true
        })
    }, [hasVerifikationer])

    // Helper to get the correct label based on mode
    const getTabLabel = (tab: typeof allTabs[0]) => {
        return isEnkel ? tab.labelEnkel : tab.labelAvancerad
    }

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/bokforing?tab=${tab}`, { scroll: false })
    }, [router])

    // Get current tab label for breadcrumb
    const currentTabData = tabs.find(t => t.id === currentTab)
    const currentTabLabel = currentTabData ? getTabLabel(currentTabData) : (isEnkel ? "Pengar in & ut" : "Transaktioner")

    return (
        <TooltipProvider>
            <div className="flex flex-col min-h-svh">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard/bokforing" className="flex items-center gap-2">
                                        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        {isEnkel ? "Min bokföring" : "Bokföring"}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{currentTabLabel}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <BreadcrumbAIBadge />
                </header>

                {/* Tab Content */}
                <div className="px-6 pt-4">
                    <div className="w-full">
                        {/* Tabs - Show max 4 visible (since we reduced count), rest in overflow */}
                        <div className="flex items-center gap-1 pb-2 mb-4 border-b-2 border-border/60">
                            {tabs.slice(0, 4).map((tab) => {
                                const isActive = currentTab === tab.id


                                return (
                                    <Tooltip key={tab.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setCurrentTab(tab.id)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                <div className={cn("h-2 w-2 rounded-full", tab.color)} />
                                                {isActive && <span>{getTabLabel(tab)}</span>}
                                            </button>
                                        </TooltipTrigger>
                                        {!isActive && (
                                            <TooltipContent side="bottom">
                                                <p>{getTabLabel(tab)}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                )
                            })}

                            {/* Overflow tabs - toggle expand */}
                            {tabs.length > 4 && !showAllTabs && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setShowAllTabs(true)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p>Visa fler ({tabs.length - 4})</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {/* Expanded tabs (5+) */}
                            {showAllTabs && tabs.slice(4).map((tab) => {
                                const isActive = currentTab === tab.id


                                return (
                                    <Tooltip key={tab.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setCurrentTab(tab.id)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                <div className={cn("h-2 w-2 rounded-full", tab.color)} />
                                                {isActive && <span>{getTabLabel(tab)}</span>}
                                            </button>
                                        </TooltipTrigger>
                                        {!isActive && (
                                            <TooltipContent side="bottom">
                                                <p>{getTabLabel(tab)}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                )
                            })}

                            {/* Collapse button when expanded */}
                            {showAllTabs && tabs.length > 4 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setShowAllTabs(false)}
                                            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p>Dölj</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {/* Last updated with refresh button */}
                            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                                <span>
                                    Senast uppdaterad: {lastRefresh.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={isLoading}
                                    className="h-7 w-7 p-0"
                                >
                                    <RefreshCw className={cn(
                                        "h-3.5 w-3.5",
                                        isLoading && "animate-spin"
                                    )} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="flex-1 flex flex-col p-6">
                    <div className="max-w-6xl w-full space-y-6">
                        {/* Content */}
                        {currentTab === "transaktioner" && (
                            <LazyTransactionsTable
                                title="Transaktioner"
                                transactions={transactions}
                                stats={transactionStats}
                                onTransactionBooked={handleTransactionBooked}
                            />
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
