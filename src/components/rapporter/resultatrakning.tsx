"use client"

import { useCompany } from "@/providers/company-provider"
import { CollapsibleTableSection } from "@/components/ui/collapsible-table"
import { ReportLayout } from "@/components/shared"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"
import { useRouter } from "next/navigation"
import { FileBarChart, Download } from "lucide-react"
import { useFinancialReports } from "@/hooks/use-financial-reports"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { downloadElementAsPDF } from "@/lib/exports/pdf-generator"

// ============================================
// Resultaträkning Component
// ============================================

export function ResultatrakningContent() {
    const { companyType } = useCompany()
    const navigateToAI = useNavigateToAIChat()
    const router = useRouter()
    const toast = useToast()
    const { incomeStatementSections, isLoading, currentYear, previousYear } = useFinancialReports()

    const handleExportPDF = async () => {
        toast.info("Exporterar", "Förbereder PDF...")
        try {
            await downloadElementAsPDF({
                fileName: `Resultatrakning-${currentYear}`,
                elementId: 'resultatrakning-content'
            })
            toast.success("Klart", "Resultaträkning har laddats ner som PDF.")
        } catch {
            toast.error("Fel", "Kunde inte skapa PDF.")
        }
    }

    return (
        <ReportLayout
            title="Resultaträkning"
            subtitle={`Räkenskapsår ${currentYear} • ${companyType.toUpperCase()}`}
            isLoading={isLoading}
            loadingMessage="Laddar resultaträkning..."
            hasData={!!incomeStatementSections && incomeStatementSections.length > 0}
            contentId="resultatrakning-content"
            actions={
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                </Button>
            }
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
                            previousValue: item.previousValue,
                            onClick: item.id ? () => {
                                const params = new URLSearchParams()
                                params.set("tab", "verifikationer")
                                params.set("account", item.id!)
                                router.push(`/dashboard/bokforing?${params.toString()}`)
                            } : undefined
                        }))}
                        total={section.total}
                        previousTotal={section.previousTotal}
                        defaultOpen={idx < 3}
                        neutral={true}
                        showComparative={true}
                        currentYear={currentYear}
                        previousYear={previousYear}
                    />
                ))}
            </div>
        </ReportLayout>
    )
}
