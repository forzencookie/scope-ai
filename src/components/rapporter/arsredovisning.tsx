"use client"

import { useState, useMemo } from "react"
import {
    Calendar,
    Building2,
    Clock,
    Download,
    Send,
    FileText,
    Plus,
} from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { Button } from "@/components/ui/button"
import { ListCard, ListCardItem } from "@/components/ui/section-card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { ArsredovisningWizardDialog, type ArsredovisningWizardData } from "./dialogs/arsredovisning-wizard-dialog"
import { CollapsibleTableHeader } from "@/components/ui/collapsible-table"
import { useVerifications } from "@/hooks/use-verifications"
import { AnnualReportProcessor } from "@/services/processors/annual-report-processor"
import { ReportPreviewDialog, type ReportSection } from "./dialogs/rapport"
import { useToast } from "@/components/ui/toast"
import { useCompany } from "@/providers/company-provider"
import { TaxReportLayout, type TaxReportStat } from "@/components/shared"

export function ArsredovisningContent() {
    const toast = useToast()
    const [showAIDialog, setShowAIDialog] = useState(false)
    const { verifications } = useVerifications()
    const { company, companyTypeFullName } = useCompany()

    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewTitle, setPreviewTitle] = useState("")
    const [previewSections, setPreviewSections] = useState<ReportSection[]>([])
    
    // Calculate fiscal year dynamically
    const currentYear = new Date().getFullYear()
    const fiscalYear = currentYear - 1 // Annual report is for previous year

    // Calculate financials from verifications
    const financials = useMemo(() => {
        const incomeLines = AnnualReportProcessor.calculateIncomeStatement(verifications, fiscalYear)
        const balanceLines = AnnualReportProcessor.calculateBalanceSheet(verifications, new Date(`${fiscalYear}-12-31`))

        // Find key figures
        const revenue = incomeLines.find(l => l.label === "Nettoomsättning")?.value || 0
        const netIncome = incomeLines.find(l => l.label === "Årets resultat")?.value || 0
        const totalAssets = balanceLines.find(l => l.label === "Summa tillgångar")?.value || 0

        return { revenue, netIncome, totalAssets }
    }, [verifications, fiscalYear])

    // Prepare data for wizard dialog
    const wizardData = useMemo<ArsredovisningWizardData>(() => ({
        fiscalYear,
        fiscalYearRange: `${fiscalYear}-01-01 – ${fiscalYear}-12-31`,
        deadline: `30 jun ${currentYear}`,
        companyType: companyTypeFullName || "Aktiebolag",
        financials,
    }), [fiscalYear, currentYear, companyTypeFullName, financials])

    // Determine section statuses based on real data
    const dynamicReportSections = useMemo(() => {
        const hasVerifications = verifications.length > 0
        const yearVerifications = verifications.filter(v => v.date.startsWith(fiscalYear.toString()))
        const hasYearData = yearVerifications.length > 0
        
        return [
            { 
                name: "Förvaltningsberättelse", 
                status: "pending", // Always needs manual completion
                description: "Verksamhetsbeskrivning och väsentliga händelser" 
            },
            { 
                name: "Resultaträkning", 
                status: hasYearData ? "complete" : "pending",
                description: "Intäkter, kostnader och årets resultat" 
            },
            { 
                name: "Balansräkning", 
                status: hasVerifications ? "complete" : "pending",
                description: "Tillgångar, skulder och eget kapital" 
            },
            { 
                name: "Noter", 
                status: "pending", // Always needs manual completion
                description: "Tilläggsupplysningar och redovisningsprinciper" 
            },
            { 
                name: "Underskrifter", 
                status: "pending",
                description: "Styrelsens underskrifter" 
            },
        ]
    }, [verifications, fiscalYear])

    const handleViewReport = (sectionName: string) => {
        let sections: ReportSection[] = []
        let title = sectionName

        if (sectionName === "Resultaträkning") {
            const lines = AnnualReportProcessor.calculateIncomeStatement(verifications, fiscalYear)
            sections = [{
                id: "rr",
                title: `Resultaträkning ${fiscalYear}`,
                items: lines.map((line, idx) => ({
                    id: String(idx + 1),
                    label: line.label,
                    value: line.value,
                    highlight: line.isTotal || line.isHeader || line.level === 1
                }))
            }]
            title = "Resultaträkning"
        } else if (sectionName === "Balansräkning") {
            const lines = AnnualReportProcessor.calculateBalanceSheet(verifications, new Date(`${fiscalYear}-12-31`))
            sections = [{
                id: "br",
                title: `Balansräkning ${fiscalYear}-12-31`,
                items: lines.map((line, idx) => ({
                    id: String(idx + 1),
                    label: line.label,
                    value: line.value,
                    highlight: line.isTotal || line.isHeader || line.level === 1
                }))
            }]
            title = "Balansräkning"
        } else {
            sections = [{
                id: "placeholder",
                title: sectionName,
                items: []
            }]
        }

        setPreviewTitle(title)
        setPreviewSections(sections)
        setPreviewOpen(true)
    }

    const stats: TaxReportStat[] = [
        {
            label: "Räkenskapsår",
            value: fiscalYear.toString(),
            subtitle: `${fiscalYear}-01-01 – ${fiscalYear}-12-31`,
            icon: Calendar,
        },
        {
            label: "Bolagsform",
            value: companyTypeFullName || "Aktiebolag",
            subtitle: "K2-regelverk",
            icon: Building2,
        },
        {
            label: "Status",
            value: verifications.length > 0 ? "Under arbete" : "Ej påbörjad",
            subtitle: `Deadline: 30 jun ${currentYear}`,
            icon: Clock,
        },
    ]

    return (
        <TaxReportLayout
            title="Årsredovisning"
            subtitle="Sammanställning av räkenskapsåret för Bolagsverket."
            stats={stats}
            aiContext="arsredovisning"
            aiTitle="AI-årsredovisning"
            aiDescription="Genereras automatiskt från bokföringen enligt K2."
            actions={
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowAIDialog(true)}
                        size="sm"
                        className="w-full sm:w-auto"
                    >
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Skapa årsredovisning</span>
                        <span className="sm:hidden">Skapa</span>
                    </Button>
                    <Button
                        onClick={() => toast.info("Kommer snart", "Integration med Bolagsverket är under utveckling.")}
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                    >
                        <Send className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Skicka till Bolagsverket</span>
                        <span className="sm:hidden">Skicka</span>
                    </Button>
                </div>
            }
            dialogs={
                <>
                    <ArsredovisningWizardDialog
                        open={showAIDialog}
                        onOpenChange={setShowAIDialog}
                        data={wizardData}
                        onConfirm={() => {
                            toast.success("Årsredovisning sparad", `Årsredovisning för ${fiscalYear} har sparats som utkast.`)
                        }}
                    />
                    <ReportPreviewDialog
                        open={previewOpen}
                        onOpenChange={setPreviewOpen}
                        title={previewTitle}
                        meta={{
                            year: fiscalYear.toString(),
                            yearLabel: "Räkenskapsår",
                            companyName: company?.name || "Mitt Företag AB",
                            companyId: company?.orgNumber || "556000-0000",
                            location: company?.city || "Stockholm"
                        }}
                        sections={previewSections}
                    />
                </>
            }
        >
            <div className="space-y-4">
                <CollapsibleTableHeader title="Delar av årsredovisningen">
                    <div className="flex items-center gap-2">
                        <IconButton icon={Download} label="Exportera XBRL" showLabel />
                    </div>
                </CollapsibleTableHeader>

                <ListCard variant="minimal">
                    {dynamicReportSections.map((section) => (
                        <ListCardItem
                            key={section.name}
                            onClick={() => handleViewReport(section.name)}
                            className="transition-colors"
                            icon={<FileText className="h-6 w-6 text-muted-foreground" />}
                            trailing={
                                <div className="flex items-center gap-3">
                                    <AppStatusBadge
                                        status={section.status === "complete" ? "Klar" : section.status === "incomplete" ? "Ofullständig" : "Väntar"}
                                        size="md"
                                    />
                                </div>
                            }
                        >
                            <div className="space-y-1">
                                <p className="text-base font-semibold tracking-tight">{section.name}</p>
                                <p className="text-sm text-muted-foreground">{section.description}</p>
                            </div>
                        </ListCardItem>
                    ))}
                </ListCard>
            </div>
        </TaxReportLayout>
    )
}
