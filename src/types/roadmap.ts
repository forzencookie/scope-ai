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
    order_index: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any> | null
    created_at: string
    updated_at: string
}

export interface CreateRoadmapInput {
    title: string
    description?: string
    steps: {
        title: string
        description?: string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata?: Record<string, any>
    }[]
}

export interface UpdateRoadmapStepInput {
    status?: RoadmapStepStatus
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>
}
