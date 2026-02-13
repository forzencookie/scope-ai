"use client"

import { useState, useMemo, useCallback } from "react"
import {
    Building2,
    Clock,
    Eye,
    ClipboardEdit,
    Download,
    Calendar,
    Lock,
    Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    CollapsibleTableContainer,
    CollapsibleTableHeader,
    CollapsibleTableSection,
    type CollapsibleTableItem
} from "@/components/ui/collapsible-table"
import { useCompany } from "@/providers/company-provider"
import { useTextMode } from "@/providers/text-mode-provider"
import { useAccountBalances, type AccountActivity } from "@/hooks/use-account-balances"
import { useToast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { downloadElementAsPDF } from "@/lib/exports/pdf-generator"
import { TaxReportLayout, type TaxReportStat } from "@/components/shared"
import { ArsbokslutWizardDialog } from "./dialogs/arsbokslut-wizard-dialog"


// =============================================================================
// Main Component
// =============================================================================
export function ArsbokslutContent() {
    const toast = useToast()
    const { companyTypeName } = useCompany()
    const [wizardOpen, setWizardOpen] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const fiscalYear = new Date().getFullYear() - 1
    const { text } = useTextMode()
    const { accountBalances, totals, isLoading } = useAccountBalances()

    // Closing entry handler
    const handleCreateClosingEntries = useCallback(async () => {
        setIsClosing(true)
        try {
            // Preview first
            const companyType = companyTypeName?.toLowerCase().includes('enskild') ? 'EF' : 'AB'
            const previewRes = await fetch(`/api/closing-entries?year=${fiscalYear}&companyType=${companyType}`)
            const preview = await previewRes.json()

            if (!previewRes.ok) {
                toast.error('Fel', preview.error || 'Kunde inte förhandsgranska')
                return
            }

            if (preview.alreadyClosed) {
                toast.error('Redan stängt', `Räkenskapsåret ${fiscalYear} har redan bokslutsposter. Ta bort serie Y-verifikationer för att köra om.`)
                return
            }

            // Show confirmation
            const confirmed = window.confirm(
                `Skapa bokslutsposter för ${fiscalYear}?\n\n` +
                `Intäkter: ${formatCurrency(preview.totalRevenue)}\n` +
                `Kostnader: ${formatCurrency(preview.totalExpenses)}\n` +
                (preview.corporateTax > 0 ? `Bolagsskatt: ${formatCurrency(preview.corporateTax)}\n` : '') +
                `Årets resultat: ${formatCurrency(preview.netResult)}\n\n` +
                `${preview.revenueEntries.length + preview.expenseEntries.length + preview.resultTransfer.length + (preview.taxEntry?.length || 0)} rader skapas i serie Y.`
            )

            if (!confirmed) return

            // Execute
            const execRes = await fetch('/api/closing-entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year: fiscalYear, companyType }),
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
        }
    }, [fiscalYear, companyTypeName, toast])

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
    const assetItems: CollapsibleTableItem[] = useMemo(() => ([
        { label: "Anläggningstillgångar", value: Math.round(fixedAssets) },
        { label: "Kundfordringar mm", value: Math.round(receivables) },
        { label: "Kassa och bank", value: Math.round(cash) },
    ]), [fixedAssets, receivables, cash]);

    const liabilityItems: CollapsibleTableItem[] = useMemo(() => ([
        { label: "Eget kapital (inkl. årets resultat)", value: Math.round(equity + result) },
        { label: "Leverantörsskulder", value: Math.round(payables) },
        { label: "Skatteskulder", value: Math.round(taxes) },
        { label: "Övriga skulder", value: Math.round(otherLiabilities) },
    ]), [equity, result, payables, taxes, otherLiabilities]);

    const stats: TaxReportStat[] = [
        {
            label: text.reports.fiscalYear,
            value: String(fiscalYear),
            subtitle: `${fiscalYear}-01-01 – ${fiscalYear}-12-31`,
            icon: Calendar,
        },
        {
            label: text.reports.companyType,
            value: companyTypeName,
            subtitle: text.reports.simplified,
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
            subtitle="Sammanställning av räkenskaper för enskild firma."
            stats={stats}
            aiContext="arsbokslut"
            aiTitle={text.reports.aiYearEnd}
            aiDescription={text.reports.aiYearEndDesc}
            isLoading={isLoading}
            actions={
                <Button onClick={() => window.print()} variant="outline" size="sm" className="w-full sm:w-auto">
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Exportera</span>
                </Button>
            }
        >
            <div id="arsbokslut-content" className="space-y-6">
                {/* Header with Actions */}
                <CollapsibleTableHeader
                    title={`Årsbokslut ${fiscalYear}`}
                    subtitle={`Räkenskapsår ${fiscalYear}-01-01 – ${fiscalYear}-12-31`}
                >
                    <Button variant="outline" size="sm" className="h-9">
                        <Eye className="mr-2 h-4 w-4" />
                        Visa detaljer
                    </Button>
                    <Button variant="outline" size="sm" className="h-9" onClick={async () => {
                        toast.info("Förbereder PDF", "Vänta...")
                        try {
                            await downloadElementAsPDF({ fileName: `arsbokslut-${fiscalYear}`, elementId: 'arsbokslut-content' })
                            toast.success("Klart", "Årsbokslut har laddats ner som PDF.")
                        } catch {
                            toast.error("Fel", "Kunde inte skapa PDF.")
                        }
                    }}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportera PDF
                    </Button>
                    <Button size="sm" className="h-9" onClick={() => setWizardOpen(true)}>
                        <ClipboardEdit className="mr-2 h-4 w-4" />
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

            <ArsbokslutWizardDialog
                open={wizardOpen}
                onOpenChange={setWizardOpen}
                data={{
                    sales: Math.round(sales),
                    materials: Math.round(materials),
                    externalExpenses: Math.round(externalExpenses),
                    personnel: Math.round(personnel),
                    depreciations: Math.round(depreciations),
                    financialItems: Math.round(financialItems),
                    result,
                    fixedAssets: Math.round(fixedAssets),
                    receivables: Math.round(receivables),
                    cash: Math.round(cash),
                    totalAssets,
                    equity: Math.round(equity),
                    payables: Math.round(payables),
                    taxes: Math.round(taxes),
                    otherLiabilities: Math.round(otherLiabilities),
                    totalEqLiab,
                    fiscalYear: String(fiscalYear),
                    companyType: companyTypeName,
                }}
            />
        </TaxReportLayout>
    )
}
