"use client"

import { useState, useMemo } from "react"
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
    MoreHorizontal,
    Trash2,
    Eye,
    Edit,
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
import { BulkActionToolbar, type BulkAction } from "../shared/bulk-action-toolbar"
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

    // Calculate periods dynamically based on real verifications
    const vatPeriodsState = useMemo(() => {
        const periods = ["Q4 2024", "Q3 2024", "Q2 2024", "Q1 2024"]
        return periods.map(p => {
            const report = VatProcessor.calculateReportFromRealVerifications(verifications, p)

            // Simulation: Q1-Q3 are simulated as submitted if we assume past is done
            // In a real app, we would fetch report status from DB too.
            // For now, keep the visual simulation for older quarters.
            if (p !== "Q4 2024") report.status = "submitted"

            return report
        })
    }, [verifications])

    const [showAIDialog, setShowAIDialog] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
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

    // Toggle selection
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const toggleAll = () => {
        if (selectedIds.size === filteredPeriods.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredPeriods.map(p => p.period)))
        }
    }

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
                setSelectedIds(new Set())
            },
        },
        {
            id: "send",
            label: "Skicka till Skatteverket",
            icon: Send,
            onClick: (ids) => {
                setVatPeriods(prev => prev.map(p =>
                    ids.includes(p.period) ? { ...p, status: "submitted" as const } : p
                ))
                toast.success("Rapporter skickade", `${ids.length} momsdeklaration(er) skickades till Skatteverket`)
                setSelectedIds(new Set())
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
                setSelectedIds(new Set())
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
                        icon={Calendar}
                        tooltip={termExplanations["Momsdeklaration"]}
                    />
                    <StatCard
                        label={text.reports.vatToPay}
                        value={formatCurrency(stats.netVat)}
                        subtitle={`${text.reports.salesVat}: ${formatCurrency(stats.salesVat)}`}
                        icon={Wallet}
                        tooltip={termExplanations["Moms att betala"]}
                    />
                    <StatCard
                        label={text.reports.inputVat}
                        value={formatCurrency(stats.inputVat)}
                        subtitle={text.reports.deductible}
                        icon={TrendingUp}
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
                        <DataTableHeaderCell className="w-10">
                            <Checkbox
                                checked={selectedIds.size === filteredPeriods.length && filteredPeriods.length > 0}
                                onCheckedChange={toggleAll}
                            />
                        </DataTableHeaderCell>
                        <DataTableHeaderCell label="Period" icon={Calendar} />
                        <DataTableHeaderCell label="Deadline" icon={Clock} />
                        <DataTableHeaderCell label="Utgående moms" icon={ArrowUpRight} />
                        <DataTableHeaderCell label="Ingående moms" icon={ArrowDownRight} />
                        <DataTableHeaderCell label="Att betala" icon={Wallet} />
                        <DataTableHeaderCell label="Status" icon={CheckCircle2} />
                        <DataTableHeaderCell label="" />
                    </DataTableHeader>
                    <DataTableBody>
                        {filteredPeriods.map((item) => (
                            <DataTableRow
                                key={item.period}
                                selected={selectedIds.has(item.period)}
                                onClick={() => setSelectedReport(item)}
                                className="cursor-pointer"
                            >
                                <DataTableCell className="w-10" onClick={(e) => e?.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedIds.has(item.period)}
                                        onCheckedChange={() => toggleSelection(item.period)}
                                    />
                                </DataTableCell>
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
                                <DataTableCell onClick={(e) => e?.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => setSelectedReport(item)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Visa detaljer
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSelectedReport(item)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Redigera
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDownloadSingle(item)}>
                                                <Download className="h-4 w-4 mr-2" />
                                                Ladda ner XML
                                            </DropdownMenuItem>
                                            <DropdownMenuItem disabled={item.status !== "upcoming"}>
                                                <Send className="h-4 w-4 mr-2" />
                                                Skicka till Skatteverket
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Ta bort
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>

                <BulkActionToolbar
                    selectedCount={selectedIds.size}
                    selectedIds={Array.from(selectedIds)}
                    onClearSelection={() => setSelectedIds(new Set())}
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
