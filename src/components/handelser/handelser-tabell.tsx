"use client"

import { useMemo, useState } from "react"
import { Calendar, Tag, User, Activity } from "lucide-react"
import {
    GridTableHeader,
    GridTableRows,
    GridTableRow
} from "@/components/ui/grid-table"
import { AppStatusBadge } from "@/components/ui/status-badge"
import type { HändelseEvent } from "@/types/events"
import { eventSourceMeta, eventStatusMeta } from "@/types/events"
import { cn } from "@/lib/utils"

import { formatDate } from "@/lib/formatters"

interface EventsTableProps {
    events: HändelseEvent[]
    onEventClick?: (event: HändelseEvent) => void
}

export function EventsTable({ events, onEventClick }: EventsTableProps) {
    const [sortBy, setSortBy] = useState<"date" | "title">("date")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            if (sortBy === "date") {
                const diff = a.timestamp.getTime() - b.timestamp.getTime()
                return sortOrder === "asc" ? diff : -diff
            }
            // Sort by title
            const diff = a.title.localeCompare(b.title)
            return sortOrder === "asc" ? diff : -diff
        })
    }, [events, sortBy, sortOrder])

    const handleSort = (column: "date" | "title") => {
        if (sortBy === column) {
            setSortOrder(prev => prev === "asc" ? "desc" : "asc")
        } else {
            setSortBy(column)
            setSortOrder("desc")
        }
    }

    return (
        <div className="w-full">
            <GridTableHeader
                columns={[
                    { label: "Datum", icon: Calendar, span: 2 },
                    { label: "Händelse", icon: Activity, span: 4 },
                    { label: "Källa", icon: Tag, span: 2 },
                    { label: "Status", span: 2 },
                    { label: "Aktör", icon: User, span: 2 },
                ]}
            />

            <GridTableRows>
                {sortedEvents.length === 0 ? (
                    <div className="col-span-12 py-12 text-center text-muted-foreground">
                        Inga händelser i denna period
                    </div>
                ) : (
                    sortedEvents.map((event) => {
                        const sourceMeta = eventSourceMeta[event.source]
                        const statusMeta = event.status ? eventStatusMeta[event.status] : null

                        return (
                            <GridTableRow
                                key={event.id}
                                onClick={() => onEventClick?.(event)}
                                className="cursor-pointer"
                            >
                                <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground">
                                    {formatDate(event.timestamp)}
                                </div>
                                <div style={{ gridColumn: 'span 4' }} className="font-medium">
                                    {event.title}
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded-full",
                                        sourceMeta.bgClass,
                                        sourceMeta.colorClass
                                    )}>
                                        {sourceMeta.label}
                                    </span>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    {statusMeta ? (
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full",
                                            statusMeta.bgClass,
                                            statusMeta.colorClass
                                        )}>
                                            {statusMeta.label}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </div>
                                <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground">
                                    {event.actor.name || event.actor.type}
                                </div>
                            </GridTableRow>
                        )
                    })
                )}
            </GridTableRows>
        </div>
    )
}
