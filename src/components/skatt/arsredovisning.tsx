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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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

import { useCompany } from "@/providers/company-provider"
import { buildAIChatUrl, getDefaultAIContext } from "@/lib/ai-context"

export function ArsredovisningContent() {
    const router = useRouter()
    const [showBankIdDialog, setShowBankIdDialog] = useState(false)
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
                                onClick={() => setShowBankIdDialog(true)}
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
                    onAction={() => router.push(buildAIChatUrl(getDefaultAIContext('arsredovisning')))}
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

                {/* BankID Signing Dialog */}
                <Dialog open={showBankIdDialog} onOpenChange={setShowBankIdDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Skicka årsredovisning till Bolagsverket</DialogTitle>
                            <DialogDescription>
                                Du är på väg att skicka in årsredovisningen för räkenskapsåret 2024.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Bolag</span>
                                    <span className="font-medium">{company?.name || "Mitt Företag AB"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Org.nr</span>
                                    <span className="font-medium">{company?.orgNumber || "556000-0000"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Räkenskapsår</span>
                                    <span className="font-medium">2024-01-01 – 2024-12-31</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Regelverk</span>
                                    <span className="font-medium">K2</span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Genom att signera bekräftar du att uppgifterna i årsredovisningen är korrekta och att du har behörighet att företräda bolaget.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setShowBankIdDialog(false)}
                                className="w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-[#183E4F] text-white hover:bg-[#183E4F]/90 transition-colors"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                                Signera med BankID
                            </button>
                            <button
                                onClick={() => setShowBankIdDialog(false)}
                                className="w-full px-4 py-2 rounded-lg font-medium text-muted-foreground hover:bg-muted/50 transition-colors text-sm"
                            >
                                Avbryt
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </main>
    )
}
