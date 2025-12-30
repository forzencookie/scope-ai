"use client"

import { useState, Suspense, useMemo } from "react"
import {
    Sparkles,
    CheckCircle2,
    Circle,
} from "lucide-react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbAIBadge,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { mockUser } from "@/data/app-navigation"


// ============================================
// Types
// ============================================


import Link from "next/link"
import { useDynamicTasks, type DynamicTask, type DynamicGoal } from "@/hooks/use-dynamic-tasks"
import { ExternalLink } from "lucide-react"

// ... existing types removed or replaced by hook types ...

function TaskItem({ task, onToggle }: { task: DynamicTask, onToggle: (id: string) => void }) {
    return (
        <div className="flex items-center gap-3 py-2 group">
            <button
                className="flex-shrink-0"
                onClick={() => onToggle(task.id)}
            >
                {task.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground/60" />}
            </button>
            <div className="flex-1 min-w-0">
                {task.href ? (
                    <Link href={task.href} className="flex items-center gap-2 group-hover:text-primary transition-colors">
                        <span className={cn("text-base", task.completed && "line-through text-muted-foreground")}>
                            {task.recurring && <span className="text-muted-foreground mr-1">↻</span>}
                            {task.title}
                        </span>
                        {!task.completed && <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />}
                    </Link>
                ) : (
                    <span className={cn("text-base", task.completed && "line-through text-muted-foreground")}>
                        {task.recurring && <span className="text-muted-foreground mr-1">↻</span>}
                        {task.title}
                    </span>
                )}
            </div>
        </div>
    )
}

function GoalSection({ goal, onToggleTask }: { goal: DynamicGoal, onToggleTask: (taskId: string) => void }) {
    const completedCount = goal.tasks.filter(t => t.completed).length
    const totalCount = goal.tasks.length

    return (
        <div className="py-4">
            {/* Goal Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{goal.name}</span>
                    {goal.target && (
                        <span className="text-sm text-muted-foreground">· {goal.target}</span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{completedCount}/{totalCount}</span>
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            </div>
            {/* Tasks */}
            <div className="space-y-1">
                {goal.tasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={onToggleTask} />
                ))}
            </div>
        </div>
    )
}

function UppgifterContent() {
    const { goals: initialGoals, isLoading } = useDynamicTasks()
    const [localGoals, setLocalGoals] = useState<DynamicGoal[]>([])

    if (localGoals.length === 0 && initialGoals.length > 0) {
        setLocalGoals(initialGoals)
    }

    useMemo(() => {
        if (initialGoals.length > 0) {
            setLocalGoals(initialGoals)
        }
    }, [initialGoals])

    const now = new Date()
    const weekNumber = Math.ceil((((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)

    const handleToggleTask = (taskId: string) => {
        setLocalGoals(prev => prev.map(goal => ({
            ...goal,
            tasks: goal.tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task)
        })))
    }

    const activeGoals = localGoals.length > 0 ? localGoals : initialGoals
    const totalTasks = activeGoals.reduce((sum, g) => sum + g.tasks.length, 0)
    const completedTasks = activeGoals.reduce((sum, g) => sum + g.tasks.filter(t => t.completed).length, 0)

    return (
        <div className="max-w-4xl mx-auto py-6">
            {/* Greeting */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Hej, {mockUser.name}</h1>
                <p className="text-muted-foreground">{completedTasks} av {totalTasks} uppgifter klara</p>
            </div>

            {/* Divider */}
            <Separator className="mb-4" />

            {/* Week header */}
            <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold">Denna veckas uppgifter</h2>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">Vecka {weekNumber}, {now.getFullYear()}</span>
            </div>

            {/* Tasks grouped by goal */}
            {isLoading && activeGoals.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Laddar...</div>
            ) : (
                <div className="divide-y divide-border/40">
                    {activeGoals.map(goal => (
                        <GoalSection key={goal.id} goal={goal} onToggleTask={handleToggleTask} />
                    ))}
                </div>
            )}

            {/* AI suggestion - subtle inline */}
            <div className="mt-6 pt-4 border-t border-border/40">
                <div className="flex items-start gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                        3 kvitton väntar på granskning. <button className="text-primary hover:underline">Bokför automatiskt?</button>
                    </p>
                </div>
            </div>
        </div>
    )
}

// ============================================
// Main Page Shell
// ============================================

function DagbokPageContent() {
    return (
        <div className="flex flex-col min-h-svh">
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Uppgifter</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <BreadcrumbAIBadge />
            </header>

            {/* Content */}
            <main className="flex-1 px-6 pb-6">
                <UppgifterContent />
            </main>
        </div>
    )
}

function DagbokPageLoading() {
    return (
        <div className="flex items-center justify-center h-svh">
            <div className="animate-pulse text-muted-foreground">Laddar...</div>
        </div>
    )
}

export default function DagbokPage() {
    return (
        <Suspense fallback={<DagbokPageLoading />}>
            <DagbokPageContent />
        </Suspense>
    )
}
