"use client"

import * as React from "react"
import { useState, useMemo, useEffect, useCallback } from "react"
import {
    Plus,
    FileText,
    Clock,
    AlertTriangle,
    TrendingUp,
    CheckCircle2,
    Eye,
    Banknote,
    Calendar,
    ChevronDown,
    Send,
    Mail,
    ArrowDownLeft,
    ArrowUpRight,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { type Invoice } from "@/data/invoices"
import { type SupplierInvoice } from "@/data/ownership"
import { useTextMode } from "@/providers/text-mode-provider"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/kanban"
import { InvoiceCreateDialog } from "@/components/bokforing/invoice-create-dialog"
import { SupplierInvoiceDialog } from "@/components/bokforing/supplier-invoice-dialog"

// =============================================================================
// Types
// =============================================================================

type InvoiceDirection = "in" | "out"
type ViewFilter = "all" | "kundfakturor" | "leverantorsfakturor"

interface UnifiedInvoice {
    id: string
    direction: InvoiceDirection
    number: string
    counterparty: string
    amount: number
    vatAmount?: number
    totalAmount: number
    dueDate: string
    issueDate: string
    status: string
    // Original data for actions
    originalCustomerInvoice?: Invoice
    originalSupplierInvoice?: SupplierInvoice
}

// =============================================================================
// Column Configurations
// =============================================================================

// Unified columns for mixed view
const UNIFIED_COLUMNS = [
    { id: "pending", title: "Att hantera", statuses: [INVOICE_STATUS_LABELS.SENT, "mottagen", "attesterad"] },
    { id: "overdue", title: "Förfallna", statuses: [INVOICE_STATUS_LABELS.OVERDUE, "förfallen"] },
    { id: "paid", title: "Betalda", statuses: [INVOICE_STATUS_LABELS.PAID, "betald"] },
    { id: "draft", title: "Utkast", statuses: [INVOICE_STATUS_LABELS.DRAFT] },
]

// Customer invoice columns
const CUSTOMER_COLUMNS = [
    { id: "draft", title: "Utkast", status: INVOICE_STATUS_LABELS.DRAFT },
    { id: "sent", title: "Skickade", status: INVOICE_STATUS_LABELS.SENT },
    { id: "overdue", title: "Förfallna", status: INVOICE_STATUS_LABELS.OVERDUE },
    { id: "paid", title: "Betalda", status: INVOICE_STATUS_LABELS.PAID },
]

// Supplier invoice columns
const SUPPLIER_COLUMNS = [
    { id: "mottagen", title: "Mottagna", status: "mottagen" },
    { id: "attesterad", title: "Attesterade", status: "attesterad" },
    { id: "forfallen", title: "Förfallna", status: "förfallen" },
    { id: "betald", title: "Betalda", status: "betald" },
]

// =============================================================================
// Empty State Component
// =============================================================================

function InvoicesEmptyState({ hasFilters }: { hasFilters: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-medium text-lg text-foreground mb-1">
                {hasFilters ? "Inga fakturor matchar filtret" : "Inga fakturor än"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
                {hasFilters
                    ? "Prova att ändra dina filter eller söktermer för att hitta vad du letar efter."
                    : "Här samlas alla dina kund- och leverantörsfakturor när du börjar skapa dem."}
            </p>
        </div>
    )
}

// =============================================================================
// Main Component
// =============================================================================

export function UnifiedInvoicesView() {
    const { text } = useTextMode()
    const toast = useToast()

    // State
    const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([])
    const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [viewFilter, setViewFilter] = useState<ViewFilter>("all")
    const [periodFilter, setPeriodFilter] = useState<"week" | "month" | "quarter" | "all">("all")
    const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
    const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)

    const periodLabels = {
        week: "Denna vecka",
        month: "Denna månad",
        quarter: "Detta kvartal",
        all: "Alla"
    }

    const viewFilterLabels: Record<ViewFilter, string> = {
        all: "Alla fakturor",
        kundfakturor: "Kundfakturor",
        leverantorsfakturor: "Leverantörsfakturor"
    }

    // =============================================================================
    // Data Fetching
    // =============================================================================

    const fetchCustomerInvoices = useCallback(async () => {
        try {
            const response = await fetch("/api/invoices", { cache: "no-store" })
            const data = await response.json()
            if (data.invoices && data.invoices.length > 0) {
                setCustomerInvoices(data.invoices.map((inv: any) => ({
                    id: inv.id || inv.invoiceNumber,
                    customer: inv.customer,
                    email: inv.email,
                    issueDate: inv.issueDate || inv.date,
                    dueDate: inv.dueDate,
                    amount: typeof inv.amount === "string" ? parseFloat(inv.amount) : inv.amount,
                    vatAmount: typeof inv.vatAmount === "string" ? parseFloat(inv.vatAmount) : inv.vatAmount,
                    status: inv.status,
                })))
            } else {
                setCustomerInvoices([])
            }
        } catch {
            setCustomerInvoices([])
        }
    }, [])

    const fetchSupplierInvoices = useCallback(async () => {
        try {
            const response = await fetch("/api/supplier-invoices/processed", { cache: "no-store" })
            const data = await response.json()
            if (data.invoices && data.invoices.length > 0) {
                const apiStatusToInternal: Record<string, SupplierInvoice["status"]> = {
                    Mottagen: "mottagen",
                    Attesterad: "attesterad",
                    Betald: "betald",
                    Förfallen: "förfallen",
                }
                setSupplierInvoices(data.invoices.map((inv: any) => ({
                    id: inv.id,
                    invoiceNumber: inv.invoiceNumber || inv.invoice_number,
                    supplierName: inv.supplierName || inv.supplier_name,
                    amount: typeof inv.amount === "string" ? parseFloat(inv.amount) : inv.amount,
                    vatAmount: typeof inv.vatAmount === "string" ? parseFloat(inv.vatAmount) : inv.vatAmount || 0,
                    totalAmount: typeof inv.totalAmount === "string" ? parseFloat(inv.totalAmount) : inv.totalAmount || inv.amount,
                    dueDate: inv.dueDate || inv.due_date,
                    invoiceDate: inv.invoiceDate || inv.issue_date,
                    status: apiStatusToInternal[inv.status] || "mottagen",
                    currency: inv.currency || "SEK",
                })))
            } else {
                setSupplierInvoices([])
            }
        } catch {
            setSupplierInvoices([])
        }
    }, [])

    useEffect(() => {
        setIsLoading(true)
        Promise.all([fetchCustomerInvoices(), fetchSupplierInvoices()])
            .finally(() => setIsLoading(false))
    }, [fetchCustomerInvoices, fetchSupplierInvoices])

    // =============================================================================
    // Unified Invoice List
    // =============================================================================

    const unifiedInvoices = useMemo<UnifiedInvoice[]>(() => {
        const customer: UnifiedInvoice[] = customerInvoices.map(inv => ({
            id: `c-${inv.id}`,
            direction: "in" as const,
            number: inv.id,
            counterparty: inv.customer,
            amount: inv.amount,
            vatAmount: inv.vatAmount,
            totalAmount: inv.amount + (inv.vatAmount || 0),
            dueDate: inv.dueDate,
            issueDate: inv.issueDate,
            status: inv.status,
            originalCustomerInvoice: inv,
        }))

        const supplier: UnifiedInvoice[] = supplierInvoices.map(inv => ({
            id: `s-${inv.id}`,
            direction: "out" as const,
            number: inv.invoiceNumber || inv.id,
            counterparty: inv.supplierName,
            amount: inv.amount,
            vatAmount: inv.vatAmount,
            totalAmount: inv.totalAmount || inv.amount,
            dueDate: inv.dueDate,
            issueDate: inv.invoiceDate,
            status: inv.status,
            originalSupplierInvoice: inv,
        }))

        let result = [...customer, ...supplier]

        // Apply view filter
        if (viewFilter === "kundfakturor") {
            result = result.filter(inv => inv.direction === "in")
        } else if (viewFilter === "leverantorsfakturor") {
            result = result.filter(inv => inv.direction === "out")
        }

        // Apply period filter
        if (periodFilter !== "all") {
            const now = new Date()
            let startDate: Date
            switch (periodFilter) {
                case "week":
                    startDate = new Date(now)
                    startDate.setDate(now.getDate() - 7)
                    break
                case "month":
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                    break
                case "quarter":
                    const quarterMonth = Math.floor(now.getMonth() / 3) * 3
                    startDate = new Date(now.getFullYear(), quarterMonth, 1)
                    break
                default:
                    startDate = new Date(0)
            }
            result = result.filter(inv => new Date(inv.issueDate) >= startDate)
        }

        return result
    }, [customerInvoices, supplierInvoices, viewFilter, periodFilter])

    // =============================================================================
    // Stats
    // =============================================================================

    const stats = useMemo(() => {
        const incomingTotal = unifiedInvoices
            .filter(inv => inv.direction === "in" && inv.status !== INVOICE_STATUS_LABELS.PAID)
            .reduce((sum, inv) => sum + inv.totalAmount, 0)

        const outgoingTotal = unifiedInvoices
            .filter(inv => inv.direction === "out" && inv.status !== "betald")
            .reduce((sum, inv) => sum + inv.totalAmount, 0)

        const overdueInvoices = unifiedInvoices.filter(inv =>
            inv.status === INVOICE_STATUS_LABELS.OVERDUE || inv.status === "förfallen"
        )
        const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

        const paidInvoices = unifiedInvoices.filter(inv =>
            inv.status === INVOICE_STATUS_LABELS.PAID || inv.status === "betald"
        )
        const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

        return {
            incoming: incomingTotal,
            outgoing: outgoingTotal,
            overdue: overdueAmount,
            overdueCount: overdueInvoices.length,
            paid: paidAmount,
        }
    }, [unifiedInvoices])

    // =============================================================================
    // Actions
    // =============================================================================

    const handleSendInvoice = async (id: string) => {
        try {
            await fetch(`/api/invoices/${id}/book`, { method: "POST" })
            setCustomerInvoices(prev => prev.map(inv =>
                inv.id === id ? { ...inv, status: INVOICE_STATUS_LABELS.SENT } : inv
            ))
            toast.success("Faktura skickad!", "Fakturan har bokförts och skickats")
        } catch {
            toast.error("Kunde inte skicka faktura", "Ett fel uppstod")
        }
    }

    const handleMarkCustomerPaid = async (id: string) => {
        try {
            await fetch(`/api/invoices/${id}/pay`, { method: "POST" })
            setCustomerInvoices(prev => prev.map(inv =>
                inv.id === id ? { ...inv, status: INVOICE_STATUS_LABELS.PAID } : inv
            ))
            toast.success("Betalning registrerad!", "Fakturan har markerats som betald")
        } catch {
            toast.error("Kunde inte registrera betalning", "Ett fel uppstod")
        }
    }

    const handleApproveSupplier = async (id: string) => {
        try {
            await fetch(`/api/supplier-invoices/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Attesterad" })
            })
            setSupplierInvoices(prev => prev.map(inv =>
                inv.id === id ? { ...inv, status: "attesterad" as const } : inv
            ))
            toast.success("Faktura attesterad", "Fakturan har godkänts för betalning")
        } catch {
            toast.error("Kunde inte attestera", "Ett fel uppstod")
        }
    }

    const handleMarkSupplierPaid = async (id: string) => {
        try {
            await fetch(`/api/supplier-invoices/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Betald" })
            })
            setSupplierInvoices(prev => prev.map(inv =>
                inv.id === id ? { ...inv, status: "betald" as const } : inv
            ))
            toast.success("Betalning registrerad", "Fakturan har markerats som betald")
        } catch {
            toast.error("Kunde inte registrera betalning", "Ett fel uppstod")
        }
    }

    const handleInvoiceCreated = (newInvoice: Invoice) => {
        setCustomerInvoices(prev => [newInvoice, ...prev])
    }

    // =============================================================================
    // Render Helpers
    // =============================================================================

    const renderInvoiceCard = (invoice: UnifiedInvoice) => {
        const isCustomer = invoice.direction === "in"
        const DirectionIcon = isCustomer ? ArrowDownLeft : ArrowUpRight

        return (
            <KanbanCard
                key={invoice.id}
                title={
                    <span className="flex items-center gap-1.5">
                        <DirectionIcon className={cn(
                            "h-3.5 w-3.5",
                            isCustomer ? "text-green-600" : "text-red-600"
                        )} />
                        {invoice.number}
                    </span>
                }
                subtitle={invoice.counterparty}
                amount={isCustomer ? invoice.totalAmount : -invoice.totalAmount}
                date={invoice.dueDate}
                isOverdue={invoice.status === INVOICE_STATUS_LABELS.OVERDUE || invoice.status === "förfallen"}
            >
                <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                <DropdownMenuItem>
                    <Eye className="h-3.5 w-3.5 mr-2" />
                    Visa detaljer
                </DropdownMenuItem>

                {/* Customer invoice actions */}
                {isCustomer && invoice.originalCustomerInvoice && (
                    <>
                        {invoice.status === INVOICE_STATUS_LABELS.DRAFT && (
                            <DropdownMenuItem onClick={() => handleSendInvoice(invoice.originalCustomerInvoice!.id)}>
                                <Send className="h-3.5 w-3.5 mr-2" />
                                Skicka faktura
                            </DropdownMenuItem>
                        )}
                        {(invoice.status === INVOICE_STATUS_LABELS.SENT || invoice.status === INVOICE_STATUS_LABELS.OVERDUE) && (
                            <>
                                <DropdownMenuItem onClick={() => handleMarkCustomerPaid(invoice.originalCustomerInvoice!.id)}>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                    Markera betald
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Mail className="h-3.5 w-3.5 mr-2" />
                                    Skicka påminnelse
                                </DropdownMenuItem>
                            </>
                        )}
                    </>
                )}

                {/* Supplier invoice actions */}
                {!isCustomer && invoice.originalSupplierInvoice && (
                    <>
                        {invoice.status === "mottagen" && (
                            <DropdownMenuItem onClick={() => handleApproveSupplier(invoice.originalSupplierInvoice!.id)}>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                Attestera
                            </DropdownMenuItem>
                        )}
                        {invoice.status === "attesterad" && (
                            <DropdownMenuItem onClick={() => handleMarkSupplierPaid(invoice.originalSupplierInvoice!.id)}>
                                <Banknote className="h-3.5 w-3.5 mr-2" />
                                Markera betald
                            </DropdownMenuItem>
                        )}
                    </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">Radera</DropdownMenuItem>
            </KanbanCard>
        )
    }

    // =============================================================================
    // Kanban View Renderers
    // =============================================================================

    const renderUnifiedKanban = () => (
        <KanbanBoard>
            {UNIFIED_COLUMNS.map(column => {
                const columnInvoices = unifiedInvoices.filter(inv =>
                    column.statuses.includes(inv.status)
                )
                return (
                    <KanbanColumn
                        key={column.id}
                        title={column.title}
                        count={columnInvoices.length}
                    >
                        {columnInvoices.map(renderInvoiceCard)}
                    </KanbanColumn>
                )
            })}
        </KanbanBoard>
    )

    const renderCustomerKanban = () => (
        <KanbanBoard>
            {CUSTOMER_COLUMNS.map(column => {
                const columnInvoices = unifiedInvoices.filter(inv =>
                    inv.direction === "in" && inv.status === column.status
                )
                return (
                    <KanbanColumn
                        key={column.id}
                        title={column.title}
                        count={columnInvoices.length}
                        onAddNew={column.id === "draft" ? () => setCustomerDialogOpen(true) : undefined}
                    >
                        {columnInvoices.map(renderInvoiceCard)}
                    </KanbanColumn>
                )
            })}
        </KanbanBoard>
    )

    const renderSupplierKanban = () => (
        <KanbanBoard>
            {SUPPLIER_COLUMNS.map(column => {
                const columnInvoices = unifiedInvoices.filter(inv =>
                    inv.direction === "out" && inv.status === column.status
                )
                return (
                    <KanbanColumn
                        key={column.id}
                        title={column.title}
                        count={columnInvoices.length}
                        onAddNew={column.id === "mottagen" ? () => setSupplierDialogOpen(true) : undefined}
                    >
                        {columnInvoices.map(renderInvoiceCard)}
                    </KanbanColumn>
                )
            })}
        </KanbanBoard>
    )

    // =============================================================================
    // Main Render
    // =============================================================================

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Fakturor</h2>
                    <p className="text-muted-foreground text-sm">Hantera alla fakturor</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Ny faktura
                            <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setCustomerDialogOpen(true)}>
                            <ArrowDownLeft className="h-4 w-4 mr-2 text-green-600" />
                            Kundfaktura (inkommande)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSupplierDialogOpen(true)}>
                            <ArrowUpRight className="h-4 w-4 mr-2 text-red-600" />
                            Leverantörsfaktura (utgående)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Stats */}
            <StatCardGrid columns={4}>
                <StatCard
                    label="Att få"
                    value={formatCurrency(stats.incoming)}
                    subtitle="Kundfakturor"
                    headerIcon={ArrowDownLeft}
                    changeType="positive"
                />
                <StatCard
                    label="Att betala"
                    value={formatCurrency(stats.outgoing)}
                    subtitle="Leverantörsfakturor"
                    headerIcon={ArrowUpRight}
                />
                <StatCard
                    label="Förfallna"
                    value={formatCurrency(stats.overdue)}
                    subtitle={`${stats.overdueCount} fakturor`}
                    headerIcon={AlertTriangle}
                    changeType="negative"
                />
                <StatCard
                    label="Betalda"
                    value={formatCurrency(stats.paid)}
                    headerIcon={TrendingUp}
                    changeType="positive"
                />
            </StatCardGrid>

            {/* Separator */}
            <div className="border-b-2 border-border/60" />

            {/* Sub-header with filters */}
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">{viewFilterLabels[viewFilter]}</h3>
                <div className="flex items-center gap-2">
                    {/* View Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 h-8">
                                {viewFilterLabels[viewFilter]}
                                <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Visa</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setViewFilter("all")}>
                                Alla fakturor
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewFilter("kundfakturor")}>
                                <ArrowDownLeft className="h-4 w-4 mr-2 text-green-600" />
                                Kundfakturor
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewFilter("leverantorsfakturor")}>
                                <ArrowUpRight className="h-4 w-4 mr-2 text-red-600" />
                                Leverantörsfakturor
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Period Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Calendar className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Visa period</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setPeriodFilter("week")}>Denna vecka</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPeriodFilter("month")}>Denna månad</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPeriodFilter("quarter")}>Detta kvartal</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setPeriodFilter("all")}>Alla</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Kanban - Different views based on filter */}
            {viewFilter === "all" && renderUnifiedKanban()}
            {viewFilter === "kundfakturor" && renderCustomerKanban()}
            {viewFilter === "leverantorsfakturor" && renderSupplierKanban()}

            {unifiedInvoices.length === 0 && (
                <InvoicesEmptyState hasFilters={viewFilter !== "all" || periodFilter !== "all"} />
            )}

            {/* Dialogs */}
            <InvoiceCreateDialog
                open={customerDialogOpen}
                onOpenChange={setCustomerDialogOpen}
                onInvoiceCreated={handleInvoiceCreated}
                existingInvoiceCount={customerInvoices.length}
            />
            <SupplierInvoiceDialog
                open={supplierDialogOpen}
                onOpenChange={setSupplierDialogOpen}
            />
        </div>
    )
}
