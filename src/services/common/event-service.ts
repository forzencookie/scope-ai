// ============================================
// Händelser Event Service
// Manages event emission and storage via Supabase
// ============================================

import { nullToUndefined } from '@/lib/utils'
import type {
    HändelseEvent,
    CreateEventInput,
    EventFilters,
    EventSource,
    EventCategory,
    EventActor,
    EventStatus,
    EventProof,
    CorporateActionType,
    RelatedEntity,
} from '@/types/events'
import { createBrowserClient } from '@/lib/database/client'
import type { Database } from '@/types/database'

type EventsRow = Database['public']['Tables']['events']['Row']
type EventsInsert = Database['public']['Tables']['events']['Insert']

/**
 * Map DB result to HändelseEvent
 */
function mapDtoToEvent(dto: EventsRow): HändelseEvent {
    return {
        id: dto.id,
        timestamp: new Date(dto.timestamp ?? dto.created_at ?? Date.now()),
        source: (dto.source ?? 'system') as EventSource,
        category: (dto.category ?? 'system') as EventCategory,
        action: dto.action ?? '',
        title: dto.title ?? '',
        actor: {
            type: (dto.actor_type ?? 'system') as EventActor['type'],
            id: nullToUndefined(dto.actor_id),
            name: nullToUndefined(dto.actor_name),
        },
        description: nullToUndefined(dto.description),
        metadata: (dto.metadata && typeof dto.metadata === 'object' && !Array.isArray(dto.metadata))
            ? dto.metadata as Record<string, unknown>
            : undefined,
        relatedTo: Array.isArray(dto.related_to)
            ? dto.related_to as unknown as RelatedEntity[]
            : undefined,
        status: nullToUndefined(dto.status) as EventStatus | undefined,
        corporateActionType: nullToUndefined(dto.corporate_action_type) as CorporateActionType | undefined,
        proof: (dto.proof && typeof dto.proof === 'object' && !Array.isArray(dto.proof))
            ? dto.proof as unknown as EventProof
            : undefined,
        hash: nullToUndefined(dto.hash),
        previousHash: nullToUndefined(dto.previous_hash),
    }
}

/**
 * Get all events from storage
 */
export async function getEvents(filters?: EventFilters & { limit?: number; offset?: number }): Promise<{ events: HändelseEvent[]; totalCount: number }> {
    const supabase = createBrowserClient()

    // Get company context for explicit filtering
    const { data: company } = await supabase.from('companies').select('id').single()
    if (!company) return { events: [], totalCount: 0 }

    let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('company_id', company.id)
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
    const supabase = createBrowserClient()
    const counts: Record<EventSource, number> = {
        ai: 0, user: 0, system: 0, document: 0, authority: 0,
    }

    // Get company context for explicit filtering
    const { data: company } = await supabase.from('companies').select('id').single()
    if (!company) return counts

    // Parallelize count queries for known sources
    const sources: EventSource[] = ['ai', 'user', 'system', 'document', 'authority']

    await Promise.all(sources.map(async (source) => {
        const { count } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .eq('source', source)

        counts[source] = count || 0
    }))

    return counts
}

/**
 * Emit a new event to the timeline
 */
export async function emitEvent(input: CreateEventInput): Promise<HändelseEvent | null> {
    const supabase = createBrowserClient()

    // Get current user and company context for security
    const [{ data: { user } }, { data: company }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('companies').select('id').single()
    ])

    if (!user || !company) {
        console.error('Cannot emit event: no authenticated context')
        return null
    }

    // For hash linking, we'd ideally fetch the last event server-side or via a function.
    // For now, let's omit the hash chaining in the client-side code or implement a basic version.

    const dbPayload: EventsInsert = {
        user_id: user.id,
        company_id: company.id,
        timestamp: new Date().toISOString(),
        source: input.source,
        category: input.category,
        action: input.action,
        title: input.title,
        actor_type: input.actor.type,
        actor_id: input.actor.id,
        actor_name: input.actor.name,
        description: input.description,
        metadata: input.metadata as EventsInsert['metadata'],
        related_to: input.relatedTo as EventsInsert['related_to'],
        status: input.status,
        corporate_action_type: input.corporateActionType,
        proof: input.proof as EventsInsert['proof'],
    }

    const { data, error } = await supabase
        .from('events')
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

// ============================================
// Activity Summary (merged from activity-service)
// ============================================

import type { ActivitySummary } from '@/lib/ai-schema'

export async function getActivitySummary(companyId: string, days: number = 30): Promise<ActivitySummary> {
    const supabase = createBrowserClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
        .from('events')
        .select('action, source, category')
        .eq('company_id', companyId)
        .gte('timestamp', startDate.toISOString())

    if (error) throw error

    const totalEvents = (data || []).length
    const bySource: Record<string, number> = {}
    const byType: Record<string, number> = {}

    for (const row of (data || [])) {
        const source = row.source || 'system'
        const type = row.category || 'other'
        bySource[source] = (bySource[source] || 0) + 1
        byType[type] = (byType[type] || 0) + 1
    }

    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0]

    return {
        period: `senaste ${days} dagarna`,
        totalEvents,
        bySource,
        byType,
        highlights: [
            `${totalEvents} händelser loggade senaste perioden.`,
            topType ? `Mest aktiva kategori: ${topType}.` : 'Ingen aktivitet loggad.'
        ]
    }
}
