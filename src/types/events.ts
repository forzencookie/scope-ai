// ============================================
// Händelser Event Types
// The company's immutable audit trail
// ============================================

/**
 * Event source - who/what triggered this event
 */
export type EventSource = 'ai' | 'user' | 'system' | 'document' | 'authority'

/**
 * Event category - which pillar/area this relates to
 */
export type EventCategory =
    | 'bokföring'
    | 'skatt'
    | 'rapporter'
    | 'parter'
    | 'löner'
    | 'dokument'
    | 'system'
    | 'bolagsåtgärd' // Corporate actions

/**
 * Event status - workflow state for actionable events
 */
export type EventStatus =
    | 'draft'             // Utkast
    | 'pending_signature' // Väntar på signatur
    | 'ready_to_send'     // Klar att skickas
    | 'submitted'         // Skickad
    | 'registered'        // Registrerad

/**
 * Corporate action type - specific corporate events
 */
export type CorporateActionType =
    | 'board_change'      // Styrelseändring
    | 'dividend'          // Utdelning
    | 'capital_change'    // Kapitalförändring
    | 'authority_filing'  // Myndighetsanmälan
    | 'statute_change'    // Bolagsordningsändring
    | 'roadmap'           // Färdplan/Planering

/**
 * Actor who triggered the event
 */
export interface EventActor {
    type: 'ai' | 'user' | 'system' | 'authority'
    id?: string              // User ID, AI model name, or authority code
    name?: string            // Display name
}

/**
 * Related entity that this event concerns
 */
export interface RelatedEntity {
    type: 'transaction' | 'invoice' | 'receipt' | 'document' | 'declaration' | 'report' | 'payroll'
    id: string
    label?: string           // Human-readable label
}

/**
 * Proof of action (for compliance)
 */
export interface EventProof {
    type: 'signature' | 'confirmation' | 'reference' | 'hash'
    value: string            // e.g., confirmation number, signature hash
}

/**
 * The main event type - represents a single entry in the company timeline
 */
export interface HändelseEvent {
    // Identity
    id: string               // UUID
    timestamp: Date          // When it happened

    // Classification
    source: EventSource
    category: EventCategory
    action: string           // e.g., 'classified', 'submitted', 'approved', 'created'

    // Actor
    actor: EventActor

    // Content
    title: string            // Human-readable summary (e.g., "AI classified 45 transactions")
    description?: string     // Detailed explanation

    // Context
    relatedTo?: RelatedEntity[]

    // Corporate Action fields (optional)
    status?: EventStatus                    // Workflow status
    corporateActionType?: CorporateActionType  // Type of corporate action
    relatedDocuments?: string[]             // Document IDs linked to this event

    // Proof & metadata
    proof?: EventProof
    metadata?: Record<string, unknown>

    // Immutability (for audit chain)
    hash?: string            // SHA-256 for integrity
    previousHash?: string    // Links to previous event
}

/**
 * Input for creating a new event (without auto-generated fields)
 */
export type CreateEventInput = Omit<HändelseEvent, 'id' | 'timestamp' | 'hash' | 'previousHash'>

/**
 * Filters for querying events
 */
export interface EventFilters {
    source?: EventSource | EventSource[]
    category?: EventCategory | EventCategory[]
    dateFrom?: Date
    dateTo?: Date
    search?: string
    relatedToId?: string
}

// ============================================
// UI Helpers
// ============================================

/**
 * Visual configuration for each event source
 */
export const eventSourceMeta: Record<EventSource, {
    label: string
    icon: string
    colorClass: string
    bgClass: string
}> = {
    ai: {
        label: 'AI',
        icon: 'Sparkles',
        colorClass: 'text-purple-600 dark:text-purple-400',
        bgClass: 'bg-purple-100 dark:bg-purple-950/50',
    },
    user: {
        label: 'Användare',
        icon: 'User',
        colorClass: 'text-blue-600 dark:text-blue-400',
        bgClass: 'bg-blue-100 dark:bg-blue-950/50',
    },
    system: {
        label: 'System',
        icon: 'Settings',
        colorClass: 'text-gray-600 dark:text-gray-400',
        bgClass: 'bg-gray-100 dark:bg-gray-800/50',
    },
    document: {
        label: 'Dokument',
        icon: 'FileText',
        colorClass: 'text-amber-600 dark:text-amber-400',
        bgClass: 'bg-amber-100 dark:bg-amber-950/50',
    },
    authority: {
        label: 'Myndighet',
        icon: 'Building2',
        colorClass: 'text-orange-600 dark:text-orange-400',
        bgClass: 'bg-orange-100 dark:bg-orange-950/50',
    },
}

/**
 * Visual configuration for each event category
 */
export const eventCategoryMeta: Record<EventCategory, {
    label: string
    colorClass: string
}> = {
    bokföring: { label: 'Bokföring', colorClass: 'text-emerald-600' },
    skatt: { label: 'Skatt', colorClass: 'text-purple-600' },
    rapporter: { label: 'Rapporter', colorClass: 'text-orange-600' },
    parter: { label: 'Parter', colorClass: 'text-blue-600' },
    löner: { label: 'Löner', colorClass: 'text-pink-600' },
    dokument: { label: 'Dokument', colorClass: 'text-amber-600' },
    system: { label: 'System', colorClass: 'text-gray-600' },
    bolagsåtgärd: { label: 'Bolagsåtgärd', colorClass: 'text-indigo-600' },
}

/**
 * Visual configuration for event statuses
 */
export const eventStatusMeta: Record<EventStatus, {
    label: string
    colorClass: string
    bgClass: string
}> = {
    draft: {
        label: 'Utkast',
        colorClass: 'text-gray-600 dark:text-gray-400',
        bgClass: 'bg-gray-100 dark:bg-gray-800/50',
    },
    pending_signature: {
        label: 'Väntar på signatur',
        colorClass: 'text-amber-600 dark:text-amber-400',
        bgClass: 'bg-amber-100 dark:bg-amber-950/50',
    },
    ready_to_send: {
        label: 'Klar att skickas',
        colorClass: 'text-blue-600 dark:text-blue-400',
        bgClass: 'bg-blue-100 dark:bg-blue-950/50',
    },
    submitted: {
        label: 'Skickad',
        colorClass: 'text-purple-600 dark:text-purple-400',
        bgClass: 'bg-purple-100 dark:bg-purple-950/50',
    },
    registered: {
        label: 'Registrerad',
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        bgClass: 'bg-emerald-100 dark:bg-emerald-950/50',
    },
}

/**
 * Visual configuration for corporate action types
 */
export const corporateActionTypeMeta: Record<CorporateActionType, {
    label: string
    icon: string
}> = {
    board_change: { label: 'Styrelseändring', icon: 'Users' },
    dividend: { label: 'Utdelning', icon: 'Coins' },
    capital_change: { label: 'Kapitalförändring', icon: 'TrendingUp' },
    authority_filing: { label: 'Myndighetsanmälan', icon: 'Building2' },
    statute_change: { label: 'Bolagsordningsändring', icon: 'FileText' },
    roadmap: { label: 'Ny färdplan', icon: 'Map' },
}
