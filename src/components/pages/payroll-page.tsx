"use client"

// Payroll page - Löner, AGI, Utdelning, Egenavgifter (EF), Delägaruttag (HB/KB)
// Optimized: Tab content components lazy loaded from src/components/payroll/
import { useCallback, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbAIBadge,
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

// Import constants from payroll components
import { allTabs } from "@/components/payroll/constants"
import { useLastUpdated } from "@/hooks/use-last-updated"

// Lazy loaded tab components
import {
    LazyLonesbeskContent,
    LazyAGIContent,
    LazyUtdelningContent,
    preloadPayrollTab
} from "@/components/shared"

// External components for EF/HB/KB tabs
import { Egenavgifter as EgenavgifterCalculator, Delagaruttag as DelagaruttagManager } from "@/components/parter"
import { TeamTab } from "@/components/payroll/team-tab"
import { BenefitsTab } from "@/components/payroll/benefits-tab"

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
        router.push(`/dashboard/sok/loner?tab=${tab}`, { scroll: false })
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
                                    <BreadcrumbPage>Löner</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <BreadcrumbAIBadge />
                </header>

                {/* Tabs with preload on hover */}
                <div className="px-6 pt-4">
                    <div className="max-w-6xl w-full">
                        <div className="flex items-center gap-1 pb-2 mb-4 border-b-2 border-border/60">
                            {tabs.map((tab) => {
                                const isActive = currentTab === tab.id
                                const Icon = tab.icon

                                return (
                                    <Tooltip key={tab.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setCurrentTab(tab.id)}
                                                onMouseEnter={() => preloadPayrollTab(tab.id)}
                                                onFocus={() => preloadPayrollTab(tab.id)}
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

                            <div className="ml-auto text-sm text-muted-foreground">
                                {lastUpdated}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Content - Lazy loaded */}
                <div className="bg-background">
                    {currentTab === "lonebesked" && <LazyLonesbeskContent />}
                    {currentTab === "team" && <TeamTab />}
                    {currentTab === "benefits" && <BenefitsTab />}
                    {currentTab === "agi" && <LazyAGIContent />}
                    {currentTab === "utdelning" && <LazyUtdelningContent />}
                    {currentTab === "egenavgifter" && (
                        <div className="px-6 pb-6 max-w-6xl">
                            <EgenavgifterCalculator />
                        </div>
                    )}
                    {currentTab === "delagaruttag" && (
                        <div className="px-6 pb-6 max-w-6xl">
                            <DelagaruttagManager />
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
}

function PayrollPageLoading() {
    return (
        <div className="flex items-center justify-center h-svh">
            <div className="animate-pulse text-muted-foreground">Laddar...</div>
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
