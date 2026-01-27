/**
 * Corporate Repository
 * 
 * Handles corporate documents, shareholders, and compliance-related operations.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { CorporateDocumentInput, ShareholderInput } from './types'

type DbClient = SupabaseClient<Database>

export function createCorporateRepository(supabase: DbClient) {
    return {
        // ====================================================================
        // Corporate Documents
        // ====================================================================

        /**
         * Get corporate documents with optional limit
         */
        async listDocuments(limit?: number) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let query = supabase.from('corporate_documents' as any)
                .select('*')
                .order('date', { ascending: false })

            if (limit) query = query.limit(limit)
            else query = query.limit(50) // Default pagination

            const { data } = await query
            return data || []
        },

        /**
         * Create a new corporate document
         */
        async createDocument(doc: CorporateDocumentInput) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await supabase.from('corporate_documents' as any)
                .insert({
                    id: doc.id || undefined,
                    type: doc.type,
                    title: doc.title,
                    date: doc.date,
                    content: doc.content,
                    status: doc.status || 'draft',
                    source: doc.source || 'manual',
                    created_by: doc.createdBy || doc.created_by,
                    metadata: doc.metadata || {}
                })
                .select()
                .single()

            if (error) console.error('Supabase Error (addCorporateDocument):', error)
            return data || doc
        },

        // ====================================================================
        // Shareholders
        // ====================================================================

        /**
         * Get shareholders with optional limit
         */
        async listShareholders(limit?: number) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let query = supabase.from('shareholders' as any)
                .select('*')
                .order('shares_count', { ascending: false })

            if (limit) query = query.limit(limit)
            else query = query.limit(100) // Default pagination

            const { data } = await query
            return data || []
        },

        /**
         * Create a new shareholder
         */
        async createShareholder(shareholder: ShareholderInput) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await supabase.from('shareholders' as any)
                .insert({
                    name: shareholder.name,
                    ssn_org_nr: shareholder.ssn_org_nr || '',
                    shares_count: shareholder.shares_count || 0,
                    shares_percentage: shareholder.shares_percentage || 0,
                    share_class: shareholder.share_class || 'B',
                })
                .select()
                .single()

            if (error) {
                console.error('Supabase Error (addShareholder):', error)
                throw new Error(`Failed to add shareholder: ${error.message}`)
            }
            return data
        },

        /**
         * Update a shareholder
         */
        async updateShareholder(id: string, updates: Partial<ShareholderInput>) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await supabase.from('shareholders' as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) console.error('Supabase Error (updateShareholder):', error)
            return data || { id, ...updates }
        },

        // ====================================================================
        // Roadmaps & Planning
        // ====================================================================

        /**
         * Get user's active roadmaps with steps
         */
        async listRoadmaps(userId: string) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await supabase
                .from('roadmaps' as any)
                .select('*, steps:roadmap_steps(*)')
                .eq('user_id', userId)
                .eq('status', 'active')
                .order('created_at', { ascending: false })

            if (error) console.error('Supabase Error (getRoadmaps):', error)
            return data || []
        },
    }
}

export type CorporateRepository = ReturnType<typeof createCorporateRepository>
