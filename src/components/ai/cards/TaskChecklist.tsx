import { cn } from "@/lib/utils"

export interface TaskChecklistProps {
    title?: string
    tasks: Array<{
        id?: string
        label: string
        completed?: boolean
    }>
}

export function TaskChecklist({ title, tasks }: TaskChecklistProps) {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            {title && <h4 className="font-semibold">{title}</h4>}
            <ul className="space-y-2">
                {tasks.map((task, index) => (
                    <li key={task.id || index} className="flex items-center gap-2 text-sm">
                        <div className={cn(
                            "h-4 w-4 rounded border flex items-center justify-center",
                            task.completed ? "bg-primary border-primary" : "border-muted-foreground/30"
                        )}>
                            {task.completed && (
                                <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                            {task.label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
