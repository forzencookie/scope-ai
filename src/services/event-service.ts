// ============================================
// Händelser Event Service
// Manages event emission and storage via Supabase
// ============================================

import type {
    HändelseEvent,
    CreateEventInput,
    EventFilters,
    EventSource,
    EventCategory,
} from '@/types/events'
import { getSupabaseClient } from '@/lib/database/supabase'

/**
 * Map DB result to HändelseEvent
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDtoToEvent(dto: any): HändelseEvent {
    return {
        id: dto.id,
        timestamp: new Date(dto.timestamp),
        source: dto.source,
        category: dto.category,
        action: dto.action,
        title: dto.title,
        actor: {
            type: dto.actor_type,
            id: dto.actor_id,
            name: dto.actor_name,
        },
        description: dto.description || undefined,
        metadata: dto.metadata || undefined,
        relatedTo: dto.related_to || undefined,
        status: dto.status || undefined,
        corporateActionType: dto.corporate_action_type || undefined,
        proof: dto.proof || undefined,
        hash: dto.hash || undefined,
        previousHash: dto.previous_hash || undefined,
    }
}

/**
 * Get all events from storage
 */
export async function getEvents(filters?: EventFilters & { limit?: number; offset?: number }): Promise<{ events: HändelseEvent[]; totalCount: number }> {
    const supabase = getSupabaseClient()

    let query = supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('events' as any)
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })

    if (filters) {
        if (filters.limit) {
            const offset = filters.offset || 0
            query = query.range(offset, offset + filters.limit - 1)
        }
        if (filters.source) {
            const sources = Array.isArray(filters.source) ? filters.source : [filters.source]
            query = query.in('source', sources)
        }
        if (filters.category) {
            const categories = Array.isArray(filters.category) ? filters.category : [filters.category]
            query = query.in('category', categories)
        }
        if (filters.dateFrom) {
            query = query.gte('timestamp', filters.dateFrom.toISOString())
        }
        if (filters.dateTo) {
            query = query.lte('timestamp', filters.dateTo.toISOString())
        }
        if (filters.search) {
            query = query.ilike('title', `%${filters.search}%`)
        }
        if (filters.relatedToId) {
            // JSONB containment search for related_to array
            query = query.contains('related_to', [{ id: filters.relatedToId }])
        }
    }

    const { data, error, count } = await query

    if (error) {
        console.error('Error fetching events:', error)
        return { events: [], totalCount: 0 }
    }

    return {
        events: (data || []).map(mapDtoToEvent),
        totalCount: count || 0
    }
}

/**
 * Get event counts by source
 */
export async function getEventCountsBySource(): Promise<Record<EventSource, number>> {
    const supabase = getSupabaseClient()
    const counts: Record<EventSource, number> = {
        ai: 0, user: 0, system: 0, document: 0, authority: 0,
    }

    // We can't easily do a single group-by count with the JS client without RPC or raw sql,
    // so for now we might just fetch counts or all metadata. 
    // For scalability, we should use an RPC function or distinct count queries.
    // Let's do a simple grouping if the dataset isn't huge, or separate count queries.
    // A simple approach for now:

    // Parallelize count queries for known sources
    const sources: EventSource[] = ['ai', 'user', 'system', 'document', 'authority']

    await Promise.all(sources.map(async (source) => {
        const { count } = await supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from('events' as any)
            .select('*', { count: 'exact', head: true })
            .eq('source', source)

        counts[source] = count || 0
    }))

    return counts
}

/**
 * Emit a new event to the timeline
 */
export async function emitEvent(input: CreateEventInput): Promise<HändelseEvent | null> {
    const supabase = getSupabaseClient()

    // For hash linking, we'd ideally fetch the last event server-side or via a function.
    // For now, let's omit the hash chaining in the client-side code or implement a basic version.

    const dbPayload = {
        timestamp: new Date().toISOString(),
        source: input.source,
        category: input.category,
        action: input.action,
        title: input.title,
        actor_type: input.actor.type,
        actor_id: input.actor.id,
        actor_name: input.actor.name,
        description: input.description,
        metadata: input.metadata,
        related_to: input.relatedTo,
        status: input.status,
        corporate_action_type: input.corporateActionType,
        proof: input.proof,
    }

    const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('events' as any)
        .insert(dbPayload)
        .select()
        .single()

    if (error) {
        console.error('Error creating event:', error)
        return null
    }

    // Trigger local update if needed
    if (typeof window !== 'undefined') {
        const event = mapDtoToEvent(data)
        window.dispatchEvent(new CustomEvent('händelse', { detail: event }))
        return event
    }

    return mapDtoToEvent(data)
}


// ============================================
// Convenience functions for common events
// ============================================

/**
 * Emit an AI action event
 */
export async function emitAIEvent(
    action: string,
    title: string,
    category: EventCategory,
    options?: {
        description?: string
        relatedTo?: HändelseEvent['relatedTo']
        metadata?: Record<string, unknown>
    }
): Promise<HändelseEvent | null> {
    return emitEvent({
        source: 'ai',
        category,
        action,
        title,
        actor: { type: 'ai', name: 'Scope AI' },
        ...options,
    })
}

/**
 * Emit a user action event
 */
export async function emitUserEvent(
    action: string,
    title: string,
    category: EventCategory,
    options?: {
        description?: string
        relatedTo?: HändelseEvent['relatedTo']
        metadata?: Record<string, unknown>
    }
): Promise<HändelseEvent | null> {
    return emitEvent({
        source: 'user',
        category,
        action,
        title,
        actor: { type: 'user', name: 'Du' },
        ...options,
    })
}

/**
 * Emit a system event
 */
export async function emitSystemEvent(
    action: string,
    title: string,
    category: EventCategory = 'system',
    options?: {
        description?: string
        metadata?: Record<string, unknown>
    }
): Promise<HändelseEvent | null> {
    return emitEvent({
        source: 'system',
        category,
        action,
        title,
        actor: { type: 'system', name: 'System' },
        ...options,
    })
}

/**
 * Emit an authority event (Skatteverket, Bolagsverket, etc.)
 */
export async function emitAuthorityEvent(
    action: string,
    title: string,
    authority: string,
    category: EventCategory,
    options?: {
        description?: string
        proof?: HändelseEvent['proof']
        relatedTo?: HändelseEvent['relatedTo']
    }
): Promise<HändelseEvent | null> {
    return emitEvent({
        source: 'authority',
        category,
        action,
        title,
        actor: { type: 'authority', id: authority, name: authority },
        ...options,
    })
}
