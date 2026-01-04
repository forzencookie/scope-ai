"use client"

import { useCallback, Suspense } from "react"
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
import {
    FileBarChart,
    FileText,
    Send,
    Calculator,
    PieChart,
    TrendingUp,
    Scale,
    Origami,
    Loader2,
} from "lucide-react"
import { useCompany } from "@/providers/company-provider"
import type { FeatureKey } from "@/lib/company-types"
import { useLastUpdated } from "@/hooks/use-last-updated"

// Lazy loaded tab content components
import {
    LazyResultatrakning,
    LazyBalansrakning,
} from "@/components/shared"

// Tab configuration with feature keys for filtering
const tabs: Array<{ id: string; label: string; color: string; feature: FeatureKey }> = [
    { id: "resultatrakning", label: "Resultaträkning", color: "bg-green-500", feature: "arsredovisning" },
    { id: "balansrakning", label: "Balansräkning", color: "bg-blue-500", feature: "arsredovisning" },
]

function ReportsPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { hasFeature } = useCompany()
    const lastUpdated = useLastUpdated()

    // Filter tabs based on company type features
    const availableTabs = tabs.filter(tab => hasFeature(tab.feature))

    const currentTab = searchParams.get("tab") || availableTabs[0]?.id || "arsredovisning"

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/rapporter?tab=${tab}`, { scroll: false })
    }, [router])

    return (
        <TooltipProvider delayDuration={400}>
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
                                    <BreadcrumbPage className="flex items-center gap-2">
                                        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                                            <Origami className="h-4 w-4" />
                                        </div>
                                        Rapporter
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
                    {currentTab === "resultatrakning" && <LazyResultatrakning />}
                    {currentTab === "balansrakning" && <LazyBalansrakning />}

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
