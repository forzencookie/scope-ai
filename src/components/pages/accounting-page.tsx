"use client"

import { useCallback, Suspense, useMemo, useEffect, useState, useRef } from "react"
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
    Building2,
    List,
    RefreshCw,
    Monitor,
    Plus,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

import { TRANSACTION_STATUS_LABELS } from "@/lib/localization"

import {
    LazyTransactionsTable,
    LazyReceiptsTable,
    LazyVerifikationerTable
} from "@/components/shared"
import { useFeature } from "@/providers/company-provider"
import { SupplierInvoicesKanban, type SupplierInvoicesKanbanRef } from "@/components/expenses"
import { Huvudbok } from "@/components/accounting"
import { InventarierTable } from "@/components/assets"
import { InvoicesKanban } from "@/components/revenue"
import { useTextMode } from "@/providers/text-mode-provider"

// Tab configuration with feature requirements and translations
const allTabs = [
    {
        id: "transaktioner",
        labelEnkel: "Pengar in & ut",
        labelAvancerad: "Transaktioner",
        icon: BookOpen,
        feature: null, // Available to all
    },
    {
        id: "kundfakturor",
        labelEnkel: "Skicka fakturor",
        labelAvancerad: "Kundfakturor",
        icon: FileText,
        feature: null, // Available to all
    },
    {
        id: "leverantorsfakturor",
        labelEnkel: "Fakturor att betala",
        labelAvancerad: "Leverantörsfakturor",
        icon: Building2,
        feature: 'leverantorsfakturor' as const,
    },
    {
        id: "kvitton",
        labelEnkel: "Kvitton & underlag",
        labelAvancerad: "Kvitton",
        icon: Receipt,
        feature: null, // Available to all
    },
    {
        id: "verifikationer",
        labelEnkel: "Alla bokningar",
        labelAvancerad: "Verifikationer",
        icon: ClipboardCheck,
        feature: 'verifikationer' as const, // Part of proper bookkeeping
    },
    {
        id: "inventarier",
        labelEnkel: "Inventarier",
        labelAvancerad: "Anläggningsregister",
        icon: Monitor,
        feature: null,
    },
    {
        id: "huvudbok",
        labelEnkel: "Kontoöversikt",
        labelAvancerad: "Huvudbok",
        icon: List,
        feature: null, // Available to all - general ledger view
    },
]


// ============ MAIN PAGE COMPONENT ============
function AccountingPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const toast = useToast()
    const currentTab = searchParams.get("tab") || "transaktioner"

    // Ref for supplier invoices table
    const supplierInvoicesRef = useRef<SupplierInvoicesKanbanRef>(null)

    // Fetch PROCESSED transactions from API
    const [apiTransactions, setApiTransactions] = useState<TransactionWithAI[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
    const [showAllTabs, setShowAllTabs] = useState(false)

    const fetchTransactions = async () => {
        try {
            // Use the processed endpoint which clothes naked transactions
            const response = await fetch('/api/transactions/processed', {
                cache: 'no-store',
            })
            const data = await response.json()

            if (data.transactions && data.transactions.length > 0) {
                // Transactions are already processed with correct properties
                setApiTransactions(data.transactions)
            } else {
                setApiTransactions([])
            }
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

        // const interval = setInterval(() => {
        //     fetchTransactions()
        // }, 5000)

        // return () => clearInterval(interval)
    }, [currentTab])

    // Manual refresh function
    const handleRefresh = () => {
        setIsLoading(true)
        if (currentTab === "leverantorsfakturor") {
            // Refresh supplier invoices table
            supplierInvoicesRef.current?.refresh()
            setIsLoading(false)
            setLastRefresh(new Date())
        } else {
            // Refresh transactions (default)
            fetchTransactions()
        }
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
    const hasLeverantorsfakturor = useFeature('leverantorsfakturor')
    const hasVerifikationer = useFeature('verifikationer')

    // Text mode for Enkel/Avancerad labels
    const { isEnkel } = useTextMode()

    // Filter tabs based on available features
    const tabs = useMemo(() => {
        return allTabs.filter(tab => {
            if (!tab.feature) return true
            if (tab.feature === 'leverantorsfakturor') return hasLeverantorsfakturor
            if (tab.feature === 'verifikationer') return hasVerifikationer
            return true
        })
    }, [hasLeverantorsfakturor, hasVerifikationer])

    // Helper to get the correct label based on mode
    const getTabLabel = (tab: typeof allTabs[0]) => {
        return isEnkel ? tab.labelEnkel : tab.labelAvancerad
    }

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/sok/bokforing?tab=${tab}`, { scroll: false })
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
                                    <BreadcrumbLink href="/dashboard/sok/bokforing">{isEnkel ? "Min bokföring" : "Bokföring"}</BreadcrumbLink>
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
                <div className="bg-background p-6">
                    <div className="max-w-6xl w-full">
                        {/* Tabs - Show max 3 visible, rest in overflow */}
                        <div className="flex items-center gap-1 pb-2 mb-6 border-b-2 border-border/60">
                            {tabs.slice(0, 3).map((tab) => {
                                const isActive = currentTab === tab.id
                                const Icon = tab.icon

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
                                                <Icon className="h-4 w-4" />
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
                            {tabs.length > 3 && !showAllTabs && (
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
                                        <p>Visa fler ({tabs.length - 3})</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {/* Expanded tabs (4+) */}
                            {showAllTabs && tabs.slice(3).map((tab) => {
                                const isActive = currentTab === tab.id
                                const Icon = tab.icon

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
                                                <Icon className="h-4 w-4" />
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
                            {showAllTabs && tabs.length > 3 && (
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

                        {/* Content */}
                        {currentTab === "transaktioner" && (
                            <LazyTransactionsTable
                                title="Transaktioner"
                                transactions={transactions}
                                onTransactionBooked={handleTransactionBooked}
                            />
                        )}
                        {currentTab === "kundfakturor" && (
                            <InvoicesKanban />
                        )}
                        {currentTab === "leverantorsfakturor" && (
                            <SupplierInvoicesKanban ref={supplierInvoicesRef} />
                        )}
                        {currentTab === "kvitton" && (
                            <LazyReceiptsTable />
                        )}
                        {currentTab === "verifikationer" && (
                            <div className="space-y-4">
                                <LazyVerifikationerTable />
                            </div>
                        )}
                        {currentTab === "huvudbok" && (
                            <Huvudbok />
                        )}
                        {currentTab === "inventarier" && (
                            <InventarierTable />
                        )}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}

// Loading fallback for Suspense
function AccountingPageLoading() {
    return (
        <div className="flex items-center justify-center h-svh">
            <div className="animate-pulse text-muted-foreground">Laddar...</div>
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
