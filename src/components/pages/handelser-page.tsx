"use client"

import { Suspense, useState, useEffect, useMemo, useCallback } from "react"
import {
    Activity,
    // History,
    Filter,
    ChevronDown,
    Plus,
    // FolderOpen,
    // List,
    Calendar,
    ChevronLeft,
    Loader2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLastUpdated } from "@/hooks/use-last-updated"
import { useEvents, useEventsPaginated } from "@/hooks/use-events"
import { eventSourceMeta, eventStatusMeta, type EventSource, type CorporateActionType } from "@/types/events"
import { cn } from "@/lib/utils"
import { ActionWizard } from "@/components/agare"
import {
    EventsFolderView,
    EventsCalendar,
    countEventsByQuarter,
    filterEventsByQuarter,
    type Quarter,
    RoadmapView,
} from "@/components/handelser"
// import { Map } from "lucide-react"

// View types
type ViewType = "folders" | "timeline" | "calendar" | "roadmap"

// Available years for the dropdown
const currentYear = new Date().getFullYear()
const availableYears = [currentYear, currentYear - 1, currentYear - 2]

function HandelserPageContent() {
    const lastUpdated = useLastUpdated()
    // Keep useEvents for Folders (needs counts) and Calendar
    const { events: allEvents, countsBySource, emitUser, isLoading: isGlobalLoading } = useEvents()

    // View state
    const [activeView, setActiveView] = useState<ViewType>("folders")
    const [selectedYear, setSelectedYear] = useState(currentYear)
    const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null)
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())

    // Legacy state
    const [activeFilter, setActiveFilter] = useState<EventSource | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [wizardOpen, setWizardOpen] = useState(false)

    // Handle completing a corporate action from the wizard
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleActionComplete = (actionType: CorporateActionType) => {
        emitUser('created', `Ny bolagsåtgärd: ${actionType}`, 'bolagsåtgärd', {
            metadata: { actionType, status: 'draft' }
        })
    }

    // Calculate variables for pagination hook
    const paginationFilters = useMemo(() => {
        const filters: any = {}

        // Source filter
        if (activeFilter) {
            filters.source = activeFilter
        }

        // Search (not implemented in UI but supported by hook)
        // filters.search = searchQuery

        // Date filters
        if (selectedQuarter) {
            // Quarter specific filtering
            const quarterMap: Record<Quarter, number> = {
                "Q1": 0, "Q2": 3, "Q3": 6, "Q4": 9
            }
            const startMonth = quarterMap[selectedQuarter]
            filters.dateFrom = new Date(selectedYear, startMonth, 1)
            filters.dateTo = new Date(selectedYear, startMonth + 3, 0, 23, 59, 59)
        } else {
            // Full year filtering
            filters.dateFrom = new Date(selectedYear, 0, 1)
            filters.dateTo = new Date(selectedYear, 11, 31, 23, 59, 59)
        }

        return filters
    }, [selectedYear, selectedQuarter, activeFilter])

    // Paginated events for Timeline view
    const {
        // events: paginatedEvents,
        // totalCount: paginatedTotalCount,
        // page,
        setPage,
        // pageSize,
        isLoading: isPaginationLoading
    } = useEventsPaginated(25, paginationFilters)

    // Filter events by year (and optionally quarter) for Calendar/Folders
    const yearEvents = useMemo(() => {
        return allEvents.filter(e => e.timestamp.getFullYear() === selectedYear)
    }, [allEvents, selectedYear])

    const quarterEvents = useMemo(() => {
        if (!selectedQuarter) return yearEvents
        return filterEventsByQuarter(allEvents, selectedYear, selectedQuarter)
    }, [allEvents, selectedYear, selectedQuarter, yearEvents])

    // Count events by quarter for folder view
    const quarterCounts = useMemo(() => {
        return countEventsByQuarter(allEvents, selectedYear)
    }, [allEvents, selectedYear])

    // Group paginated events by date for timeline view
    const groupedPaginatedEvents = useMemo(() => {
        return paginatedEvents.reduce((groups, event) => {
            const date = event.timestamp.toLocaleDateString('sv-SE')
            if (!groups[date]) {
                groups[date] = []
            }
            groups[date].push(event)
            return groups
        }, {} as Record<string, typeof paginatedEvents>)
    }, [paginatedEvents])

    const dateLabels = useMemo(() => {
        const now = new Date()
        const oneDayMs = 86400000
        return {
            [now.toLocaleDateString('sv-SE')]: 'Idag',
            [new Date(now.getTime() - oneDayMs).toLocaleDateString('sv-SE')]: 'Igår',
        }
    }, [])

    // Handle quarter selection
    const handleSelectQuarter = useCallback((quarter: Quarter) => {
        setSelectedQuarter(quarter)
        setActiveView("timeline") // Switch to timeline when drilling into a quarter
    }, [])

    // Handle back to folders
    const handleBackToFolders = useCallback(() => {
        setSelectedQuarter(null)
        setActiveView("folders")
    }, [])

    // Seed with demo events on first mount if empty AND not loading
    // Seed with demo events on first mount if empty AND not loading
    useEffect(() => {
        if (!isGlobalLoading && allEvents.length === 0) {
            // Only seed if we're sure it's empty after trying to load

            // NOTE: In production/Supabase mode, we might want to disable auto-seeding
            // or perform it via a proper seed script. Keeping minimal generic seed for non-empty feel if truly empty.
            /*
           setTimeout(() => {
               emitAI('classified', 'AI klassificerade 12 transaktioner', 'bokföring', {
                   metadata: { count: 12, confidence: 0.94 }
               })
           }, 100)
           */
        }
    }, [allEvents.length]) // eslint-disable-line react-hooks/exhaustive-deps

    // Source filter buttons
    const filterButtons: { source: EventSource | null; label: string }[] = [
        { source: null, label: 'Alla' },
        { source: 'ai', label: 'AI' },
        { source: 'user', label: 'Användare' },
        { source: 'system', label: 'System' },
        { source: 'document', label: 'Dokument' },
        { source: 'authority', label: 'Myndighet' },
    ]

    // View tabs
    const viewTabs: { id: ViewType; label: string; icon: typeof FolderOpen }[] = [
        { id: "folders", label: "Mappar", icon: FolderOpen },
        { id: "timeline", label: "Tidslinje", icon: List },
        { id: "calendar", label: "Kalender", icon: Calendar },
        { id: "roadmap", label: "Planering", icon: Map },
    ]

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
                                    <span className="hidden sm:inline">{selectedYear}</span>
                                    <span className="sm:hidden">{selectedYear}</span>
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
                        <>
                            {/* Header with filters */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {selectedQuarter ? `${selectedQuarter} ${selectedYear}` : 'Tidslinje'}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        ({paginatedTotalCount} händelser)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="gap-1.5"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Filter
                                        <ChevronDown className={cn(
                                            "h-3 w-3 transition-transform",
                                            showFilters && "rotate-180"
                                        )} />
                                    </Button>
                                    <span className="text-sm text-muted-foreground">{lastUpdated}</span>
                                </div>
                            </div>

                            {/* Filter bar */}
                            {showFilters && (
                                <div className="flex gap-2 pb-2 overflow-x-auto">
                                    {filterButtons.map(({ source, label }) => {
                                        const isActive = activeFilter === source
                                        const count = source ? countsBySource[source] : paginatedTotalCount
                                        return (
                                            <Button
                                                key={source ?? 'all'}
                                                variant={isActive ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setActiveFilter(source)}
                                                className="gap-1.5 shrink-0"
                                            >
                                                {label}
                                                <span className={cn(
                                                    "text-xs px-1.5 py-0.5 rounded-full",
                                                    isActive ? "bg-primary-foreground/20" : "bg-muted"
                                                )}>
                                                    {count}
                                                </span>
                                            </Button>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Grouped timeline */}
                            {Object.entries(groupedPaginatedEvents).length > 0 ? (
                                Object.entries(groupedPaginatedEvents).map(([date, dateEvents]) => (
                                    <div key={date} className="space-y-2">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-2">
                                            {dateLabels[date] || date}
                                        </div>
                                        <Card className="divide-y">
                                            {dateEvents.map((event) => {
                                                const meta = eventSourceMeta[event.source]
                                                return (
                                                    <div
                                                        key={event.id}
                                                        className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium">{event.title}</p>
                                                            {event.description && (
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                    {event.description}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {event.timestamp.toLocaleTimeString('sv-SE', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                                {event.actor.name && (
                                                                    <>
                                                                        <span className="text-muted-foreground">·</span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {event.actor.name}
                                                                        </span>
                                                                    </>
                                                                )}
                                                                {event.relatedTo && event.relatedTo.length > 0 && (
                                                                    <>
                                                                        <span className="text-muted-foreground">·</span>
                                                                        <span className="text-xs text-primary">
                                                                            {event.relatedTo[0].label || event.relatedTo[0].type}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {event.status && eventStatusMeta[event.status] && (
                                                            <div className={cn(
                                                                "text-xs px-2 py-0.5 rounded-full shrink-0",
                                                                eventStatusMeta[event.status].bgClass,
                                                                eventStatusMeta[event.status].colorClass
                                                            )}>
                                                                {eventStatusMeta[event.status].label}
                                                            </div>
                                                        )}
                                                        <div className={cn(
                                                            "text-xs px-2 py-0.5 rounded-full shrink-0",
                                                            meta.bgClass,
                                                            meta.colorClass
                                                        )}>
                                                            {meta.label}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </Card>
                                    </div>
                                ))
                            ) : (
                                <Card className="p-8 text-center">
                                    <Activity className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                                    <p className="text-muted-foreground mb-1">Inga händelser</p>
                                    <p className="text-sm text-muted-foreground/70">
                                        {selectedQuarter
                                            ? `Inga händelser i ${selectedQuarter} ${selectedYear}`
                                            : 'Händelser loggas automatiskt när saker händer i systemet.'}
                                    </p>
                                </Card>
                            )}

                            {paginatedTotalCount > pageSize && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 py-4 mt-6 border-t border-border/40">
                                    <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                                        Visar {Math.min((page - 1) * pageSize + 1, paginatedTotalCount)}-{Math.min(page * pageSize, paginatedTotalCount)} av {paginatedTotalCount} händelser
                                    </div>
                                    <div className="flex items-center justify-center sm:justify-end space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page <= 1 || isPaginationLoading}
                                        >
                                            <ChevronLeft className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">Föregående</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page + 1)}
                                            disabled={page * pageSize >= paginatedTotalCount || isPaginationLoading}
                                        >
                                            <span className="hidden sm:inline">Nästa</span>
                                            <ChevronDown className="h-4 w-4 sm:ml-2 rotate-[-90deg]" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
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
