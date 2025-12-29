"use client"

import { useState, useMemo, useEffect } from "react"
import {
    Calendar,
    Wallet,
    TrendingUp,
    Bot,
    Clock,
    Download,
    Send,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    Trash2,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { IconButton, IconButtonGroup } from "@/components/ui/icon-button"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DataTable,
    DataTableHeader,
    DataTableHeaderCell,
    DataTableBody,
    DataTableRow,
    DataTableCell
} from "@/components/ui/data-table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SectionCard } from "@/components/ui/section-card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, useBulkSelection, type BulkAction } from "../shared/bulk-action-toolbar"
import { MomsWizardDialog } from "./ai-wizard-dialog"
import { MomsDetailDialog } from "./moms-detail-dialog"
import { termExplanations } from "./constants"
import { VatProcessor, type VatReport } from "@/lib/vat-processor"
import { useVerifications } from "@/hooks/use-verifications"
import { useCompany } from "@/providers/company-provider"
import { useTextMode } from "@/providers/text-mode-provider"

export function MomsdeklarationContent() {
    const toast = useToast()
    const { text } = useTextMode()
    const { verifications } = useVerifications()
    const { company } = useCompany()

    const [periods, setPeriods] = useState<any[]>([])
    const [savedReports, setSavedReports] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Fetch periods and saved reports
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const [pRes, rRes] = await Promise.all([
                    fetch('/api/financial-periods'),
                    fetch('/api/reports/vat')
                ])
                const pData = await pRes.json()
                const rData = await rRes.json()
                setPeriods(pData.periods || [])
                setSavedReports(rData.reports || [])
            } catch (err) {
                console.error("Failed to fetch reports data:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    // Calculate periods dynamically by merging DB status with live ledger calculations
    const vatPeriodsState = useMemo(() => {
        if (isLoading && periods.length === 0) return []

        return periods.map(p => {
            // Find if there's a saved report for this period
            const saved = savedReports.find(r => r.period_id === p.id)

            if (saved && saved.status === 'submitted') {
                // If submitted, use the saved data (immutability for accounting)
                const report = saved.data as VatReport
                report.status = 'submitted'
                return report
            }

            // Otherwise, calculate LIVE draft from verifications
            const report = VatProcessor.calculateReportFromRealVerifications(verifications, p.name)

            // Set properties from DB record
            report.status = p.status === 'submitted' ? 'submitted' : 'upcoming'
            // We use the ID from the period as a key
            return { ...report, periodId: p.id }
        })
    }, [verifications, periods, savedReports, isLoading])

    const [showAIDialog, setShowAIDialog] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [selectedReport, setSelectedReport] = useState<VatReport | null>(null)
    const [vatPeriods, setVatPeriods] = useState<VatReport[]>([])

    // Sync state with memoized calculation
    // This allows local edits (if any) to persist until re-fetch, but here we just overwrite on verifications change
    // Ideally we shouldn't duplicate state, but the existing component structure uses 'vatPeriods' state.
    useMemo(() => {
        setVatPeriods(vatPeriodsState)
    }, [vatPeriodsState])

    // Calculate stats from the active period (Q4 2024 or upcoming)
    const stats = useMemo(() => {
        // Find the first upcoming or Q4 period
        const upcomingPeriod = vatPeriodsState.find(p => p.status === "upcoming") || vatPeriodsState[0]

        if (!upcomingPeriod) return {
            nextPeriod: "Ingen period",
            deadline: "",
            salesVat: 0,
            inputVat: 0,
            netVat: 0,
        }

        return {
            nextPeriod: upcomingPeriod.period,
            deadline: `Deadline: ${upcomingPeriod.dueDate}`,
            salesVat: upcomingPeriod.salesVat,
            inputVat: upcomingPeriod.inputVat,
            netVat: upcomingPeriod.netVat,
            fullReport: upcomingPeriod
        }
    }, [vatPeriodsState])

    // Filter periods - use stateful vatPeriods for updates to persist
    const filteredPeriods = useMemo(() => {
        return vatPeriods.filter(period => {
            const matchesSearch = !searchQuery ||
                period.period.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = !statusFilter || period.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [searchQuery, statusFilter, vatPeriods])

    // Map periods to have id for useBulkSelection
    const periodsWithId = useMemo(() =>
        filteredPeriods.map(p => ({ ...p, id: p.period })),
        [filteredPeriods]
    )

    // Use shared bulk selection hook
    const selection = useBulkSelection(periodsWithId)

    // Bulk actions
    const bulkActions: BulkAction[] = [
        {
            id: "delete",
            label: "Ta bort",
            icon: Trash2,
            variant: "destructive",
            onClick: (ids) => {
                setVatPeriods(prev => prev.filter(p => !ids.includes(p.period)))
                toast.success("Rapporter borttagna", `${ids.length} momsrapport(er) har tagits bort`)
                selection.clearSelection()
            },
        },
        {
            id: "send",
            label: "Skicka till Skatteverket",
            icon: Send,
            onClick: (ids) => {
                toast.info("Kommer snart", "Inlämning direkt till Skatteverket via API är under utveckling. Du kan ladda ner XML-filen för manuell inlämning.")
            },
        },
        {
            id: "download",
            label: "Ladda ner XML",
            icon: Download,
            onClick: (ids) => {
                const reports = vatPeriods.filter(p => ids.includes(p.period))
                reports.forEach(report => {
                    const xml = VatProcessor.generateXML(report, company?.orgNumber || "556000-0000")
                    const blob = new Blob([xml], { type: "text/xml" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `momsdeklaration-${report.period.replace(' ', '-')}.xml`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                })
                toast.success("Nerladdat", `${ids.length} fil(er) har laddats ner.`)
                selection.clearSelection()
            },
        },
    ]

    const handleDownloadSingle = (report: VatReport) => {
        const xml = VatProcessor.generateXML(report, company?.orgNumber || "556000-0000")
        const blob = new Blob([xml], { type: "text/xml" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `momsdeklaration-${report.period.replace(' ', '-')}.xml`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success("Nerladdat", `Momsdeklaration för ${report.period} har laddats ner.`)
    }

    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
                <StatCardGrid columns={3}>
                    <StatCard
                        label={text.reports.nextDeclaration}
                        value={stats.nextPeriod}
                        subtitle={stats.deadline}
                        headerIcon={Calendar}
                        tooltip={termExplanations["Momsdeklaration"]}
                    />
                    <StatCard
                        label={text.reports.vatToPay}
                        value={formatCurrency(stats.netVat)}
                        subtitle={`${text.reports.salesVat}: ${formatCurrency(stats.salesVat)}`}
                        headerIcon={Wallet}
                        tooltip={termExplanations["Moms att betala"]}
                    />
                    <StatCard
                        label={text.reports.inputVat}
                        value={formatCurrency(stats.inputVat)}
                        subtitle={text.reports.deductible}
                        headerIcon={TrendingUp}
                        tooltip={termExplanations["Ingående moms"]}
                    />
                </StatCardGrid>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title={text.reports.aiVatReport}
                    description={text.reports.aiVatDesc}
                    variant="ai"
                    onAction={() => setShowAIDialog(true)}
                />

                <MomsWizardDialog
                    open={showAIDialog}
                    onOpenChange={setShowAIDialog}
                    initialData={stats.fullReport}
                    onConfirm={async () => {
                        // Refresh data
                        setIsLoading(true)
                        try {
                            const [pRes, rRes] = await Promise.all([
                                fetch('/api/financial-periods'),
                                fetch('/api/reports/vat')
                            ])
                            const pData = await pRes.json()
                            const rData = await rRes.json()
                            setPeriods(pData.periods || [])
                            setSavedReports(rData.reports || [])
                            toast.success("Momsdeklaration skapad", "Din rapport har sparats och perioden har låsts.")
                        } catch (err) {
                            console.error("Failed to refresh data:", err)
                        } finally {
                            setIsLoading(false)
                        }
                    }}
                />

                <DataTable
                    title={text.reports.vatPeriods}
                    headerActions={
                        <div className="flex items-center gap-2">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Sök period..."
                                className="w-48"
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <FilterButton
                                        label="Status"
                                        isActive={!!statusFilter}
                                    />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                                        Alla
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter("upcoming")}>
                                        <Clock className="h-4 w-4 mr-2" />
                                        Kommande
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter("submitted")}>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Inskickad
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button size="sm" onClick={() => setShowAIDialog(true)}>
                                <Plus className="h-4 w-4 mr-1.5" />
                                Ny period
                            </Button>
                        </div>
                    }
                >
                    <DataTableHeader>

                        <DataTableHeaderCell label="Period" icon={Calendar} />
                        <DataTableHeaderCell label="Deadline" icon={Clock} />
                        <DataTableHeaderCell label="Utgående moms" icon={ArrowUpRight} />
                        <DataTableHeaderCell label="Ingående moms" icon={ArrowDownRight} />
                        <DataTableHeaderCell label="Att betala" icon={Wallet} />
                        <DataTableHeaderCell label="Status" icon={CheckCircle2} />
                        <DataTableHeaderCell className="w-10">
                            <Checkbox
                                checked={selection.allSelected && filteredPeriods.length > 0}
                                onCheckedChange={selection.toggleAll}
                            />
                        </DataTableHeaderCell>

                    </DataTableHeader>
                    <DataTableBody>
                        {filteredPeriods.map((item) => (
                            <DataTableRow
                                key={item.period}
                                selected={selection.isSelected(item.period)}
                                onClick={() => setSelectedReport(item)}
                                className="cursor-pointer"
                            >

                                <DataTableCell bold>{item.period}</DataTableCell>
                                <DataTableCell muted>{item.dueDate}</DataTableCell>
                                <DataTableCell>{item.salesVat.toLocaleString("sv-SE")} kr</DataTableCell>
                                <DataTableCell>{item.inputVat.toLocaleString("sv-SE")} kr</DataTableCell>
                                <DataTableCell bold>{item.netVat.toLocaleString("sv-SE")} kr</DataTableCell>
                                <DataTableCell>
                                    <AppStatusBadge
                                        status={item.status === "upcoming" ? "Kommande" : "Inskickad"}
                                    />
                                </DataTableCell>
                                <DataTableCell className="w-10 text-right" onClick={(e) => e?.stopPropagation()}>
                                    <div className="flex justify-end pr-2">
                                        <Checkbox
                                            checked={selection.isSelected(item.period)}
                                            onCheckedChange={() => selection.toggleItem(item.period)}
                                        />
                                    </div>
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>

                <BulkActionToolbar
                    selectedCount={selection.selectedCount}
                    selectedIds={selection.selectedIds}
                    onClearSelection={selection.clearSelection}
                    actions={bulkActions}
                />

                {/* VAT Report Detail Dialog */}
                <MomsDetailDialog
                    report={selectedReport}
                    open={!!selectedReport}
                    onOpenChange={(open) => !open && setSelectedReport(null)}
                    onSave={(updatedReport) => {
                        setVatPeriods(prev => prev.map(p =>
                            p.period === updatedReport.period ? updatedReport : p
                        ))
                        toast.success("Rapport uppdaterad", `Momsdeklaration för ${updatedReport.period} har sparats`)
                        setSelectedReport(null)
                    }}
                />
            </div>
        </main>
    )
}
