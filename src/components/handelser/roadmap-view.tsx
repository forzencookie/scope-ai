"use client"

import { useEffect, useState, useCallback } from "react"
import { Map, Loader2, Check, Circle, ChevronDown, Trash2, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type Roadmap, type RoadmapStep, type RoadmapStepStatus } from "@/types/roadmap"
import { getRoadmaps, updateStep, deleteRoadmap } from "@/services/roadmap-service"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface RoadmapViewProps {
    onCreateNew: () => void
}

function StepIcon({ status }: { status: RoadmapStepStatus }) {
    if (status === "completed") {
        return (
            <div className="h-7 w-7 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 z-10">
                <Check className="h-4 w-4" />
            </div>
        )
    }
    if (status === "in_progress") {
        return (
            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 z-10 ring-4 ring-primary/20">
                <Circle className="h-3 w-3 fill-current" />
            </div>
        )
    }
    if (status === "skipped") {
        return (
            <div className="h-7 w-7 rounded-full bg-muted border-2 border-muted-foreground/30 flex items-center justify-center shrink-0 z-10">
                <span className="text-xs text-muted-foreground">—</span>
            </div>
        )
    }
    // pending
    return (
        <div className="h-7 w-7 rounded-full bg-background border-2 border-muted-foreground/30 shrink-0 z-10" />
    )
}

function RoadmapStepper({
    roadmap,
    onStepToggle,
    onDelete,
}: {
    roadmap: Roadmap
    onStepToggle: (step: RoadmapStep) => void
    onDelete: (id: string) => void
}) {
    const [expanded, setExpanded] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)

    const sortedSteps = [...(roadmap.steps || [])].sort((a, b) => a.order_index - b.order_index)
    const completedSteps = sortedSteps.filter(s => s.status === "completed").length
    const totalSteps = sortedSteps.length
    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteRoadmap(roadmap.id)
            onDelete(roadmap.id)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="rounded-lg border bg-card">
            {/* Roadmap Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-t-lg"
            >
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", expanded && "rotate-180")} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base truncate">{roadmap.title}</h3>
                        <Badge variant={roadmap.status === "completed" ? "default" : "outline"} className="shrink-0">
                            {roadmap.status === "completed" ? "Klar" : `${progress}%`}
                        </Badge>
                    </div>
                    {roadmap.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{roadmap.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {completedSteps}/{totalSteps} steg
                    </span>
                    {/* Progress ring */}
                    <div className="relative h-8 w-8">
                        <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-muted" strokeWidth="3" />
                            <circle
                                cx="18" cy="18" r="15.9" fill="none"
                                className="stroke-primary"
                                strokeWidth="3"
                                strokeDasharray={`${progress} 100`}
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </div>
            </button>

            {/* Progress bar */}
            <div className="h-0.5 bg-muted mx-4">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            {/* Steps stepper */}
            {expanded && (
                <div className="p-4 pt-3">
                    <div className="relative">
                        {sortedSteps.map((step, index) => {
                            const isLast = index === sortedSteps.length - 1
                            const isCompleted = step.status === "completed"

                            return (
                                <div key={step.id} className="relative flex gap-3">
                                    {/* Vertical connector line */}
                                    {!isLast && (
                                        <div
                                            className={cn(
                                                "absolute left-[13px] top-7 w-0.5 bottom-0",
                                                isCompleted ? "bg-green-500/40" : "bg-muted-foreground/15"
                                            )}
                                        />
                                    )}

                                    {/* Step icon */}
                                    <button
                                        onClick={() => onStepToggle(step)}
                                        className="relative shrink-0 hover:scale-110 transition-transform"
                                        title={isCompleted ? "Markera som ej klar" : "Markera som klar"}
                                    >
                                        <StepIcon status={step.status} />
                                    </button>

                                    {/* Step content */}
                                    <div className={cn("flex-1 pb-6 min-w-0", isLast && "pb-0")}>
                                        <div className={cn(
                                            "font-medium text-sm",
                                            isCompleted && "line-through text-muted-foreground"
                                        )}>
                                            {step.title}
                                        </div>
                                        {step.description && (
                                            <p className={cn(
                                                "text-xs mt-0.5",
                                                isCompleted ? "text-muted-foreground/60" : "text-muted-foreground"
                                            )}>
                                                {step.description}
                                            </p>
                                        )}
                                        {step.due_date && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{new Date(step.due_date).toLocaleDateString("sv-SE")}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer with date + delete */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
                        <span>Startad {new Date(roadmap.created_at).toLocaleDateString("sv-SE")}</span>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1">
                                    <Trash2 className="h-3 w-3" />
                                    Ta bort
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Ta bort plan?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Är du säker på att du vill ta bort &quot;{roadmap.title}&quot;? Denna åtgärd kan inte ångras.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        {isDeleting ? "Tar bort..." : "Ta bort"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )}
        </div>
    )
}

export function RoadmapView({ onCreateNew: _onCreateNew }: RoadmapViewProps) {
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
    const [loading, setLoading] = useState(true)

    const loadRoadmaps = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getRoadmaps()
            setRoadmaps(data)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadRoadmaps()
    }, [loadRoadmaps])

    const handleStepToggle = async (step: RoadmapStep) => {
        const newStatus: RoadmapStepStatus = step.status === "completed" ? "pending" : "completed"
        await updateStep(step.id, { status: newStatus })
        loadRoadmaps()
    }

    const handleDelete = (id: string) => {
        setRoadmaps(prev => prev.filter(r => r.id !== id))
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
        <div className="space-y-4">
            {roadmaps.map((roadmap) => (
                <RoadmapStepper
                    key={roadmap.id}
                    roadmap={roadmap}
                    onStepToggle={handleStepToggle}
                    onDelete={handleDelete}
                />
            ))}
        </div>
    )
}
