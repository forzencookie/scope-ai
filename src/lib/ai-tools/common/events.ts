/**
 * Common AI Tools - Events (Händelser)
 *
 * Tools for managing events, activity log, and calendar.
 * Uses event-service.ts to query real data from Supabase.
 */

import { defineTool } from '../registry'
import { getEvents as getEventsFromDB, emitEvent } from '@/services/common/event-service'
import { taxService } from '@/services/tax/tax-service'
import { activityService } from '@/services/common/activity-service'
import type { EventSource, EventCategory } from '@/types/events'

// =============================================================================
// Types
// =============================================================================

export interface Event {
    id: string
    title: string
    description?: string
    date: string
    source: EventSource
    category?: EventCategory
    type: 'info' | 'warning' | 'deadline' | 'action' | 'milestone'
    status?: 'pending' | 'completed' | 'overdue' | 'draft' | 'submitted'
    metadata?: Record<string, unknown>
}

export interface GetEventsParams {
    source?: string
    category?: string
    startDate?: string
    endDate?: string
    limit?: number
}

// =============================================================================
// Event Query Tools
// =============================================================================

export const getEventsTool = defineTool<GetEventsParams, Event[]>({
    name: 'get_events',
    description: 'Hämta händelser och aktivitetslogg. Kan filtreras på källa, kategori och datum.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: [],
  domain: 'common',
    keywords: ['händelse', 'aktivitet', 'logg', 'historik'],
    parameters: {
        type: 'object',
        properties: {
            source: { type: 'string', description: 'Filtrera på källa (ai, user, system, document, authority)' },
            category: { type: 'string', description: 'Filtrera på kategori (bokföring, skatt, rapporter, parter, löner, dokument, system, bolagsåtgärd)' },
            startDate: { type: 'string', description: 'Från datum (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'Till datum (YYYY-MM-DD)' },
            limit: { type: 'number', description: 'Max antal händelser (standard: 20)' },
        },
    },
    execute: async (params) => {
        const limit = params.limit || 20

        // Query real events from database
        const { events: dbEvents, totalCount } = await getEventsFromDB({
            limit,
            source: params.source as EventSource | undefined,
            category: params.category as EventCategory | undefined,
            dateFrom: params.startDate ? new Date(params.startDate) : undefined,
            dateTo: params.endDate ? new Date(params.endDate) : undefined,
        })

        // Map to simplified Event type for AI
        const events: Event[] = dbEvents.map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            date: e.timestamp.toISOString().split('T')[0],
            source: e.source,
            category: e.category,
            type: mapCategoryToType(e.category, e.status),
            status: e.status as Event['status'],
            metadata: e.metadata,
        }))

        return {
            success: true,
            data: events,
            message: events.length > 0
                ? `Hittade ${events.length} händelser${totalCount > events.length ? ` (av totalt ${totalCount})` : ''}.`
                : 'Inga händelser hittades för de valda filtren.',
        }
    },
})

/**
 * Map event category to display type
 */
function mapCategoryToType(category?: EventCategory, status?: string): Event['type'] {
    if (status === 'pending_signature' || status === 'ready_to_send') return 'action'
    if (category === 'skatt') return 'deadline'
    if (category === 'bolagsåtgärd') return 'milestone'
    if (category === 'system') return 'info'
    return 'info'
}

// =============================================================================
// Create Event Tool
// =============================================================================

export interface CreateEventParams {
    title: string
    description?: string
    date: string
    category?: 'bokföring' | 'skatt' | 'rapporter' | 'parter' | 'löner' | 'dokument' | 'system'
    reminderDays?: number
}

