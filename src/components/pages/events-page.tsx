"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { PageHeader, YearSlider } from "@/components/shared"
import {
    ManadsavslutView,
    DeadlinesList,
    useHandelserLogic,
    availableYears,
} from "@/components/handelser"

function HandelserPageContent() {
    const { selectedYear, setSelectedYear } = useHandelserLogic()

    const minYear = availableYears[availableYears.length - 1]
    const maxYear = availableYears[0]

    return (
        <div className="flex flex-col min-h-svh">
            {/* Page Header */}
            <div className="px-4 md:px-6 pt-6">
                <PageHeader
                    title="Händelser"
                    subtitle="Månadsavslut, periodstängning och kommande deadlines"
                    actions={
                        <YearSlider
                            year={selectedYear}
                            onYearChange={setSelectedYear}
                            minYear={minYear}
                            maxYear={maxYear}
                        />
                    }
                />
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
                <div className="max-w-4xl w-full space-y-6">
                    <DeadlinesList />
                    <ManadsavslutView year={selectedYear} />
                </div>
            </div>
        </div>
    )
}

function HandelserPageLoading() {
    return (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Laddar händelser...
        </div>
    )
}

export default function EventsPage() {
    return (
        <Suspense fallback={<HandelserPageLoading />}>
            <HandelserPageContent />
        </Suspense>
    )
}
