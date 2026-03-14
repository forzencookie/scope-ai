"use client"

import dynamic from "next/dynamic"
import { z } from "zod"

const RoadmapPreview = dynamic(() => import("../previews/roadmap-preview").then(m => ({ default: m.RoadmapPreview })), { ssr: false })

export const RoadmapStepSchema = z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['pending', 'in_progress', 'completed', 'skipped'])
})

export const RoadmapSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    steps: z.array(RoadmapStepSchema)
})

export type RoadmapProps = z.infer<typeof RoadmapSchema>

export function RoadmapCard(props: RoadmapProps) {
    return <RoadmapPreview data={props} />
}
