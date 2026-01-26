"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
    Activity,
    Filter,
    ChevronDown,
    ChevronLeft,
} from "lucide-react"
import { eventSourceMeta, eventStatusMeta, type EventSource, type EventStatus } from "@/types/events"
import type { Quarter } from "./events-folder-view"

// Define the event type for this component
interface TimelineEvent {
    id: string
    title: string
    description?: string
    timestamp: Date
    source: EventSource
    status?: EventStatus
    actor: { name?: string }
    relatedTo?: Array<{ type: string; label?: string }>
}

interface EventsTimelineViewProps {
    // Data
    paginatedEvents: TimelineEvent[]
    groupedPaginatedEvents: Record<string, TimelineEvent[]>
    paginatedTotalCount: number
    countsBySource: Record<EventSource, number>
    dateLabels: Record<string, string>
    
    // State
    selectedYear: number
    selectedQuarter: Quarter | null
    activeFilter: EventSource | null
    showFilters: boolean
    
    // Pagination
    page: number
    pageSize: number
    isPaginationLoading: boolean
    
    // Actions
    setActiveFilter: (filter: EventSource | null) => void
    setShowFilters: (show: boolean) => void
    setPage: (page: number) => void
    
    // Optional
    lastUpdated?: React.ReactNode
}

const filterButtons: { source: EventSource | null; label: string }[] = [
    { source: null, label: 'Alla' },
    { source: 'ai', label: 'AI' },
    { source: 'user', label: 'Användare' },
    { source: 'system', label: 'System' },
    { source: 'document', label: 'Dokument' },
    { source: 'authority', label: 'Myndighet' },
]

export function EventsTimelineView({
    paginatedEvents,
    groupedPaginatedEvents,
    paginatedTotalCount,
    countsBySource,
    dateLabels,
    selectedYear,
    selectedQuarter,
    activeFilter,
    showFilters,
    page,
    pageSize,
    isPaginationLoading,
    setActiveFilter,
    setShowFilters,
    setPage,
    lastUpdated,
}: EventsTimelineViewProps) {
    return (
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
                    {lastUpdated && (
                        <span className="text-sm text-muted-foreground">{lastUpdated}</span>
                    )}
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

            {/* Pagination */}
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
    )
}
