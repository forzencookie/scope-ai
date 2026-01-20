"use client"

import { Suspense, use } from "react"

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

function ApparPageContent({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = use(params)
    const section = slug[0]
    const pageInfo = pageMap[section]

    if (!pageInfo) {
        return (
            <div className="flex flex-col p-6">
                <p className="text-muted-foreground">Sidan hittades inte</p>
            </div>
        )
    }

    const PageComponent = pageInfo.component

    return (
        <div className="flex flex-col min-h-screen">
            <PageComponent />
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
