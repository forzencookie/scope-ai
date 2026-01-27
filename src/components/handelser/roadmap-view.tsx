"use client"

import { useEffect, useState } from "react"
import { Map, ArrowRight, Loader2, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type Roadmap } from "@/types/roadmap"
import { getRoadmaps } from "@/services/roadmap-service"
import { RoadmapDetail } from "./roadmap-detail"

interface RoadmapViewProps {
    onCreateNew: () => void
}

export function RoadmapView({ onCreateNew: _onCreateNew }: RoadmapViewProps) {
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null)

    const loadRoadmaps = async () => {
        setLoading(true)
        try {
            const data = await getRoadmaps()
            setRoadmaps(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadRoadmaps()
    }, [])

    if (selectedRoadmap) {
        return (
            <RoadmapDetail
                roadmap={selectedRoadmap}
                onBack={() => setSelectedRoadmap(null)}
                onUpdate={() => {
                    loadRoadmaps() // Refresh to get latest status if needed
                    // We might need to refresh selectedRoadmap too strictly speaking, 
                    // but for status toggles local state in Detail is often enough or we re-fetch.
                    // For now let's re-fetch the list.
                    // To handle perfect sync we'd re-fetch the single roadmap.
                }}
            />
        )
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Laddar planering...</p>
            </div>
        )
    }

    if (roadmaps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Map className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Inga aktiva planer</h3>
                <p className="text-muted-foreground text-sm max-w-xs md:max-w-md mb-8 px-4">
                    Skapa en långsiktig plan för ditt företagande. AI hjälper dig att bryta ner stora mål i hanterbara steg.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                {roadmaps.map((roadmap) => {
                    const completedSteps = roadmap.steps?.filter(s => s.status === 'completed').length || 0
                    const totalSteps = roadmap.steps?.length || 0
                    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

                    return (
                        <Card
                            key={roadmap.id}
                            className="p-5 cursor-pointer hover:shadow-md transition-shadow group relative overflow-hidden"
                            onClick={() => setSelectedRoadmap(roadmap)}
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                        {roadmap.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                        {roadmap.description}
                                    </p>
                                </div>
                                <Badge variant={roadmap.status === 'completed' ? 'secondary' : 'outline'}>
                                    {roadmap.status === 'completed' ? 'Klar' : 'Pågående'}
                                </Badge>
                            </div>

                            <div className="space-y-2 mt-4">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{Math.round(progress)}% klart</span>
                                    <span>{completedSteps}/{totalSteps} steg</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center text-xs text-muted-foreground mt-4 pt-3 border-t">
                                <Calendar className="h-3 w-3 mr-1.5" />
                                <span>Startad {new Date(roadmap.created_at).toLocaleDateString('sv-SE')}</span>
                                <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-4px] group-hover:translate-x-0" />
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
