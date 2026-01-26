"use client"

import dynamic from "next/dynamic"

const RoadmapPreview = dynamic(() => import("../previews/roadmap-preview").then(m => ({ default: m.RoadmapPreview })), { ssr: false })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RoadmapCard(props: any) {
    return <RoadmapPreview data={props} />
}
