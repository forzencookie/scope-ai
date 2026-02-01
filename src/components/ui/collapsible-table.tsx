"use client"

import { ReactNode, useState, useRef, useCallback, useTransition } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn, safeNumber, formatNumber } from "@/lib/utils"

// ==========================================
// Collapsible Table Components
// For financial reports with expandable sections
// Used by: Resultaträkning, Balansräkning, INK2, Förmåner
// ==========================================

// Debounce rapid toggles to prevent jank
const TOGGLE_DEBOUNCE_MS = 50
const ANIMATION_DURATION_MS = 200

export interface CollapsibleTableItem {
    id?: string       // Optional code (e.g., "3.1" for tax forms)
    label: string     // Display name
    value: number     // Numerical amount
    indent?: boolean  // Visual indentation
    sublabel?: string // Optional secondary text
    onClick?: () => void // Optional click handler
}

// ==========================================
// Container
// ==========================================

export function CollapsibleTableContainer({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("w-full space-y-4 md:space-y-6", className)}>
            {children}
        </div>
    )
}

// ==========================================
// Badge (colored value display)
// ==========================================

export function CollapsibleTableBadge({ value, className }: { value: number; className?: string }) {
    const safeValue = safeNumber(value)
    const roundedValue = Math.round(safeValue) === 0 ? 0 : Math.round(safeValue)

    if (roundedValue === 0) return (
        <span className={cn("font-medium text-sm tabular-nums px-2 py-0.5 rounded-sm shrink-0 text-muted-foreground bg-muted/50", className)}>
            0 kr
        </span>
    )

    return (
        <span className={cn(
            "font-medium text-sm tabular-nums px-2 py-0.5 rounded-sm shrink-0",
            roundedValue > 0 && "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/50",
            roundedValue < 0 && "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50",
            className
        )}>
            {roundedValue > 0 && "+"}{formatNumber(roundedValue)} kr
        </span>
    )
}

// ==========================================
// Header
// ==========================================

interface CollapsibleTableHeaderProps {
    title: string
    subtitle?: string
    children?: ReactNode
}

export function CollapsibleTableHeader({ title, subtitle, children }: CollapsibleTableHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-2">
            <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight truncate">{title}</h2>
                {subtitle && <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {children}
            </div>
        </div>
    )
}

// ==========================================
// Row (expandable item)
// ==========================================

interface CollapsibleTableRowProps {
    item: CollapsibleTableItem
    className?: string
    children?: ReactNode
    neutral?: boolean  // If true, don't use green/red coloring
}

export function CollapsibleTableRow({ item, className, children, neutral = false }: CollapsibleTableRowProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const lastToggle = useRef(0)
    const [, startTransition] = useTransition()
    
    const safeValue = safeNumber(item.value)
    const roundedValue = Math.round(safeValue) === 0 ? 0 : Math.round(safeValue)
    const hasChildren = !!children

    const handleToggle = useCallback(() => {
        const now = Date.now()
        // Prevent rapid toggle spam
        if (isAnimating || now - lastToggle.current < TOGGLE_DEBOUNCE_MS) {
            return
        }
        lastToggle.current = now
        setIsAnimating(true)
        
        startTransition(() => {
            setIsOpen(prev => !prev)
        })
        
        setTimeout(() => {
            setIsAnimating(false)
        }, ANIMATION_DURATION_MS)
    }, [isAnimating])

    return (
        <div className={cn("group", className)}>
            <div
                className={cn(
                    "flex items-start justify-between py-3 px-2 -mx-2 rounded-md transition-colors",
                    (hasChildren || item.onClick) ? "cursor-pointer hover:bg-muted/30" : "hover:bg-muted/30",
                    isAnimating && "pointer-events-none"
                )}
                onClick={() => {
                    if (hasChildren) handleToggle()
                    if (item.onClick) item.onClick()
                }}
            >
                <div className="flex items-start gap-3">
                    {/* Toggle Icon or Spacer */}
                    {hasChildren ? (
                        <div className="mt-0.5 text-muted-foreground group-hover:text-foreground">
                            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </div>
                    ) : (
                        <div className="w-3.5" /> // Spacer for alignment
                    )}

                    {item.id && (
                        <span className="font-mono text-xs text-muted-foreground w-10 shrink-0 pt-0.5">
                            {item.id}
                        </span>
                    )}
                    <div className={cn("text-sm", item.indent && "pl-4")}>
                        <span className={cn(item.onClick && "text-primary hover:underline font-medium")}>
                            {item.label}
                        </span>
                        {item.sublabel && (
                            <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                        )}
                    </div>
                </div>
                <span className={cn(
                    "font-medium text-sm tabular-nums shrink-0 ml-4",
                    neutral
                        ? "text-foreground"
                        : roundedValue > 0
                            ? "text-green-600 dark:text-green-400"
                            : roundedValue < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-muted-foreground"
                )}>
                    {formatNumber(roundedValue)} kr
                </span>
            </div>

            {/* Nested Content - with smooth animation */}
            {isOpen && hasChildren && (
                <div 
                    className={cn(
                        "pl-16 pr-2 py-2 border-t border-border/40 bg-muted/5 -mx-2 mb-2",
                        "transition-all duration-200 ease-in-out",
                        "animate-in fade-in-0 slide-in-from-top-1"
                    )}
                >
                    {children}
                </div>
            )}
        </div>
    )
}