export const createEventTool = defineTool<CreateEventParams, Event>({
    name: 'create_event',
    description: 'Skapa en ny händelse eller påminnelse i kalendern.',
    category: 'write',
    requiresConfirmation: false,
  allowedCompanyTypes: [],
  // Low-risk action
  domain: 'common',
    keywords: ['skapa', 'händelse', 'påminnelse', 'kalender'],
    parameters: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Titel på händelsen' },
            description: { type: 'string', description: 'Beskrivning (valfritt)' },
            date: { type: 'string', description: 'Datum (YYYY-MM-DD)' },
            category: { type: 'string', enum: ['bokföring', 'skatt', 'rapporter', 'parter', 'löner', 'dokument', 'system'], description: 'Kategori för händelsen' },
            reminderDays: { type: 'number', description: 'Skicka påminnelse X dagar innan' },
        },
        required: ['title', 'date'],
    },
    execute: async (params) => {
        // Create event in database using emitEvent
        const category = params.category || 'system'

        const dbEvent = await emitEvent({
            source: 'user',
            category: category as EventCategory,
            action: 'created',
            title: params.title,
            description: params.description,
            actor: {
                type: 'user',
                name: 'AI Assistant',
            },
            metadata: params.reminderDays ? { reminderDays: params.reminderDays } : undefined,
        })

        const event: Event = {
            id: dbEvent?.id || `evt-${Date.now()}`,
            title: params.title,
            description: params.description,
            date: params.date,
            source: 'user',
            category: category as EventCategory,
            type: 'info',
            status: 'pending',
        }

        const categoryLabels: Record<string, string> = {
            'bokföring': 'Bokföring',
            'skatt': 'Skatt',
            'rapporter': 'Rapporter',
            'parter': 'Parter',
            'löner': 'Löner',
            'dokument': 'Dokument',
            'system': 'System',
        }

        return {
            success: true,
            data: event,
            message: `Händelse "${params.title}" skapad under ${categoryLabels[category]} för ${params.date}.${params.reminderDays ? ` Påminnelse ${params.reminderDays} dagar innan.` : ''}`,
            navigation: {
                route: '/dashboard/handelser?view=calendar',
                label: 'Visa kalender',
            },
        }
    },
})

// =============================================================================
// Upcoming Deadlines Tool
// =============================================================================

export interface UpcomingDeadline {
    id: string
    title: string
    description: string
    deadline: string
    daysUntil: number
    category: 'tax' | 'compliance' | 'accounting' | 'hr' | 'custom'
    priority: 'high' | 'medium' | 'low'
    actionUrl?: string
}

export const getUpcomingDeadlinesTool = defineTool<{ days?: number }, UpcomingDeadline[]>({
    name: 'get_upcoming_deadlines',
    description: 'Visa kommande deadlines för skatt, bokföring och bolagsärenden.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: [],
  domain: 'common',
    keywords: ['deadline', 'förfallodag', 'datum', 'kommande'],
    parameters: {
        type: 'object',
        properties: {
            days: { type: 'number', description: 'Antal dagar framåt (standard: 60)' },
        },
    },
    execute: async (params) => {
        const days = params.days || 60
        const data = await taxService.getUpcomingDeadlines(days)
        const today = new Date()

        const deadlines: UpcomingDeadline[] = data.map(item => {
            const deadlineDate = new Date(item.due_date)
            const diffTime = deadlineDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            return {
                id: item.id,
                title: item.title || 'Deadline',
                description: item.description || '',
                deadline: item.due_date,
                daysUntil: diffDays,
                category: (item.deadline_type || 'tax') as UpcomingDeadline['category'],
                priority: (diffDays < 14 ? 'high' : diffDays < 30 ? 'medium' : 'low'),
                actionUrl: (item.metadata && typeof item.metadata === 'object' && 'action_url' in item.metadata) 
                    ? String(item.metadata.action_url) 
                    : undefined,
            }
        })

        const urgentCount = deadlines.filter(d => d.priority === 'high').length

        return {
            success: true,
            data: deadlines,
            message: `${deadlines.length} deadlines inom ${days} dagar. ${urgentCount} är brådskande.`,
        }
    },
})

// =============================================================================
// Activity Summary Tool
// =============================================================================

export interface ActivitySummary {
    period: string
    totalEvents: number
    bySource: Record<string, number>
    byType: Record<string, number>
    highlights: string[]
}

export const getActivitySummaryTool = defineTool<{ period?: 'week' | 'month' | 'quarter' }, ActivitySummary>({
    name: 'get_activity_summary',
    description: 'Visa en sammanfattning av aktivitet för en period.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: [],
  domain: 'common',
    keywords: ['sammanfattning', 'aktivitet', 'period', 'översikt'],
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', enum: ['week', 'month', 'quarter'], description: 'Period att sammanfatta (standard: month)' },
        },
    },
    execute: async (params, context) => {
        const period = params.period || 'month'
        const days = period === 'week' ? 7 : period === 'quarter' ? 90 : 30
        
        const companyId = context?.companyId
        if (!companyId) return { success: false, error: 'Inget företag valt.' }

        const summary = await activityService.getActivitySummary(companyId, days)

        return {
            success: true,
            data: summary,
            message: summary.highlights.join(' '),
        }
    },
})

// =============================================================================
// Calendar Export Tool
// =============================================================================

export interface ExportToCalendarParams {
    calendarType: 'google' | 'outlook' | 'ical'
    eventTypes?: string[]
}

