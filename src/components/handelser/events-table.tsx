"use client"

import { useMemo, useState } from "react"
import { Calendar, Tag, User, Activity } from "lucide-react"
import {
    DataTable,
    DataTableHeader,
    DataTableHeaderCell,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    DataTableEmpty,
} from "@/components/ui/data-table"
import { AppStatusBadge } from "@/components/ui/status-badge"
import type { HändelseEvent } from "@/types/events"
import { eventSourceMeta, eventStatusMeta } from "@/types/events"
import { cn } from "@/lib/utils"

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
        <DataTable>
            <DataTableHeader>
                <DataTableHeaderCell
                    icon={Calendar}
                    label="Datum"
                    className="cursor-pointer hover:text-foreground"
                />
                <DataTableHeaderCell
                    icon={Activity}
                    label="Händelse"
                    className="cursor-pointer hover:text-foreground"
                />
                <DataTableHeaderCell
                    icon={Tag}
                    label="Källa"
                />
                <DataTableHeaderCell label="Status" />
                <DataTableHeaderCell
                    icon={User}
                    label="Aktör"
                />
            </DataTableHeader>

            <DataTableBody>
                {sortedEvents.length === 0 ? (
                    <DataTableEmpty message="Inga händelser i denna period" colSpan={5} />
                ) : (
                    sortedEvents.map((event) => {
                        const sourceMeta = eventSourceMeta[event.source]
                        const statusMeta = event.status ? eventStatusMeta[event.status] : null

                        return (
                            <DataTableRow
                                key={event.id}
                                onClick={() => onEventClick?.(event)}
                            >
                                <DataTableCell muted>
                                    {event.timestamp.toLocaleDateString("sv-SE")}
                                </DataTableCell>
                                <DataTableCell bold>
                                    {event.title}
                                </DataTableCell>
                                <DataTableCell>
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded-full",
                                        sourceMeta.bgClass,
                                        sourceMeta.colorClass
                                    )}>
                                        {sourceMeta.label}
                                    </span>
                                </DataTableCell>
                                <DataTableCell>
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
                                </DataTableCell>
                                <DataTableCell muted>
                                    {event.actor.name || event.actor.type}
                                </DataTableCell>
                            </DataTableRow>
                        )
                    })
                )}
            </DataTableBody>
        </DataTable>
    )
}
