export type RoadmapStatus = 'active' | 'completed' | 'archived'
export type RoadmapStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface Roadmap {
    id: string
    user_id: string
    title: string
    description: string | null
    status: RoadmapStatus
    created_at: string
    updated_at: string
    steps?: RoadmapStep[]
}

export interface RoadmapStep {
    id: string
    roadmap_id: string
    title: string
    description: string | null
    status: RoadmapStepStatus
    due_date?: string | null // ISO Date string
    order_index: number
    metadata: Record<string, unknown> | null
    created_at: string
    updated_at: string
}

export interface CreateRoadmapInput {
    title: string
    description?: string
    steps: {
        title: string
        description?: string
        due_date?: string
        metadata?: Record<string, unknown>
    }[]
}

export interface UpdateRoadmapStepInput {
    status?: RoadmapStepStatus
    due_date?: string | null
    metadata?: Record<string, unknown>
}
