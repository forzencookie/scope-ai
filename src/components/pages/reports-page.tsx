"use client"

import { useCallback, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    TooltipProvider
} from "@/components/ui/tooltip"
import {
    Loader2,
} from "lucide-react"
import { useCompany } from "@/providers/company-provider"
import type { FeatureKey } from "@/lib/company-types"
import { useLastUpdated } from "@/hooks/use-last-updated"
import { PageTabsLayout } from "@/components/shared/layout/page-tabs-layout"

// Lazy loaded tab content components
import {
    LazyResultatrakning,
    LazyBalansrakning,
    LazyMomsdeklaration,
    LazyInkomstdeklaration,
    LazyArsredovisning,
    LazyArsbokslut,
    LazyK10,
    LazyAGI,
} from "@/components/shared"

// Tab configuration with feature keys for filtering
const allTabs: Array<{ id: string; label: string; color: string; feature: FeatureKey }> = [
    { id: "resultatrakning", label: "Resultaträkning", color: "bg-emerald-500", feature: "resultatrakning" },
    { id: "balansrakning", label: "Balansräkning", color: "bg-blue-500", feature: "balansrakning" },
    { id: "momsdeklaration", label: "Momsdeklaration", color: "bg-purple-500", feature: "momsdeklaration" },
    { id: "inkomstdeklaration", label: "Inkomstdeklaration", color: "bg-amber-500", feature: "inkomstdeklaration" },
    { id: "agi", label: "AGI", color: "bg-emerald-500", feature: "agi" },
    { id: "arsredovisning", label: "Årsredovisning", color: "bg-indigo-500", feature: "arsredovisning" },
    { id: "arsbokslut", label: "Årsbokslut", color: "bg-indigo-400", feature: "arsbokslut" },
    { id: "k10", label: "K10", color: "bg-purple-400", feature: "k10" },
];

function ReportsPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { hasFeature } = useCompany()
    const lastUpdated = useLastUpdated()

    // Filter tabs based on company type features
    const availableTabs = useMemo(() => {
        return allTabs.filter(tab => hasFeature(tab.feature))
    }, [hasFeature])

    const tabParam = searchParams.get("tab")

    // Default to first available tab
    const currentTab = useMemo(() => {
        if (!tabParam) return availableTabs[0]?.id || "resultatrakning"
        const isValid = availableTabs.some(t => t.id === tabParam)
        return isValid ? tabParam : (availableTabs[0]?.id || "resultatrakning")
    }, [tabParam, availableTabs])

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/rapporter?tab=${tab}`, { scroll: false })
    }, [router])



    return (
        <TooltipProvider delayDuration={400}>
            <div className="flex flex-col min-h-svh">
                {/* Tabs */}
                <div className="px-6 pt-6">
                    <PageTabsLayout
                        tabs={availableTabs}
                        currentTab={currentTab}
                        onTabChange={setCurrentTab}
                        lastUpdated={lastUpdated}
                    />
                </div>

                {/* Tab Content */}
                <div className="bg-background px-6">
                    {currentTab === "resultatrakning" && <LazyResultatrakning />}
                    {currentTab === "balansrakning" && <LazyBalansrakning />}
                    {currentTab === "momsdeklaration" && <LazyMomsdeklaration />}
                    {currentTab === "k10" && <LazyK10 />}
                    {currentTab === "inkomstdeklaration" && <LazyInkomstdeklaration />}
                    {currentTab === "agi" && <LazyAGI />}
                    {currentTab === "arsredovisning" && <LazyArsredovisning />}
                    {currentTab === "arsbokslut" && <LazyArsbokslut />}
                </div>
            </div>
        </TooltipProvider>
    )
}

function ReportsPageLoading() {
    return (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Laddar rapporter...
        </div>
    )
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<ReportsPageLoading />}>
            <ReportsPageContent />
        </Suspense>
    )
}
