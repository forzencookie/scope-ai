"use client"

import { Suspense } from "react"
import {
    Loader2,
    LayoutDashboard,
    Archive,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ActivityFeed } from "@/components/shared/activity-feed"
import { PageHeader, YearSlider } from "@/components/shared"
import { useDynamicTasks } from "@/hooks"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import {
    EventsCalendar,
    ManadsavslutView,
    DeadlinesList,
    useHandelserLogic,
    availableYears,
    type ViewType,
} from "@/components/handelser"

// View tabs configuration — 2 views
const viewTabs: { id: ViewType; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "oversikt", label: "Översikt", icon: LayoutDashboard },
    { id: "arkiv", label: "Arkiv", icon: Archive },
]

// Tab-specific headers (content swapped: Översikt = calendar+activity+deadlines, Arkiv = månadsavslut)
const tabHeaders: Record<ViewType, { title: string; subtitle: string }> = {
    oversikt: { title: "Översikt", subtitle: "Kalender, aktivitet och kommande deadlines" },
    arkiv: { title: "Arkiv", subtitle: "Månadsavslut och periodstängning" },
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
    const { goals } = useDynamicTasks()

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
                        <YearSlider
                            year={selectedYear}
                            onYearChange={setSelectedYear}
                            minYear={minYear}
                            maxYear={maxYear}
                        />
                    }
                />
            </div>

            {/* View Content */}
            <div className="p-4 md:p-6">
                <div className="max-w-4xl w-full space-y-6">
                    {/* Översikt: Calendar + Activity Feed + Deadlines */}
                    {activeView === "oversikt" && (
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
                                    Klicka på en dag för att se aktivitet
                                </p>
                            )}

                            <DeadlinesList />

                            {/* Active Plans Section */}
                            {goals.length > 0 && (
                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                            Aktiva planer
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {goals.map((goal) => {
                                            const completedTasks = goal.tasks.filter(t => t.completed).length
                                            const progress = Math.round((completedTasks / goal.tasks.length) * 100)
                                            
                                            return (
                                                <Card key={goal.id} className="overflow-hidden border-primary/10 bg-gradient-to-br from-background to-primary/5">
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h4 className="font-bold text-sm">{goal.name}</h4>
                                                                <p className="text-xs text-muted-foreground line-clamp-1">{goal.target}</p>
                                                            </div>
                                                            <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                {progress}%
                                                            </span>
                                                        </div>
                                                        <Progress value={progress} className="h-1.5 mb-2" />
                                                        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
                                                            <span>{completedTasks} av {goal.tasks.length} steg klara</span>
                                                            {progress === 100 && (
                                                                <span className="text-emerald-600 flex items-center gap-1 font-bold">
                                                                    Klar
                                                                </span>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Arkiv: Månadsavslut grid */}
                    {activeView === "arkiv" && (
                        <ManadsavslutView year={selectedYear} />
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

export default function EventsPage() {
    return (
        <Suspense fallback={<HandelserPageLoading />}>
            <HandelserPageContent />
        </Suspense>
    )
}
