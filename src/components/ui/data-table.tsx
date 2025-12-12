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
}

export function DataTable({
    title,
    headerActions,
    children,
    className,
}: DataTableProps) {
    return (
        <div className={cn("bg-card overflow-hidden", className)}>
            {(title || headerActions) && (
                <div className="px-4 py-3 border-t-2 border-b-2 border-border/60 flex items-center justify-between">
                    {title && <h2 className="font-medium">{title}</h2>}
                    {headerActions && (
                        <div className="flex items-center gap-2">{headerActions}</div>
                    )}
                </div>
            )}
            <div className="w-full overflow-auto">
                <table className="w-full text-sm">{children}</table>
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
                "border-b border-border/40 hover:bg-muted/30 transition-colors",
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
}

export function DataTableCell({
    children,
    className,
    align = "left",
    mono,
    muted,
    bold,
    colSpan,
}: DataTableCellProps) {
    return (
        <td
            className={cn(
                "px-4 py-3",
                align === "right" && "text-right",
                align === "center" && "text-center",
                mono && "font-mono",
                muted && "text-muted-foreground",
                bold && "font-medium",
                className
            )}
            colSpan={colSpan}
        >
            {children}
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
        <tr>
            <td colSpan={colSpan} className="px-4 py-8 text-center text-muted-foreground">
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
                "border-t border-border/40 p-2 text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-2",
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
        <div className={cn("bg-card border-y-2 border-border/60 overflow-hidden", className)}>
            <div className="w-full overflow-auto">
                {children}
            </div>
            {footer}
        </div>
    )
}
