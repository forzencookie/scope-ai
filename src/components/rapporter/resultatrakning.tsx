"use client"

import { useCompany } from "@/providers/company-provider"
import { CollapsibleTableSection } from "@/components/ui/collapsible-table"
import { ReportLayout } from "@/components/shared"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"
import { useRouter } from "next/navigation"
import { FileBarChart } from "lucide-react"
import { useFinancialReports } from "@/hooks/use-financial-reports"

// ============================================
// Resultaträkning Component
// ============================================

export function ResultatrakningContent() {
    const { companyType } = useCompany()
    const navigateToAI = useNavigateToAIChat()
    const router = useRouter()
    const { incomeStatementSections, isLoading } = useFinancialReports()

    return (
        <ReportLayout
            title="Resultaträkning"
            subtitle={`Räkenskapsår ${new Date().getFullYear()} • ${companyType.toUpperCase()}`}
            isLoading={isLoading}
            loadingMessage="Laddar resultaträkning..."
            hasData={!!incomeStatementSections && incomeStatementSections.length > 0}
            ai={{
                title: "Analysera resultatet",
                description: "Låt AI gå igenom dina intäkter och kostnader för att hitta avvikelser och förbättringsmöjligheter.",
                icon: FileBarChart,
                actionLabel: "Starta analys",
                onAction: () => navigateToAI(getDefaultAIContext("resultatrakning"))
            }}
        >
            <div className="space-y-4">
                {incomeStatementSections?.map((section, idx) => (
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
        </ReportLayout>
    )
}
