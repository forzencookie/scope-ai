"use client"

import { ReactNode, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// ==========================================
// Collapsible Table Components
// For financial reports with expandable sections
// Used by: Resultaträkning, Balansräkning, INK2, Förmåner
// ==========================================

export interface CollapsibleTableItem {
    id?: string       // Optional code (e.g., "3.1" for tax forms)
    label: string     // Display name
    value: number     // Numerical amount
    indent?: boolean  // Visual indentation
    sublabel?: string // Optional secondary text
}

// ==========================================
// Container
// ==========================================

export function CollapsibleTableContainer({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("max-w-6xl w-full space-y-6", className)}>
            {children}
        </div>
    )
}

// ==========================================
// Badge (colored value display)
// ==========================================

export function CollapsibleTableBadge({ value, className }: { value: number; className?: string }) {
    const roundedValue = Math.round(value) === 0 ? 0 : Math.round(value)

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
            {roundedValue > 0 && "+"}{roundedValue.toLocaleString('sv-SE')} kr
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
        <div className="flex items-center justify-between pt-2">
            <div>
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
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
    const roundedValue = Math.round(item.value) === 0 ? 0 : Math.round(item.value)
    const hasChildren = !!children

    return (
        <div className={cn("group", className)}>
            <div
                className={cn(
                    "flex items-start justify-between py-3 px-2 -mx-2 rounded-md transition-colors",
                    hasChildren ? "cursor-pointer hover:bg-muted/30" : "hover:bg-muted/30"
                )}
                onClick={() => hasChildren && setIsOpen(!isOpen)}
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
                        <span>{item.label}</span>
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
                    {roundedValue.toLocaleString('sv-SE')} kr
                </span>
            </div>

            {/* Nested Content */}
            {isOpen && hasChildren && (
                <div className="pl-16 pr-2 py-2 border-t border-border/40 bg-muted/5 -mx-2 mb-2">
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

    // Auto-calculate total if not provided
    const displayTotal = total !== undefined ? total : items.reduce((sum, item) => sum + item.value, 0)

    if (items.length === 0) return null

    return (
        <div className="space-y-1">
            {/* Section Header Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 py-2 hover:bg-muted/30 rounded-sm px-2 -mx-2 transition-colors group w-full text-left"
            >
                <div className="flex items-center gap-3">
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    )}
                    <span className="font-medium text-sm group-hover:text-foreground transition-colors text-muted-foreground">
                        {title}
                    </span>

                    {!hideTotalHeader && (
                        neutral ? (
                            <span className="font-medium text-sm tabular-nums text-foreground">
                                {displayTotal.toLocaleString('sv-SE')} kr
                            </span>
                        ) : (
                            <CollapsibleTableBadge value={displayTotal} />
                        )
                    )}
                </div>
            </button>

            {/* Section Rows */}
            {isOpen && (
                <div className="space-y-0.5 pl-6">
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
