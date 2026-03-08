"use client"

import { ReactNode } from "react"
import { type LucideIcon, Bot } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionCard } from "@/components/ui/section-card"
import { Button } from "@/components/ui/button"
import { CollapsibleTableContainer } from "@/components/ui/collapsible-table"
import { useNavigateToAIChat, getDefaultAIContext, type AIPageType } from "@/lib/ai/context"
import { YearSlider } from "@/components/shared/year-slider"

// =============================================================================
// Types
// =============================================================================

export interface TaxReportStat {
    label: string
    value: string
    subtitle: string
    icon: LucideIcon
}

export interface TaxReportLayoutProps {
    /** Main title of the report */
    title: string
    /** Subtitle describing the report */
    subtitle: string
    /** Stats cards to display (typically 3) */
    stats: TaxReportStat[]
    /** AI context key for navigation (e.g., 'arsredovisning', 'arsbokslut') */
    aiContext: AIPageType
    /** AI section title */
    aiTitle: string
    /** AI section description */
    aiDescription: string
    /** Header action buttons */
    actions?: ReactNode
    /** Main content (sections, tables, etc.) */
    children: ReactNode
    /** Loading state */
    isLoading?: boolean
    /** Loading message */
    loadingMessage?: string
    /** Additional dialogs to render */
    dialogs?: ReactNode
    /** Year navigation — when provided, shows year slider in header */
    yearNav?: {
        year: number
        onYearChange: (year: number) => void
        minYear?: number
        maxYear?: number
    }
}

// =============================================================================
// Component
// =============================================================================

/**
 * TaxReportLayout - Shared layout for tax report pages
 * 
 * Used by: årsredovisning, årsbokslut, inkomstdeklaration
 * 
 * Provides consistent structure:
 * - Page heading with title/subtitle and actions
 * - StatCardGrid with 3 stat cards
 * - AI section card
 * - Collapsible table content
 */
export function TaxReportLayout({
    title,
    subtitle,
    stats,
    aiContext,
    aiTitle,
    aiDescription,
    actions,
    children,
    isLoading = false,
    loadingMessage = "Läser in bokföring...",
    dialogs,
    yearNav,
}: TaxReportLayoutProps) {
    const navigateToAI = useNavigateToAIChat()

    return (
        <div className="w-full">
            <CollapsibleTableContainer>
                <div className="w-full space-y-4 md:space-y-6">
                    {/* Page Heading */}
                    <div className="flex flex-col gap-4 md:gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {yearNav && (
                                    <YearSlider
                                        year={yearNav.year}
                                        onYearChange={yearNav.onYearChange}
                                        minYear={yearNav.minYear}
                                        maxYear={yearNav.maxYear}
                                    />
                                )}
                                {actions}
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {isLoading ? (
                        <StatCardGrid columns={stats.length as 2 | 3 | 4}>
                            {stats.map((_, index) => (
                                <div key={index} className="bg-card rounded-lg p-4 border-2 border-border/60 space-y-3">
                                    <div className="flex items-center gap-1.5">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-6 w-6 rounded-md" />
                                    </div>
                                    <Skeleton className="h-7 w-28" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            ))}
                        </StatCardGrid>
                    ) : (
                        <StatCardGrid columns={stats.length as 2 | 3 | 4}>
                            {stats.map((stat, index) => (
                                <StatCard
                                    key={index}
                                    label={stat.label}
                                    value={stat.value}
                                    subtitle={stat.subtitle}
                                    headerIcon={stat.icon}
                                />
                            ))}
                        </StatCardGrid>
                    )}

                    {/* Section Separator */}
                    <div className="border-b-2 border-border/60" />

                    {/* AI Section */}
                    <SectionCard
                        icon={Bot}
                        title={aiTitle}
                        description={aiDescription}
                        variant="ai"
                        onAction={() => navigateToAI(getDefaultAIContext(aiContext))}
                    />

                    {/* Section Separator */}
                    <div className="border-b-2 border-border/60" />

                    {/* Main Content */}
                    {children}
                </div>
            </CollapsibleTableContainer>

            {/* Dialogs */}
            {dialogs}
        </div>
    )
}
