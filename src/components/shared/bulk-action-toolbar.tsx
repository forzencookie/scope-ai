"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Trash2, Download, Archive, Tag, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface BulkAction {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: "default" | "destructive" | "ai"
  onClick?: (selectedIds: string[]) => void
}

interface BulkActionToolbarProps {
  selectedCount: number
  selectedIds: string[]
  onClearSelection: () => void
  actions?: BulkAction[]
  className?: string
}

// Default actions that can be customized
const defaultActions: BulkAction[] = [
  { id: "delete", label: "Radera", icon: Trash2, variant: "destructive" },
  { id: "archive", label: "Arkivera", icon: Archive },
  { id: "download", label: "Ladda ner", icon: Download },
  { id: "tag", label: "Tagga", icon: Tag },
]

export function BulkActionToolbar({
  selectedCount,
  selectedIds,
  onClearSelection,
  actions = defaultActions,
  className,
}: BulkActionToolbarProps) {
  const isVisible = selectedCount > 0

  // Show first 3 actions as buttons, rest in dropdown
  const visibleActions = actions.slice(0, 3)
  const overflowActions = actions.slice(3)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed bottom-4 left-1/2 -translate-x-1/2 z-40",
            "flex items-center gap-2 px-4 py-2 rounded-lg",
            "bg-background border border-border shadow-lg",
            "md:bottom-6",
            className
          )}
        >
          {/* Selection count */}
          <div className="flex items-center gap-2 pr-3 border-r border-border">
            <span className="text-sm font-medium">
              {selectedCount} {selectedCount === 1 ? "vald" : "valda"}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClearSelection}
              className="h-6 w-6"
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Avmarkera alla</span>
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {visibleActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.id}
                  variant={action.variant === "destructive" ? "destructive" : action.variant === "ai" ? "outline" : "outline"}
                  size="sm"
                  onClick={() => action.onClick?.(selectedIds)}
                  className={cn(
                    "gap-1.5",
                    action.variant === "ai" && "bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700"
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              )
            })}

            {/* Overflow menu */}
            {overflowActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon-sm">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Fler åtgärder</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {overflowActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <DropdownMenuItem
                        key={action.id}
                        onClick={() => action.onClick?.(selectedIds)}
                        className={action.variant === "destructive" ? "text-red-600" : ""}
                      >
                        {Icon && <Icon className="h-4 w-4 mr-2" />}
                        {action.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for managing bulk selection state
export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  const selectedCount = selectedIds.size
  const allSelected = items.length > 0 && selectedIds.size === items.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length

  const toggleItem = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAll = React.useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)))
    }
  }, [items, allSelected])

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = React.useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  )

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount,
    allSelected,
    someSelected,
    toggleItem,
    toggle: toggleItem,  // Alias for compatibility
    toggleAll,
    clearSelection,
    isSelected,
  }
}
