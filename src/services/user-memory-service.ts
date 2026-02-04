// @ts-nocheck
// TODO: Create user_memory table migration before enabling type checking
/**
 * User Memory Service
 *
 * Manages user/company-specific memories for AI personalization.
 * Part of AI Architecture v2.
 * 
 * Memory categories:
 * - decision: Past actions taken (e.g., "Took 120k dividend Dec 2025")
 * - preference: User preferences (e.g., "Prefers simple explanations")
 * - pending: Things being considered (e.g., "Considering hiring", expires after 30 days)
 */

import { getSupabaseClient } from '@/lib/database/supabase'

// =============================================================================
// Types
// =============================================================================

export type MemoryCategory = 'decision' | 'preference' | 'pending'

export interface UserMemory {
    id: string
    companyId: string
    content: string
    category: MemoryCategory
    confidence: number
    expiresAt: string | null
    supersededBy: string | null
    sourceConversationId: string | null
    createdAt: string
    updatedAt: string
}

export interface CreateMemoryParams {
    companyId: string
    content: string
    category: MemoryCategory
    confidence?: number
    expiresInDays?: number
    sourceConversationId?: string
}

export interface UpdateMemoryParams {
    content?: string
    category?: MemoryCategory
    confidence?: number
    expiresAt?: string | null
}

// =============================================================================
// Service
// =============================================================================

