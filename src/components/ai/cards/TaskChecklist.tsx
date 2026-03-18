import { cn } from "@/lib/utils"
import type { TaskChecklist as TaskChecklistData } from "@/lib/ai-schema"

export interface TaskChecklistProps {
    title: TaskChecklistData['title']
    tasks: TaskChecklistData['tasks']
}

export function TaskChecklist({ title, tasks }: TaskChecklistProps) {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
            <h4 className="font-semibold text-sm flex items-center gap-2">
                <span>📋</span>
                {title}
            </h4>
            <ul className="space-y-2.5">
                {tasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-2.5 text-sm">
                        <div className={cn(
                            "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                            task.completed ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/30 bg-muted/20"
                        )}>
                            {task.completed && (
                                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className={cn(
                            "leading-tight",
                            task.completed ? "line-through text-muted-foreground/60" : "text-foreground/90"
                        )}>
                            {task.label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
