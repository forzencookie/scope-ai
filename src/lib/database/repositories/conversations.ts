/**
 * Conversations Repository
 * 
 * Handles chat conversations and messages.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { MessageInput } from './types'

type DbClient = SupabaseClient<Database>

export function createConversationsRepository(supabase: DbClient) {
    return {
        /**
         * Create a new conversation
         */
        async create(title: string, userId?: string) {
            const { data, error } = await supabase
                .from('conversations')
                .insert({
                    title,
                    user_id: userId
                })
                .select()
                .single()

            if (error) console.error('Supabase Error (createConversation):', error)
            return data
        },

        /**
         * Get conversations for a user
         */
        async list(userId?: string, limit?: number) {
            let query = supabase
                .from('conversations')
                .select('*')
                .order('updated_at', { ascending: false })

            if (userId) query = query.eq('user_id', userId)
            query = query.limit(limit ?? 50) // Default pagination

            const { data, error } = await query
            if (error) console.error('Supabase Error (getConversations):', error)
            return data || []
        },

        /**
         * Get a single conversation by ID
         */
        async getById(id: string) {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', id)
                .single()

            if (error) console.error('Supabase Error (getConversation):', error)
            return data
        },

        /**
         * Delete a conversation
         */
        async delete(id: string) {
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('id', id)

            if (error) {
                console.error('Supabase Error (deleteConversation):', error)
                return false
            }
            return true
        },

        /**
         * Add a message to a conversation
         */
        async addMessage(message: MessageInput) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('messages')
                .insert({
                    conversation_id: message.conversation_id,
                    role: message.role,
                    content: message.content,
                    tool_calls: message.tool_calls,
                    tool_results: message.tool_results,
                    user_id: message.user_id
                })
                .select()
                .single()

            // Update conversation timestamp
            if (!error && message.conversation_id) {
                await supabase
                    .from('conversations')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', message.conversation_id)
            }

            if (error) console.error('Supabase Error (addMessage):', error)
            return data
        },

        /**
         * Get messages for a conversation
         */
        async getMessages(conversationId: string) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            if (error) console.error('Supabase Error (getMessages):', error)
            return data || []
        },
    }
}

export type ConversationsRepository = ReturnType<typeof createConversationsRepository>
