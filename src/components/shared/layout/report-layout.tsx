"use client"

import { ReactNode } from "react"
import { Loader2, type LucideIcon } from "lucide-react"
import {
    CollapsibleTableContainer,
} from "@/components/ui/collapsible-table"
import { SectionCard } from "@/components/ui/section-card"

interface ReportLayoutProps {
    /** Main title of the report */
    title: string
    /** Subtitle (period, company type, etc.) */
    subtitle: string
    /** Whether data is loading */
    isLoading?: boolean
    /** Loading message */
    loadingMessage?: string
    /** No data message */
    noDataMessage?: string
    /** Whether there is data to display */
    hasData?: boolean
    /** AI section configuration */
    ai?: {
        title: string
        description: string
        icon: LucideIcon
        actionLabel: string
        onAction: () => void
    }
    /** Header actions (buttons, etc.) */
    actions?: ReactNode
    /** Main content (sections, tables, etc.) */
    children: ReactNode
    /** Footer content */
    footer?: ReactNode
}

/**
 * ReportLayout - Shared layout for financial report pages
 * 
 * Used by resultaträkning and balansräkning pages.
 * Provides consistent structure for:
 * - Page heading with title/subtitle
 * - Optional AI analysis section
 * - Loading/empty states
 * - Collapsible table container
 */
export function ReportLayout({
    title,
    subtitle,
    isLoading = false,
    loadingMessage = "Laddar...",
    noDataMessage = "Ingen data tillgänglig.",
    hasData = true,
    ai,
    actions,
    children,
    footer,
}: ReportLayoutProps) {
    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                {loadingMessage}
            </div>
        )
    }

    if (!hasData) {
        return <div className="p-6">{noDataMessage}</div>
    }

    return (
        <main className="flex-1 flex flex-col p-4 md:p-6">
            <CollapsibleTableContainer>
                {/* Page Heading */}
                <div className="flex flex-col gap-4 md:gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
                            <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
                        </div>
                        {actions && (
                            <div className="flex items-center gap-2 shrink-0">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Analysis Section */}
                {ai && (
                    <SectionCard
                        title={ai.title}
                        description={ai.description}
                        variant="ai"
                        icon={ai.icon}
                        actionLabel={ai.actionLabel}
                        onAction={ai.onAction}
                    />
                )}

                {/* Main Content */}
                {children}

                {/* Footer */}
                {footer}
            </CollapsibleTableContainer>
        </main>
    )
}
