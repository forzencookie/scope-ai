"use client"

import { useCallback, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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
} from "lucide-react"

import { mockTransactions } from "@/data/transactions"
import { 
    LazyTransactionsTable, 
    LazyReceiptsTable, 
    LazyInvoicesTable, 
    LazyVerifikationerTable 
} from "@/components/lazy-modules"
import { useFeature } from "@/providers/company-provider"
import { LeverantorsfakturorTable } from "@/components/leverantorsfakturor-table"
import { Huvudbok } from "@/components/huvudbok"

// Tab configuration with feature requirements
const allTabs = [
    {
        id: "transaktioner",
        label: "Transaktioner",
        icon: BookOpen,
        feature: null, // Available to all
    },
    {
        id: "kundfakturor",
        label: "Kundfakturor",
        icon: FileText,
        feature: null, // Available to all
    },
    {
        id: "leverantorsfakturor",
        label: "Leverantörsfakturor",
        icon: Building2,
        feature: 'leverantorsfakturor' as const,
    },
    {
        id: "kvitton",
        label: "Kvitton",
        icon: Receipt,
        feature: null, // Available to all
    },
    {
        id: "verifikationer",
        label: "Verifikationer",
        icon: ClipboardCheck,
        feature: 'verifikationer' as const, // Part of proper bookkeeping
    },
    {
        id: "huvudbok",
        label: "Huvudbok",
        icon: List,
        feature: null, // Available to all - general ledger view
    },
]


// ============ MAIN PAGE COMPONENT ============
function AccountingPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const currentTab = searchParams.get("tab") || "transaktioner"

    // Feature checks for conditional tabs
    const hasLeverantorsfakturor = useFeature('leverantorsfakturor')
    const hasVerifikationer = useFeature('verifikationer')

    // Filter tabs based on available features
    const tabs = useMemo(() => {
        return allTabs.filter(tab => {
            if (!tab.feature) return true
            if (tab.feature === 'leverantorsfakturor') return hasLeverantorsfakturor
            if (tab.feature === 'verifikationer') return hasVerifikationer
            return true
        })
    }, [hasLeverantorsfakturor, hasVerifikationer])

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/accounting?tab=${tab}`, { scroll: false })
    }, [router])

    // Get current tab label for breadcrumb
    const currentTabLabel = tabs.find(t => t.id === currentTab)?.label || "Transaktioner"

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
                                    <BreadcrumbLink href="/dashboard/accounting">Bokföring</BreadcrumbLink>
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
                        {/* Tabs */}
                        <div className="flex items-center gap-1 pb-2 mb-6 border-b-2 border-border/60">
                            {tabs.map((tab) => {
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
                                                {isActive && <span>{tab.label}</span>}
                                            </button>
                                        </TooltipTrigger>
                                        {!isActive && (
                                            <TooltipContent side="bottom">
                                                <p>{tab.label}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                )
                            })}
                        </div>

                        {/* Content */}
                        {currentTab === "transaktioner" && (
                            <LazyTransactionsTable 
                                title="Transaktioner" 
                                transactions={mockTransactions} 
                            />
                        )}
                        {currentTab === "kundfakturor" && (
                            <LazyInvoicesTable />
                        )}
                        {currentTab === "leverantorsfakturor" && (
                            <LeverantorsfakturorTable />
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
