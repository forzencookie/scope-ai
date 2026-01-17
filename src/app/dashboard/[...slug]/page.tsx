"use client"

import { Suspense, use } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,

} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

// Import page content components (moved from app routes)
import PayrollPage from "@/components/pages/payroll-page"
import AccountingPage from "@/components/pages/accounting-page"
import ReportsPage from "@/components/pages/reports-page"
import HandelserPage from "@/components/pages/handelser-page"
import ParterPage from "@/components/pages/parter-page"

// Map slug to page component and label (Swedish URL names)
const pageMap: Record<string, { component: React.ComponentType; label: string }> = {
    bokforing: { component: AccountingPage, label: "Bokföring" },
    rapporter: { component: ReportsPage, label: "Rapporter" },
    handelser: { component: HandelserPage, label: "Händelser" },
    agare: { component: ParterPage, label: "Ägare & Styrning" },
    loner: { component: PayrollPage, label: "Löner" },
}

function ApparBreadcrumb({ section }: { section: string }) {
    const pageInfo = pageMap[section]

    return (
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
                            <BreadcrumbPage>{pageInfo?.label || section}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

        </header>
    )
}

function ApparPageContent({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = use(params)
    const section = slug[0]
    const pageInfo = pageMap[section]

    if (!pageInfo) {
        return (
            <div className="flex flex-col">
                <ApparBreadcrumb section={section} />
                <div className="p-6">
                    <p className="text-muted-foreground">Sidan hittades inte</p>
                </div>
            </div>
        )
    }

    const PageComponent = pageInfo.component

    // Render the page without its own header (we provide the breadcrumb)
    return (
        <div className="flex flex-col min-h-screen">
            <ApparBreadcrumb section={section} />
            <div className="flex-1 [&>*:first-child>header]:hidden">
                <PageComponent />
            </div>
        </div>
    )
}

export default function ApparCatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
    return (
        <Suspense fallback={<div className="p-6">Laddar...</div>}>
            <ApparPageContent params={params} />
        </Suspense>
    )
}
