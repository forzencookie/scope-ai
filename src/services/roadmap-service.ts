import { createBrowserClient } from '@/lib/database/client'
import type { Json } from '@/types/database'
import type { Roadmap, RoadmapStep, CreateRoadmapInput, UpdateRoadmapStepInput, RoadmapStatus } from '@/types/roadmap'

/**
 * Roadmap Service
 * 
 * Manages user-specific roadmaps stored in Supabase.
 * Authentication is required for all operations.
 */

export async function getRoadmaps(): Promise<Roadmap[]> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('roadmaps')
        .select('*, steps:roadmap_steps(*)')
        .order('created_at', { ascending: false })
        .order('order_index', { ascending: true, foreignTable: 'roadmap_steps' })

    if (error) {
        console.error('[RoadmapService] Failed to fetch roadmaps:', error)
        return []
    }
    return data as Roadmap[]
}

export async function getRoadmap(id: string): Promise<Roadmap | null> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('roadmaps')
        .select('*, steps:roadmap_steps(*)')
        .eq('id', id)
        .order('order_index', { ascending: true, foreignTable: 'roadmap_steps' })
        .single()

    if (error) {
        console.error('[RoadmapService] Failed to fetch roadmap:', error)
        return null
    }
    return data as Roadmap
}

export async function createRoadmap(input: CreateRoadmapInput): Promise<Roadmap> {
    const supabase = createBrowserClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
        throw new Error('Authentication required to create a roadmap')
    }

    // 1. Create Roadmap
    const { data: roadmap, error: roadmapError } = await supabase
        .from('roadmaps')
        .insert({
            user_id: userData.user.id,
            title: input.title,
            description: input.description,
            status: 'active'
        })
        .select()
        .single()

    if (roadmapError) throw roadmapError

    // 2. Create Steps
    const stepsData = input.steps.map((step, index) => ({
        roadmap_id: roadmap.id,
        title: step.title,
        description: step.description ?? null,
        status: 'pending',
        order_index: index,
        metadata: (step.metadata ?? null) as Json,
    }))

    const { data: steps, error: stepsError } = await supabase
        .from('roadmap_steps')
        .insert(stepsData)
        .select()

    if (stepsError) throw stepsError

    return {
        ...roadmap,
        steps: (steps || []).map((s) => ({
            id: s.id,
            roadmap_id: s.roadmap_id,
            title: s.title ?? '',
            description: s.description,
            status: (s.status ?? 'pending') as RoadmapStep['status'],
            order_index: s.order_index ?? 0,
            metadata: s.metadata as RoadmapStep['metadata'],
            created_at: s.created_at ?? '',
            updated_at: s.updated_at ?? '',
        })),
    } as Roadmap
}

export async function updateRoadmapStatus(id: string, status: RoadmapStatus): Promise<void> {
    const supabase = createBrowserClient()
    const { error } = await supabase
        .from('roadmaps')
        .update({ status })
        .eq('id', id)

    if (error) throw error
}

export async function updateStep(stepId: string, updates: UpdateRoadmapStepInput): Promise<void> {
    const supabase = createBrowserClient()
    const dbUpdate: Record<string, unknown> = {}
    if (updates.status !== undefined) dbUpdate.status = updates.status
    if (updates.metadata !== undefined) dbUpdate.metadata = updates.metadata as Json

    const { error } = await supabase
        .from('roadmap_steps')
        .update(dbUpdate as { status?: string | null; metadata?: Json })
        .eq('id', stepId)

    if (error) throw error
}

export async function deleteRoadmap(id: string): Promise<void> {
    const supabase = createBrowserClient()
    // Steps are cascade deleted via foreign key
    const { error } = await supabase
        .from('roadmaps')
        .delete()
        .eq('id', id)

    if (error) throw error
}
