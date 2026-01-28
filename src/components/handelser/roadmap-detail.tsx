"use client"

import { useState } from "react"
import { ChevronDown, ArrowRight, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import type { Roadmap, RoadmapStep, RoadmapStepStatus } from "@/types/roadmap"
import { updateStep, deleteRoadmap } from "@/services/roadmap-service"

interface RoadmapDetailProps {
    roadmap: Roadmap
    onUpdate?: () => void
    onBack?: () => void
}

export function RoadmapDetail({ roadmap, onUpdate, onBack }: RoadmapDetailProps) {
    const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({})
    const [isDeleting, setIsDeleting] = useState(false)

    const completedSteps = roadmap.steps?.filter(s => s.status === 'completed').length || 0
    const totalSteps = roadmap.steps?.length || 0
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

    const toggleStep = async (step: RoadmapStep) => {
        const newStatus: RoadmapStepStatus = step.status === 'completed' ? 'pending' : 'completed'
        await updateStep(step.id, { status: newStatus })
        onUpdate?.()
    }

    const toggleExpand = (stepId: string) => {
        setExpandedSteps(prev => ({
            ...prev,
            [stepId]: !prev[stepId]
        }))
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteRoadmap(roadmap.id)
            onBack?.()
        } finally {
            setIsDeleting(false)
        }
    }

    // Sort steps by order_index
    const sortedSteps = [...(roadmap.steps || [])].sort((a, b) => a.order_index - b.order_index)

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
                    <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
                    Tillbaka
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4 mr-1" />
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
                                {isDeleting ? 'Tar bort...' : 'Ta bort'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <Card className="p-6 border-l-4 border-l-primary shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{roadmap.title}</h2>
                        {roadmap.description && (
                            <p className="text-muted-foreground mt-1">{roadmap.description}</p>
                        )}
                    </div>
                    <Badge variant={roadmap.status === 'completed' ? 'default' : 'outline'}>
                        {roadmap.status === 'completed' ? 'Klar' : 'Pågående'}
                    </Badge>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-muted-foreground">Framsteg</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right mt-1">
                        {completedSteps} av {totalSteps} steg avklarade
                    </p>
                </div>
            </Card>

            <div className="space-y-3">
                <h3 className="font-medium text-lg px-1">Att göra</h3>
                {sortedSteps.map((step) => {
                    const isCompleted = step.status === 'completed'
                    const isOpen = expandedSteps[step.id]

                    return (
                        <Card
                            key={step.id}
                            className={cn(
                                "transition-all duration-200 border-l-4",
                                isCompleted ? "bg-muted/30 border-l-green-500" : "border-l-gray-300 dark:border-l-gray-700"
                            )}
                        >
                            <Collapsible open={isOpen} onOpenChange={() => toggleExpand(step.id)}>
                                <div className="p-4 flex items-start gap-3">
                                    <Checkbox
                                        checked={isCompleted}
                                        onCheckedChange={() => toggleStep(step)}
                                        className="mt-1"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div
                                                className={cn(
                                                    "font-medium cursor-pointer",
                                                    isCompleted && "line-through text-muted-foreground"
                                                )}
                                                onClick={() => toggleExpand(step.id)}
                                            >
                                                {step.title}
                                            </div>
                                            {step.description && (
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                                                        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                                                    </Button>
                                                </CollapsibleTrigger>
                                            )}
                                        </div>

                                        <CollapsibleContent>
                                            <div className="pt-2 text-sm text-muted-foreground animate-in slide-in-from-top-1">
                                                {step.description}
                                            </div>
                                        </CollapsibleContent>
                                    </div>
                                </div>
                            </Collapsible>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
