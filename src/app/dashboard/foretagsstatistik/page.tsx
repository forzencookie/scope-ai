"use client"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbAIBadge,
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
import {
    OverviewTab,
    TransactionsTab,
    ExpensesTab,
} from "@/components/statistics"

export default function CompanyStatisticsPage() {
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
                    <BreadcrumbAIBadge />
                </header>

                <main className="p-6">
                    <div className="max-w-6xl w-full">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="bg-transparent rounded-none h-auto p-0 mb-6 flex gap-2 border-b-2 border-border/60 pb-2 w-full justify-start">
                                <TabsTrigger 
                                    value="overview" 
                                    className="gap-2 data-[state=active]:bg-secondary data-[state=active]:shadow-none rounded-md px-3 py-1.5 text-sm font-medium"
                                >
                                    <LayoutDashboard className="h-3.5 w-3.5" />
                                    Översikt
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="transactions" 
                                    className="gap-2 data-[state=active]:bg-secondary data-[state=active]:shadow-none rounded-md px-3 py-1.5 text-sm font-medium"
                                >
                                    <ArrowLeftRight className="h-3.5 w-3.5" />
                                    Transaktioner & Fakturor
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="expenses" 
                                    className="gap-2 data-[state=active]:bg-secondary data-[state=active]:shadow-none rounded-md px-3 py-1.5 text-sm font-medium"
                                >
                                    <TrendingDown className="h-3.5 w-3.5" />
                                    Kostnader
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview">
                                <OverviewTab />
                            </TabsContent>

                            <TabsContent value="transactions">
                                <TransactionsTab />
                            </TabsContent>

                            <TabsContent value="expenses">
                                <ExpensesTab />
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </TooltipProvider>
    )
}
