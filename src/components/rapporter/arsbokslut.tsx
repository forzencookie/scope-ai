"use client"

import { useState, useMemo, useCallback } from "react"
import {
    Building2,
    Clock,
    Download,
    Calendar,
    Lock,
    Loader2,
    Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    CollapsibleTableContainer,
    CollapsibleTableHeader,
    CollapsibleTableSection,
    type CollapsibleTableItem
} from "@/components/ui/collapsible-table"
import { useCompany } from "@/providers/company-provider"
import { text } from "@/lib/translations"
import { useAccountBalances, type AccountActivity } from "@/hooks/use-account-balances"
import { useToast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { downloadElementAsPDF } from "@/lib/generators/pdf-generator"
import { TaxReportLayout, type TaxReportStat } from "@/components/shared"
import { ConfirmDialog } from "@/components/ui/alert-dialog"
import { getFiscalYearRange } from "@/lib/bookkeeping/utils"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"


// =============================================================================
// Main Component
// =============================================================================
export function ArsbokslutContent() {
    const toast = useToast()
    const navigateToAI = useNavigateToAIChat()
    const { company, companyType, companyTypeName } = useCompany()
    const [isClosing, setIsClosing] = useState(false)
    const [closingConfirmOpen, setClosingConfirmOpen] = useState(false)
    const [closingPreview, setClosingPreview] = useState<{
        totalRevenue: number; totalExpenses: number; corporateTax: number;
        netResult: number; entryCount: number; closingCompanyType: string;
    } | null>(null)
    // Calculate default year (previous completed FY)
    const fiscalYearEnd = company?.fiscalYearEnd || '12-31'
    const defaultFY = useMemo(() => {
        const currentFY = getFiscalYearRange(fiscalYearEnd, new Date())
        const prevRefDate = new Date(currentFY.start)
        prevRefDate.setFullYear(prevRefDate.getFullYear() - 1)
        return getFiscalYearRange(fiscalYearEnd, prevRefDate).end.getFullYear()
    }, [fiscalYearEnd])

    const [selectedYear, setSelectedYear] = useState(defaultFY)

    // Recalculate FY range based on selected year
    const { fiscalYear, fiscalStartStr, fiscalEndStr } = useMemo(() => {
        const refDate = new Date(selectedYear, 6, 1) // mid-year reference
        const fy = getFiscalYearRange(fiscalYearEnd, refDate)
        return {
            fiscalYear: selectedYear,
            fiscalStartStr: fy.startStr,
            fiscalEndStr: fy.endStr,
        }
    }, [selectedYear, fiscalYearEnd])
    const { accountBalances, totals, isLoading } = useAccountBalances()

    // Closing entry handler — step 1: fetch preview and show confirmation dialog
    const handleCreateClosingEntries = useCallback(async () => {
        setIsClosing(true)
        try {
            const closingCompanyType = companyType === 'ef' ? 'EF' : 'AB'
            const previewRes = await fetch(`/api/closing-entries?year=${fiscalYear}&companyType=${closingCompanyType}`)
            const preview = await previewRes.json()

            if (!previewRes.ok) {
                toast.error('Fel', preview.error || 'Kunde inte förhandsgranska')
                return
            }

            if (preview.alreadyClosed) {
                toast.error('Redan stängt', `Räkenskapsåret ${fiscalYear} har redan bokslutsposter. Ta bort serie Y-verifikationer för att köra om.`)
                return
            }

            const entryCount = preview.revenueEntries.length + preview.expenseEntries.length + preview.resultTransfer.length + (preview.taxEntry?.length || 0)
            setClosingPreview({
                totalRevenue: preview.totalRevenue,
                totalExpenses: preview.totalExpenses,
                corporateTax: preview.corporateTax,
                netResult: preview.netResult,
                entryCount,
                closingCompanyType,
            })
            setClosingConfirmOpen(true)
        } catch (err) {
            toast.error('Fel', 'Ett oväntat fel uppstod')
            console.error('Closing entries error:', err)
        } finally {
            setIsClosing(false)
        }
    }, [fiscalYear, companyType, toast])

    // Closing entry handler — step 2: execute after confirmation
    const handleConfirmClosing = useCallback(async () => {
        if (!closingPreview) return
        setIsClosing(true)
        try {
            const execRes = await fetch('/api/closing-entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year: fiscalYear, companyType: closingPreview.closingCompanyType }),
            })
            const execResult = await execRes.json()

            if (!execRes.ok) {
                toast.error('Fel', execResult.error || 'Kunde inte skapa bokslutsposter')
                return
            }

            toast.success('Bokslutsposter skapade',
                `${execResult.verificationIds.length} verifikationer skapade. Årets resultat: ${formatCurrency(execResult.netResult)}`
            )
        } catch (err) {
            toast.error('Fel', 'Ett oväntat fel uppstod')
            console.error('Closing entries error:', err)
        } finally {
            setIsClosing(false)
            setClosingPreview(null)
        }
    }, [fiscalYear, closingPreview, toast])

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
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 7700 && parseInt(a.accountNumber) <= 7999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const financialItems = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 8000 && parseInt(a.accountNumber) <= 8999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const result = Math.round(totals.netIncome)

    // P&L Items
    const plItems: CollapsibleTableItem[] = useMemo(() => ([
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

    const inventory = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 1400 && parseInt(a.accountNumber) <= 1499)
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

    const untaxedReserves = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 2100 && parseInt(a.accountNumber) <= 2199)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0) * -1

    const provisions = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 2200 && parseInt(a.accountNumber) <= 2299)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0) * -1

    const longTermLiabilities = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 2300 && parseInt(a.accountNumber) <= 2399)
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

    const totalEqLiab = Math.round(equity + result + untaxedReserves + provisions + longTermLiabilities + payables + taxes + otherLiabilities)

    // Balance Sheet Items
    const assetItems: CollapsibleTableItem[] = useMemo(() => ([
        { label: "Anläggningstillgångar", value: Math.round(fixedAssets) },
        { label: "Lager", value: Math.round(inventory) },
        { label: "Kundfordringar mm", value: Math.round(receivables) },
        { label: "Kassa och bank", value: Math.round(cash) },
    ]), [fixedAssets, inventory, receivables, cash]);

    // Company type-specific equity label
    const equityLabel = useMemo(() => {
        if (companyType === 'hb') return "Eget kapital per delägare"
        if (companyType === 'kb') return "Eget kapital (komplementär/kommanditdelägare)"
        return "Eget kapital (inkl. årets resultat)"
    }, [companyType])

    const liabilityItems: CollapsibleTableItem[] = useMemo(() => ([
        { label: equityLabel, value: Math.round(equity + result) },
        { label: "Obeskattade reserver", value: Math.round(untaxedReserves) },
        { label: "Avsättningar", value: Math.round(provisions) },
        { label: "Långfristiga skulder", value: Math.round(longTermLiabilities) },
        { label: "Leverantörsskulder", value: Math.round(payables) },
        { label: "Skatteskulder", value: Math.round(taxes) },
        { label: "Övriga skulder", value: Math.round(otherLiabilities) },
    ]), [equityLabel, equity, result, untaxedReserves, provisions, longTermLiabilities, payables, taxes, otherLiabilities]);

    const stats: TaxReportStat[] = [
        {
            label: text.reports.fiscalYear,
            value: String(fiscalYear),
            subtitle: `${fiscalStartStr} – ${fiscalEndStr}`,
            icon: Calendar,
        },
        {
            label: text.reports.companyType,
            value: companyTypeName,
            subtitle: companyTypeName,
            icon: Building2,
        },
        {
            label: text.reports.reportStatus,
            value: text.reports.workInProgress,
            subtitle: `${text.reports.deadline}: 30 jun ${fiscalYear + 1}`,
            icon: Clock,
        },
    ]

    return (
        <TaxReportLayout
            title="Årsbokslut"
            subtitle={`Sammanställning av räkenskaper för ${companyTypeName.toLowerCase()}.`}
            stats={stats}
            aiContext="arsbokslut"
            aiTitle={text.reports.aiYearEnd}
            aiDescription={text.reports.aiYearEndDesc}
            isLoading={isLoading}
            yearNav={{
                year: selectedYear,
                onYearChange: setSelectedYear,
                minYear: new Date().getFullYear() - 5,
                maxYear: new Date().getFullYear(),
            }}
            actions={
                <Button variant="outline" className="gap-2 overflow-hidden w-[120px] sm:w-auto" onClick={async () => {
                    toast.info("Förbereder PDF", "Vänta...")
                    try {
                        await downloadElementAsPDF({ fileName: `arsbokslut-${fiscalYear}`, elementId: 'arsbokslut-content' })
                        toast.success("Klart", "Årsbokslut har laddats ner som PDF.")
                    } catch {
                        toast.error("Fel", "Kunde inte skapa PDF.")
                    }
                }}>
                    <Download className="h-4 w-4 shrink-0" />
                    <span className="truncate">PDF</span>
                </Button>
            }
        >
            <div id="arsbokslut-content" className="space-y-6">
                {/* Header with Actions */}
                <CollapsibleTableHeader
                    title={`Årsbokslut ${fiscalYear}`}
                    subtitle={`Räkenskapsår ${fiscalStartStr} – ${fiscalEndStr}`}
                >
                    <Button size="sm" className="h-9" onClick={() => navigateToAI(getDefaultAIContext('arsbokslut'))}>
                        <Bot className="mr-2 h-4 w-4" />
                        Generera
                    </Button>
                    <Button
                        size="sm"
                        className="h-9"
                        variant="default"
                        onClick={handleCreateClosingEntries}
                        disabled={isClosing || isLoading}
                    >
                        {isClosing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Lock className="mr-2 h-4 w-4" />
                        )}
                        Skapa bokslutsposter
                    </Button>
                </CollapsibleTableHeader>

                {/* Simplified P&L - Form Style */}
                <div className="space-y-4">
                    <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        {text.reports.profitLossSimplified}
                    </h2>

                    <CollapsibleTableContainer>
                        <div className="space-y-4">
                            <CollapsibleTableSection
                                title="Intäkter och kostnader"
                                items={plItems}
                                total={result}
                            />
                        </div>
                    </CollapsibleTableContainer>
                </div>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                {/* Simplified Balance Sheet - Form Style */}
                <div className="space-y-4">
                    <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        {text.reports.balanceSheetSimplified}
                    </h2>
                    <CollapsibleTableContainer>
                        <div className="space-y-2">
                            <CollapsibleTableSection
                                title="Tillgångar"
                                items={assetItems}
                                total={totalAssets}
                            />
                            <CollapsibleTableSection
                                title="Eget kapital och skulder"
                                items={liabilityItems}
                                total={totalEqLiab}
                            />
                        </div>
                    </CollapsibleTableContainer>
                </div>
            </div>

            <ConfirmDialog
                open={closingConfirmOpen}
                onOpenChange={setClosingConfirmOpen}
                title={`Skapa bokslutsposter för ${fiscalYear}?`}
                description={
                    closingPreview
                        ? `Intäkter: ${formatCurrency(closingPreview.totalRevenue)}\nKostnader: ${formatCurrency(closingPreview.totalExpenses)}${closingPreview.corporateTax > 0 ? `\nBolagsskatt: ${formatCurrency(closingPreview.corporateTax)}` : ''}\nÅrets resultat: ${formatCurrency(closingPreview.netResult)}\n\n${closingPreview.entryCount} rader skapas i serie Y.`
                        : ''
                }
                confirmLabel="Skapa bokslutsposter"
                onConfirm={handleConfirmClosing}
            />

        </TaxReportLayout>
    )
}
