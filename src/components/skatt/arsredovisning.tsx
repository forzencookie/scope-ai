"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Calendar,
    Building2,
    Clock,
    Bot,
    Download,
    Send,
    FileText,
} from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { IconButton } from "@/components/ui/icon-button"
import { Button } from "@/components/ui/button"
import { SectionCard, ListCard, ListCardItem } from "@/components/ui/section-card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { ArsredovisningWizardDialog } from "./dialogs/assistent"
import {
    CollapsibleTableContainer,
    CollapsibleTableHeader
} from "@/components/ui/collapsible-table"
import { reportSections } from "./constants"
import { useVerifications } from "@/hooks/use-verifications"
import { AnnualReportProcessor } from "@/lib/annual-report-processor"
import { ReportPreviewDialog, type ReportSection } from "./dialogs/rapport"
import { useToast } from "@/components/ui/toast"

import { useCompany } from "@/providers/company-provider"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai-context"

export function ArsredovisningContent() {
    const router = useRouter()
    const navigateToAI = useNavigateToAIChat()
    const toast = useToast()
    const [showAIDialog, setShowAIDialog] = useState(false)
    const { verifications } = useVerifications()
    const { company, companyTypeFullName, companyTypeName } = useCompany()

    // ... existing preview state ...
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewTitle, setPreviewTitle] = useState("")
    const [previewSections, setPreviewSections] = useState<ReportSection[]>([])

    const handleViewReport = (sectionName: string) => {
        // ... (existing logic)
        const year = 2024
        let sections: ReportSection[] = []
        let title = sectionName

        if (sectionName === "Resultaträkning") {
            const lines = AnnualReportProcessor.calculateIncomeStatement(verifications, year)
            // Transform lines to sections (grouping by headers?)
            // Simple mapping: one big section
            sections = [{
                id: "rr",
                title: `Resultaträkning ${year}`,
                items: lines.map((line, idx) => ({
                    id: String(idx + 1),
                    label: line.label,
                    value: line.value,
                    highlight: line.isTotal || line.isHeader || line.level === 1
                }))
            }]
            title = "Resultaträkning"
        } else if (sectionName === "Balansräkning") {
            const lines = AnnualReportProcessor.calculateBalanceSheet(verifications, new Date(`${year}-12-31`))
            sections = [{
                id: "br",
                title: `Balansräkning ${year}-12-31`,
                items: lines.map((line, idx) => ({
                    id: String(idx + 1),
                    label: line.label,
                    value: line.value,
                    highlight: line.isTotal || line.isHeader || line.level === 1
                }))
            }]
            title = "Balansräkning"
        } else {
            // Placeholder for other sections
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

    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Årsredovisning</h2>
                            <p className="text-muted-foreground mt-1">
                                Sammanställning av räkenskapsåret för Bolagsverket.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => toast.info("Kommer snart", "Integration med Bolagsverket är under utveckling.")}
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Skicka till Bolagsverket
                            </Button>
                        </div>
                    </div>
                </div>



                <StatCardGrid columns={3}>
                    <StatCard
                        label="Räkenskapsår"
                        value="2024"
                        subtitle="2024-01-01 – 2024-12-31"
                        headerIcon={Calendar}
                    />
                    <StatCard
                        label="Bolagsform"
                        value={companyTypeFullName || "Aktiebolag"}
                        subtitle="K2-regelverk"
                        headerIcon={Building2}
                    />
                    <StatCard
                        label="Status"
                        value="Under arbete"
                        subtitle="Deadline: 30 jun 2025"
                        headerIcon={Clock}
                    />
                </StatCardGrid>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title="AI-årsredovisning"
                    description="Genereras automatiskt från bokföringen enligt K2."
                    variant="ai"
                    onAction={() => navigateToAI(getDefaultAIContext('arsredovisning'))}
                />

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <ArsredovisningWizardDialog
                    open={showAIDialog}
                    onOpenChange={setShowAIDialog}
                />

                <ReportPreviewDialog
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    title={previewTitle}
                    meta={{
                        year: "2024",
                        yearLabel: "Räkenskapsår",
                        companyName: company?.name || "Mitt Företag AB",
                        companyId: company?.orgNumber || "556000-0000",
                        location: company?.city || "Stockholm"
                    }}
                    sections={previewSections}
                />

                <div className="space-y-4">
                    <CollapsibleTableHeader
                        title="Delar av årsredovisningen"
                    >
                        <div className="flex items-center gap-2">
                            <IconButton icon={Download} label="Exportera XBRL" showLabel />
                        </div>
                    </CollapsibleTableHeader>

                    <ListCard variant="minimal">
                        {reportSections.map((section) => (
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
            </div>
        </main>
    )
}
