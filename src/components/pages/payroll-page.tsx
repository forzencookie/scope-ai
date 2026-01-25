"use client"

// Payroll page - Löner, Förmåner, Team, Egenavgifter (EF), Delägaruttag (HB/KB)
// Note: AGI moved to Skatt, Utdelning moved to Parter
import { useCallback, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    TooltipProvider
} from "@/components/ui/tooltip"
import { useCompany } from "@/providers/company-provider"
import { Loader2 } from "lucide-react"

// Import constants from payroll components
import { allTabs } from "@/components/loner/constants"
import { useLastUpdated } from "@/hooks/use-last-updated"
import { PageTabsLayout } from "@/components/shared/layout/page-tabs-layout"

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
                {/* Tabs with preload on hover */}
                <div className="px-6 pt-6">
                    <PageTabsLayout
                        tabs={tabs}
                        currentTab={currentTab}
                        onTabChange={setCurrentTab}
                        lastUpdated={lastUpdated}
                    />
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
