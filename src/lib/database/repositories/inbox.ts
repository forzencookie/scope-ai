/**
 * Inbox Repository
 * 
 * Handles inbox items and notifications.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { InboxItemInput, InboxItemRow } from './types'

type DbClient = SupabaseClient<Database>

export function createInboxRepository(supabase: DbClient) {
    return {
        /**
         * Get inbox items
         */
        async list(limit?: number) {
            const { data, error } = await supabase
                .from('inboxitems')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit ?? 50) // Default pagination

            if (error) console.error('getInboxItems error:', error)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return ((data || []) as any[]).map((row: InboxItemRow) => ({
                id: row.id,
                sender: row.sender,
                title: row.title,
                description: row.description,
                date: row.date || 'Idag',
                timestamp: new Date(row.created_at),
                category: row.category,
                read: row.read,
                starred: row.starred,
            }))
        },

        /**
         * Create a new inbox item
         */
        async create(item: InboxItemInput) {
            const { data, error } = await supabase
                .from('inboxitems')
                .insert({
                    id: item.id || undefined,
                    sender: item.sender,
                    title: item.title,
                    description: item.description,
                    date: item.date,
                    category: item.category || 'other',
                    read: item.read ?? false,
                    starred: item.starred ?? false,
                })
                .select()
                .single()

            if (error) console.error('addInboxItem error:', error)
            return data || item
        },

        /**
         * Update an inbox item
         */
        async update(id: string, updates: { read?: boolean; starred?: boolean; category?: string }) {
            const dbUpdates: { read?: boolean; starred?: boolean; category?: string } = {}
            if (updates.read !== undefined) dbUpdates.read = updates.read
            if (updates.starred !== undefined) dbUpdates.starred = updates.starred
            if (updates.category !== undefined) dbUpdates.category = updates.category

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabase
                .from('inboxitems')
                .update(dbUpdates as any)
                .eq('id', id)

            if (error) console.error('updateInboxItem error:', error)
            return { id, ...updates }
        },

        /**
         * Clear all inbox items
         */
        async clear() {
            const { error } = await supabase
                .from('inboxitems')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000')

            if (error) console.error('clearInbox error:', error)
            return { success: !error }
        },
    }
}

export type InboxRepository = ReturnType<typeof createInboxRepository>
