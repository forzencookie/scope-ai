"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Calendar,
    TrendingUp,
    Clock,
    Bot,
    Send,
    FileDown,
    ChevronDown,
    ChevronRight,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { FilterButton } from "@/components/ui/filter-button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
    CollapsibleTableContainer,
    CollapsibleTableHeader,
    CollapsibleTableSection,
    type CollapsibleTableItem
} from "@/components/ui/collapsible-table"
import { useVerifications } from "@/hooks/use-verifications"
import { Ink2Processor, type Ink2FormField } from "@/services/processors/inkomstdeklaration-processor"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { cn, formatNumber } from "@/lib/utils"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"

import { SectionCard } from "@/components/ui/section-card"
import { SRUPreviewDialog } from "./dialogs/sru"
import { useCompany } from "@/providers/company-provider"


// =============================================================================
// Main Component
// =============================================================================


export function InkomstdeklarationContent() {
    const router = useRouter()
    const navigateToAI = useNavigateToAIChat()
    const { addToast: toast } = useToast()
    const { verifications } = useVerifications()
    const { company } = useCompany()
    const [showSRUPreview, setShowSRUPreview] = useState(false)
    const [activeFilter, setActiveFilter] = useState<"all" | "incomeStatement" | "balanceSheet" | "taxAdjustments">("all")

    // Get dynamic beskattningsår from helper
    const [taxYear, setTaxYear] = useState({ year: 2024, deadlineLabel: '1 jul 2025' })
    useEffect(() => {
        const loadTaxYear = async () => {
            const { getCurrentBeskattningsar } = await import('@/lib/tax-periods')
            const fiscalYearEnd = company?.fiscalYearEnd || '12-31'
            const result = getCurrentBeskattningsar(fiscalYearEnd)
            setTaxYear({ year: result.year, deadlineLabel: result.deadlineLabel })
        }
        loadTaxYear()
    }, [company?.fiscalYearEnd])

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

    const handleSend = () => {
        toast({
            title: "Kommer snart",
            description: "Integration med Skatteverket är under utveckling.",
        })
    }

    return (

        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
                {/* Page Heading */}
                {/* Page Heading */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Inkomstdeklaration</h2>
                            <p className="text-muted-foreground mt-1">Sammanställ INK2-deklaration baserat på bokföringen.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleSend}>
                                <Send className="h-4 w-4 mr-2" />
                                Skicka till Skatteverket
                            </Button>
                        </div>
                    </div>
                </div>

                <StatCardGrid columns={3}>
                    <StatCard
                        label="Beskattningsår"
                        value={stats.year}
                        subtitle="Inkomstdeklaration 2"
                        headerIcon={Calendar}
                    />
                    <StatCard
                        label="Bokfört resultat"
                        value={`${formatNumber(stats.result)} kr`}
                        subtitle="Före skattemässiga justeringar"
                        headerIcon={TrendingUp}
                    />
                    <StatCard
                        label="Status"
                        value={INVOICE_STATUS_LABELS.DRAFT}
                        subtitle={`Deadline: ${stats.deadline}`}
                        headerIcon={Clock}
                    />
                </StatCardGrid>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title="AI-inkomstdeklaration"
                    description="INK2-fälten genereras automatiskt från bokföringen."
                    variant="ai"
                    onAction={() => navigateToAI(getDefaultAIContext('inkomstdeklaration'))}
                />

                <SRUPreviewDialog
                    open={showSRUPreview}
                    onOpenChange={setShowSRUPreview}
                />


                {/* Thick separator below AI card */}
                <div className="border-b-2 border-border/60" />

                {/* Form Header with Actions */}

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


            </div >
        </main >
    )
}
