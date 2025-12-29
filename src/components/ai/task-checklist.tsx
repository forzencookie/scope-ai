"use client"

import { cn } from "@/lib/utils"
import { Check, Circle, Loader2 } from "lucide-react"

type TaskStatus = 'pending' | 'in_progress' | 'completed'

interface TaskItem {
    id: string
    label: string
    status: TaskStatus
}

interface TaskChecklistProps {
    title: string
    tasks: TaskItem[]
    className?: string
}

/**
 * Task Checklist Component
 * 
 * Displays a list of tasks with checkmarks showing progress
 * Used in AI chat to show multi-step operations
 */
export function TaskChecklist({ title, tasks, className }: TaskChecklistProps) {
    const completedCount = tasks.filter(t => t.status === 'completed').length
    const totalCount = tasks.length

    return (
        <div className={cn(
            "rounded-lg border-2 border-border/60 bg-card overflow-hidden",
            className
        )}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                    📋 {title}
                </span>
                <span className="text-xs text-muted-foreground">
                    {completedCount}/{totalCount}
                </span>
            </div>

            {/* Task List */}
            <div className="px-4 py-3 space-y-2">
                {tasks.map((task) => (
                    <TaskItemRow key={task.id} task={task} />
                ))}
            </div>
        </div>
    )
}

function TaskItemRow({ task }: { task: TaskItem }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <TaskStatusIcon status={task.status} />
            <span className={cn(
                task.status === 'completed' && "text-muted-foreground line-through",
                task.status === 'in_progress' && "font-medium"
            )}>
                {task.label}
            </span>
        </div>
    )
}

function TaskStatusIcon({ status }: { status: TaskStatus }) {
    switch (status) {
        case 'completed':
            return (
                <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-500" />
                </div>
            )
        case 'in_progress':
            return (
                <div className="h-4 w-4 flex items-center justify-center">
                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                </div>
            )
        case 'pending':
        default:
            return (
                <div className="h-4 w-4 flex items-center justify-center">
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />
                </div>
            )
    }
}

// Utility to create task items from a list of labels
export function createTaskItems(labels: string[]): TaskItem[] {
    return labels.map((label, index) => ({
        id: `task-${index}`,
        label,
        status: 'pending' as TaskStatus,
    }))
}