// ==========================================
// Section (collapsible group with items)
// ==========================================

interface CollapsibleTableSectionProps {
    title: string
    items: CollapsibleTableItem[]
    total?: number        // Can be manually provided or auto-calculated from items
    defaultOpen?: boolean
    hideTotalHeader?: boolean
    neutral?: boolean     // If true, don't use green/red coloring
}

export function CollapsibleTableSection({
    title,
    items,
    total,
    defaultOpen = true,
    hideTotalHeader = false,
    neutral = false
}: CollapsibleTableSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const [isAnimating, setIsAnimating] = useState(false)
    const lastToggle = useRef(0)
    const [, startTransition] = useTransition()

    // Auto-calculate total if not provided, using safeNumber for each item
    const displayTotal = safeNumber(total !== undefined ? total : items.reduce((sum, item) => sum + safeNumber(item.value), 0))

    const handleToggle = useCallback(() => {
        const now = Date.now()
        // Prevent rapid toggle spam
        if (isAnimating || now - lastToggle.current < TOGGLE_DEBOUNCE_MS) {
            return
        }
        lastToggle.current = now
        setIsAnimating(true)
        
        startTransition(() => {
            setIsOpen(prev => !prev)
        })
        
        setTimeout(() => {
            setIsAnimating(false)
        }, ANIMATION_DURATION_MS)
    }, [isAnimating])

    const isEmpty = items.length === 0

    return (
        <div className="space-y-1">
            {/* Section Header Button */}
            <button
                onClick={isEmpty ? undefined : handleToggle}
                disabled={isAnimating || isEmpty}
                className={cn(
                    "flex items-center gap-3 py-2 rounded-sm px-2 -mx-2 transition-colors group w-full text-left",
                    isEmpty ? "cursor-default" : "hover:bg-muted/30",
                    isAnimating && "pointer-events-none opacity-70"
                )}
            >
                <div className="flex items-center gap-3">
                    {isEmpty ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    ) : isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    )}
                    <span className={cn(
                        "font-medium text-sm transition-colors",
                        isEmpty ? "text-muted-foreground/50" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                        {title}
                    </span>

                    {!hideTotalHeader && (
                        neutral ? (
                            <span className={cn(
                                "font-medium text-sm tabular-nums",
                                isEmpty ? "text-muted-foreground/50" : "text-foreground"
                            )}>
                                {formatNumber(displayTotal)} kr
                            </span>
                        ) : (
                            <CollapsibleTableBadge value={displayTotal} />
                        )
                    )}
                </div>
            </button>

            {/* Section Rows - with smooth animation */}
            {isOpen && !isEmpty && (
                <div className={cn(
                    "space-y-0.5 pl-6",
                    "transition-all duration-200 ease-in-out",
                    "animate-in fade-in-0 slide-in-from-top-1"
                )}>
                    {items.map((item, idx) => (
                        <CollapsibleTableRow key={item.id || `${item.label}-${idx}`} item={item} neutral={neutral} />
                    ))}
                </div>
            )}
        </div>
    )
}

// Backwards compatibility aliases during migration
export {
    CollapsibleTableContainer as Table2Container,
    CollapsibleTableHeader as Table2Header,
    CollapsibleTableRow as Table2Row,
    CollapsibleTableSection as Table2Section,
    CollapsibleTableBadge as Table2Badge,
}
export type { CollapsibleTableItem as Table2Item }
