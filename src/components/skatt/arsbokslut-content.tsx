"use client"

import { useState, useMemo } from "react"
import {
    Calendar,
    Building2,
    Clock,
    Bot,
    ChevronDown,
    ChevronRight,
    Eye,
    Send,
    Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { SectionCard } from "@/components/ui/section-card"
import { Button } from "@/components/ui/button"
import {
    ReportContainer,
    ReportHeader,
    ReportSection,
    type ReportItem
} from "./report-ui"
import { useCompany } from "@/providers/company-provider"
import { useTextMode } from "@/providers/text-mode-provider"
import { useAccountBalances, type AccountActivity } from "@/hooks/use-account-balances"


// =============================================================================
// Main Component
// =============================================================================
export function ArsbokslutContent() {
    const { companyTypeName } = useCompany()
    const { text } = useTextMode()
    const { accountBalances, totals, isLoading } = useAccountBalances()

    // P&L Calculations
    const sales = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 3000 && parseInt(a.accountNumber) <= 3999)
        .reduce((sum: number, a: AccountActivity) => sum + (a.balance * -1), 0)

    const materials = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 4000 && parseInt(a.accountNumber) <= 4999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const externalExpenses = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 5000 && parseInt(a.accountNumber) <= 6999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const personnel = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 7000 && parseInt(a.accountNumber) <= 7699)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const depreciations = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 7800 && parseInt(a.accountNumber) <= 7999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const financialItems = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 8000 && parseInt(a.accountNumber) <= 8999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const result = Math.round(totals.netIncome)

    // P&L Items
    const plItems: ReportItem[] = useMemo(() => ([
        { label: "Försäljning och övriga intäkter", value: Math.round(sales) },
        { label: "Varor, material och tjänster", value: Math.round(materials) * -1 },
        { label: "Övriga externa kostnader", value: Math.round(externalExpenses) * -1 },
        { label: "Personalkostnader", value: Math.round(personnel) * -1 },
        { label: "Avskrivningar", value: Math.round(depreciations) * -1 },
        { label: "Finansiella poster", value: Math.round(financialItems) * -1 },
    ]), [sales, materials, externalExpenses, personnel, depreciations, financialItems]);

    // Balance Sheet Calculations
    const fixedAssets = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 1000 && parseInt(a.accountNumber) <= 1399)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const receivables = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 1500 && parseInt(a.accountNumber) <= 1799)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const cash = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 1900 && parseInt(a.accountNumber) <= 1999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const totalAssets = Math.round(totals.assets)

    const equity = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 2000 && parseInt(a.accountNumber) <= 2099)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0) * -1

    const payables = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 2400 && parseInt(a.accountNumber) <= 2499)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0) * -1

    const taxes = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 2500 && parseInt(a.accountNumber) <= 2699)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0) * -1

    const otherLiabilities = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 2700 && parseInt(a.accountNumber) <= 2999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0) * -1

    const totalEqLiab = Math.round(equity + result + payables + taxes + otherLiabilities)

    // Balance Sheet Items
    const assetItems: ReportItem[] = useMemo(() => ([
        { label: "Anläggningstillgångar", value: Math.round(fixedAssets) },
        { label: "Kundfordringar mm", value: Math.round(receivables) },
        { label: "Kassa och bank", value: Math.round(cash) },
    ]), [fixedAssets, receivables, cash]);

    const liabilityItems: ReportItem[] = useMemo(() => ([
        { label: "Eget kapital (inkl. årets resultat)", value: Math.round(equity + result) },
        { label: "Leverantörsskulder", value: Math.round(payables) },
        { label: "Skatteskulder", value: Math.round(taxes) },
        { label: "Övriga skulder", value: Math.round(otherLiabilities) },
    ]), [equity, result, payables, taxes, otherLiabilities]);

    if (isLoading) {
        return <div className="p-12 text-center text-muted-foreground">Läser in bokföring...</div>
    }

    return (
        <main className="flex-1 flex flex-col px-6 pt-2 pb-6">
            <div className="max-w-6xl w-full space-y-6">



                <StatCardGrid columns={3}>
                    <StatCard
                        label={text.reports.fiscalYear}
                        value="2024"
                        subtitle="2024-01-01 – 2024-12-31"
                        headerIcon={Calendar}
                    />
                    <StatCard
                        label={text.reports.companyType}
                        value={companyTypeName}
                        subtitle={text.reports.simplified}
                        headerIcon={Building2}
                    />
                    <StatCard
                        label={text.reports.reportStatus}
                        value={text.reports.workInProgress}
                        subtitle={`${text.reports.deadline}: 2 maj 2025`}
                        headerIcon={Clock}
                    />
                </StatCardGrid>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title={text.reports.aiYearEnd}
                    description={text.reports.aiYearEndDesc}
                    variant="ai"
                    onAction={() => { }}
                />

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                {/* Header with Actions */}
                <ReportHeader
                    title="Årsbokslut 2024"
                    subtitle="Räkenskapsår 2024-01-01 – 2024-12-31"
                >
                    <Button variant="outline" size="sm" className="h-9">
                        <Eye className="mr-2 h-4 w-4" />
                        Visa detaljer
                    </Button>
                    <Button variant="outline" size="sm" className="h-9">
                        <Download className="mr-2 h-4 w-4" />
                        Exportera PDF
                    </Button>
                    <Button size="sm" className="h-9">
                        <Send className="mr-2 h-4 w-4" />
                        Skicka till Bolagsverket
                    </Button>
                </ReportHeader>

                {/* Simplified P&L - Form Style */}
                <div className="space-y-4">
                    <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        {text.reports.profitLossSimplified}
                    </h2>

                    <ReportContainer>
                        <div className="space-y-4">
                            <ReportSection
                                title="Intäkter och kostnader"
                                items={plItems}
                                total={result}
                            />
                        </div>
                    </ReportContainer>
                </div>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                {/* Simplified Balance Sheet - Form Style */}
                <div className="space-y-4">
                    <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        {text.reports.balanceSheetSimplified}
                    </h2>
                    <ReportContainer>
                        <div className="space-y-2">
                            <ReportSection
                                title="Tillgångar"
                                items={assetItems}
                                total={totalAssets}
                            />
                            <ReportSection
                                title="Eget kapital och skulder"
                                items={liabilityItems}
                                total={totalEqLiab}
                            />
                        </div>
                    </ReportContainer>
                </div>
            </div>
        </main>
    )
}
