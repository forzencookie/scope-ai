"use client"

import { useCompany } from "@/providers/company-provider"
import { CollapsibleTableSection } from "@/components/ui/collapsible-table"
import { ReportLayout } from "@/components/shared"
import { useNavigateToAIChat, type PageContext } from "@/lib/ai/context"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { Download, AlertTriangle } from "lucide-react"
import { useFinancialReports } from "@/hooks/use-financial-reports"
import { SectionCard } from "@/components/ui/section-card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { downloadElementAsPDF } from "@/lib/generators/pdf-generator"
import { formatCurrency } from "@/lib/utils"

// ============================================
// Balansräkning Component
// ============================================

export function BalansrakningContent() {
    const { companyType } = useCompany()
    const navigateToAI = useNavigateToAIChat()
    const router = useRouter()
    const toast = useToast()
    const { balanceSheetSections, isLoading, currentYear, previousYear } = useFinancialReports()

    // Balance check: assets must equal equity + liabilities
    const balanceDiff = useMemo(() => {
        if (!balanceSheetSections?.length) return 0
        const assetTitles = ["Anläggningstillgångar", "Omsättningstillgångar"]
        const totalAssets = balanceSheetSections
            .filter(s => assetTitles.includes(s.title))
            .reduce((sum, s) => sum + s.total, 0)
        const totalEqLiab = balanceSheetSections
            .filter(s => !assetTitles.includes(s.title))
            .reduce((sum, s) => sum + s.total, 0)
        return Math.round(totalAssets - totalEqLiab)
    }, [balanceSheetSections])

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
                <Button variant="outline" className="gap-2 overflow-hidden w-[120px] sm:w-auto" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 shrink-0" />
                    <span className="truncate">PDF</span>
                </Button>
            }
        >
            {Math.abs(balanceDiff) > 1 && (
                <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span>
                        Balansräkningen stämmer inte. Tillgångar och eget kapital + skulder skiljer sig med{" "}
                        <strong>{formatCurrency(balanceDiff)}</strong>.
                    </span>
                </div>
            )}

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
