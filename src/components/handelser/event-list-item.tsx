"use client"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { EventSourceBadge, EventStatusBadge } from "./event-badge"
import type { EventSource, EventStatus } from "@/types/events"

interface EventListItemData {
    id: string
    title: string
    description?: string
    timestamp: Date
    source: EventSource
    status?: EventStatus
    actor?: { name?: string }
    relatedTo?: Array<{ type: string; label?: string }>
}

interface EventListItemProps {
    event: EventListItemData
    className?: string
    onClick?: () => void
}

/**
 * Single event item for timeline/list views
 */
export function EventListItem({ event, className, onClick }: EventListItemProps) {
    return (
        <div
            className={cn(
                "flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors",
                onClick && "cursor-pointer",
                className
            )}
            onClick={onClick}
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
                    {event.actor?.name && (
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
            {event.status && <EventStatusBadge status={event.status} />}
            <EventSourceBadge source={event.source} />
        </div>
    )
}

interface EventListGroupProps {
    dateLabel: string
    events: EventListItemData[]
    onEventClick?: (event: EventListItemData) => void
}

/**
 * Group of events under a date label
 */
export function EventListGroup({ dateLabel, events, onEventClick }: EventListGroupProps) {
    return (
        <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-2">
                {dateLabel}
            </div>
            <Card className="divide-y">
                {events.map((event) => (
                    <EventListItem
                        key={event.id}
                        event={event}
                        onClick={onEventClick ? () => onEventClick(event) : undefined}
                    />
                ))}
            </Card>
        </div>
    )
}
