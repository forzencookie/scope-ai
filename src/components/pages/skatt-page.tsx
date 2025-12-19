"use client"

import { useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
    Calculator,
    FileText,
    Send,
    FileBarChart,
} from "lucide-react"
import { useCompany } from "@/providers/company-provider"
import type { FeatureKey } from "@/lib/company-types"
import { useLastUpdated } from "@/hooks/use-last-updated"

// Import tab content components
import {
    MomsdeklarationContent,
    InkomstdeklarationContent,
    ArsredovisningContent,
    ArsbokslutContent,
} from "@/components/skatt"

// Tab configuration with feature keys for filtering
const tabs: Array<{ id: string; label: string; icon: typeof Calculator; feature: FeatureKey }> = [
    { id: "momsdeklaration", label: "Momsdeklaration", icon: Calculator, feature: "momsdeklaration" },
    { id: "inkomstdeklaration", label: "Inkomstdeklaration", icon: Send, feature: "inkomstdeklaration" },
    { id: "arsredovisning", label: "Årsredovisning", icon: FileBarChart, feature: "arsredovisning" },
    { id: "arsbokslut", label: "Årsbokslut", icon: FileText, feature: "arsbokslut" },
]

function SkattPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { hasFeature } = useCompany()
    const lastUpdated = useLastUpdated()

    // Filter tabs based on company type features
    const availableTabs = tabs.filter(tab => hasFeature(tab.feature))

    const currentTab = searchParams.get("tab") || availableTabs[0]?.id || "momsdeklaration"

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/sok/skatt?tab=${tab}`, { scroll: false })
    }, [router])

    return (
        <TooltipProvider delayDuration={400}>
            <div className="flex flex-col min-h-svh">
                {/* Page Heading */}
                <div className="px-6 pt-6">
                    <div className="max-w-6xl w-full">
                        <h2 className="text-xl font-semibold">Skatt & Deklarationer</h2>
                        <p className="text-sm text-muted-foreground">Hantera momsdeklarationer, inkomstdeklaration och bokslut.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4">
                    <div className="max-w-6xl w-full">
                        <div className="flex items-center gap-1 pb-2 mb-4 border-b-2 border-border/60">
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

function SkattPageLoading() {
    return (
        <div className="flex items-center justify-center h-svh">
            <div className="animate-pulse text-muted-foreground">Laddar...</div>
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
