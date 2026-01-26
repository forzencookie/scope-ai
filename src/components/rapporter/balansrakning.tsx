"use client"

import { useCompany } from "@/providers/company-provider"
import { CollapsibleTableSection } from "@/components/ui/collapsible-table"
import { cn } from "@/lib/utils"
import { ReportLayout } from "@/components/shared"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"
import { useRouter } from "next/navigation"
import { Scale, CheckCircle2, XCircle } from "lucide-react"
import { useFinancialReports } from "@/hooks/use-financial-reports"

// ============================================
// Balansräkning Component
// ============================================

export function BalansrakningContent() {
    const { companyType } = useCompany()
    const navigateToAI = useNavigateToAIChat()
    const router = useRouter()
    const { balanceSheetSections, isLoading } = useFinancialReports()

    // Calculate totals for balance check
    const totalAssets = balanceSheetSections?.find(s => s.title === "Tillgångar")?.total || 0
    const totalEqLiab = balanceSheetSections?.find(s => s.title === "Eget kapital och skulder")?.total || 0
    const isBalanced = Math.abs(totalAssets - totalEqLiab) < 1 // Tolerance for float math

    return (
        <ReportLayout
            title="Balansräkning"
            subtitle={`Per ${new Date().toISOString().split('T')[0]} • ${companyType.toUpperCase()}`}
            isLoading={isLoading}
            loadingMessage="Laddar balansräkning..."
            hasData={!!balanceSheetSections && balanceSheetSections.length > 0}
            ai={{
                title: "Analysera finansiell ställning",
                description: "Få en genomgång av bolagets likviditet, soliditet och långsiktiga finansiella hälsa.",
                icon: Scale,
                actionLabel: "Analysera balansräkning",
                onAction: () => navigateToAI(getDefaultAIContext("balansrakning"))
            }}
            footer={
                <div className={cn(
                    "mt-8 p-4 rounded-lg",
                    isBalanced ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium">Balansräkningsprov</span>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Tillgångar {isBalanced ? "=" : "≠"} Eget kapital + Skulder
                            </p>
                        </div>
                        <div className={cn(
                            "flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-md",
                            isBalanced
                                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                : "bg-red-500/20 text-red-600 dark:text-red-400"
                        )}>
                            {isBalanced ? "Balanserar" : "Obalanserad"}
                            {isBalanced ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        </div>
                    </div>
                </div>
            }
        >
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
