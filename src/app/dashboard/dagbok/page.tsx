"use client"

import { useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { 
    CheckSquare, 
    Circle,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Calendar,
    Plus,
    MoreHorizontal,
    Sparkles,
    FileText,
    Building2,
    User,
    Flag,
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
import { 
    Tooltip, 
    TooltipContent, 
    TooltipTrigger, 
    TooltipProvider 
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { LazyJournalCalendar } from "@/components/lazy-modules"

// ============================================
// Tasks Data & Config
// ============================================

const initialTasks = [
    {
        id: 1,
        title: "Granska saknade underlag",
        description: "3 transaktioner saknar kvitton",
        category: "bookkeeping",
        priority: "high",
        dueDate: "Idag",
        isAiGenerated: true,
        completed: false,
    },
    {
        id: 2,
        title: "Godkänn AI-matchningar",
        description: "5 transaktioner väntar på godkännande",
        category: "ai",
        priority: "medium",
        dueDate: "Idag",
        isAiGenerated: true,
        completed: false,
    },
    {
        id: 3,
        title: "Momsdeklaration Q4",
        description: "Deadline 12 januari 2025",
        category: "reports",
        priority: "high",
        dueDate: "12 jan",
        isAiGenerated: false,
        completed: false,
    },
    {
        id: 4,
        title: "Skapa lönebesked december",
        description: "2 anställda",
        category: "payroll",
        priority: "medium",
        dueDate: "28 dec",
        isAiGenerated: true,
        completed: false,
    },
    {
        id: 5,
        title: "Stäm av bankkonto",
        description: "Saldo: 45 230 kr",
        category: "bookkeeping",
        priority: "low",
        dueDate: "10 dec",
        isAiGenerated: true,
        completed: false,
    },
    {
        id: 6,
        title: "Kategorisera okända transaktioner",
        description: "2 transaktioner behöver kategoriseras",
        category: "ai",
        priority: "medium",
        dueDate: "Igår",
        isAiGenerated: true,
        completed: true,
    },
    {
        id: 7,
        title: "Ladda upp kvitto - Lunch kundmöte",
        description: "450 kr saknar underlag",
        category: "bookkeeping",
        priority: "medium",
        dueDate: "5 dec",
        isAiGenerated: true,
        completed: true,
    },
]

const categoryConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    bookkeeping: { icon: <FileText className="h-3.5 w-3.5" />, label: "Bokföring", color: "text-muted-foreground" },
    ai: { icon: <Sparkles className="h-3.5 w-3.5" />, label: "AI", color: "text-muted-foreground" },
    reports: { icon: <Building2 className="h-3.5 w-3.5" />, label: "Rapporter", color: "text-muted-foreground" },
    payroll: { icon: <User className="h-3.5 w-3.5" />, label: "Löner", color: "text-muted-foreground" },
}

const priorityConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    high: { icon: <Flag className="h-3.5 w-3.5" />, color: "text-red-500" },
    medium: { icon: <Flag className="h-3.5 w-3.5" />, color: "text-amber-500" },
    low: { icon: <Flag className="h-3.5 w-3.5" />, color: "text-gray-400" },
}

// ============================================
// Tab Configuration
// ============================================

const tabs = [
    { id: "uppgifter", label: "Uppgifter", icon: CheckSquare },
    { id: "kalender", label: "Kalender", icon: Calendar },
]

// Get contextual info for each tab
function getTabInfo(tabId: string) {
    switch (tabId) {
        case "uppgifter":
            return "5 att göra"
        case "kalender":
            return "December 2024"
        default:
            return ""
    }
}

// ============================================
// Tasks Content Component
// ============================================

function TasksContent() {
    const [tasks, setTasks] = useState(initialTasks)
    const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending")

    const filteredTasks = tasks.filter(task => {
        if (filter === "pending") return !task.completed
        if (filter === "completed") return task.completed
        return true
    })

    const pendingCount = tasks.filter(t => !t.completed).length
    const completedCount = tasks.filter(t => t.completed).length
    const aiGeneratedCount = tasks.filter(t => t.isAiGenerated && !t.completed).length

    const toggleComplete = (id: number) => {
        setTasks(prev => prev.map(t => 
            t.id === id ? { ...t, completed: !t.completed } : t
        ))
    }

    const deleteTask = (id: number) => {
        setTasks(prev => prev.filter(t => t.id !== id))
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">
                        AI-genererade och manuella uppgifter för din bokföring
                    </p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ny uppgift
                </Button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 border-b-2 border-border/60 pb-2">
                <Button 
                    variant={filter === "all" ? "secondary" : "ghost"} 
                    size="sm"
                    onClick={() => setFilter("all")}
                >
                    Alla ({tasks.length})
                </Button>
                <Button 
                    variant={filter === "pending" ? "secondary" : "ghost"} 
                    size="sm"
                    onClick={() => setFilter("pending")}
                >
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    Att göra ({pendingCount})
                </Button>
                <Button 
                    variant={filter === "completed" ? "secondary" : "ghost"} 
                    size="sm"
                    onClick={() => setFilter("completed")}
                >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Klara ({completedCount})
                </Button>
            </div>

            {/* Task list */}
            <div className="flex flex-col gap-2">
                {filteredTasks.map((task) => {
                    const category = categoryConfig[task.category]
                    const priority = priorityConfig[task.priority]
                    const isOverdue = task.dueDate === "Igår" && !task.completed
                    
                    return (
                        <div 
                            key={task.id}
                            className={`flex items-center gap-4 p-4 rounded-lg border transition-colors group ${
                                task.completed 
                                    ? "bg-muted/20 border-border/30" 
                                    : "border-2 border-border/60 hover:bg-muted/30"
                            }`}
                        >
                            {/* Checkbox */}
                            <button 
                                onClick={() => toggleComplete(task.id)}
                                className="flex-shrink-0"
                            >
                                {task.completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                                )}
                            </button>

                            {/* Content */}
                            <div className={`flex-1 min-w-0 ${task.completed ? "opacity-50" : ""}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium ${task.completed ? "line-through" : ""}`}>
                                        {task.title}
                                    </span>
                                    {task.isAiGenerated && (
                                        <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                                    )}
                                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${category.color}`}>
                                        {category.icon}
                                        {category.label}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                            </div>

                            {/* Priority */}
                            <div className={priority.color}>
                                {priority.icon}
                            </div>

                            {/* Due date */}
                            <div className={`flex items-center gap-1 text-sm ${
                                isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
                            }`}>
                                <Calendar className="h-3.5 w-3.5" />
                                {task.dueDate}
                                {isOverdue && <AlertTriangle className="h-3.5 w-3.5 ml-1" />}
                            </div>

                            {/* Actions */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => toggleComplete(task.id)}>
                                        {task.completed ? (
                                            <>
                                                <Circle className="h-4 w-4 mr-2" />
                                                Markera som ej klar
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                Markera som klar
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={() => deleteTask(task.id)}
                                    >
                                        Ta bort
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )
                })}

                {filteredTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <CheckSquare className="h-12 w-12 mb-4 opacity-50" />
                        <p>{filter === "completed" ? "Inga klara uppgifter" : "Inga uppgifter att göra"}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================
// Main Page Component
// ============================================

function DagbokPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const tabParam = searchParams.get("tab")
    const currentTab = tabParam && tabs.some(t => t.id === tabParam) ? tabParam : "uppgifter"

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/dagbok?tab=${tab}`, { scroll: false })
    }, [router])

    return (
        <TooltipProvider>
            <div className="flex flex-col min-h-svh">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Dagbok</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <BreadcrumbAIBadge />
                </header>

                {/* Tabs with same styling as other pages */}
                <div className="px-6 pt-6">
                    <div className="max-w-6xl w-full">
                        <div className="flex items-center gap-1 pb-2 mb-6 border-b-2 border-border/60">
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
                            
                            <div className="ml-auto text-sm text-muted-foreground">
                                {getTabInfo(currentTab)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <main className="flex-1 px-6 pb-6">
                    <div className="max-w-6xl w-full">
                        {currentTab === "uppgifter" && <TasksContent />}
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
