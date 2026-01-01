"use client"

import * as React from "react"
import { Plus, MoreHorizontal, Calendar } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ============================================================================
// Kanban Column Configuration Types
// ============================================================================

export interface KanbanColumnConfig {
    id: string
    title: string
    status: string
}

// ============================================================================
// Kanban Card Component (Generic)
// ============================================================================

export interface KanbanCardProps {
    title: React.ReactNode
    subtitle?: string
    amount: number
    date?: string
    isOverdue?: boolean
    extraTags?: React.ReactNode  // For additional tags like VAT
    children?: React.ReactNode  // For action menu content
}

export function KanbanCard({
    title,
    subtitle,
    amount,
    date,
    isOverdue = false,
    extraTags,
    children,
}: KanbanCardProps) {
    return (
        <div className="bg-background rounded-lg p-4 border-2 border-transparent hover:border-border transition-colors cursor-pointer group">
            {/* Subtitle/Client Label */}
            {subtitle && (
                <div className="text-xs text-muted-foreground mb-2">
                    {subtitle}
                </div>
            )}

            {/* Title */}
            <h4 className="font-medium text-sm mb-3 line-clamp-2">
                {title}
            </h4>

            {/* Amount Tag */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    isOverdue
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                )}>
                    {formatCurrency(amount)}
                </span>
                {extraTags}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                {/* Date */}
                {date && (
                    <div className={cn(
                        "flex items-center gap-1",
                        isOverdue && "text-red-600 dark:text-red-400"
                    )}>
                        <Calendar className="h-3 w-3" />
                        <span>{date}</span>
                    </div>
                )}
                {!date && <div />}

                {/* Actions Menu */}
                {children && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {children}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// Kanban Column Component (Generic)
// ============================================================================

export interface KanbanColumnProps {
    title: string
    count: number
    onAddNew?: () => void
    children: React.ReactNode
}

export function KanbanColumn({
    title,
    count,
    onAddNew,
    children,
}: KanbanColumnProps) {
    return (
        <div className="flex flex-col flex-1 bg-muted/50 rounded-lg min-w-0">
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-2 rounded-t-lg">
                <span className="font-semibold text-sm text-foreground">
                    {title}: {count}
                </span>
                <div className="flex items-center gap-1">
                    {onAddNew && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={onAddNew}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Column Content - auto height up to 60vh max, then scrolls */}
            <div className="p-2 space-y-2 rounded-b-lg max-h-[60vh] overflow-y-auto">
                {children}
            </div>

            {/* Add New Row at bottom */}
            {onAddNew && (
                <button
                    onClick={onAddNew}
                    className="m-2 p-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Lägg till ny
                </button>
            )}
        </div>
    )
}

// ============================================================================
// Kanban Board Container (Generic)
// ============================================================================

export interface KanbanBoardProps {
    children: React.ReactNode
    className?: string
}

export function KanbanBoard({ children, className }: KanbanBoardProps) {
    return (
        <div className={cn(
            "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
            className
        )}>
            {children}
        </div>
    )
}