export const exportToCalendarTool = defineTool<ExportToCalendarParams, { exported: boolean; url?: string }>({
    name: 'export_to_calendar',
    description: 'Exportera deadlines och händelser till extern kalender.',
    category: 'write',
    requiresConfirmation: true,
  allowedCompanyTypes: [],
  domain: 'common',
    keywords: ['exportera', 'kalender', 'google', 'outlook'],
    parameters: {
        type: 'object',
        properties: {
            calendarType: { type: 'string', enum: ['google', 'outlook', 'ical'], description: 'Typ av kalender' },
            eventTypes: { type: 'array', items: { type: 'string' }, description: 'Vilka händelsetyper att exportera' },
        },
        required: ['calendarType'],
    },
    execute: async (params) => {
        const calendarLabels: Record<string, string> = {
            google: 'Google Kalender',
            outlook: 'Microsoft Outlook',
            ical: 'iCal/Apple Kalender',
        }

        return {
            success: true,
            data: {
                exported: false,
                url: `/api/calendar/export?type=${params.calendarType}`,
            },
            message: `Redo att exportera till ${calendarLabels[params.calendarType]}.`,
            confirmationRequired: {
                title: 'Exportera till kalender',
                description: `Skapa en prenumeration i ${calendarLabels[params.calendarType]} för att automatiskt synka deadlines.`,
                summary: [
                    { label: 'Kalender', value: calendarLabels[params.calendarType] },
                    { label: 'Händelser', value: params.eventTypes?.join(', ') || 'Alla deadlines' },
                    { label: 'Uppdatering', value: 'Automatisk synkning' },
                ],
                action: { toolName: 'export_to_calendar', params },
            },
        }
    },
})

// =============================================================================
// Walkthrough History Tools
// =============================================================================

export interface GetWalkthroughHistoryParams {
    search?: string
    limit?: number
}

export interface WalkthroughHistoryItem {
    id: string
    title: string
    subtitle?: string
    timestamp: string
}

export const getWalkthroughHistoryTool = defineTool<GetWalkthroughHistoryParams, WalkthroughHistoryItem[]>({
    name: 'get_walkthrough_history',
    description: 'Hämta sparade walkthroughs (genomgångar). Kan sökas på titel.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: [],
  domain: 'common',
    keywords: ['genomgång', 'walkthrough', 'historik', 'sparad'],
    parameters: {
        type: 'object',
        properties: {
            search: { type: 'string', description: 'Sök på titel (valfritt)' },
            limit: { type: 'number', description: 'Max antal resultat (standard: 10)' },
        },
    },
    execute: async (params) => {
        const limit = params.limit || 10

        const { events: dbEvents } = await getEventsFromDB({
            limit,
            search: params.search,
        })

        // Filter to walkthrough events only
        const walkthroughEvents = dbEvents.filter(e => e.action === 'walkthrough_generated')

        const items: WalkthroughHistoryItem[] = walkthroughEvents.map(e => ({
            id: e.id,
            title: e.title,
            subtitle: e.description,
            timestamp: e.timestamp.toISOString(),
        }))

        return {
            success: true,
            data: items,
            message: items.length > 0
                ? `Hittade ${items.length} sparade genomgångar.`
                : 'Inga sparade genomgångar hittades.',
        }
    },
})

export interface ShowWalkthroughParams {
    eventId: string
}

export const showWalkthroughTool = defineTool<ShowWalkthroughParams, Record<string, unknown>>({
    name: 'show_walkthrough',
    description: 'Visa en sparad walkthrough (genomgång) genom att hämta den från händelsehistoriken.',
    category: 'read',
    requiresConfirmation: false,
  allowedCompanyTypes: [],
  domain: 'common',
    keywords: ['visa', 'genomgång', 'walkthrough'],
    parameters: {
        type: 'object',
        properties: {
            eventId: { type: 'string', description: 'ID för händelsen som innehåller walkthrough-data' },
        },
        required: ['eventId'],
    },
    execute: async (params) => {
        const { events: allEvents } = await getEventsFromDB({ limit: 100 })
        const event = allEvents.find(e => e.id === params.eventId)

        if (!event) {
            return {
                success: false,
                data: {},
                message: 'Kunde inte hitta den angivna genomgången.',
            }
        }

        const walkthroughBlocks = (event.metadata as Record<string, unknown>)?.walkthroughBlocks
        if (!walkthroughBlocks) {
            return {
                success: false,
                data: {},
                message: 'Händelsen innehåller ingen sparad genomgång.',
            }
        }

        return {
            success: true,
            data: walkthroughBlocks as Record<string, unknown>,
            message: `Visar genomgång: "${event.title}"`,
            walkthrough: walkthroughBlocks,
        }
    },
})

// =============================================================================
// Export
// =============================================================================

export const eventTools = [
    getEventsTool,
    createEventTool,
    getUpcomingDeadlinesTool,
    getActivitySummaryTool,
    exportToCalendarTool,
    getWalkthroughHistoryTool,
    showWalkthroughTool,
]
