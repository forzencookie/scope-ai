"use client"

import { useCallback, Suspense } from "react"
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
} from "lucide-react"

import { mockTransactions } from "@/data/transactions"
import { 
    LazyTransactionsTable, 
    LazyReceiptsTable, 
    LazyInvoicesTable, 
    LazyVerifikationerTable 
} from "@/components/lazy-modules"

// Tab configuration
const tabs = [
    {
        id: "transaktioner",
        label: "Transaktioner",
        icon: BookOpen,
    },
    {
        id: "underlag",
        label: "Fakturor & Kvitton",
        icon: Receipt,
    },
    {
        id: "verifikationer",
        label: "Verifikationer",
        icon: ClipboardCheck,
    },
]


// ============ MAIN PAGE COMPONENT ============
function AccountingPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const currentTab = searchParams.get("tab") || "transaktioner"

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/accounting?tab=${tab}`, { scroll: false })
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
                                    <BreadcrumbLink href="/accounting">Bokföring</BreadcrumbLink>
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
                        <div className="flex items-center gap-1 pb-2 mb-6 border-b border-border/20">
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
                        {currentTab === "underlag" && (
                            <div className="space-y-8">
                                <LazyReceiptsTable />
                                <LazyInvoicesTable />
                            </div>
                        )}
                        {currentTab === "verifikationer" && (
                            <div className="space-y-4">
                                <LazyVerifikationerTable />
                            </div>
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
