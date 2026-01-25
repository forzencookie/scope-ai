"use client"

import { useCompany } from "@/providers/company-provider"
import {
    CollapsibleTableContainer,
    CollapsibleTableSection,
} from "@/components/ui/collapsible-table"
import { SectionCard } from "@/components/ui/section-card"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"
import { useRouter } from "next/navigation"
import { FileBarChart, Loader2 } from "lucide-react"
import { useFinancialReports } from "@/hooks/use-financial-reports"

// ============================================
// Resultaträkning Component
// ============================================

export function ResultatrakningContent() {
    const { companyType } = useCompany()
    const navigateToAI = useNavigateToAIChat()
    const router = useRouter()
    const { incomeStatementSections, isLoading } = useFinancialReports()

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Laddar resultaträkning...
            </div>
        )
    }

    if (!incomeStatementSections || incomeStatementSections.length === 0) {
        return <div className="p-6">Ingen data tillgänglig.</div>
    }

    return (
        <main className="flex-1 flex flex-col p-4 md:p-6">
            <CollapsibleTableContainer>
                {/* Page Heading */}
                <div className="flex flex-col gap-4 md:gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Resultaträkning</h2>
                            <p className="text-xs sm:text-sm text-muted-foreground">Räkenskapsår {new Date().getFullYear()} • {companyType.toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                <SectionCard
                    title="Analysera resultatet"
                    description="Låt AI gå igenom dina intäkter och kostnader för att hitta avvikelser och förbättringsmöjligheter."
                    variant="ai"
                    icon={FileBarChart}
                    actionLabel="Starta analys"
                    onAction={() => navigateToAI(getDefaultAIContext("resultatrakning"))}
                />

                {/* Collapsible Sections */}
                <div className="space-y-4">
                    {incomeStatementSections.map((section, idx) => (
                        <CollapsibleTableSection
                            key={section.title}
                            title={section.title}
                            items={section.items.map(item => ({
                                id: item.id,
                                label: item.label,
                                value: item.value,
                                onClick: item.id ? () => {
                                    const params = new URLSearchParams()
                                    params.set("tab", "verifikationer")
                                    params.set("account", item.id!)
                                    router.push(`/dashboard/bokforing?${params.toString()}`)
                                } : undefined
                            }))}
                            total={section.total}
                            defaultOpen={idx < 3}
                            neutral={true}
                        />
                    ))}
                </div>
            </CollapsibleTableContainer>
        </main>
    )
}
