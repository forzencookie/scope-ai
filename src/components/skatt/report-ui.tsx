"use client"

import { ReactNode, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Re-export core DataTable components for convenience
export {
    DataTable,
    DataTableHeader,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    DataTableHeaderCell
} from "@/components/ui/data-table"

// ==========================================
// Types
// ==========================================

export interface ReportItem {
    id?: string       // Optional code (e.g., "3.1" for tax forms)
    label: string     // Display name
    value: number     // Numerical amount
    indent?: boolean  // Visual indentation
    sublabel?: string // Optional secondary text
}

// ==========================================
// 1. Report Container
// ==========================================

export function ReportContainer({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("max-w-6xl w-full space-y-6", className)}>
            {children}
        </div>
    )
}

// ==========================================
// 2. Report Badge
// ==========================================

export function ReportBadge({ value, className }: { value: number; className?: string }) {
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
// 3. Report Header
// ==========================================

interface ReportHeaderProps {
    title: string
    subtitle?: string
    children?: ReactNode
}

export function ReportHeader({ title, subtitle, children }: ReportHeaderProps) {
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
// 3. Report Row (The Atom)
// ==========================================

interface ReportRowProps {
    item: ReportItem
    className?: string
}

export function ReportRow({ item, className }: ReportRowProps) {
    const roundedValue = Math.round(item.value) === 0 ? 0 : Math.round(item.value)

    return (
        <div className={cn("flex items-start justify-between py-3 hover:bg-muted/30 px-2 -mx-2 rounded-md transition-colors", className)}>
            <div className="flex items-start gap-3">
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
                roundedValue > 0 && "text-green-600 dark:text-green-400",
                roundedValue < 0 && "text-red-600 dark:text-red-400",
                roundedValue === 0 && "text-muted-foreground"
            )}>
                {roundedValue > 0 && "+"}{roundedValue.toLocaleString('sv-SE')} kr
            </span>
        </div>
    )
}

// ==========================================
// 4. Report Section (The Molecule)
// ==========================================

interface ReportSectionProps {
    title: string
    items: ReportItem[]
    total?: number        // Can be manually provided or auto-calculated from items
    defaultOpen?: boolean
    hideTotalHeader?: boolean
}

export function ReportSection({
    title,
    items,
    total,
    defaultOpen = true,
    hideTotalHeader = false
}: ReportSectionProps) {
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
                        <ReportBadge value={displayTotal} />
                    )}
                </div>
            </button>

            {/* Section Rows */}
            {isOpen && (
                <div className="space-y-0.5 pl-6">
                    {items.map((item, idx) => (
                        <ReportRow key={item.id || `${item.label}-${idx}`} item={item} />
                    ))}
                </div>
            )}
        </div>
    )
}
