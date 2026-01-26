"use client"

import { cn } from "@/lib/utils"
import { eventSourceMeta, eventStatusMeta, type EventSource, type EventStatus } from "@/types/events"

interface EventSourceBadgeProps {
    source: EventSource
    className?: string
}

/**
 * Badge displaying the source of an event (AI, User, System, etc.)
 */
export function EventSourceBadge({ source, className }: EventSourceBadgeProps) {
    const meta = eventSourceMeta[source]
    
    return (
        <div className={cn(
            "text-xs px-2 py-0.5 rounded-full shrink-0",
            meta.bgClass,
            meta.colorClass,
            className
        )}>
            {meta.label}
        </div>
    )
}

interface EventStatusBadgeProps {
    status: EventStatus
    className?: string
}

/**
 * Badge displaying the status of an event (pending, completed, etc.)
 */
export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
    const meta = eventStatusMeta[status]
    
    if (!meta) return null
    
    return (
        <div className={cn(
            "text-xs px-2 py-0.5 rounded-full shrink-0",
            meta.bgClass,
            meta.colorClass,
            className
        )}>
            {meta.label}
        </div>
    )
}

interface EventBadgesProps {
    source: EventSource
    status?: EventStatus
    className?: string
}

/**
 * Combined event badges showing both source and status
 */
export function EventBadges({ source, status, className }: EventBadgesProps) {
    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            {status && <EventStatusBadge status={status} />}
            <EventSourceBadge source={source} />
        </div>
    )
}
