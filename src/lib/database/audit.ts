/**
 * Server-side audit logging utility.
 *
 * Inserts into the events table for server-side operations
 * (API routes, services) where the client-side hooks are unavailable.
 */

import { createBrowserClient } from '@/lib/database/client'
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
    | 'verification_attachments'
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
        const supabase = createBrowserClient()
        const [{ data: { user } }, { data: company }] = await Promise.all([
            supabase.auth.getUser(),
            supabase.from('companies').select('id').single(),
        ])
        if (!user) return

        const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'System'

        await supabase.from('events').insert({
            user_id: user.id,
            company_id: company?.id ?? null,
            source: 'system',
            category: 'bokföring',
            action: params.action,
            title: params.entityName ?? `${params.entityType} ${params.action}`,
            actor_type: 'user',
            actor_id: user.id,
            actor_name: userName as string,
            metadata: {
                entityType: params.entityType,
                entityId: params.entityId,
                ...params.metadata,
            } as unknown as Json,
            related_to: params.entityId
                ? [{ type: params.entityType, id: params.entityId }] as unknown as Json
                : null,
        })
    } catch (error) {
        // Audit logging should never break the main operation
        console.error('[audit] Failed to log event:', error)
    }
}
