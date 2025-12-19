"use client"

import { useState, useCallback, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    CheckSquare,
    Calendar as CalendarIcon,

    Target,
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
import { Card } from "@/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { mockUser } from "@/data/navigation"
import { LazyJournalCalendar } from "@/components/shared"

// ============================================
// Types
// ============================================


import Link from "next/link"
import { useDynamicTasks, type DynamicTask, type DynamicGoal } from "@/hooks/use-dynamic-tasks"
import { ExternalLink } from "lucide-react"

// ... existing types removed or replaced by hook types ...

function TaskItem({ task, onToggle }: { task: DynamicTask, onToggle: (id: string) => void }) {
    return (
        <div className="flex items-center gap-3 py-2 px-3 hover:bg-muted/30 rounded-lg transition-colors group">
            <button
                className="flex-shrink-0"
                onClick={() => onToggle(task.id)}
            >
                {task.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
            </button>
            <div className="flex-1 min-w-0">
                {task.href ? (
                    <Link href={task.href} className="flex items-center gap-2 group-hover:text-primary transition-colors">
                        <span className={cn("text-sm truncate", task.completed && "line-through text-muted-foreground group-hover:text-muted-foreground")}>
                            {task.recurring && <span className="text-muted-foreground mr-1">↻</span>}
                            {task.title}
                        </span>
                        {!task.completed && <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />}
                    </Link>
                ) : (
                    <span className={cn("text-sm block truncate", task.completed && "line-through text-muted-foreground")}>
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
        <Card className="p-4">
            <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mål</span>
                    <Target className="h-3 w-3 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">{goal.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="uppercase text-[10px] tracking-wider">Delmål · </span>
                    {goal.target}
                </p>
            </div>
            <Separator className="my-3" />
            <div className="space-y-1">
                {goal.tasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={onToggleTask} />
                ))}
            </div>
            <div className="mt-3 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{completedCount}/{totalCount} klara</span>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(completedCount / totalCount) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </Card>
    )
}

function UppgifterContent() {
    const { goals: initialGoals, isLoading } = useDynamicTasks()
    const [localGoals, setLocalGoals] = useState<DynamicGoal[]>([])

    // Sync with hook data but allow local overrides
    // In a real app complexity: we would need to merge 'completed' state if persistence is needed
    // For now we initialize local state with hook data when loaded
    if (localGoals.length === 0 && initialGoals.length > 0) {
        setLocalGoals(initialGoals)
    }

    // Effect to update if initialGoals changes (e.g. data fetch completes)
    // We only update if we haven't touched it, OR we carefully merge? 
    // Simple approach: Use initialGoals as base, maintain completed IDs?
    // Let's just update localGoals when initialGoals changes for this dynamic view
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
        <div className="max-w-3xl mx-auto py-6">
            {/* Greeting Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Hej, {mockUser.name}</h1>
                    <p className="text-muted-foreground text-sm mt-1">{completedTasks} av {totalTasks} uppgifter klara idag</p>
                </div>
                {/* 
                  // Quick Actions removed - focus on tasks
                  // If we want them back, we can add them here
                */}
            </div>

            {/* Week Section Header */}
            <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold">Denna veckas uppgifter</h2>
                <span className="text-muted-foreground text-sm">|</span>
                <span className="text-muted-foreground text-sm">Vecka {weekNumber}, {now.getFullYear()}</span>
            </div>

            {/* Goals with Tasks */}
            <div className="space-y-4">
                {isLoading && activeGoals.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">Läser in uppgifter...</div>
                ) : (
                    activeGoals.map(goal => <GoalSection key={goal.id} goal={goal} onToggleTask={handleToggleTask} />)
                )}
            </div>

            {/* AI Suggestion */}
            <Card className="mt-6 p-4 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                        <h4 className="font-medium text-sm">AI-förslag</h4>
                        <p className="text-xs text-muted-foreground mt-1">Du har 3 kvitton som väntar på granskning. Vill du att jag bokför dem automatiskt?</p>
                    </div>
                </div>
            </Card>
        </div>
    )
}

// ============================================
// Main Page Shell
// ============================================

const tabs = [
    { id: "uppgifter", label: "Uppgifter", icon: CheckSquare },
    { id: "kalender", label: "Kalender", icon: CalendarIcon },
]

function DagbokPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const currentTab = useMemo(() => {
        const tab = searchParams.get("tab")
        return tab && tabs.some(t => t.id === tab) ? tab : "uppgifter"
    }, [searchParams])

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/dagbok?tab=${tab}`, { scroll: false })
    }, [router])

    return (
        <TooltipProvider>
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

                {/* Tabs */}
                <div className="px-6 pt-4">
                    <div className="max-w-6xl w-full">
                        <div className="flex items-center gap-1 pb-2 mb-4 border-b-2 border-border/60">
                            {tabs.map((tab) => {
                                const isActive = currentTab === tab.id
                                const Icon = tab.icon
                                return (
                                    <Tooltip key={tab.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setCurrentTab(tab.id)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {isActive && <span>{tab.label}</span>}
                                            </button>
                                        </TooltipTrigger>
                                        {!isActive && (
                                            <TooltipContent side="bottom">
                                                <p>{tab.label}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <main className="flex-1 px-6 pb-6">
                    <div className="max-w-6xl w-full">
                        {currentTab === "uppgifter" && <UppgifterContent />}
                        {currentTab === "kalender" && <LazyJournalCalendar />}
                    </div>
                </main>
            </div>
        </TooltipProvider>
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