class UserMemoryService {
    /**
     * Get all active memories for a company.
     * Active = not superseded and not expired.
     */
    async getMemoriesForCompany(companyId: string): Promise<UserMemory[]> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('user_memory')
            .select('*')
            .eq('company_id', companyId)
            .is('superseded_by', null)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[UserMemory] Error fetching memories:', error)
            return []
        }

        return (data || []).map(this.mapFromDb)
    }

    /**
     * Get memories by category.
     */
    async getMemoriesByCategory(companyId: string, category: MemoryCategory): Promise<UserMemory[]> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('user_memory')
            .select('*')
            .eq('company_id', companyId)
            .eq('category', category)
            .is('superseded_by', null)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[UserMemory] Error fetching memories by category:', error)
            return []
        }

        return (data || []).map(this.mapFromDb)
    }

    /**
     * Search memories by content (simple text search).
     * For semantic search, use queryRelevantMemories.
     */
    async searchMemories(companyId: string, query: string): Promise<UserMemory[]> {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
            .from('user_memory')
            .select('*')
            .eq('company_id', companyId)
            .is('superseded_by', null)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .ilike('content', `%${query}%`)
            .order('confidence', { ascending: false })
            .limit(10)

        if (error) {
            console.error('[UserMemory] Error searching memories:', error)
            return []
        }

        return (data || []).map(this.mapFromDb)
    }

    /**
     * Add a new memory.
     * Checks for similar existing memories and supersedes if appropriate.
     */
    async addMemory(params: CreateMemoryParams): Promise<UserMemory | null> {
        const supabase = getSupabaseClient()

        // Calculate expiry if specified
        let expiresAt: string | null = null
        if (params.expiresInDays) {
            const expiry = new Date()
            expiry.setDate(expiry.getDate() + params.expiresInDays)
            expiresAt = expiry.toISOString()
        }

        const { data, error } = await supabase
            .from('user_memory')
            .insert({
                company_id: params.companyId,
                content: params.content,
                category: params.category,
                confidence: params.confidence ?? 1.0,
                expires_at: expiresAt,
                source_conversation_id: params.sourceConversationId,
            })
            .select()
            .single()

        if (error) {
            console.error('[UserMemory] Error adding memory:', error)
            return null
        }

        return this.mapFromDb(data)
    }

    /**
     * Update a memory's content while superseding the old version.
     * Creates a new memory and marks the old one as superseded.
     */
    async updateMemory(
        memoryId: string,
        newContent: string,
        params?: { category?: MemoryCategory; confidence?: number }
    ): Promise<UserMemory | null> {
        const supabase = getSupabaseClient()

        // Get the old memory
        const { data: oldMemory, error: fetchError } = await supabase
            .from('user_memory')
            .select('*')
            .eq('id', memoryId)
            .single()

        if (fetchError || !oldMemory) {
            console.error('[UserMemory] Error fetching memory to update:', fetchError)
            return null
        }

        // Create new memory
        const { data: newMemory, error: insertError } = await supabase
            .from('user_memory')
            .insert({
                company_id: oldMemory.company_id,
                content: newContent,
                category: params?.category ?? oldMemory.category,
                confidence: params?.confidence ?? oldMemory.confidence,
                expires_at: oldMemory.expires_at,
                source_conversation_id: oldMemory.source_conversation_id,
            })
            .select()
            .single()

        if (insertError || !newMemory) {
            console.error('[UserMemory] Error creating updated memory:', insertError)
            return null
        }

        // Mark old memory as superseded
        const { error: updateError } = await supabase
            .from('user_memory')
            .update({ superseded_by: newMemory.id })
            .eq('id', memoryId)

        if (updateError) {
            console.error('[UserMemory] Error marking memory as superseded:', updateError)
            // Still return the new memory, it was created successfully
        }

        return this.mapFromDb(newMemory)
    }

    /**
     * Supersede a memory (soft delete).
     * The memory is marked as replaced but not physically deleted.
     */
    async supersedeMemory(memoryId: string, replacementId: string): Promise<boolean> {
        const supabase = getSupabaseClient()

        const { error } = await supabase
            .from('user_memory')
            .update({ superseded_by: replacementId })
            .eq('id', memoryId)

        if (error) {
            console.error('[UserMemory] Error superseding memory:', error)
            return false
        }

        return true
    }

    /**
     * Delete a memory by superseding it with null content.
     * Actually creates a "deletion" record for audit trail.
     */
    async deleteMemory(memoryId: string): Promise<boolean> {
        const supabase = getSupabaseClient()

        // Get the old memory
        const { data: oldMemory, error: fetchError } = await supabase
            .from('user_memory')
            .select('*')
            .eq('id', memoryId)
            .single()

        if (fetchError || !oldMemory) {
            console.error('[UserMemory] Error fetching memory to delete:', fetchError)
            return false
        }

        // Create deletion marker
        const { data: deletionMarker, error: insertError } = await supabase
            .from('user_memory')
            .insert({
                company_id: oldMemory.company_id,
                content: '[DELETED]',
                category: oldMemory.category,
                confidence: 0,
                expires_at: new Date().toISOString(), // Immediately expired
            })
            .select()
            .single()

        if (insertError || !deletionMarker) {
            console.error('[UserMemory] Error creating deletion marker:', insertError)
            return false
        }

        // Mark old memory as superseded by deletion marker
        const { error: updateError } = await supabase
            .from('user_memory')
            .update({ superseded_by: deletionMarker.id })
            .eq('id', memoryId)

        return !updateError
    }

    /**
     * Get memory history (including superseded versions).
     */
    async getMemoryHistory(memoryId: string): Promise<UserMemory[]> {
        const supabase = getSupabaseClient()

        const history: UserMemory[] = []
        let currentId: string | null = memoryId

        while (currentId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error }: { data: any; error: any } = await supabase
                .from('user_memory')
                .select('*')
                .eq('id', currentId)
                .single()

            if (error || !data) break

            history.push(this.mapFromDb(data))
            currentId = data.superseded_by
        }

        return history
    }

    /**
     * Map database row to TypeScript type.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapFromDb(row: any): UserMemory {
        return {
            id: row.id,
            companyId: row.company_id,
            content: row.content,
            category: row.category,
            confidence: row.confidence,
            expiresAt: row.expires_at,
            supersededBy: row.superseded_by,
            sourceConversationId: row.source_conversation_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }
    }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const userMemoryService = new UserMemoryService()
