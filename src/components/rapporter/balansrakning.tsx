"use client"

import { useCompany } from "@/providers/company-provider"
import { CollapsibleTableSection } from "@/components/ui/collapsible-table"
import { ReportLayout } from "@/components/shared"
import { useNavigateToAIChat, type PageContext } from "@/lib/ai/context"
import { useRouter } from "next/navigation"
import { Download } from "lucide-react"
import { useFinancialReports } from "@/hooks/use-financial-reports"
import { SectionCard } from "@/components/ui/section-card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { downloadElementAsPDF } from "@/lib/exports/pdf-generator"

// ============================================
// Balansräkning Component
// ============================================

export function BalansrakningContent() {
    const { companyType } = useCompany()
    const navigateToAI = useNavigateToAIChat()
    const router = useRouter()
    const toast = useToast()
    const { balanceSheetSections, isLoading, currentYear, previousYear } = useFinancialReports()

    const handleExportPDF = async () => {
        toast.info("Exporterar", "Förbereder PDF...")
        try {
            await downloadElementAsPDF({
                fileName: `Balansrakning-${currentYear}`,
                elementId: 'balansrakning-content'
            })
            toast.success("Klart", "Balansräkning har laddats ner som PDF.")
        } catch {
            toast.error("Fel", "Kunde inte skapa PDF.")
        }
    }

    const handleRunAudit = () => {
        const context: PageContext = {
            pageName: 'Balanskontroll',
            pageType: 'balansrakning',
            initialPrompt: 'Kör en komplett balanskontroll. Kontrollera balansräkningsprov, momsavstämning, kundfordringar, leverantörsskulder, löneavstämning, avskrivningar, eget kapital och periodiseringar.',
            autoSend: true,
            actionTrigger: {
                icon: 'audit',
                title: 'Balanskontroll',
                subtitle: `Balansräkning ${currentYear}`,
            }
        }
        navigateToAI(context)
    }

    return (
        <ReportLayout
            title="Balansräkning"
            subtitle={`Per ${new Date().toISOString().split('T')[0]} • ${companyType.toUpperCase()}`}
            isLoading={isLoading}
            loadingMessage="Laddar balansräkning..."
            hasData={!!balanceSheetSections && balanceSheetSections.length > 0}
            contentId="balansrakning-content"
            actions={
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                </Button>
            }
        >
            <SectionCard
                title="Balanskontroll"
                description="Kontrollera att balansräkningen stämmer — momsavstämning, kundfordringar, avskrivningar och mer."
                variant="success"
                actionLabel="Kör kontroll"
                onAction={handleRunAudit}
            />

            <div className="space-y-4">
                {balanceSheetSections?.map((section) => (
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
                        defaultOpen={true}
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
