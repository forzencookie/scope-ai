"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

// ============ Table Container ============

export interface DataTableProps {
    /** Optional title for the table */
    title?: string
    /** Actions to show in the header (buttons, filters, etc.) */
    headerActions?: React.ReactNode
    /** The table content */
    children: React.ReactNode
    /** Additional className for the container */
    className?: string
    /** Variant for header thickness: default (normal tables) or compact (reports) */
    variant?: "default" | "compact"
}

export function DataTable({
    title,
    headerActions,
    children,
    className,
    variant = "default",
}: DataTableProps) {
    return (
        <div className={cn("bg-card border-t-2 border-border/60 overflow-hidden", className)}>
            {(title || headerActions) && (
                <div className={cn(
                    "px-4 border-b-2 border-border/60 flex items-center justify-between",
                    variant === "compact" ? "py-2" : "py-3"
                )}>
                    {title && <h2 className="font-medium">{title}</h2>}
                    {headerActions && (
                        <div className="flex items-center gap-2">{headerActions}</div>
                    )}
                </div>
            )}
            <div className="w-full overflow-auto">
                <table className="w-full text-sm border-collapse">{children}</table>
            </div>
        </div>
    )
}

// ============ Table Header ============

export interface DataTableHeaderProps {
    children: React.ReactNode
    className?: string
}

export function DataTableHeader({ children, className }: DataTableHeaderProps) {
    return (
        <thead className={cn("bg-muted/50", className)}>
            <tr className="border-b border-border/40 text-left text-muted-foreground">
                {children}
            </tr>
        </thead>
    )
}

// ============ Header Cell ============

export interface DataTableHeaderCellProps {
    /** Column label */
    label?: string
    /** Optional icon */
    icon?: LucideIcon
    /** Text alignment */
    align?: "left" | "center" | "right"
    /** Additional className */
    className?: string
    /** Column width */
    width?: string
    /** Custom children (overrides label/icon) */
    children?: React.ReactNode
}

export function DataTableHeaderCell({
    label,
    icon: Icon,
    align = "left",
    className,
    width,
    children,
}: DataTableHeaderCellProps) {
    return (
        <th
            className={cn(
                "px-4 py-3 font-medium",
                align === "right" && "text-right",
                align === "center" && "text-center",
                className
            )}
            style={width ? { width } : undefined}
        >
            {children ? (
                children
            ) : Icon ? (
                <span className={cn(
                    "flex items-center gap-2",
                    align === "right" && "justify-end",
                    align === "center" && "justify-center"
                )}>
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                </span>
            ) : (
                label
            )}
        </th>
    )
}

// ============ Table Body ============

export interface DataTableBodyProps {
    children: React.ReactNode
    className?: string
}

export function DataTableBody({ children, className }: DataTableBodyProps) {
    return <tbody className={className}>{children}</tbody>
}

// ============ Table Row ============

export interface DataTableRowProps {
    children: React.ReactNode
    className?: string
    onClick?: () => void
    selected?: boolean
}

export function DataTableRow({ children, className, onClick, selected }: DataTableRowProps) {
    return (
        <tr
            className={cn(
                "group/row border-b border-border/40 transition-colors last:border-0",
                onClick && "cursor-pointer",
                selected && "bg-primary/5",
                className
            )}
            onClick={onClick}
        >
            {children}
        </tr>
    )
}

// ============ Table Cell ============

export interface DataTableCellProps {
    children: React.ReactNode
    className?: string
    align?: "left" | "center" | "right"
    /** Make content monospace */
    mono?: boolean
    /** Make content muted */
    muted?: boolean
    /** Make content bold */
    bold?: boolean
    /** Column span */
    colSpan?: number
    /** Click handler */
    onClick?: (e?: React.MouseEvent) => void
}

export function DataTableCell({
    children,
    className,
    align = "left",
    mono,
    muted,
    bold,
    colSpan,
    onClick,
}: DataTableCellProps) {
    return (
        <td
            className={cn(
                "px-4 py-4 relative group/cell transition-colors",
                // The rounded hover pill highlight using pseudo-elements
                // Standard Tailwind before: is used to create the gap and rounded edges
                "before:absolute before:inset-y-1.5 before:inset-x-0 before:bg-transparent before:transition-colors before:z-0",
                "group-hover/row:before:bg-muted/40",
                "first:before:rounded-l-xl",
                "last:before:rounded-r-xl",

                align === "right" && "text-right",
                align === "center" && "text-center",
                mono && "tabular-nums",
                muted && "text-muted-foreground",
                bold && "font-medium",
                className
            )}
            colSpan={colSpan}
            onClick={onClick}
        >
            <div className="relative z-10">
                {children}
            </div>
        </td>
    )
}

// ============ Empty State ============

export interface DataTableEmptyProps {
    message?: string
    colSpan: number
}

export function DataTableEmpty({ message = "Inga resultat", colSpan }: DataTableEmptyProps) {
    return (
        <tr className="border-0">
            <td colSpan={colSpan} className="px-4 py-12 text-center text-muted-foreground border-0">
                {message}
            </td>
        </tr>
    )
}

// ============ Table Footer ============

export interface DataTableFooterProps {
    children: React.ReactNode
    className?: string
}

export function DataTableFooter({ children, className }: DataTableFooterProps) {
    return (
        <div className={cn(
            "border-t border-border/40 p-2 text-sm text-muted-foreground",
            className
        )}>
            {children}
        </div>
    )
}

// ============ Add Row Button ============

export interface DataTableAddRowProps {
    label?: string
    onClick: () => void
    className?: string
}

export function DataTableAddRow({
    label = "Ny rad",
    onClick,
    className
}: DataTableAddRowProps) {
    return (
        <div
            className={cn(
                "p-2 text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-2",
                className
            )}
            onClick={onClick}
        >
            <div className="h-4 w-4 flex items-center justify-center ml-4">
                <span className="text-lg leading-none">+</span>
            </div>
            {label}
        </div>
    )
}

// ============ Raw Table Wrapper (for custom table content) ============

export interface DataTableRawProps {
    children: React.ReactNode
    className?: string
    footer?: React.ReactNode
}

/**
 * A minimal table wrapper that only provides the container styling.
 * Use this when you need full control over the table structure.
 */
export function DataTableRaw({
    children,
    className,
    footer,
}: DataTableRawProps) {
    return (
        <div className={cn("bg-card border-y border-border/40 overflow-hidden", className)}>
            <div className="w-full overflow-auto">
                {children}
            </div>
            {footer}
        </div>
    )
}
