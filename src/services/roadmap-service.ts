// @ts-nocheck - TODO: Fix after regenerating Supabase types with proper PostgrestVersion
import { getSupabaseClient } from '@/lib/database/supabase'
import type { Roadmap, RoadmapStep, CreateRoadmapInput, UpdateRoadmapStepInput, RoadmapStatus } from '@/types/roadmap'

// Local storage key for fallback/dev
const STORAGE_KEY = 'scope_roadmaps'

function getLocalRoadmaps(): Roadmap[] {
    if (typeof window === 'undefined') return []
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

function saveLocalRoadmaps(roadmaps: Roadmap[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roadmaps))
}

export async function getRoadmaps(): Promise<Roadmap[]> {
    try {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('roadmaps')
            .select('*, steps:roadmap_steps(*)')
            .order('created_at', { ascending: false })
            .order('order_index', { ascending: true, foreignTable: 'roadmap_steps' })

        if (error) throw error
        return data as Roadmap[]
    } catch (error) {
        console.warn('Failed to fetch roadmaps from DB, falling back to local storage', error)
        return getLocalRoadmaps()
    }
}

export async function getRoadmap(id: string): Promise<Roadmap | null> {
    try {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('roadmaps')
            .select('*, steps:roadmap_steps(*)')
            .eq('id', id)
            .order('order_index', { ascending: true, foreignTable: 'roadmap_steps' })
            .single()

        if (error) throw error
        return data as Roadmap
    } catch (error) {
        console.warn('Failed to fetch roadmap from DB, falling back to local storage', error)
        const roadmaps = getLocalRoadmaps()
        return roadmaps.find(r => r.id === id) || null
    }
}

export async function createRoadmap(input: CreateRoadmapInput): Promise<Roadmap> {
    try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
            // Fallback for demo/no-auth
            const roadmapId = crypto.randomUUID()
            const now = new Date().toISOString()

            const roadmap: Roadmap = {
                id: roadmapId,
                user_id: 'local-user',
                title: input.title,
                description: input.description || null,
                status: 'active',
                created_at: now,
                updated_at: now,
                steps: input.steps.map((step, index) => ({
                    id: crypto.randomUUID(),
                    roadmap_id: roadmapId,
                    title: step.title,
                    description: step.description || null,
                    status: 'pending',
                    order_index: index,
                    metadata: step.metadata || null,
                    created_at: now,
                    updated_at: now
                }))
            }

            const current = getLocalRoadmaps()
            saveLocalRoadmaps([roadmap, ...current])
            return roadmap
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
            description: step.description,
            status: 'pending',
            order_index: index,
            metadata: step.metadata
        }))

        const { data: steps, error: stepsError } = await supabase
            .from('roadmap_steps')
            .insert(stepsData)
            .select()

        if (stepsError) throw stepsError

        return { ...roadmap, steps: steps || [] }
    } catch (error) {
        console.error('Error creating roadmap:', error)
        throw error
    }
}

export async function updateRoadmapStatus(id: string, status: RoadmapStatus): Promise<void> {
    try {
        const supabase = createClient()
        const { error } = await supabase
            .from('roadmaps')
            .update({ status })
            .eq('id', id)

        if (error) throw error
    } catch (error) {
        // Fallback
        const roadmaps = getLocalRoadmaps()
        const index = roadmaps.findIndex(r => r.id === id)
        if (index !== -1) {
            roadmaps[index].status = status
            roadmaps[index].updated_at = new Date().toISOString()
            saveLocalRoadmaps(roadmaps)
        }
    }
}

export async function updateStep(stepId: string, updates: UpdateRoadmapStepInput): Promise<void> {
    try {
        const supabase = createClient()
        const { error } = await supabase
            .from('roadmap_steps')
            .update(updates)
            .eq('id', stepId)

        if (error) throw error
    } catch (error) {
        // Fallback
        const roadmaps = getLocalRoadmaps()
        let found = false
        for (const roadmap of roadmaps) {
            if (roadmap.steps) {
                const stepIndex = roadmap.steps.findIndex(s => s.id === stepId)
                if (stepIndex !== -1) {
                    roadmap.steps[stepIndex] = {
                        ...roadmap.steps[stepIndex],
                        ...updates,
                        updated_at: new Date().toISOString()
                    }
                    found = true
                    break
                }
            }
        }
        if (found) saveLocalRoadmaps(roadmaps)
    }
}
