"use client"

import { Suspense, useState } from "react"
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Plus,
    Loader2,
    Map,
    History,
    BookCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CorporateActionType } from "@/types/events"
import { cn } from "@/lib/utils"
import { ActionWizard } from "@/components/agare"
import { ActivityFeed } from "@/components/shared/activity-feed"
import { PageHeader } from "@/components/shared"
import {
    EventsCalendar,
    RoadmapView,
    ManadsavslutView,
    DayDetailDialog,
    useHandelserLogic,
    availableYears,
    type ViewType,
} from "@/components/handelser"

// View tabs configuration
const viewTabs: { id: ViewType; label: string; icon: typeof BookCheck }[] = [
    { id: "manadsavslut", label: "Månadsavslut", icon: BookCheck },
    { id: "calendar", label: "Kalender", icon: Calendar },
    { id: "roadmap", label: "Planering", icon: Map },
    { id: "activity", label: "Aktivitetslogg", icon: History },
]

// Tab-specific headers
const tabHeaders: Record<ViewType, { title: string; subtitle: string }> = {
    manadsavslut: { title: "Månadsavslut", subtitle: "Översikt och avstämning per månad" },
    calendar: { title: "Kalender", subtitle: "Se händelser i kalendervy" },
    roadmap: { title: "Planering", subtitle: "Planera kommande åtgärder och händelser" },
    activity: { title: "Aktivitetslogg", subtitle: "Se vem som gjort vad i företaget" },
}

function HandelserPageContent() {
    const logic = useHandelserLogic()
    const [selectedDay, setSelectedDay] = useState<Date | null>(null)

    const {
        activeView,
        selectedYear,
        calendarMonth,
        wizardOpen,
        yearEvents,
        setActiveView,
        setSelectedYear,
        setCalendarMonth,
        setWizardOpen,
        handleActionComplete,
    } = logic

    const currentHeader = tabHeaders[activeView]

    // Show year nav for views that need it
    const showYearNav = activeView === "calendar" || activeView === "manadsavslut"
    const minYear = availableYears[availableYears.length - 1]
    const maxYear = availableYears[0]
    // Show new action button only for roadmap view
    const showNewAction = activeView === "roadmap"

    // Roadmap view only allows creating roadmap items
    const getAllowedActions = (): CorporateActionType[] => ["roadmap"]

    return (
        <div className="flex flex-col min-h-svh">
            {/* Tabs Navigation */}
            <div className="px-6 pt-6">
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

            {/* Page Header - specific to current tab */}
            <div className="px-6 pt-6">
                <PageHeader
                    title={currentHeader.title}
                    subtitle={currentHeader.subtitle}
                    actions={
                        <div className="flex items-center gap-2">
                            {showYearNav && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={selectedYear <= minYear}
                                        onClick={() => setSelectedYear(selectedYear - 1)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-medium min-w-[4ch] text-center tabular-nums">
                                        {selectedYear}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={selectedYear >= maxYear}
                                        onClick={() => setSelectedYear(selectedYear + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            {showNewAction && (
                                <Button size="sm" className="gap-1.5" onClick={() => setWizardOpen(true)}>
                                    <Plus className="h-4 w-4" />
                                    Ny åtgärd
                                </Button>
                            )}
                        </div>
                    }
                />
            </div>

            {/* Action Wizard Dialog */}
            <ActionWizard
                open={wizardOpen}
                onOpenChange={setWizardOpen}
                onComplete={handleActionComplete}
                allowedActions={getAllowedActions()}
            />

            {/* View Content */}
            <div className="px-6 py-6">
                <div className="max-w-4xl w-full space-y-4">
                    {/* Calendar View */}
                    {activeView === "calendar" && (
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
                                <DayDetailDialog
                                    open={selectedDay !== null}
                                    onOpenChange={(open) => { if (!open) setSelectedDay(null) }}
                                    date={selectedDay}
                                    events={yearEvents}
                                    onDateChange={(d) => setSelectedDay(d)}
                                />
                            )}
                        </>
                    )}

                    {/* Roadmap View */}
                    {activeView === "roadmap" && (
                        <RoadmapView onCreateNew={() => setWizardOpen(true)} />
                    )}

                    {/* Månadsavslut View */}
                    {activeView === "manadsavslut" && (
                        <ManadsavslutView year={selectedYear} />
                    )}

                    {/* Activity Log View */}
                    {activeView === "activity" && (
                        <ActivityFeed
                            limit={50}
                            showTitle={false}
                            className="border-0 shadow-none bg-transparent"
                        />
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
            Laddar händelser...
        </div>
    )
}

export default function HandelserPage() {
    return (
        <Suspense fallback={<HandelserPageLoading />}>
            <HandelserPageContent />
        </Suspense>
    )
}
