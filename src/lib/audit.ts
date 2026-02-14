/**
 * Server-side audit logging utility.
 *
 * Inserts directly into the activity_log table for server-side operations
 * (API routes, services) where the client-side useActivityLog hook is unavailable.
 */

import { getSupabaseClient } from '@/lib/database/supabase'
import type { Json } from '@/types/database'

export type AuditAction =
    | 'created'
    | 'updated'
    | 'deleted'
    | 'booked'
    | 'archived'
    | 'exported'

export type AuditEntityType =
    | 'verifications'
    | 'transactions'
    | 'receipts'
    | 'payslips'
    | 'employees'
    | 'shareholders'

export async function logAuditEntry(params: {
    action: AuditAction
    entityType: AuditEntityType
    entityId?: string
    entityName?: string
    metadata?: Record<string, unknown>
}): Promise<void> {
    try {
        const supabase = getSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('activity_log').insert({
            action: params.action,
            entity_type: params.entityType,
            entity_id: params.entityId ?? null,
            entity_name: params.entityName ?? null,
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
            user_email: user.email ?? null,
            metadata: (params.metadata as Json) ?? null,
        })
    } catch (error) {
        // Audit logging should never break the main operation
        console.error('[audit] Failed to log activity:', error)
    }
}
