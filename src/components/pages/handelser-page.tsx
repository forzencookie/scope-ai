"use client"

import { Suspense } from "react"
import {
    Calendar,
    ChevronDown,
    Plus,
    FolderOpen,
    List,
    Loader2,
    Map,
    History,
    BookCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CorporateActionType } from "@/types/events"
import { useLastUpdated } from "@/hooks/use-last-updated"
import { cn } from "@/lib/utils"
import { ActionWizard } from "@/components/agare"
import { ActivityFeed } from "@/components/shared/activity-feed"
import { PageHeader } from "@/components/shared"
import {
    EventsFolderView,
    EventsCalendar,
    EventsTimelineView,
    RoadmapView,
    ManadsavslutView,
    useHandelserLogic,
    availableYears,
    type ViewType,
} from "@/components/handelser"

// View tabs configuration
const viewTabs: { id: ViewType; label: string; icon: typeof FolderOpen }[] = [
    { id: "manadsavslut", label: "Månadsavslut", icon: BookCheck },
    { id: "folders", label: "Mappar", icon: FolderOpen },
    { id: "timeline", label: "Tidslinje", icon: List },
    { id: "calendar", label: "Kalender", icon: Calendar },
    { id: "roadmap", label: "Planering", icon: Map },
    { id: "activity", label: "Aktivitetslogg", icon: History },
]

// Tab-specific headers
const tabHeaders: Record<ViewType, { title: string; subtitle: string }> = {
    manadsavslut: { title: "Månadsavslut", subtitle: "Stäng perioder och lås verifikationer" },
    folders: { title: "Mappar", subtitle: "Företagshändelser organiserat per kvartal" },
    timeline: { title: "Tidslinje", subtitle: "Kronologisk vy över alla händelser" },
    calendar: { title: "Kalender", subtitle: "Se händelser i kalendervy" },
    roadmap: { title: "Planering", subtitle: "Planera kommande åtgärder och händelser" },
    activity: { title: "Aktivitetslogg", subtitle: "Se vem som gjort vad i företaget" },
}

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

    const currentHeader = tabHeaders[activeView]
    
    // Show year dropdown for views that need it
    const showYearDropdown = activeView === "folders" || activeView === "timeline" || activeView === "calendar" || activeView === "manadsavslut"
    // Show new action button only for roadmap view (planning future actions)
    // Other corporate actions should be created in their respective pages (Ägare, etc.)
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
                            {showYearDropdown && (
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
