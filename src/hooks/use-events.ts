// ============================================
// useEvents Hook
// React hook for accessing event timeline via Supabase
// ============================================

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { HändelseEvent, EventFilters, EventSource, CreateEventInput } from '@/types/events'
import {
    getEvents,
    getEventCountsBySource,
    emitEvent,
    emitAIEvent,
    emitUserEvent,
    emitSystemEvent,
    emitAuthorityEvent,
} from '@/services/event-service'

export interface UseEventsReturn {
    /** All events matching current filters */
    events: HändelseEvent[]
    /** Event counts by source type */
    countsBySource: Record<EventSource, number>
    /** Total event count */
    totalCount: number
    /** Current filters */
    filters: EventFilters
    /** Update filters */
    setFilters: (filters: EventFilters) => void
    /** Refresh events from storage */
    refresh: () => Promise<void>
    /** Emit a new event */
    emit: (input: CreateEventInput) => Promise<HändelseEvent | null>
    /** Convenience: emit AI event */
    emitAI: typeof emitAIEvent
    /** Convenience: emit user event */
    emitUser: typeof emitUserEvent
    /** Convenience: emit system event */
    emitSystem: typeof emitSystemEvent
    /** Convenience: emit authority event */
    emitAuthority: typeof emitAuthorityEvent
    /** Loading state */
    isLoading: boolean
    /** Error state */
    error: Error | null
}

/**
 * Hook for accessing and managing events
 */
export function useEvents(initialFilters?: EventFilters): UseEventsReturn {
    const [events, setEvents] = useState<HändelseEvent[]>([])
    const [countsBySource, setCountsBySource] = useState<Record<EventSource, number>>({
        ai: 0, user: 0, system: 0, document: 0, authority: 0,
    })
    const [filters, setFilters] = useState<EventFilters>(initialFilters || {})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const pendingRefreshRef = useRef<Promise<void> | null>(null)
    const filtersRef = useRef(filters)
    filtersRef.current = filters

    // Load events (deduplicated — concurrent calls share the same promise)
    const refresh = useCallback(async () => {
        if (pendingRefreshRef.current) return pendingRefreshRef.current

        const promise = (async () => {
            setIsLoading(true)
            setError(null)
            try {
                const [eventsData, counts] = await Promise.all([
                    getEvents(filtersRef.current),
                    getEventCountsBySource()
                ])
                setEvents(eventsData.events)
                setCountsBySource(counts)
            } catch (err) {
                console.error('Failed to fetch events:', err)
                setError(err instanceof Error ? err : new Error('Failed to fetch events'))
            } finally {
                setIsLoading(false)
                pendingRefreshRef.current = null
            }
        })()

        pendingRefreshRef.current = promise
        return promise
    }, [])

    // Initial load and when filters change
    useEffect(() => {
        pendingRefreshRef.current = null // allow new fetch on filter change
        refresh()
    }, [filters, refresh])

    // Listen for new events (realtime or local optimistics)
    useEffect(() => {
        const handleNewEvent = () => {
            refresh()
        }

        window.addEventListener('händelse', handleNewEvent)
        return () => window.removeEventListener('händelse', handleNewEvent)
    }, [refresh])

    // Emit wrapper that also refreshes
    const emit = useCallback(async (input: CreateEventInput) => {
        const event = await emitEvent(input)
        // The custom event listener will trigger refresh
        return event
    }, [])

    return {
        events,
        countsBySource,
        totalCount: events.length,
        filters,
        setFilters,
        refresh,
        emit,
        emitAI: emitAIEvent,
        emitUser: emitUserEvent,
        emitSystem: emitSystemEvent,
        emitAuthority: emitAuthorityEvent,
        isLoading,
        error
    }
}

/**
 * Hook for paginated events (Timeline View)
 */
export function useEventsPaginated(pageSize: number = 20, initialFilters?: EventFilters) {
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState<EventFilters>(initialFilters || {})
    const [events, setEvents] = useState<HändelseEvent[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const refresh = useCallback(async () => {
        setIsLoading(true)
        try {
            const offset = (page - 1) * pageSize
            const { events, totalCount } = await getEvents({ ...filters, limit: pageSize, offset })
            setEvents(events)
            setTotalCount(totalCount)
        } catch (err) {
            console.error('Failed to fetch paginated events:', err)
            setError(err instanceof Error ? err : new Error('Failed to fetch events'))
        } finally {
            setIsLoading(false)
        }
    }, [page, pageSize, filters])

    useEffect(() => {
        refresh()
    }, [refresh])

    // Reset page when filters change (deep comparison or simple dependency)
    useEffect(() => {
        setPage(1)
    }, [filters.source, filters.category, filters.search, filters.dateFrom, filters.dateTo])

    return {
        events,
        totalCount,
        page,
        setPage,
        pageSize,
        filters,
        setFilters,
        isLoading,
        error,
        refresh
    }
}

/**
 * Get a single event by ID (helper, though in a real app might use a separate service call)
 */
export function useEvent(id: string): { event: HändelseEvent | null, isLoading: boolean } {
    const [event, setEvent] = useState<HändelseEvent | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Quick improvement: fetch single event from DB instead of filtering all
        // For now, reusing getEvents for simplicity of migration
        async function fetchEvent() {
            setIsLoading(true)
            const eventsData = await getEvents()
            const found = eventsData.events.find(e => e.id === id)
            setEvent(found || null)
            setIsLoading(false)
        }

        fetchEvent()
    }, [id])

    return { event, isLoading }
}

// Re-export types for convenience
export type { CreateEventInput } from '@/types/events'
