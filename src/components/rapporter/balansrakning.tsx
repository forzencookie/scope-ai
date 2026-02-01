"use client"

import { useCompany } from "@/providers/company-provider"
import { CollapsibleTableSection } from "@/components/ui/collapsible-table"
import { ReportLayout } from "@/components/shared"
import { useNavigateToAIChat, type PageContext } from "@/lib/ai/context"
import { useRouter } from "next/navigation"
import { useFinancialReports } from "@/hooks/use-financial-reports"
import { SectionCard } from "@/components/ui/section-card"

// ============================================
// Balansräkning Component
// ============================================

export function BalansrakningContent() {
    const { companyType } = useCompany()
    const navigateToAI = useNavigateToAIChat()
    const router = useRouter()
    const { balanceSheetSections, isLoading } = useFinancialReports()

    const handleRunAudit = () => {
        const context: PageContext = {
            pageName: 'Balanskontroll',
            pageType: 'balansrakning',
            initialPrompt: 'Kör en komplett balanskontroll. Kontrollera balansräkningsprov, momsavstämning, kundfordringar, leverantörsskulder, löneavstämning, avskrivningar, eget kapital och periodiseringar.',
            autoSend: true,
            actionTrigger: {
                icon: 'audit',
                title: 'Balanskontroll',
                subtitle: `Balansräkning ${new Date().getFullYear()}`,
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
                            onClick: item.id ? () => {
                                const params = new URLSearchParams()
                                params.set("tab", "verifikationer")
                                params.set("account", item.id!)
                                router.push(`/dashboard/bokforing?${params.toString()}`)
                            } : undefined
                        }))}
                        total={section.total}
                        defaultOpen={true}
                        neutral={true}
                    />
                ))}
            </div>
        </ReportLayout>
    )
}
