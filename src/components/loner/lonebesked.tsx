"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Calendar,
    Banknote,
    Wallet,
    Bot,
    Send,
    Download,
    User,
    CheckCircle2,
    Trash2,
    Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { buildAIChatUrl, getDefaultAIContext } from "@/lib/ai-context"
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
    GridTableHeader,
    GridTableRows,
    GridTableRow,
} from "@/components/ui/grid-table"

import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, type BulkAction } from "../shared/bulk-action-toolbar"

import { AppStatusBadge } from "@/components/ui/status-badge"
// import { payslips } from "./constants"
import { PayslipDetailsDialog } from "./dialogs/spec"
import { PayslipCreateDialog } from "./dialogs/lonebesked"
import { generatePayslipPDF } from "@/lib/pdf-generator"
import { payrollService, type PayrollStats } from "@/lib/services/payroll-service"

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
    const router = useRouter()
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

    useEffect(() => {
        fetchPayslips()
    }, [])

    // Handle row click to open details
    const handleRowClick = (slip: Payslip) => {
        setSelectedPayslip(slip)
        setViewDialogOpen(true)
    }

    // Calculate stats from payslips data
    const [stats, setStats] = useState<PayrollStats>({
        currentPeriod: "Laddar...",
        employeeCount: 0,
        totalGross: 0,
        totalTax: 0
    })

    useEffect(() => {
        const loadStats = async () => {
            const data = await payrollService.getStats()
            setStats(data)
        }
        loadStats()
    }, [allPayslips]) // Reload if payslips change (e.g. after add)

    /*
    const filteredPayslips = useMemo(() => {
        return allPayslips.filter(slip => {
    */

    // Kept filteredPayslips logic below but removing the stats useMemo block
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
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
                {/* Page Heading */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Lönekörning</h2>
                            <p className="text-muted-foreground mt-1">
                                Hantera löner och lönespecifikationer för dina anställda.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setShowAIDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Ny lönekörning
                            </Button>
                        </div>
                    </div>
                </div>

                <StatCardGrid columns={3}>
                    <StatCard
                        label="Aktuell period"
                        value={stats.currentPeriod}
                        subtitle={`${stats.employeeCount} anställda`}
                        headerIcon={Calendar}
                    />
                    <StatCard
                        label="Total bruttolön"
                        value={formatCurrency(stats.totalGross)}
                        subtitle="Denna månad"
                        headerIcon={Banknote}
                    />
                    <StatCard
                        label="Skatt att betala"
                        value={formatCurrency(stats.totalTax)}
                        subtitle="Avdragen skatt"
                        headerIcon={Wallet}
                    />
                </StatCardGrid>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title="AI-löneförslag"
                    description="Baserat på tidigare månader och anställningsavtal."
                    variant="ai"
                    onAction={() => router.push(buildAIChatUrl(getDefaultAIContext('lonebesked')))}
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

                {/* Table Title + Actions */}
                <div className="space-y-4 pt-8 border-t-2 border-border/60">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Lönespecifikationer</h2>
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
                    </div>

                    <div>
                        <div>
                            <GridTableHeader
                                columns={[
                                    { label: "Anställd", icon: User, span: 3 },
                                    { label: "Period", icon: Calendar, span: 2 },
                                    { label: "Bruttolön", icon: Banknote, span: 2, align: 'right' },
                                    { label: "Skatt", icon: Banknote, span: 2, align: 'right' },
                                    { label: "Nettolön", icon: Wallet, span: 2, align: 'right' },
                                    { label: "Status", icon: CheckCircle2, span: 1 },
                                ]}
                            />
                            <GridTableRows>
                                {filteredPayslips.map((slip) => (
                                    <GridTableRow
                                        key={slip.id}
                                        selected={selectedIds.has(String(slip.id))}
                                        onClick={() => handleRowClick(slip)}
                                    >
                                        {/* Anställd */}
                                        <div className="col-span-3 font-medium text-sm">{slip.employee}</div>

                                        {/* Period */}
                                        <div className="col-span-2 text-sm text-muted-foreground">{slip.period}</div>

                                        {/* Bruttolön */}
                                        <div className="col-span-2 text-right tabular-nums">
                                            {formatCurrency(slip.grossSalary)}
                                        </div>

                                        {/* Skatt */}
                                        <div className="col-span-2 text-right tabular-nums text-red-600 dark:text-red-500/70">
                                            -{slip.tax.toLocaleString("sv-SE")} kr
                                        </div>

                                        {/* Nettolön */}
                                        <div className="col-span-2 text-right tabular-nums font-medium">
                                            {formatCurrency(slip.netSalary)}
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-1">
                                            <AppStatusBadge
                                                status={slip.status === "pending" ? "Väntar" : "Skickad"}
                                                size="sm"
                                            />
                                        </div>
                                    </GridTableRow>
                                ))}
                            </GridTableRows>
                        </div>
                    </div>
                </div>

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
