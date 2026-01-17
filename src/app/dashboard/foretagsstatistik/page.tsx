"use client"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,

} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    LayoutDashboard,
    ArrowLeftRight,
    TrendingDown,
} from "lucide-react"

// Import extracted tab components
import { EkonomiskOversikt } from "@/components/foretagsstatistik/oversikt"
import { Transaktionsrapport } from "@/components/foretagsstatistik/transaktionsrapport"
import { Kostnadsanalys } from "@/components/foretagsstatistik/kostnadsanalys"
import { useSearchParams, useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export default function CompanyStatisticsPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const currentTab = searchParams.get("tab") || "overview"

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/foretagsstatistik?tab=${tab}`, { scroll: false })
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
                                    <BreadcrumbPage>Företagsstatistik</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                </header>

                <main className="p-6">
                    <div className="max-w-6xl w-full">
                        {/* Tabs */}
                        <div className="px-6 pt-4">
                            <div className="w-full">
                                <div className="flex items-center gap-1 pb-2 mb-4 border-b-2 border-border/60 overflow-x-auto scrollbar-hide">
                                    {[
                                        { id: 'overview', label: 'Översikt', color: 'bg-emerald-500' },
                                        { id: 'transactions', label: 'Transaktioner & Fakturor', color: 'bg-blue-500' },
                                        { id: 'expenses', label: 'Kostnader', color: 'bg-amber-500' },
                                    ].map((tab) => {
                                        const isActive = currentTab === tab.id

                                        return (
                                            <Tooltip key={tab.id}>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={() => setCurrentTab(tab.id)}
                                                        className={cn(
                                                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                                            isActive
                                                                ? "text-primary"
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
                                </div>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="bg-background">
                            {currentTab === "overview" && <EkonomiskOversikt />}
                            {currentTab === "transactions" && <Transaktionsrapport />}
                            {currentTab === "expenses" && <Kostnadsanalys />}
                        </div>
                    </div>
                </main>
            </div>
        </TooltipProvider>
    )
}
