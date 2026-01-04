"use client"

import { Suspense, useState, useEffect, useMemo, useCallback } from "react"
import {
    Activity,
    History,
    Filter,
    ChevronDown,
    Plus,
    FolderOpen,
    List,
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
import { useEvents } from "@/hooks/use-events"
import { eventSourceMeta, eventStatusMeta, type EventSource, type CorporateActionType } from "@/types/events"
import { cn } from "@/lib/utils"
import { ActionWizard } from "@/components/parter"
import {
    EventsFolderView,
    EventsTable,
    EventsCalendar,
    countEventsByQuarter,
    filterEventsByQuarter,
    type Quarter,
} from "@/components/handelser"

// View types
type ViewType = "folders" | "timeline" | "calendar"

// Available years for the dropdown
const currentYear = new Date().getFullYear()
const availableYears = [currentYear, currentYear - 1, currentYear - 2]

function HandelserPageContent() {
    const lastUpdated = useLastUpdated()
    const { events, countsBySource, emitAI, emitUser, emitSystem } = useEvents()

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
    const handleActionComplete = (actionType: CorporateActionType) => {
        emitUser('created', `Ny bolagsåtgärd: ${actionType}`, 'bolagsåtgärd', {
            metadata: { actionType, status: 'draft' }
        })
    }

    // Filter events by year (and optionally quarter)
    const yearEvents = useMemo(() => {
        return events.filter(e => e.timestamp.getFullYear() === selectedYear)
    }, [events, selectedYear])

    const quarterEvents = useMemo(() => {
        if (!selectedQuarter) return yearEvents
        return filterEventsByQuarter(events, selectedYear, selectedQuarter)
    }, [events, selectedYear, selectedQuarter, yearEvents])

    // Filter by source
    const filteredEvents = useMemo(() => {
        const baseEvents = selectedQuarter ? quarterEvents : yearEvents
        if (!activeFilter) return baseEvents
        return baseEvents.filter(e => e.source === activeFilter)
    }, [yearEvents, quarterEvents, selectedQuarter, activeFilter])

    // Count events by quarter for folder view
    const quarterCounts = useMemo(() => {
        return countEventsByQuarter(events, selectedYear)
    }, [events, selectedYear])

    // Group events by date for timeline view
    const groupedEvents = useMemo(() => {
        return filteredEvents.reduce((groups, event) => {
            const date = event.timestamp.toLocaleDateString('sv-SE')
            if (!groups[date]) {
                groups[date] = []
            }
            groups[date].push(event)
            return groups
        }, {} as Record<string, typeof events>)
    }, [filteredEvents])

    const dateLabels: Record<string, string> = {
        [new Date().toLocaleDateString('sv-SE')]: 'Idag',
        [new Date(Date.now() - 86400000).toLocaleDateString('sv-SE')]: 'Igår',
    }

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

    // Seed with demo events on first mount if empty
    useEffect(() => {
        if (events.length === 0) {
            setTimeout(() => {
                emitAI('classified', 'AI klassificerade 12 transaktioner', 'bokföring', {
                    metadata: { count: 12, confidence: 0.94 }
                })
            }, 100)
            setTimeout(() => {
                emitUser('submitted', 'Du skickade momsdeklaration Q4', 'skatt', {
                    relatedTo: [{ type: 'declaration', id: 'moms-q4', label: 'Momsdeklaration Q4 2024' }]
                })
            }, 200)
            setTimeout(() => {
                emitSystem('closed', 'Räkenskapsåret 2024 stängdes', 'system')
            }, 300)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    ]

    return (
        <div className="flex flex-col min-h-svh">
            {/* Page Heading */}
            <div className="px-6 pt-6">
                <div className="max-w-4xl w-full flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                                <Calendar className="h-4 w-4" />
                            </div>
                            Händelser
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Arkiv över företagshändelser — organiserat per kvartal.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Year Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {selectedYear}
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
                                        ({filteredEvents.length} händelser)
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
                                        const count = source ? countsBySource[source] : filteredEvents.length
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
                            {Object.entries(groupedEvents).length > 0 ? (
                                Object.entries(groupedEvents).map(([date, dateEvents]) => (
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

                            {filteredEvents.length > 0 && (
                                <div className="text-center py-4">
                                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        <History className="h-4 w-4 inline mr-1.5" />
                                        Visa äldre händelser
                                    </button>
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
