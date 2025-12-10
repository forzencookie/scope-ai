"use client"

import { useState } from "react"
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
    Receipt,
    Building2,
    User,
    Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Sample tasks - AI-generated and manual
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

export default function TasksPage() {
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
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <CheckSquare className="h-6 w-6" />
                        Uppgifter
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        AI-genererade och manuella uppgifter för din bokföring
                    </p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ny uppgift
                </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border/50">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">{pendingCount} att göra</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border/50">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">{aiGeneratedCount} AI-genererade</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border/50">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{completedCount} klara</span>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 border-b border-border/50 pb-2">
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
                                    : "border-border/50 hover:bg-muted/30"
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
