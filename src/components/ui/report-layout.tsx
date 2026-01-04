"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { SectionCard } from "@/components/ui/section-card"
import { CollapsibleTableContainer } from "@/components/ui/collapsible-table"
import { LucideIcon } from "lucide-react"

// ==========================================
// ReportLayout
// Layout for financial reports:
// Title → AI SectionCard → CollapsibleTable sections
// Used by: Resultaträkning, Balansräkning
// ==========================================

interface ReportLayoutProps {
    /** Report title */
    title: string
    /** Subtitle (e.g., period, company type) */
    subtitle?: string
    /** AI section configuration */
    aiSection?: {
        title: string
        description: string
        icon?: LucideIcon
        actionLabel?: string
        onAction: () => void
    }
    /** Main content (CollapsibleTable sections) */
    children: ReactNode
    /** Additional className */
    className?: string
}

export function ReportLayout({
    title,
    subtitle,
    aiSection,
    children,
    className,
}: ReportLayoutProps) {
    return (
        <main className={cn("flex-1 flex flex-col p-6", className)}>
            <CollapsibleTableContainer>
                {/* Page Heading */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                        {subtitle && (
                            <p className="text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                </div>

                {/* AI Section Card */}
                {aiSection && (
                    <div className="mb-6">
                        <SectionCard
                            title={aiSection.title}
                            description={aiSection.description}
                            variant="ai"
                            icon={aiSection.icon}
                            actionLabel={aiSection.actionLabel || "Starta analys"}
                            onAction={aiSection.onAction}
                        />
                    </div>
                )}

                {/* Main Content (CollapsibleTable sections) */}
                {children}
            </CollapsibleTableContainer>
        </main>
    )
}
