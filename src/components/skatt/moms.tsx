"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
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
import { MomsWizardDialog } from "./dialogs/assistent"
import { MomsDetailDialog } from "./dialogs/moms"
import { termExplanations } from "./constants"
import { VatProcessor, type VatReport } from "@/lib/vat-processor"
import { useVerifications } from "@/hooks/use-verifications"
import { useCompany } from "@/providers/company-provider"
import { useTextMode } from "@/providers/text-mode-provider"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai-context"
import { taxService, type VatStats } from "@/lib/services/tax-service"

export function MomsdeklarationContent() {
    const router = useRouter()
    const navigateToAI = useNavigateToAIChat()
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
    const [stats, setStats] = useState<{
        nextPeriod: string,
        deadline: string,
        salesVat: number,
        inputVat: number,
        netVat: number,
        fullReport?: VatReport
    }>({
        nextPeriod: "Laddar...",
        deadline: "",
        salesVat: 0,
        inputVat: 0,
        netVat: 0,
    })

    useEffect(() => {
        const loadStats = async () => {
            // Import tax period helper for fallback
            const { getNextVatPeriod } = await import('@/lib/tax-periods')
            const vatFrequency = company?.vatFrequency || 'quarterly'
            const fiscalYearEnd = company?.fiscalYearEnd || '12-31'

            // If DB periods available, use them
            if (!isLoading && periods.length > 0) {
                const upcomingPeriod = periods.find(p => p.status === 'open' || p.status === 'upcoming') || periods[0]

                if (upcomingPeriod && upcomingPeriod.start_date && upcomingPeriod.end_date) {
                    const rpcStats = await taxService.getVatStats(upcomingPeriod.start_date, upcomingPeriod.end_date)

                    setStats({
                        nextPeriod: upcomingPeriod.name,
                        deadline: upcomingPeriod.due_date ? `Deadline: ${upcomingPeriod.due_date}` : "Datum saknas",
                        salesVat: rpcStats.salesVat,
                        inputVat: rpcStats.inputVat,
                        netVat: rpcStats.netVat,
                        fullReport: vatPeriodsState.find(p => p.periodId === upcomingPeriod.id)
                    })
                    return
                }
            }

            // Fallback: Use onboarding-driven calculation
            const calculatedPeriod = getNextVatPeriod(vatFrequency, fiscalYearEnd)
            setStats({
                nextPeriod: calculatedPeriod.periodName,
                deadline: `Deadline: ${calculatedPeriod.deadline}`,
                salesVat: 0,
                inputVat: 0,
                netVat: 0,
            })
        }
        loadStats()
    }, [periods, isLoading, company?.vatFrequency, company?.fiscalYearEnd])

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
                {/* Page Heading */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Momsdeklaration</h2>
                            <p className="text-muted-foreground mt-1">Hantera momsrapporter och skicka till Skatteverket.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setShowAIDialog(true)} className="w-full sm:w-auto">
                                <Plus className="h-4 w-4 mr-2" />
                                Ny period
                            </Button>
                        </div>
                    </div>
                </div>

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
                    onAction={() => navigateToAI(getDefaultAIContext('moms'))}
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

                {/* Table Actions Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 mb-2">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Alla perioder</h3>
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
                    </div>
                </div>

                {/* Responsive Table Container */}
                <div className="overflow-x-auto -mx-2 px-2">
                    {/* GridTable Header */}
                    <GridTableHeader
                        columns={[
                            { label: "Period", icon: Calendar, span: 2 },
                            { label: "Deadline", icon: Clock, span: 2 },
                            { label: "Utgående moms", icon: ArrowUpRight, span: 2, align: "right" },
                            { label: "Ingående moms", icon: ArrowDownRight, span: 2, align: "right" },
                            { label: "Att betala", icon: Wallet, span: 2, align: "right" },
                            { label: "Status", icon: CheckCircle2, span: 1 },
                        ]}
                        trailing={
                            <Checkbox
                                checked={selection.allSelected && filteredPeriods.length > 0}
                                onCheckedChange={selection.toggleAll}
                            />
                        }
                    />

                    {/* GridTable Rows */}
                    <GridTableRows>
                    {filteredPeriods.map((item) => (
                        <GridTableRow
                            key={item.period}
                            onClick={() => setSelectedReport(item)}
                            selected={selection.isSelected(item.period)}
                        >
                            <div style={{ gridColumn: 'span 2' }} className="font-medium">
                                {item.period}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground">
                                {item.dueDate}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums">
                                {item.salesVat.toLocaleString("sv-SE")} kr
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums">
                                {item.inputVat.toLocaleString("sv-SE")} kr
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums font-medium">
                                {item.netVat.toLocaleString("sv-SE")} kr
                            </div>
                            <div style={{ gridColumn: 'span 1' }}>
                                <AppStatusBadge
                                    status={item.status === "upcoming" ? "Kommande" : "Inskickad"}
                                />
                            </div>
                            <div
                                style={{ gridColumn: 'span 1' }}
                                className="flex justify-end"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Checkbox
                                    checked={selection.isSelected(item.period)}
                                    onCheckedChange={() => selection.toggleItem(item.period)}
                                />
                            </div>
                        </GridTableRow>
                    ))}
                    </GridTableRows>
                </div>

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
