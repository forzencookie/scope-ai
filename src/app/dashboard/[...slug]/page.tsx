"use client"

import { Suspense, use } from "react"
import dynamic from "next/dynamic"

// Dynamic imports for better code splitting and faster initial load
const PayrollPage = dynamic(() => import("@/components/pages/payroll-page"), {
    loading: () => <div className="p-6">Laddar löner...</div>
})
const AccountingPage = dynamic(() => import("@/components/pages/accounting-page"), {
    loading: () => <div className="p-6">Laddar bokföring...</div>
})
const ReportsPage = dynamic(() => import("@/components/pages/reports-page"), {
    loading: () => <div className="p-6">Laddar rapporter...</div>
})
const HandelserPage = dynamic(() => import("@/components/pages/handelser-page"), {
    loading: () => <div className="p-6">Laddar händelser...</div>
})
const ParterPage = dynamic(() => import("@/components/pages/parter-page"), {
    loading: () => <div className="p-6">Laddar ägare...</div>
})

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
