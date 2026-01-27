/**
 * Verifications Repository
 * 
 * Handles all verification-related database operations.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { VerificationInput } from './types'

type DbClient = SupabaseClient<Database>

export function createVerificationsRepository(supabase: DbClient) {
    return {
        /**
         * Get verifications with optional limit
         */
        async list(limit?: number) {
            let query = supabase
                .from('verifications')
                .select('*')
                .order('created_at', { ascending: false })

            if (limit) query = query.limit(limit)
            else query = query.limit(50) // Default pagination

            const { data } = await query
            return data || []
        },

        /**
         * Get a single verification by ID
         */
        async getById(id: string) {
            const { data, error } = await supabase
                .from('verifications')
                .select('*')
                .eq('id', id)
                .single()

            if (error) return null
            return data
        },

        /**
         * Create a new verification
         */
        async create(verification: VerificationInput) {
            let id = verification.id
            if (!id) {
                // Simple sequence generation via count
                const { count } = await supabase
                    .from('verifications')
                    .select('*', { count: 'exact', head: true })
                id = `A-${(count || 0) + 1}`
            }

            const { data, error } = await supabase
                .from('verifications')
                .insert({
                    id,
                    date: verification.date,
                    description: verification.description,
                    rows: verification.rows
                })
                .select()
                .single()

            if (error) {
                console.error('Error adding verification:', error)
                throw error
            }

            return data || verification
        },
    }
}

export type VerificationsRepository = ReturnType<typeof createVerificationsRepository>
