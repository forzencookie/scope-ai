
import { Check, Map, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RoadmapPreviewProps {
    data: {
        id: string
        title: string
        description?: string
        steps: Array<{
            title: string
            description: string
            status: 'pending' | 'in_progress' | 'completed' | 'skipped'
        }>
    }
    onConfirm?: () => void
    onCancel?: () => void
}

export function RoadmapPreview({ data, onConfirm }: RoadmapPreviewProps) {
    return (
        <Card className="w-full max-w-md overflow-hidden border-indigo-100 dark:border-indigo-900 bg-background/95 backdrop-blur-sm shadow-sm ring-1 ring-indigo-100/20">
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg shrink-0">
                        <Map className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-sm leading-none flex items-center gap-2">
                            {data.title}
                            <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-[10px] uppercase font-bold tracking-wider">
                                Ny Plan
                            </span>
                        </h3>
                        {data.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {data.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Steps Preview */}
            <div className="p-4 space-y-3 bg-muted/10">
                <div className="flex items-center justify-between text-xs text-muted-foreground uppercase font-medium tracking-wider px-1">
                    <span>Föreslagna steg ({data.steps.length})</span>
                </div>

                <div className="space-y-2">
                    {data.steps.slice(0, 3).map((step, i) => (
                        <div key={i} className="flex gap-3 items-start p-2.5 rounded-md border border-border/50 bg-background/50 text-sm">
                            <div className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-medium border border-indigo-100 dark:border-indigo-900 shrink-0">
                                {i + 1}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                                <p className="font-medium truncate">{step.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                            </div>
                        </div>
                    ))}
                    {data.steps.length > 3 && (
                        <div className="text-xs text-center text-muted-foreground italic py-1">
                            + {data.steps.length - 3} steg till...
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="p-3 bg-muted/20 border-t border-border flex justify-end gap-2">
                <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    onClick={() => {
                        window.location.href = '/dashboard/handelser?view=roadmap'
                    }}
                >
                    Öppna Planering
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
            </div>
        </Card>
    )
}
