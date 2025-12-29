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
} from "lucide-react"
import { useCompany } from "@/providers/company-provider"
import type { FeatureKey } from "@/lib/company-types"
import { useLastUpdated } from "@/hooks/use-last-updated"

// Import extracted tab content components
import {
    MomsdeklarationContent,
    InkomstdeklarationContent,
    ArsredovisningContent,
    ArsbokslutContent,
} from "@/components/skatt"

// Tab configuration with feature keys for filtering
const tabs: Array<{ id: string; label: string; icon: typeof Calculator | typeof FileBarChart | typeof FileText | typeof Send; feature: FeatureKey }> = [
    { id: "arsredovisning", label: "Årsredovisning", icon: FileBarChart, feature: "arsredovisning" },
    { id: "arsbokslut", label: "Årsbokslut", icon: FileText, feature: "arsbokslut" },
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
        router.push(`/dashboard/sok/rapporter?tab=${tab}`, { scroll: false })
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
                                    <BreadcrumbPage>Rapporter</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <BreadcrumbAIBadge />
                </header>

                {/* Tabs */}
                <div className="px-4 pt-4">
                    <div className="w-full">
                        <div className="flex items-center gap-1 pb-2 mb-4 border-b-2 border-border/60 -ml-1">
                            {availableTabs.map((tab) => {
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

                            <div className="ml-auto text-sm text-muted-foreground">
                                {lastUpdated}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-background">
                    {currentTab === "momsdeklaration" && <MomsdeklarationContent />}
                    {currentTab === "inkomstdeklaration" && <InkomstdeklarationContent />}
                    {currentTab === "arsredovisning" && <ArsredovisningContent />}
                    {currentTab === "arsbokslut" && <ArsbokslutContent />}
                </div>
            </div>
        </TooltipProvider>
    )
}

function ReportsPageLoading() {
    return (
        <div className="flex items-center justify-center h-svh">
            <div className="animate-pulse text-muted-foreground">Laddar...</div>
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
