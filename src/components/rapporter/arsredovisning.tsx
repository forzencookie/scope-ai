"use client"

import { useState, useMemo } from "react"
import {
    Calendar,
    Building2,
    Clock,
    Download,
    FileText,
    Bot,
} from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { Button } from "@/components/ui/button"
import { ListCard, ListCardItem } from "@/components/ui/section-card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { CollapsibleTableHeader } from "@/components/ui/collapsible-table"
import { useVerifications } from "@/hooks/use-verifications"
import { useAllTaxRates } from "@/hooks/use-tax-parameters"
import { AnnualReportProcessor, type FiscalYearRange } from "@/services/processors/annual-report-processor"
import { ReportPreviewDialog, type ReportSection } from "./dialogs/rapport"
import { useToast } from "@/components/ui/toast"
import { useCompany } from "@/providers/company-provider"
import { TaxReportLayout, type TaxReportStat } from "@/components/shared"
import { generateXBRL, type XBRLParams } from "@/lib/generators/xbrl-generator"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"

export function ArsredovisningContent() {
    const toast = useToast()
    const navigateToAI = useNavigateToAIChat()
    const { verifications } = useVerifications()
    const { company, companyTypeFullName } = useCompany()

    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewTitle, setPreviewTitle] = useState("")
    const [previewSections, setPreviewSections] = useState<ReportSection[]>([])

    // Calculate default fiscal year from company settings
    const defaultFiscalYear = useMemo(() => {
        const fiscalEnd = company?.fiscalYearEnd || '12-31'
        const [endMonth, endDay] = fiscalEnd.split('-').map(Number)
        const now = new Date()
        let endYear = now.getFullYear() - 1
        if (endMonth !== 12) {
            const fyEndThisYear = new Date(now.getFullYear(), endMonth - 1, endDay)
            if (now >= fyEndThisYear) endYear = now.getFullYear()
        }
        return endYear
    }, [company?.fiscalYearEnd])

    const [selectedYear, setSelectedYear] = useState(defaultFiscalYear)

    const fiscalYearRange = useMemo<FiscalYearRange>(() => {
        const fiscalEnd = company?.fiscalYearEnd || '12-31'
        const [endMonth] = fiscalEnd.split('-').map(Number)
        const end = `${selectedYear}-${fiscalEnd}`
        const startYear = endMonth === 12 ? selectedYear : selectedYear - 1
        const startMonth = endMonth === 12 ? 1 : endMonth + 1
        const start = `${startYear}-${String(startMonth).padStart(2, '0')}-01`
        return { start, end, year: selectedYear }
    }, [company?.fiscalYearEnd, selectedYear])

    const { rates: taxRates } = useAllTaxRates(fiscalYearRange.year)

    // Calculate financials from verifications
    const incomeLines = useMemo(() =>
        AnnualReportProcessor.calculateIncomeStatement(verifications, fiscalYearRange, taxRates),
        [verifications, fiscalYearRange, taxRates]
    )
    const balanceLines = useMemo(() =>
        AnnualReportProcessor.calculateBalanceSheet(
            verifications,
            new Date(fiscalYearRange.end),
            { taxRates, fiscalYearStart: fiscalYearRange.start }
        ),
        [verifications, fiscalYearRange, taxRates]
    )

    const financials = useMemo(() => {
        const revenue = incomeLines.find(l => l.label === "Nettoomsättning")?.value || 0
        const netIncome = incomeLines.find(l => l.label === "Årets resultat")?.value || 0
        const totalAssets = balanceLines.find(l => l.label === "Summa tillgångar")?.value || 0

        return { revenue, netIncome, totalAssets }
    }, [incomeLines, balanceLines])

    // Deadline: 7 months after fiscal year end for AB, 6 months for förening
    const deadline = useMemo(() => {
        const [y, m] = fiscalYearRange.end.split('-').map(Number)
        const deadlineDate = new Date(y, m + 6, 0) // 7 months after end
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
        return `${deadlineDate.getDate()} ${monthNames[deadlineDate.getMonth()]} ${deadlineDate.getFullYear()}`
    }, [fiscalYearRange.end])

    // Determine section statuses based on real data
    const dynamicReportSections = useMemo(() => {
        const yearVerifications = verifications.filter(v =>
            v.date >= fiscalYearRange.start && v.date <= fiscalYearRange.end
        )
        const hasYearData = yearVerifications.length > 0

        return [
            {
                name: "Förvaltningsberättelse",
                status: "pending",
                description: "Verksamhetsbeskrivning och väsentliga händelser"
            },
            {
                name: "Resultaträkning",
                status: hasYearData ? "complete" : "pending",
                description: "Intäkter, kostnader och årets resultat"
            },
            {
                name: "Balansräkning",
                status: hasYearData ? "complete" : "pending",
                description: "Tillgångar, skulder och eget kapital"
            },
            {
                name: "Noter",
                status: "pending",
                description: "Tilläggsupplysningar och redovisningsprinciper"
            },
            {
                name: "Underskrifter",
                status: "pending",
                description: "Styrelsens underskrifter"
            },
        ]
    }, [verifications, fiscalYearRange])

    const handleExportXBRL = () => {
        const getLine = (lines: typeof incomeLines, label: string) =>
            lines.find(l => l.label === label)?.value || 0

        const prevStartYear = parseInt(fiscalYearRange.start.split('-')[0]) - 1

        const xbrlParams: XBRLParams = {
            company: {
                name: company?.name || 'Mitt Foretag AB',
                orgNumber: company?.orgNumber || '556000-0000',
            },
            period: {
                currentStart: fiscalYearRange.start,
                currentEnd: fiscalYearRange.end,
                previousStart: `${prevStartYear}-${fiscalYearRange.start.slice(5)}`,
                previousEnd: `${parseInt(fiscalYearRange.end.split('-')[0]) - 1}-${fiscalYearRange.end.slice(5)}`,
            },
            values: {
                netTurnover: getLine(incomeLines, 'Nettoomsättning'),
                goodsCost: getLine(incomeLines, 'Råvaror och förnödenheter'),
                externalCosts: getLine(incomeLines, 'Övriga externa kostnader'),
                personnelCosts: getLine(incomeLines, 'Personalkostnader'),
                depreciation: getLine(incomeLines, 'Av- och nedskrivningar'),
                operatingResult: getLine(incomeLines, 'Rörelseresultat'),
                financialItems: getLine(incomeLines, 'Finansiella poster'),
                profitAfterFin: getLine(incomeLines, 'Resultat efter finansiella poster'),
                taxOnResult: getLine(incomeLines, 'Skatt på årets resultat'),
                netResult: getLine(incomeLines, 'Årets resultat'),
                fixedAssets: getLine(balanceLines, 'Anläggningstillgångar'),
                currentAssets: getLine(balanceLines, 'Omsättningstillgångar'),
                cashAndBank: getLine(balanceLines, 'Kassa och bank'),
                totalAssets: getLine(balanceLines, 'Summa tillgångar'),
                equity: getLine(balanceLines, 'Eget kapital (inkl. årets resultat)'),
                longTermLiabilities: getLine(balanceLines, 'Långfristiga skulder'),
                shortTermLiabilities: getLine(balanceLines, 'Kortfristiga skulder'),
                totalEquityAndLiabilities: getLine(balanceLines, 'Summa eget kapital och skulder'),
            },
        }

        const xml = generateXBRL(xbrlParams)
        const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `arsredovisning_${fiscalYearRange.year}_${(company?.orgNumber || 'foretag').replace(/\D/g, '')}.xbrl`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success('iXBRL exporterad', `Årsredovisning ${fiscalYearRange.year} har laddats ner som iXBRL.`)
    }

    const handleViewReport = (sectionName: string) => {
        let sections: ReportSection[] = []
        let title = sectionName

        if (sectionName === "Resultaträkning") {
            sections = [{
                id: "rr",
                title: `Resultaträkning ${fiscalYearRange.start} – ${fiscalYearRange.end}`,
                items: incomeLines.map((line, idx) => ({
                    id: String(idx + 1),
                    label: line.label,
                    value: line.value,
                    highlight: line.isTotal || line.isHeader || line.level === 1
                }))
            }]
            title = "Resultaträkning"
        } else if (sectionName === "Balansräkning") {
            sections = [{
                id: "br",
                title: `Balansräkning ${fiscalYearRange.end}`,
                items: balanceLines.map((line, idx) => ({
                    id: String(idx + 1),
                    label: line.label,
                    value: line.value,
                    highlight: line.isTotal || line.isHeader || line.level === 1
                }))
            }]
            title = "Balansräkning"
        } else if (sectionName === "Förvaltningsberättelse") {
            sections = [{
                id: "fb",
                title: `Förvaltningsberättelse ${fiscalYearRange.year}`,
                items: [
                    { id: "1", label: "Allmänt om verksamheten", value: 0, highlight: true },
                    { id: "2", label: "Väsentliga händelser under året", value: 0, highlight: true },
                    { id: "3", label: "Resultatdisposition", value: 0, highlight: true },
                ]
            }]
            title = "Förvaltningsberättelse"
        } else if (sectionName === "Noter") {
            sections = [{
                id: "noter",
                title: `Noter ${fiscalYearRange.year}`,
                items: [
                    { id: "1", label: "Not 1. Redovisningsprinciper", value: 0, highlight: true },
                    { id: "2", label: "Not 2. Medelantal anställda", value: 0, highlight: true },
                ]
            }]
            title = "Noter"
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
            value: fiscalYearRange.year.toString(),
            subtitle: `${fiscalYearRange.start} – ${fiscalYearRange.end}`,
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
            subtitle: `Deadline: ${deadline}`,
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
            yearNav={{
                year: selectedYear,
                onYearChange: setSelectedYear,
                minYear: new Date().getFullYear() - 5,
                maxYear: new Date().getFullYear(),
            }}
            actions={
                <Button
                    onClick={() => navigateToAI(getDefaultAIContext('arsredovisning'))}
                    className="gap-2 overflow-hidden w-[120px] sm:w-auto"
                >
                    <Bot className="h-4 w-4 shrink-0" />
                    <span className="truncate">Skapa årsredovisning</span>
                </Button>
            }
            dialogs={
                <ReportPreviewDialog
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    title={previewTitle}
                    meta={{
                        year: fiscalYearRange.year.toString(),
                        yearLabel: "Räkenskapsår",
                        companyName: company?.name || "Mitt Företag AB",
                        companyId: company?.orgNumber || "556000-0000",
                        location: company?.city || "Stockholm"
                    }}
                    sections={previewSections}
                />
            }
        >
            <div className="space-y-4">
                <CollapsibleTableHeader title="Delar av årsredovisningen">
                    <div className="flex items-center gap-2">
                        <IconButton icon={Download} label="Ladda ner iXBRL" showLabel onClick={handleExportXBRL} />
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
                                        status={section.status === "complete" ? "Klar" : "Väntar"}
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
