"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { SearchBar } from "@/components/ui/search-bar"
import { LucideIcon } from "lucide-react"

// ==========================================
// PageLayout
// Standard layout for data pages:
// Title → StatCards → Divider → Search/Filters → Content
// ==========================================

export interface PageStat {
    label: string
    value: string | number
    subtitle?: string
    icon?: LucideIcon
    change?: string
    changeType?: "positive" | "negative" | "neutral"
    tooltip?: string
}

interface PageLayoutProps {
    /** Page title */
    title: string
    /** Optional description below title */
    description?: string
    /** Stats to display in cards (2-4 recommended) */
    stats?: PageStat[]
    /** Number of stat columns (defaults to stats length or 3) */
    statColumns?: 2 | 3 | 4
    /** Actions to render next to title (e.g., buttons) */
    actions?: ReactNode
    /** Search configuration */
    search?: {
        value: string
        onChange: (value: string) => void
        placeholder?: string
    }
    /** Filters to render next to search */
    filters?: ReactNode
    /** Table heading text */
    tableHeading?: string
    /** Main content (typically a table) */
    children: ReactNode
    /** Additional className */
    className?: string
}

export function PageLayout({
    title,
    description,
    stats,
    statColumns,
    actions,
    search,
    filters,
    tableHeading,
    children,
    className,
}: PageLayoutProps) {
    const columns = statColumns || (stats?.length as 2 | 3 | 4) || 3

    return (
        <main className={cn("flex-1 flex flex-col p-6", className)}>
            <div className="max-w-6xl w-full space-y-6">
                {/* Page Heading */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                            {description && (
                                <p className="text-muted-foreground mt-1">{description}</p>
                            )}
                        </div>
                        {actions && (
                            <div className="flex items-center gap-2">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stat Cards */}
                {stats && stats.length > 0 && (
                    <StatCardGrid columns={columns}>
                        {stats.map((stat, idx) => (
                            <StatCard
                                key={idx}
                                label={stat.label}
                                value={typeof stat.value === 'number'
                                    ? stat.value.toLocaleString('sv-SE')
                                    : stat.value}
                                subtitle={stat.subtitle}
                                headerIcon={stat.icon}
                                change={stat.change}
                                changeType={stat.changeType}
                                tooltip={stat.tooltip}
                            />
                        ))}
                    </StatCardGrid>
                )}

                {/* Divider */}
                <div className="border-b-2 border-border/60" />

                {/* Search & Filters Row */}
                {(search || filters || tableHeading) && (
                    <div className="flex items-center justify-between py-2 mb-2">
                        {tableHeading && (
                            <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                                {tableHeading}
                            </h3>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                            {search && (
                                <SearchBar
                                    value={search.value}
                                    onChange={search.onChange}
                                    placeholder={search.placeholder || "Sök..."}
                                    className="w-48"
                                />
                            )}
                            {filters}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {children}
            </div>
        </main>
    )
}
