"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Zap } from "lucide-react"
import { useQuickActions } from "@/hooks/chat/use-quick-actions"
import type { QuickAction, QuickActionCategory } from "@/lib/ai/quick-actions"
import { quickActionCategories } from "@/lib/ai/quick-actions"

// ============================================
// Types
// ============================================

interface QuickActionsMenuProps {
    /** Whether the menu is open */
    open: boolean
    /** Called when the menu should close */
    onClose: () => void
    /** Called when a quick action is selected */
    onSelect: (action: QuickAction) => void
    /** Current search query to filter by */
    searchQuery: string
}

// ============================================
// QuickActionsMenu Component
// ============================================

export function QuickActionsMenu({
    open,
    onClose,
    onSelect,
    searchQuery,
}: QuickActionsMenuProps) {
    const { search, grouped, categories } = useQuickActions()
    const [activeIndex, setActiveIndex] = useState(0)
    const menuRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

    // Determine which actions to display
    const isSearching = searchQuery.trim().length > 0
    const filteredActions = isSearching ? search(searchQuery) : null

    // Reset active index when query changes
    useEffect(() => {
        setActiveIndex(0)
    }, [searchQuery])

    // Build flat list for keyboard navigation
    const flatActions: QuickAction[] = isSearching
        ? (filteredActions ?? [])
        : Object.entries(categories)
              .sort(([, a], [, b]) => a.order - b.order)
              .flatMap(([cat]) => grouped[cat as QuickActionCategory] ?? [])

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!open) return

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault()
                    setActiveIndex(i => Math.min(i + 1, flatActions.length - 1))
                    break
                case "ArrowUp":
                    e.preventDefault()
                    setActiveIndex(i => Math.max(i - 1, 0))
                    break
                case "Enter":
                    e.preventDefault()
                    if (flatActions[activeIndex]) {
                        onSelect(flatActions[activeIndex])
                    }
                    break
                case "Escape":
                    e.preventDefault()
                    onClose()
                    break
            }
        },
        [open, flatActions, activeIndex, onSelect, onClose]
    )

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [handleKeyDown])

    // Scroll active item into view
    useEffect(() => {
        const el = itemRefs.current.get(activeIndex)
        el?.scrollIntoView({ block: "nearest" })
    }, [activeIndex])

    // Click outside to close
    useEffect(() => {
        if (!open) return
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        // Delay to avoid immediate close from the trigger click
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside)
        }, 0)
        return () => {
            clearTimeout(timer)
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [open, onClose])

    if (!open) return null

    // No results
    if (flatActions.length === 0) {
        return (
            <div
                ref={menuRef}
                className="w-full bg-popover border rounded-xl shadow-lg p-4"
            >
                <p className="text-sm text-muted-foreground text-center">
                    Inga åtgärder hittades{isSearching ? ` för "${searchQuery}"` : ""}
                </p>
            </div>
        )
    }

    let globalIndex = 0

    return (
        <div
            ref={menuRef}
            className="w-full bg-popover border rounded-xl shadow-lg overflow-hidden"
        >
            <div className="max-h-[240px] overflow-y-auto p-1.5">
                {isSearching ? (
                    // Flat search results
                    <div className="space-y-0.5">
                        {filteredActions?.map((action) => {
                            const idx = globalIndex++
                            return (
                                <ActionItem
                                    key={action.id}
                                    action={action}
                                    isActive={idx === activeIndex}
                                    onSelect={() => onSelect(action)}
                                    onHover={() => setActiveIndex(idx)}
                                    ref={(el) => {
                                        if (el) itemRefs.current.set(idx, el)
                                        else itemRefs.current.delete(idx)
                                    }}
                                />
                            )
                        })}
                    </div>
                ) : (
                    // Grouped by category
                    Object.entries(categories)
                        .sort(([, a], [, b]) => a.order - b.order)
                        .map(([cat, meta]) => {
                            const actions = grouped[cat as QuickActionCategory]
                            if (!actions || actions.length === 0) return null
                            const categoryStartIndex = globalIndex
                            return (
                                <div key={cat} className="mb-0.5 last:mb-0">
                                    <div className="px-2 py-1 mt-1 first:mt-0">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
                                            {meta.label}
                                        </span>
                                    </div>
                                    <div className="space-y-0.5">
                                        {actions.map((action, i) => {
                                            const idx = categoryStartIndex + i
                                            globalIndex++
                                            return (
                                                <ActionItem
                                                    key={action.id}
                                                    action={action}
                                                    isActive={idx === activeIndex}
                                                    onSelect={() => onSelect(action)}
                                                    onHover={() => setActiveIndex(idx)}
                                                    ref={(el) => {
                                                        if (el) itemRefs.current.set(idx, el)
                                                        else itemRefs.current.delete(idx)
                                                    }}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })
                )}
            </div>

            {/* Footer hint */}
            <div className="border-t px-3 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground/50 bg-muted/20">
                <span>↑↓ navigera · ↵ välj · esc stäng</span>
                <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Snabbåtgärder
                </span>
            </div>
        </div>
    )
}

// ============================================
// ActionItem
// ============================================

import { forwardRef } from "react"

const ActionItem = forwardRef<
    HTMLButtonElement,
    {
        action: QuickAction
        isActive: boolean
        onSelect: () => void
        onHover: () => void
    }
>(function ActionItem({ action, isActive, onSelect, onHover }, ref) {
    const Icon = action.icon

    return (
        <button
            ref={ref}
            type="button"
            className={cn(
                "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors",
                isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 text-foreground"
            )}
            onClick={onSelect}
            onMouseEnter={onHover}
        >
            <div className="flex-shrink-0 flex items-center justify-center opacity-70">
                <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0 flex items-baseline gap-2">
                <span className="text-[13px] font-medium whitespace-nowrap">{action.label}</span>
                <span className="text-[12px] text-muted-foreground truncate">{action.description}</span>
            </div>
            {action.autoSend && (
                <span className="flex-shrink-0 text-[9px] text-muted-foreground/60 font-medium px-1.5 py-0.5 rounded-sm bg-muted">
                    auto
                </span>
            )}
        </button>
    )
})
