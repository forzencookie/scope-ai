"use client"

import { useState, useMemo } from "react"
import {
    Calendar,
    Banknote,
    Wallet,
    Bot,
    Send,
    Download,
    User,
    CheckCircle2,
    Trash2
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { SectionCard } from "@/components/ui/section-card"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    DataTable,
    DataTableHeader,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    DataTableHeaderCell
} from "@/components/ui/data-table"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, type BulkAction } from "../shared/bulk-action-toolbar"
import { AmountText } from "@/components/table/table-shell"
import { AppStatusBadge } from "@/components/ui/status-badge"
// import { payslips } from "./constants"
import { PayslipDetailsDialog } from "./payslip-details-dialog"
import { PayslipCreateDialog } from "./payslip-create-dialog"
import { generatePayslipPDF } from "@/lib/pdf-generator"

type Payslip = {
    id: string | number
    employee: string
    period: string
    grossSalary: number
    netSalary: number
    tax: number
    status: string
    paymentDate?: string
}

export function LonesbeskContent() {
    const toast = useToast()
    const [allPayslips, setAllPayslips] = useState<Payslip[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAIDialog, setShowAIDialog] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string[]>([])
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)

    // Fetch real payslips
    const fetchPayslips = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/payroll/payslips')
            const data = await res.json()
            if (data.payslips) {
                // Map DB format to UI format
                setAllPayslips(data.payslips.map((p: any) => ({
                    id: p.id,
                    employee: p.employees?.name || 'Okänd anställd',
                    period: p.period,
                    grossSalary: Number(p.gross_salary),
                    netSalary: Number(p.net_salary),
                    tax: Number(p.tax_deduction),
                    status: p.status,
                    paymentDate: p.payment_date
                })))
            }
        } catch (err) {
            console.error("Failed to fetch payslips:", err)
        } finally {
            setIsLoading(false)
        }
    }

    useMemo(() => {
        fetchPayslips()
    }, [])

    // Handle row click to open details
    const handleRowClick = (slip: Payslip) => {
        setSelectedPayslip(slip)
        setViewDialogOpen(true)
    }

    const filteredPayslips = useMemo(() => {
        return allPayslips.filter(slip => {
            const matchesSearch = !searchQuery ||
                slip.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                slip.period.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus = statusFilter.length === 0 ||
                statusFilter.includes(slip.status)

            return matchesSearch && matchesStatus
        })
    }, [searchQuery, statusFilter, allPayslips])

    // Calculate stats from payslips data
    const stats = useMemo(() => {
        const periods = [...new Set(allPayslips.map(p => p.period))]
        const currentPeriod = periods[0]

        const currentPayslips = allPayslips.filter(p => p.period === currentPeriod)

        const totalGross = currentPayslips.reduce((sum, p) => sum + p.grossSalary, 0)
        const totalTax = currentPayslips.reduce((sum, p) => sum + p.tax, 0)
        const employeeCount = currentPayslips.length

        const periodMatch = currentPeriod ? currentPeriod.match(/(\w+)\s+(\d{4})/) : null
        let deadline = "12 jan 2025"
        if (periodMatch) {
            const monthNames = ["Januari", "Februari", "Mars", "April", "Maj", "Juni",
                "Juli", "Augusti", "September", "Oktober", "November", "December"]
            const monthIndex = monthNames.findIndex(m =>
                currentPeriod.toLowerCase().includes(m.toLowerCase())
            )
            if (monthIndex !== -1) {
                const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1
                const nextYear = monthIndex === 11 ? parseInt(periodMatch[2]) + 1 : parseInt(periodMatch[2])
                deadline = `12 ${monthNames[nextMonth].toLowerCase().slice(0, 3)} ${nextYear}`
            }
        }

        return {
            currentPeriod: currentPeriod || "Januari 2025",
            employeeCount,
            totalGross,
            totalTax,
            deadline,
        }
    }, [allPayslips])

    // Toggle selection for a single row
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

    // Toggle all rows
    const toggleAll = () => {
        if (selectedIds.size === filteredPayslips.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredPayslips.map(p => String(p.id))))
        }
    }

    const handlePayslipCreated = (newPayslip: Payslip) => {
        fetchPayslips()
    }

    const bulkActions: BulkAction[] = [
        {
            id: 'send',
            label: 'Skicka',
            icon: Send,
            onClick: (ids) => {
                toast.success(`${ids.length} lönebesked skickade`, "Anställda har notifierats via e-post")
                setSelectedIds(new Set())
            },
        },
        {
            id: 'download',
            label: 'Ladda ner PDF',
            icon: Download,
            onClick: (ids) => {
                toast.info(`Laddar ner ${ids.length} PDF-filer...`, "Förbereder nedladdning")
            },
        },
        {
            id: 'delete',
            label: 'Ta bort',
            icon: Trash2,
            variant: 'destructive' as const,
            onClick: (ids) => {
                setAllPayslips(prev => prev.filter(p => !ids.includes(String(p.id))))
                toast.success(`${ids.length} lönebesked borttagna`, "Åtgärden kan inte ångras")
                setSelectedIds(new Set())
            },
        },
    ]

    return (
        <main className="px-6 pt-2 pb-6">
            <div className="max-w-6xl w-full space-y-6">
                <StatCardGrid columns={3}>
                    <StatCard
                        label="Aktuell period"
                        value={stats.currentPeriod}
                        subtitle={`${stats.employeeCount} anställda`}
                        icon={Calendar}
                    />
                    <StatCard
                        label="Total bruttolön"
                        value={formatCurrency(stats.totalGross)}
                        subtitle="Denna månad"
                        icon={Banknote}
                    />
                    <StatCard
                        label="Skatt att betala"
                        value={formatCurrency(stats.totalTax)}
                        subtitle={`Deadline: ${stats.deadline}`}
                        icon={Wallet}
                    />
                </StatCardGrid>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title="AI-löneförslag"
                    description="Baserat på tidigare månader och anställningsavtal."
                    variant="ai"
                    onAction={() => setShowAIDialog(true)}
                />

                {/* AI Salary Wizard Dialog - Extracted Component */}
                <PayslipCreateDialog
                    open={showAIDialog}
                    onOpenChange={setShowAIDialog}
                    onPayslipCreated={handlePayslipCreated}
                    currentPeriod={stats.currentPeriod}
                />

                {/* Payslip Details Dialog */}
                <PayslipDetailsDialog
                    payslip={selectedPayslip}
                    open={viewDialogOpen}
                    onOpenChange={setViewDialogOpen}
                    onSend={(id) => {
                        toast.success("Lönespecifikation skickad", "Skickades till anställd")
                    }}
                />

                <DataTable
                    title="Lönespecifikationer"
                    headerActions={
                        <div className="flex items-center gap-2">
                            <SearchBar
                                placeholder="Sök anställd..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <FilterButton
                                        label="Status"
                                        isActive={statusFilter.length > 0}
                                        activeCount={statusFilter.length}
                                    />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter.includes("pending")}
                                        onCheckedChange={(checked) => {
                                            if (checked) setStatusFilter([...statusFilter, "pending"])
                                            else setStatusFilter(statusFilter.filter(s => s !== "pending"))
                                        }}
                                    >
                                        Väntar
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter.includes("sent")}
                                        onCheckedChange={(checked) => {
                                            if (checked) setStatusFilter([...statusFilter, "sent"])
                                            else setStatusFilter(statusFilter.filter(s => s !== "sent"))
                                        }}
                                    >
                                        Skickad
                                    </DropdownMenuCheckboxItem>
                                    {statusFilter.length > 0 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuCheckboxItem
                                                checked={false}
                                                onCheckedChange={() => setStatusFilter([])}
                                            >
                                                Rensa filter
                                            </DropdownMenuCheckboxItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    }
                >
                    <DataTableHeader>
                        <DataTableHeaderCell label="Anställd" icon={User} />
                        <DataTableHeaderCell label="Period" icon={Calendar} />
                        <DataTableHeaderCell label="Bruttolön" icon={Banknote} />
                        <DataTableHeaderCell label="Skatt" icon={Banknote} />
                        <DataTableHeaderCell label="Nettolön" icon={Wallet} />
                        <DataTableHeaderCell label="Status" icon={CheckCircle2} />
                        <DataTableHeaderCell className="w-10">
                            <Checkbox
                                checked={selectedIds.size === filteredPayslips.length && filteredPayslips.length > 0}
                                onCheckedChange={toggleAll}
                            />
                        </DataTableHeaderCell>

                    </DataTableHeader>
                    <DataTableBody>
                        {filteredPayslips.map((slip) => (
                            <DataTableRow
                                key={slip.id}
                                selected={selectedIds.has(String(slip.id))}
                                onClick={() => handleRowClick(slip)}
                                className="cursor-pointer"
                            >

                                <DataTableCell bold>{slip.employee}</DataTableCell>
                                <DataTableCell muted>{slip.period}</DataTableCell>
                                <DataTableCell><AmountText value={slip.grossSalary} /></DataTableCell>
                                <DataTableCell className="text-red-600 dark:text-red-500/70">-{slip.tax.toLocaleString("sv-SE")} kr</DataTableCell>
                                <DataTableCell bold><AmountText value={slip.netSalary} /></DataTableCell>
                                <DataTableCell>
                                    <AppStatusBadge
                                        status={slip.status === "pending" ? "Väntar" : "Skickad"}
                                        size="sm"
                                    />
                                </DataTableCell>
                                <DataTableCell className="w-10 text-right">
                                    <div className="flex justify-end pr-2">
                                        <Checkbox
                                            checked={selectedIds.has(String(slip.id))}
                                            onCheckedChange={() => toggleSelection(String(slip.id))}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
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
            </div>
        </main>
    )
}
