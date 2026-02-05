"use client"

import { useState, useMemo } from "react"
import {
    Calendar,
    TrendingUp,
    Clock,
    FileDown,
    Plus,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { FilterButton } from "@/components/ui/filter-button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
    CollapsibleTableContainer,
    CollapsibleTableHeader,
    CollapsibleTableSection
} from "@/components/ui/collapsible-table"
import { useVerifications } from "@/hooks/use-verifications"
import { useTaxPeriod } from "@/hooks/use-tax-period"
import { Ink2Processor, type Ink2FormField } from "@/services/processors/inkomstdeklaration-processor"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { formatNumber } from "@/lib/utils"
import { TaxReportLayout, type TaxReportStat } from "@/components/shared"
import { SRUPreviewDialog } from "./dialogs/sru"
import { InkomstWizardDialog, type InkomstWizardData } from "./dialogs/inkomst-wizard-dialog"
import { useCompany } from "@/providers/company-provider"


// =============================================================================
// Main Component
// =============================================================================


export function InkomstdeklarationContent() {
    // const router = useRouter()
    const { addToast: toast } = useToast()
    const { verifications } = useVerifications()
    const { company } = useCompany()
    const [showSRUPreview, setShowSRUPreview] = useState(false)
    const [showAIDialog, setShowAIDialog] = useState(false)
    const [activeFilter, setActiveFilter] = useState<"all" | "incomeStatement" | "balanceSheet" | "taxAdjustments">("all")

    // Get dynamic beskattningsår using shared hook
    const { taxYear } = useTaxPeriod({ 
        fiscalYearEnd: company?.fiscalYearEnd || '12-31',
        type: 'income' 
    })

    // Calculate all fields from ledger
    const calculatedData = useMemo(() => {
        return Ink2Processor.calculateAll(verifications, taxYear.year)
    }, [verifications, taxYear.year])

    // Calculate stats
    const stats = useMemo(() => {
        const arsResultat = calculatedData.totals.netIncome
        return {
            year: taxYear.year.toString(),
            result: arsResultat,
            status: INVOICE_STATUS_LABELS.DRAFT,
            deadline: taxYear.deadlineLabel,
        }
    }, [calculatedData, taxYear])

    // Prepare data for wizard dialog
    const wizardData = useMemo<InkomstWizardData>(() => {
        // Calculate ej avdragsgilla from representation (accounts 6070-6079)
        const representationTotal = calculatedData.taxAdjustments
            .find(f => f.field === "4.3c")?.value || 0

        return {
            taxYear: taxYear.year,
            deadline: taxYear.deadlineLabel,
            totals: {
                revenue: calculatedData.totals.revenue,
                expenses: calculatedData.totals.expenses,
                netIncome: calculatedData.totals.netIncome,
                taxableResult: calculatedData.totals.taxableResult,
                totalAssets: calculatedData.totals.totalAssets,
                totalEquityAndLiabilities: calculatedData.totals.totalEquityAndLiabilities,
            },
            adjustments: {
                previousYearLoss: 0, // Would come from previous declaration
                periodiseringsfondAvsattning: 0,
                periodiseringsfondAterforing: 0,
                ejAvdragsgillaKostnader: representationTotal,
            },
        }
    }, [calculatedData, taxYear])

    // Group income statement fields by sub-section
    const incomeStatementSections = useMemo(() => {
        const sections: { title: string; fields: Ink2FormField[] }[] = []
        const fieldsBySection = new Map<string, Ink2FormField[]>()

        calculatedData.incomeStatement.forEach(field => {
            const section = field.section || "Övrigt"
            const existing = fieldsBySection.get(section) || []
            existing.push(field)
            fieldsBySection.set(section, existing)
        })

        // Order the sections logically
        const sectionOrder = [
            "Rörelseintäkter",
            "Rörelsekostnader",
            "Finansiella poster",
            "Bokslutsdispositioner",
            "Skatt och resultat"
        ]

        sectionOrder.forEach(sectionName => {
            const fields = fieldsBySection.get(sectionName)
            if (fields && fields.length > 0) {
                sections.push({ title: sectionName, fields })
            }
        })

        return sections
    }, [calculatedData])

    // Group balance sheet fields by sub-section
    const balanceSheetSections = useMemo(() => {
        const sections: { title: string; fields: Ink2FormField[] }[] = []
        const fieldsBySection = new Map<string, Ink2FormField[]>()

        calculatedData.balanceSheet.forEach(field => {
            const section = field.section || "Övrigt"
            const existing = fieldsBySection.get(section) || []
            existing.push(field)
            fieldsBySection.set(section, existing)
        })

        // Get unique sections in order
        const seenSections = new Set<string>()
        calculatedData.balanceSheet.forEach(f => {
            if (f.section && !seenSections.has(f.section)) {
                seenSections.add(f.section)
                const fields = fieldsBySection.get(f.section)
                if (fields) {
                    sections.push({ title: f.section, fields })
                }
            }
        })

        return sections
    }, [calculatedData])

    // Group tax adjustment fields by sub-section
    const taxAdjustmentSections = useMemo(() => {
        const sections: { title: string; fields: Ink2FormField[] }[] = []
        const fieldsBySection = new Map<string, Ink2FormField[]>()

        calculatedData.taxAdjustments.forEach(field => {
            const section = field.section || "Övrigt"
            const existing = fieldsBySection.get(section) || []
            existing.push(field)
            fieldsBySection.set(section, existing)
        })

        // Get unique sections in order
        const seenSections = new Set<string>()
        calculatedData.taxAdjustments.forEach(f => {
            if (f.section && !seenSections.has(f.section)) {
                seenSections.add(f.section)
                const fields = fieldsBySection.get(f.section)
                if (fields) {
                    sections.push({ title: f.section, fields })
                }
            }
        })

        return sections
    }, [calculatedData])

    const taxReportStats: TaxReportStat[] = [
        {
            label: "Beskattningsår",
            value: stats.year,
            subtitle: "Inkomstdeklaration 2",
            icon: Calendar,
        },
        {
            label: "Bokfört resultat",
            value: `${formatNumber(stats.result)} kr`,
            subtitle: "Före skattemässiga justeringar",
            icon: TrendingUp,
        },
        {
            label: "Status",
            value: INVOICE_STATUS_LABELS.DRAFT,
            subtitle: `Deadline: ${stats.deadline}`,
            icon: Clock,
        },
    ]

    return (
        <TaxReportLayout
            title="Inkomstdeklaration"
            subtitle="Sammanställ INK2-deklaration baserat på bokföringen."
            stats={taxReportStats}
            aiContext="inkomstdeklaration"
            aiTitle="AI-inkomstdeklaration"
            aiDescription="INK2-fälten genereras automatiskt från bokföringen."
            actions={
                <Button size="sm" onClick={() => setShowAIDialog(true)} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Skapa deklaration</span>
                    <span className="sm:hidden">Skapa</span>
                </Button>
            }
            dialogs={
                <>
                    <SRUPreviewDialog
                        open={showSRUPreview}
                        onOpenChange={setShowSRUPreview}
                    />
                    <InkomstWizardDialog
                        open={showAIDialog}
                        onOpenChange={setShowAIDialog}
                        data={wizardData}
                        onConfirm={() => {
                            toast({
                                title: "Inkomstdeklaration sparad",
                                description: `INK2 för ${taxYear.year} har sparats som utkast.`,
                            })
                        }}
                    />
                </>
            }
        >
            <CollapsibleTableContainer>
                {/* Form Header with Actions */}
                <CollapsibleTableHeader
                    title={
                        activeFilter === "all" ? "INK2 – Komplett" :
                            activeFilter === "incomeStatement" ? "INK2 – Resultaträkning" :
                                activeFilter === "balanceSheet" ? "INK2R – Balansräkning" :
                                    "INK2S – Skattemässiga justeringar"
                    }
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <FilterButton
                                label={activeFilter === "all" ? "Visa alla" : "Filtrerad"}
                                isActive={activeFilter !== "all"}
                            />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuLabel>Visa sektion</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setActiveFilter("all")}
                                className={activeFilter === "all" ? "bg-accent" : ""}
                            >
                                Visa alla (komplett INK2)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setActiveFilter("incomeStatement")}
                                className={activeFilter === "incomeStatement" ? "bg-accent" : ""}
                            >
                                Resultaträkning (3.x)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setActiveFilter("balanceSheet")}
                                className={activeFilter === "balanceSheet" ? "bg-accent" : ""}
                            >
                                Balansräkning (2.x)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setActiveFilter("taxAdjustments")}
                                className={activeFilter === "taxAdjustments" ? "bg-accent" : ""}
                            >
                                Skattemässiga justeringar (4.x)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSRUPreview(true)}
                    >
                        <FileDown className="h-4 w-4 mr-1.5" />
                        Exportera SRU
                    </Button>
                </CollapsibleTableHeader>

                {/* Form Sections */}
                <div className="space-y-8">
                    {/* Income Statement */}
                    {(activeFilter === "all" || activeFilter === "incomeStatement") && (
                        <div className="space-y-4">
                            {activeFilter === "all" && (
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide pb-2 border-b border-border/60">
                                    Resultaträkning (3.x)
                                </h3>
                            )}
                            {incomeStatementSections.map((section, idx) => (
                                <CollapsibleTableSection
                                    key={section.title}
                                    title={section.title}
                                    items={section.fields.map(f => ({ id: f.field, label: f.label, value: f.value }))}
                                    defaultOpen={activeFilter === "incomeStatement" || idx < 3}
                                />
                            ))}
                        </div>
                    )}

                    {/* Balance Sheet */}
                    {(activeFilter === "all" || activeFilter === "balanceSheet") && (
                        <div className="space-y-4">
                            {activeFilter === "all" && (
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide pb-2 border-b border-border/60">
                                    Balansräkning (2.x)
                                </h3>
                            )}
                            {balanceSheetSections.map((section, idx) => (
                                <CollapsibleTableSection
                                    key={section.title}
                                    title={section.title}
                                    items={section.fields.map(f => ({ id: f.field, label: f.label, value: f.value }))}
                                    defaultOpen={activeFilter === "balanceSheet" && idx < 3}
                                />
                            ))}
                        </div>
                    )}

                    {/* Tax Adjustments */}
                    {(activeFilter === "all" || activeFilter === "taxAdjustments") && (
                        <div className="space-y-4">
                            {activeFilter === "all" && (
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide pb-2 border-b border-border/60">
                                    Skattemässiga justeringar (4.x)
                                </h3>
                            )}
                            {taxAdjustmentSections.map((section, idx) => (
                                <CollapsibleTableSection
                                    key={section.title}
                                    title={section.title}
                                    items={section.fields.map(f => ({ id: f.field, label: f.label, value: f.value }))}
                                    defaultOpen={activeFilter === "taxAdjustments" && idx < 3}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </CollapsibleTableContainer>
        </TaxReportLayout>
    )
}
