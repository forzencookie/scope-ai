"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

// ==========================================
// Grid Table Components
// Clean, CSS grid-based table for most data displays
// Used by: transaktioner, kvitton, inventarier, moms, etc.
// ==========================================

interface TableColumn {
    label: string
    icon?: React.ComponentType<{ className?: string }>
    span?: number  // grid column span, defaults to 1
    align?: 'left' | 'right' | 'center'
}

interface GridTableHeaderProps {
    columns: TableColumn[]
    /** Total grid columns (defaults to 12) */
    gridCols?: number
    /** Optional trailing element (e.g., checkbox) */
    trailing?: ReactNode
    className?: string
}

export function GridTableHeader({
    columns,
    gridCols = 12,
    trailing,
    className
}: GridTableHeaderProps) {
    return (
        <div
            className={cn(
                "grid gap-4 px-2 py-3.5 -mx-2 mb-2 bg-muted/40 rounded-lg text-xs font-medium text-muted-foreground uppercase tracking-wider items-center",
                className
            )}
            style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
        >
            {columns.map((col, idx) => {
                const Icon = col.icon
                const align = col.align || 'left'
                const spanStyle = col.span ? { gridColumn: `span ${col.span}` } : undefined
                return (
                    <div
                        key={idx}
                        className={cn(
                            "flex items-center gap-1 w-full min-w-0",
                            align === 'right' && "justify-end",
                            align === 'center' && "justify-center"
                        )}
                        style={spanStyle}
                    >
                        {Icon && <Icon className="h-3 w-3 flex-shrink-0" />}
                        <span className="truncate whitespace-nowrap">{col.label}</span>
                    </div>
                )
            })}
            {trailing && (
                <div className="flex justify-end items-center">
                    {trailing}
                </div>
            )}
        </div>
    )
}

interface GridTableRowsProps {
    children: ReactNode
    className?: string
}

export function GridTableRows({ children, className }: GridTableRowsProps) {
    return (
        <div className={cn("space-y-0.5", className)}>
            {children}
        </div>
    )
}

interface GridTableRowProps {
    children: ReactNode
    gridCols?: number
    selected?: boolean
    onClick?: () => void
    className?: string
}

export function GridTableRow({
    children,
    gridCols = 12,
    selected,
    onClick,
    className
}: GridTableRowProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "grid gap-4 px-2 py-3 hover:bg-muted/30 -mx-2 rounded-md transition-colors items-center text-sm group",
                onClick && "cursor-pointer",
                selected && "bg-muted/40",
                className
            )}
            style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
        >
            {children}
        </div>
    )
}

// Backwards compatibility aliases during migration
export {
    GridTableHeader as Table3Header,
    GridTableRows as Table3Rows,
    GridTableRow as Table3Row,
}
