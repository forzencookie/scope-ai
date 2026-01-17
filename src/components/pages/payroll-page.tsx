"use client"

// Payroll page - Löner, Förmåner, Team, Egenavgifter (EF), Delägaruttag (HB/KB)
// Note: AGI moved to Skatt, Utdelning moved to Parter
import { useCallback, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,

} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useCompany } from "@/providers/company-provider"
import { PiggyBank, Loader2 } from "lucide-react"

// Import constants from payroll components
import { allTabs } from "@/components/loner/constants"
import { useLastUpdated } from "@/hooks/use-last-updated"

// Lazy loaded tab components
import {
    LazyLonebesked,
    LazyTeamTab,
    LazyBenefitsTab,
    LazyEgenavgifter,
    LazyDelagaruttag,
} from "@/components/shared"

function PayrollPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { hasFeature } = useCompany()
    const lastUpdated = useLastUpdated()

    // Filter tabs based on available features for the current company type
    const tabs = useMemo(() => {
        return allTabs.filter(tab => {
            if (!tab.feature) return true
            return hasFeature(tab.feature)
        })
    }, [hasFeature])

    // Default to first available tab if current tab is not available
    const currentTab = useMemo(() => {
        const requestedTab = searchParams.get("tab") || "lonebesked"
        const isTabAvailable = tabs.some(t => t.id === requestedTab)
        return isTabAvailable ? requestedTab : (tabs[0]?.id || "lonebesked")
    }, [searchParams, tabs])

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/loner?tab=${tab}`, { scroll: false })
    }, [router])

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
                                    <BreadcrumbPage>
                                        Löner
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                </header>

                {/* Tabs with preload on hover */}
                <div className="px-6 pt-4">
                    <div className="w-full">
                        <div className="flex items-center gap-1 pb-2 mb-4 border-b-2 border-border/60">
                            {tabs.map((tab) => {
                                const isActive = currentTab === tab.id

                                return (
                                    <Tooltip key={tab.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setCurrentTab(tab.id)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                                    isActive
                                                        ? "bg-primary/5 text-primary"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                <div className={cn("h-2 w-2 rounded-full", tab.color)} />
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

                            <div className="ml-auto text-sm text-muted-foreground">
                                {lastUpdated}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-background">
                    {currentTab === "lonebesked" && <LazyLonebesked />}
                    {currentTab === "team" && <LazyTeamTab />}
                    {currentTab === "benefits" && <LazyBenefitsTab />}
                    {currentTab === "egenavgifter" && (
                        <div className="px-4 pb-4 w-full">
                            <LazyEgenavgifter />
                        </div>
                    )}
                    {currentTab === "delagaruttag" && (
                        <div className="px-4 pb-4 w-full">
                            <LazyDelagaruttag />
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
}

function PayrollPageLoading() {
    return (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Laddar löner...
        </div>
    )
}

export default function PayrollPage() {
    return (
        <Suspense fallback={<PayrollPageLoading />}>
            <PayrollPageContent />
        </Suspense>
    )
}
