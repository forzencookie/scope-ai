"use client"

import { useCallback, Suspense } from "react"
import { useSearchParams, useRouter, notFound } from "next/navigation"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbAIBadge,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import {
    Calculator,
    FileText,
    Send,
    FileBarChart,
    Loader2,
} from "lucide-react"
import { useCompany } from "@/providers/company-provider"
import type { FeatureKey } from "@/lib/company-types"
import { useLastUpdated } from "@/hooks/use-last-updated"

// Lazy loaded tab content components
import {
    LazyMomsdeklaration,
    LazyInkomstdeklaration,
    LazyArsredovisning,
    LazyArsbokslut,
    LazyK10,
    LazyAGI,
} from "@/components/shared"

// Tab configuration with feature keys for filtering
const tabs: Array<{ id: string; label: string; color: string; feature: FeatureKey }> = [
    { id: "momsdeklaration", label: "Momsdeklaration", color: "bg-purple-500", feature: "momsdeklaration" },
    { id: "inkomstdeklaration", label: "Inkomstdeklaration", color: "bg-amber-500", feature: "inkomstdeklaration" },
    { id: "agi", label: "AGI", color: "bg-emerald-500", feature: "agi" },
    { id: "arsredovisning", label: "Årsredovisning", color: "bg-blue-500", feature: "arsredovisning" },
    { id: "arsbokslut", label: "Årsbokslut", color: "bg-indigo-500", feature: "arsbokslut" },
    { id: "k10", label: "K10", color: "bg-purple-100 text-purple-700", feature: "k10" },
];

function SkattPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { hasFeature } = useCompany()
    const lastUpdated = useLastUpdated()

    // Filter tabs based on company type features
    const availableTabs = tabs.filter(tab => hasFeature(tab.feature))

    const tabParam = searchParams.get("tab")

    // If a specific tab is requested but not valid/available, 404
    if (tabParam && !availableTabs.find(t => t.id === tabParam)) {
        notFound()
    }

    const currentTab = tabParam || availableTabs[0]?.id || "momsdeklaration"

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/skatt?tab=${tab}`, { scroll: false })
    }, [router])

    return (
        <TooltipProvider delayDuration={400}>
            <div className="flex flex-col min-h-svh">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="flex items-center gap-2">
                                        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                                            <Calculator className="h-4 w-4" />
                                        </div>
                                        Skatt
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <BreadcrumbAIBadge />
                </header>

                {/* Tabs */}
                <div className="px-6 pt-4">
                    <div className="w-full">
                        <div className="flex items-center gap-1 pb-2 mb-4 border-b-2 border-border/60">
                            {availableTabs.map((tab) => {
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

function SkattPageLoading() {
    return (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Laddar skatt & deklarationer...
        </div>
    )
}

export default function SkattPage() {
    return (
        <Suspense fallback={<SkattPageLoading />}>
            <SkattPageContent />
        </Suspense>
    )
}
