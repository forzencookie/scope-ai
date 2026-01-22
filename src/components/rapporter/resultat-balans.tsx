"use client"

import { useCompany } from "@/providers/company-provider"
import {
    CollapsibleTableContainer,
    CollapsibleTableSection,
} from "@/components/ui/collapsible-table"
import { cn, formatCurrency } from "@/lib/utils"
import { SectionCard } from "@/components/ui/section-card"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai-context"
import { useRouter } from "next/navigation"
import { FileBarChart, Scale, Loader2, CheckCircle2, XCircle } from "lucide-react"
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
        <main className="flex-1 flex flex-col p-6">
            <CollapsibleTableContainer>
                {/* Page Heading */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Resultaträkning</h2>
                            <p className="text-muted-foreground">Räkenskapsår {new Date().getFullYear()} • {companyType.toUpperCase()}</p>
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

// ============================================
// Balansräkning Component
// ============================================

export function BalansrakningContent() {
    const { companyType } = useCompany()
    const navigateToAI = useNavigateToAIChat()
    const router = useRouter()
    const { balanceSheetSections, isLoading } = useFinancialReports()

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Laddar balansräkning...
            </div>
        )
    }

    if (!balanceSheetSections || balanceSheetSections.length === 0) {
        return <div className="p-6">Ingen data tillgänglig.</div>
    }

    // Calculate totals for balance check
    const totalAssets = balanceSheetSections.find(s => s.title === "Tillgångar")?.total || 0
    const totalEqLiab = balanceSheetSections.find(s => s.title === "Eget kapital och skulder")?.total || 0
    const isBalanced = Math.abs(totalAssets - totalEqLiab) < 1 // Tolerance for float math

    return (
        <main className="flex-1 flex flex-col p-6">
            <CollapsibleTableContainer>
                {/* Page Heading */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Balansräkning</h2>
                            <p className="text-muted-foreground">Per {new Date().toISOString().split('T')[0]} • {companyType.toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                <SectionCard
                    title="Analysera finansiell ställning"
                    description="Få en genomgång av bolagets likviditet, soliditet och långsiktiga finansiella hälsa."
                    variant="ai"
                    icon={Scale}
                    actionLabel="Analysera balansräkning"
                    onAction={() => navigateToAI(getDefaultAIContext("balansrakning"))}
                />

                {/* Collapsible Sections */}
                <div className="space-y-4">
                    {balanceSheetSections.map((section) => (
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

                {/* Balance Verification */}
                <div className={cn(
                    "mt-8 p-4 rounded-lg",
                    isBalanced
                        ? "bg-green-500/10"
                        : "bg-red-500/10"
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
                            {isBalanced ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                        </div>
                    </div>
                </div>
            </CollapsibleTableContainer>
        </main>
    )
}
