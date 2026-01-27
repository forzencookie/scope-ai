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
    /** Hide this column on mobile (below md breakpoint) */
    hiddenOnMobile?: boolean
}

interface GridTableHeaderProps {
    columns: TableColumn[]
    /** Total grid columns (defaults to 12) */
    gridCols?: number
    /** Optional trailing element (e.g., checkbox) */
    trailing?: ReactNode
    className?: string
    /** Minimum width for the grid (for horizontal scroll on mobile) */
    minWidth?: string
}

export function GridTableHeader({
    columns,
    gridCols = 12,
    trailing,
    className,
    minWidth = "0"
}: GridTableHeaderProps) {
    // Calculate visible columns on mobile (those without hiddenOnMobile)
    const mobileVisibleCount = columns.filter(c => !c.hiddenOnMobile).length + (trailing ? 1 : 0)
    
    return (
        <>
            {/* Desktop grid - full 12 columns */}
            <div
                className={cn(
                    "hidden md:grid gap-4 px-2 py-3.5 -mx-2 mb-2 bg-muted/40 rounded-lg text-xs font-medium text-muted-foreground uppercase tracking-wider items-center",
                    className
                )}
                style={{
                    gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                    minWidth
                }}
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
            
            {/* Mobile grid - only visible columns, evenly distributed */}
            <div
                className={cn(
                    "grid md:hidden gap-2 px-2 py-3 -mx-2 mb-2 bg-muted/40 rounded-lg text-xs font-medium text-muted-foreground uppercase tracking-wider items-center",
                    className
                )}
                style={{
                    gridTemplateColumns: `repeat(${mobileVisibleCount}, minmax(0, 1fr))`
                }}
            >
                {columns.filter(col => !col.hiddenOnMobile).map((col, idx) => {
                    const Icon = col.icon
                    const align = col.align || 'left'
                    return (
                        <div
                            key={idx}
                            className={cn(
                                "flex items-center gap-1 w-full min-w-0",
                                align === 'right' && "justify-end",
                                align === 'center' && "justify-center"
                            )}
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
        </>
    )
}

interface GridTableContainerProps {
    children: ReactNode
    className?: string
}

/** Responsive container that adds horizontal scroll on mobile */
export function GridTableContainer({ children, className }: GridTableContainerProps) {
    return (
        <div className={cn("overflow-x-auto -mx-2 px-2", className)}>
            {children}
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
    /** Desktop grid columns (defaults to 12) */
    gridCols?: number
    selected?: boolean
    onClick?: () => void
    className?: string
    /** Minimum width for the grid (for horizontal scroll on mobile) */
    minWidth?: string
}

export function GridTableRow({
    children,
    gridCols = 12,
    selected,
    onClick,
    className,
    minWidth = "0"
}: GridTableRowProps) {
    // Render separate mobile and desktop grids
    // Mobile uses auto-flow which ignores col-span and distributes visible children evenly
    // Desktop uses the full 12-column grid with explicit spans
    return (
        <>
            {/* Desktop row - uses 12-col grid with explicit spans */}
            <div
                onClick={onClick}
                className={cn(
                    "hidden md:grid gap-4 px-2 py-3 hover:bg-muted/30 -mx-2 rounded-md transition-colors items-center text-sm group",
                    onClick && "cursor-pointer",
                    selected && "bg-muted/40",
                    className
                )}
                style={{
                    gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                    minWidth
                }}
            >
                {children}
            </div>
            {/* Mobile row - auto-flow distributes visible children evenly */}
            <div
                onClick={onClick}
                className={cn(
                    "grid md:hidden gap-2 px-2 py-3 hover:bg-muted/30 -mx-2 rounded-md transition-colors items-center text-sm group",
                    onClick && "cursor-pointer",
                    selected && "bg-muted/40",
                    className
                )}
                style={{
                    gridAutoFlow: 'column',
                    gridAutoColumns: '1fr'
                }}
            >
                {children}
            </div>
        </>
    )
}

// Backwards compatibility aliases during migration
export {
    GridTableHeader as Table3Header,
    GridTableRows as Table3Rows,
    GridTableRow as Table3Row,
    GridTableContainer as Table3Container,
}
