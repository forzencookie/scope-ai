"use client"

import { Suspense } from "react"
import {
    Calendar,
    ChevronDown,
    Plus,
    FolderOpen,
    List,
    ChevronLeft,
    Loader2,
    Map,
    History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLastUpdated } from "@/hooks/use-last-updated"
import { cn } from "@/lib/utils"
import { ActionWizard } from "@/components/agare"
import { ActivityFeed } from "@/components/shared/activity-feed"
import {
    EventsFolderView,
    EventsCalendar,
    EventsTimelineView,
    RoadmapView,
    useHandelserLogic,
    availableYears,
    type ViewType,
} from "@/components/handelser"

// View tabs configuration
const viewTabs: { id: ViewType; label: string; icon: typeof FolderOpen }[] = [
    { id: "folders", label: "Mappar", icon: FolderOpen },
    { id: "timeline", label: "Tidslinje", icon: List },
    { id: "calendar", label: "Kalender", icon: Calendar },
    { id: "roadmap", label: "Planering", icon: Map },
    { id: "activity", label: "Aktivitetslogg", icon: History },
]

function HandelserPageContent() {
    const lastUpdated = useLastUpdated()
    const logic = useHandelserLogic()

    const {
        // State
        activeView,
        selectedYear,
        selectedQuarter,
        calendarMonth,
        wizardOpen,
        
        // Data
        yearEvents,
        quarterCounts,
        groupedPaginatedEvents,
        paginatedTotalCount,
        countsBySource,
        dateLabels,
        paginatedEvents,
        
        // Pagination & filters
        page,
        pageSize,
        isPaginationLoading,
        activeFilter,
        showFilters,
        
        // Actions
        setActiveView,
        setSelectedYear,
        setCalendarMonth,
        setWizardOpen,
        setPage,
        setActiveFilter,
        setShowFilters,
        handleSelectQuarter,
        handleBackToFolders,
        handleActionComplete,
    } = logic

    return (
        <div className="flex flex-col min-h-svh">
            {/* Page Heading */}
            <div className="px-4 md:px-6 pt-6">
                <div className="max-w-4xl w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 shrink-0">
                                <Calendar className="h-4 w-4" />
                            </div>
                            Händelser
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                            Arkiv över företagshändelser — organiserat per kvartal.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Year Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    <span>{selectedYear}</span>
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {availableYears.map((year) => (
                                    <DropdownMenuItem
                                        key={year}
                                        onClick={() => setSelectedYear(year)}
                                    >
                                        {year}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button size="sm" className="gap-1.5" onClick={() => setWizardOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Ny åtgärd
                        </Button>
                    </div>
                </div>
            </div>

            {/* Action Wizard Dialog */}
            <ActionWizard
                open={wizardOpen}
                onOpenChange={setWizardOpen}
                onComplete={handleActionComplete}
            />

            {/* View Tabs */}
            <div className="px-6 pt-4">
                <div className="max-w-4xl w-full">
                    <div className="flex items-center gap-1 pb-2 mb-4 border-b-2 border-border/60">
                        {selectedQuarter && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBackToFolders}
                                className="mr-2"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                {selectedQuarter} {selectedYear}
                            </Button>
                        )}
                        {!selectedQuarter && viewTabs.map((tab) => {
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
            </div>

            {/* View Content */}
            <div className="px-6 pb-6">
                <div className="max-w-4xl w-full space-y-4">
                    {/* Folder View */}
                    {activeView === "folders" && !selectedQuarter && (
                        <EventsFolderView
                            year={selectedYear}
                            eventCounts={quarterCounts}
                            onSelectQuarter={handleSelectQuarter}
                        />
                    )}

                    {/* Timeline View */}
                    {(activeView === "timeline" || selectedQuarter) && (
                        <EventsTimelineView
                            paginatedEvents={paginatedEvents}
                            groupedPaginatedEvents={groupedPaginatedEvents}
                            paginatedTotalCount={paginatedTotalCount}
                            countsBySource={countsBySource}
                            dateLabels={dateLabels}
                            selectedYear={selectedYear}
                            selectedQuarter={selectedQuarter}
                            activeFilter={activeFilter}
                            showFilters={showFilters}
                            page={page}
                            pageSize={pageSize}
                            isPaginationLoading={isPaginationLoading}
                            setActiveFilter={setActiveFilter}
                            setShowFilters={setShowFilters}
                            setPage={setPage}
                            lastUpdated={lastUpdated}
                        />
                    )}

                    {/* Calendar View */}
                    {activeView === "calendar" && !selectedQuarter && (
                        <EventsCalendar
                            events={yearEvents}
                            year={selectedYear}
                            month={calendarMonth}
                            onMonthChange={(y, m) => {
                                setSelectedYear(y)
                                setCalendarMonth(m)
                            }}
                        />
                    )}

                    {/* Roadmap View */}
                    {activeView === "roadmap" && (
                        <RoadmapView onCreateNew={() => setWizardOpen(true)} />
                    )}

                    {/* Activity Log View */}
                    {activeView === "activity" && (
                        <ActivityFeed 
                            limit={50} 
                            showHeader={false}
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
