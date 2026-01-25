"use client"

import dynamic from "next/dynamic"

const RoadmapPreview = dynamic(() => import("../previews/roadmap-preview").then(m => ({ default: m.RoadmapPreview })), { ssr: false })

export function RoadmapCard(props: any) {
    return <RoadmapPreview data={props} />
}
