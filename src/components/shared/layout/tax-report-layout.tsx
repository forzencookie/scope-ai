"use client"

import { ReactNode } from "react"
import { type LucideIcon, Bot, Loader2 } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { SectionCard } from "@/components/ui/section-card"
import { Button } from "@/components/ui/button"
import { CollapsibleTableContainer } from "@/components/ui/collapsible-table"
import { useNavigateToAIChat, getDefaultAIContext, type AIPageType } from "@/lib/ai/context"

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
}: TaxReportLayoutProps) {
    const navigateToAI = useNavigateToAIChat()

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                {loadingMessage}
            </div>
        )
    }

    return (
        <main className="flex-1 flex flex-col p-4 md:p-6">
            <CollapsibleTableContainer>
                <div className="max-w-6xl w-full space-y-4 md:space-y-6">
                    {/* Page Heading */}
                    <div className="flex flex-col gap-4 md:gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>
                            </div>
                            {actions && (
                                <div className="flex items-center gap-2">
                                    {actions}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Cards */}
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
        </main>
    )
}
