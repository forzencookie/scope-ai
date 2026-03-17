/**
 * User Memory Service
 *
 * Manages user/company-specific memories for AI personalization.
 * Part of AI Architecture v2.
 *
 * Memory categories:
 * - decision: Past actions taken (e.g., "Took 120k dividend Dec 2025")
 * - preference: User preferences (e.g., "Prefers simple explanations")
 * - pending: Things being considered (e.g., "Considering hiring")
 */

import { createBrowserClient } from '@/lib/database/client'
import type { Database } from '@/types/database'

// =============================================================================
// Types
// =============================================================================

type UserMemoryRow = Database['public']['Tables']['user_memory']['Row']
type UserMemoryInsert = Database['public']['Tables']['user_memory']['Insert']

export type MemoryCategory = 'decision' | 'preference' | 'pending'

export interface UserMemory {
    id: string
    companyId: string
    content: string
    category: MemoryCategory
    confidence: number | null
    supersededBy: string | null
    sourceMessageId: string | null
    createdAt: string | null
    updatedAt: string | null
}

export interface CreateMemoryParams {
    companyId: string
    content: string
    category: MemoryCategory
    confidence?: number
    sourceMessageId?: string
}

export interface UpdateMemoryParams {
    content?: string
    category?: MemoryCategory
    confidence?: number
}

// =============================================================================
// Service
// =============================================================================

class UserMemoryService {
    /**
     * Get all active memories for a company.
     * Active = not superseded.
     */
    async getMemoriesForCompany(companyId: string): Promise<UserMemory[]> {
        const supabase = createBrowserClient()

        const { data, error } = await supabase
            .from('user_memory')
            .select('*')
            .eq('company_id', companyId)
            .is('superseded_by', null)
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
        const supabase = createBrowserClient()

        const { data, error } = await supabase
            .from('user_memory')
            .select('*')
            .eq('company_id', companyId)
            .eq('category', category)
            .is('superseded_by', null)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[UserMemory] Error fetching memories by category:', error)
            return []
        }

        return (data || []).map(this.mapFromDb)
    }

    /**
     * Search memories by content (simple text search).
     */
    async searchMemories(companyId: string, query: string): Promise<UserMemory[]> {
        const supabase = createBrowserClient()

        const { data, error } = await supabase
            .from('user_memory')
            .select('*')
            .eq('company_id', companyId)
            .is('superseded_by', null)
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
     */
    async addMemory(params: CreateMemoryParams): Promise<UserMemory | null> {
        const supabase = createBrowserClient()

        const payload: UserMemoryInsert = {
            company_id: params.companyId,
            content: params.content,
            category: params.category,
            confidence: params.confidence ?? 1.0,
            source_message_id: params.sourceMessageId,
        }

        const { data, error } = await supabase
            .from('user_memory')
            .insert(payload)
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
        const supabase = createBrowserClient()

        const { data: oldMemory, error: fetchError } = await supabase
            .from('user_memory')
            .select('*')
            .eq('id', memoryId)
            .single()

        if (fetchError || !oldMemory) {
            console.error('[UserMemory] Error fetching memory to update:', fetchError)
            return null
        }

        const payload: UserMemoryInsert = {
            company_id: oldMemory.company_id,
            content: newContent,
            category: params?.category ?? oldMemory.category,
            confidence: params?.confidence ?? oldMemory.confidence,
            source_message_id: oldMemory.source_message_id,
        }

        const { data: newMemory, error: insertError } = await supabase
            .from('user_memory')
            .insert(payload)
            .select()
            .single()

        if (insertError || !newMemory) {
            console.error('[UserMemory] Error creating updated memory:', insertError)
            return null
        }

        const { error: updateError } = await supabase
            .from('user_memory')
            .update({ superseded_by: newMemory.id })
            .eq('id', memoryId)

        if (updateError) {
            console.error('[UserMemory] Error marking memory as superseded:', updateError)
        }

        return this.mapFromDb(newMemory)
    }

    /**
     * Supersede a memory (soft delete).
     */
    async supersedeMemory(memoryId: string, replacementId: string): Promise<boolean> {
        const supabase = createBrowserClient()

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
     * Delete a memory by superseding it with a deletion marker.
     */
    async deleteMemory(memoryId: string): Promise<boolean> {
        const supabase = createBrowserClient()

        const { data: oldMemory, error: fetchError } = await supabase
            .from('user_memory')
            .select('*')
            .eq('id', memoryId)
            .single()

        if (fetchError || !oldMemory) {
            console.error('[UserMemory] Error fetching memory to delete:', fetchError)
            return false
        }

        const payload: UserMemoryInsert = {
            company_id: oldMemory.company_id,
            content: '[DELETED]',
            category: oldMemory.category,
            confidence: 0,
        }

        const { data: deletionMarker, error: insertError } = await supabase
            .from('user_memory')
            .insert(payload)
            .select()
            .single()

        if (insertError || !deletionMarker) {
            console.error('[UserMemory] Error creating deletion marker:', insertError)
            return false
        }

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
        const supabase = createBrowserClient()

        const history: UserMemory[] = []
        let currentId: string | null = memoryId

        while (currentId) {
            const { data, error }: { data: Database['public']['Tables']['user_memory']['Row'] | null; error: unknown } = await supabase
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

    private mapFromDb(row: UserMemoryRow): UserMemory {
        return {
            id: row.id,
            companyId: row.company_id,
            content: row.content,
            category: row.category as MemoryCategory,
            confidence: row.confidence,
            supersededBy: row.superseded_by,
            sourceMessageId: row.source_message_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }
    }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const userMemoryService = new UserMemoryService()
