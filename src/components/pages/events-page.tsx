"use client"

import { Suspense } from "react"
import {
    Loader2,
    LayoutDashboard,
    FileText,
    Archive,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ActivityFeed } from "@/components/shared/activity-feed"
import { PageHeader, YearSlider } from "@/components/shared"
import {
    EventsCalendar,
    ManadsavslutView,
    DeadlinesList,
    CanvasView,
    useHandelserLogic,
    availableYears,
    type ViewType,
} from "@/components/handelser"

// View tabs configuration — Phase 6: 3 tabs
const viewTabs: { id: ViewType; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "oversikt", label: "Oversikt", icon: LayoutDashboard },
    { id: "canvas", label: "Canvas", icon: FileText },
    { id: "arkiv", label: "Arkiv", icon: Archive },
]

// Tab-specific headers
const tabHeaders: Record<ViewType, { title: string; subtitle: string }> = {
    oversikt: { title: "Oversikt", subtitle: "Manadsavslut och kommande deadlines" },
    canvas: { title: "Canvas", subtitle: "Planer och AI-genererade dokument" },
    arkiv: { title: "Arkiv", subtitle: "Kalender och historik dag for dag" },
}

const MONTH_NAMES_SV = [
    "januari", "februari", "mars", "april", "maj", "juni",
    "juli", "augusti", "september", "oktober", "november", "december"
]

function formatSelectedDay(date: Date): string {
    return `${date.getDate()} ${MONTH_NAMES_SV[date.getMonth()]} ${date.getFullYear()}`
}

function HandelserPageContent() {
    const logic = useHandelserLogic()

    const {
        activeView,
        selectedYear,
        calendarMonth,
        yearEvents,
        selectedDay,
        setActiveView,
        setSelectedYear,
        setCalendarMonth,
        setSelectedDay,
    } = logic

    const currentHeader = tabHeaders[activeView]

    // Show year nav for Oversikt and Arkiv
    const showYearNav = activeView === "oversikt" || activeView === "arkiv"
    const minYear = availableYears[availableYears.length - 1]
    const maxYear = availableYears[0]

    return (
        <div className="flex flex-col min-h-svh">
            {/* Tabs Navigation */}
            <div className="px-4 md:px-6 pt-6">
                <div className="flex items-center gap-1 pb-2 border-b-2 border-border/60">
                    {viewTabs.map((tab) => {
                        const isActive = activeView === tab.id
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveView(tab.id)}
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
                        )
                    })}
                </div>
            </div>

            {/* Page Header */}
            <div className="px-4 md:px-6 pt-6">
                <PageHeader
                    title={currentHeader.title}
                    subtitle={currentHeader.subtitle}
                    actions={
                        showYearNav ? (
                            <YearSlider
                                year={selectedYear}
                                onYearChange={setSelectedYear}
                                minYear={minYear}
                                maxYear={maxYear}
                            />
                        ) : undefined
                    }
                />
            </div>

            {/* View Content */}
            <div className="p-4 md:p-6">
                <div className="max-w-4xl w-full space-y-6">
                    {/* Oversikt: Manadsavslut + Deadlines */}
                    {activeView === "oversikt" && (
                        <>
                            <ManadsavslutView year={selectedYear} />
                            <DeadlinesList />
                        </>
                    )}

                    {/* Canvas: Markdown workspace */}
                    {activeView === "canvas" && (
                        <CanvasView />
                    )}

                    {/* Arkiv: Calendar + inline activity feed */}
                    {activeView === "arkiv" && (
                        <>
                            <EventsCalendar
                                events={yearEvents}
                                year={selectedYear}
                                month={calendarMonth}
                                onMonthChange={(y, m) => {
                                    setSelectedYear(y)
                                    setCalendarMonth(m)
                                }}
                                onDayClick={(date) => setSelectedDay(date)}
                            />

                            {selectedDay && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground px-1">
                                        {formatSelectedDay(selectedDay)}
                                    </h3>
                                    <ActivityFeed
                                        dateFilter={selectedDay}
                                        limit={50}
                                        showTitle={false}
                                        className="border shadow-none"
                                        emptyMessage="Ingen aktivitet denna dag"
                                    />
                                </div>
                            )}

                            {!selectedDay && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Klicka pa en dag for att se aktivitet
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function HandelserPageLoading() {
    return (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Laddar handelser...
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
