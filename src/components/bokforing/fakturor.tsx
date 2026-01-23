"use client"

import * as React from "react"
import { useState, useMemo, useEffect, useCallback, memo } from "react"
import {
    Plus,
    FileText,
    Calendar,
    ChevronDown,
    ArrowDownLeft,
    ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { type Invoice } from "@/data/invoices"
import { type SupplierInvoice } from "@/data/ownership"
import { useTextMode } from "@/providers/text-mode-provider"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { KanbanBoard, KanbanColumn } from "@/components/shared/kanban"
import { InvoiceCreateDialog } from "../dialogs/faktura"
import { SupplierInvoiceDialog } from "../dialogs/leverantor"
import { invoiceService } from "@/lib/services/invoice-service"

// Imported newly created components
import { UnifiedInvoice, ViewFilter, PeriodFilter } from "./fakturor/types"
import { UNIFIED_COLUMNS, CUSTOMER_COLUMNS, SUPPLIER_COLUMNS } from "./fakturor/constants"
import { InvoicesEmptyState } from "./fakturor/components/InvoicesEmptyState"
import { InvoiceSummaryBar } from "./fakturor/components/InvoiceSummaryBar"
import { InvoiceCard } from "./fakturor/components/InvoiceCard"

// Memoized to prevent unnecessary re-renders when parent state changes
export const UnifiedInvoicesView = memo(function UnifiedInvoicesView() {
    const { text } = useTextMode()
    const toast = useToast()

    // State
    const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([])
    const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([])
    // invoiceStats state removed
    const [isLoading, setIsLoading] = useState(true)
    const [viewFilter, setViewFilter] = useState<ViewFilter>("all")
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")
    const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
    const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)

    // =============================================================================
    // Data Fetching
    // =============================================================================

    const fetchInvoices = useCallback(async () => {
        try {
            const [customerData, supplierData] = await Promise.all([
                invoiceService.getCustomerInvoices(),
                invoiceService.getSupplierInvoices()
            ])

            setCustomerInvoices(customerData.invoices.map(inv => ({
                id: inv.id,
                customer: inv.customer,
                email: inv.email,
                issueDate: inv.issueDate,
                dueDate: inv.dueDate,
                amount: inv.amount,
                vatAmount: inv.vatAmount,
                status: inv.status as any,
            })))

            setSupplierInvoices(supplierData.invoices.map(inv => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                supplierName: inv.supplierName,
                amount: inv.amount,
                vatAmount: inv.vatAmount ?? 0,
                totalAmount: inv.totalAmount,
                dueDate: inv.dueDate,
                invoiceDate: inv.invoiceDate,
                status: inv.status,
                currency: (inv.currency || 'SEK') as 'SEK' | 'EUR' | 'USD',
            })))

        } catch (error) {
            console.error('Failed to fetch invoices:', error)
            setCustomerInvoices([])
            setSupplierInvoices([])
        }
    }, [])

    useEffect(() => {
        setIsLoading(true)
        fetchInvoices().finally(() => setIsLoading(false))
    }, [fetchInvoices])

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
        const incoming = customerInvoices
            .filter(i => i.status === INVOICE_STATUS_LABELS.SENT || i.status === INVOICE_STATUS_LABELS.OVERDUE)
            .reduce((sum, start) => sum + (start.totalAmount || start.amount * 1.25), 0)

        const outgoing = supplierInvoices
            .filter(i => i.status !== 'betald')
            .reduce((sum, i) => sum + (i.totalAmount || i.amount), 0)

        const today = new Date().toISOString().split('T')[0]
        const overdueCustomer = customerInvoices.filter(i => i.status === INVOICE_STATUS_LABELS.OVERDUE || (i.status === INVOICE_STATUS_LABELS.SENT && i.dueDate < today))
        const overdueSupplier = supplierInvoices.filter(i => i.status === 'förfallen' || (i.status !== 'betald' && i.dueDate < today))

        const overdueCount = overdueCustomer.length + overdueSupplier.length
        const overdueAmount = overdueCustomer.reduce((sum, i) => sum + (i.totalAmount || 0), 0) + overdueSupplier.reduce((sum, i) => sum + (i.totalAmount || 0), 0)

        const paidCustomer = customerInvoices
            .filter(i => i.status === INVOICE_STATUS_LABELS.PAID)
            .reduce((sum, i) => sum + (i.totalAmount || 0), 0)

        const paidSupplier = supplierInvoices
            .filter(i => i.status === 'betald')
            .reduce((sum, i) => sum + (i.totalAmount || 0), 0)

        return {
            incoming,
            outgoing,
            overdue: overdueAmount,
            overdueCount,
            paid: paidCustomer + paidSupplier,
        }
    }, [customerInvoices, supplierInvoices])

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
    // Render
    // =============================================================================

    const renderCard = (invoice: UnifiedInvoice) => (
        <InvoiceCard
            key={invoice.id}
            invoice={invoice}
            onSend={handleSendInvoice}
            onMarkCustomerPaid={handleMarkCustomerPaid}
            onApproveSupplier={handleApproveSupplier}
            onMarkSupplierPaid={handleMarkSupplierPaid}
        />
    )

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
                        {columnInvoices.map(renderCard)}
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
                        {columnInvoices.map(renderCard)}
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
                        {columnInvoices.map(renderCard)}
                    </KanbanColumn>
                )
            })}
        </KanbanBoard>
    )

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

            {/* Summary Bar + Filters in one row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Compact Summary */}
                <InvoiceSummaryBar
                    incoming={stats.incoming}
                    outgoing={stats.outgoing}
                    overdueCount={stats.overdueCount}
                />

                {/* Filters */}
                <div className="flex items-center gap-3">
                    {/* View Filter with FilterTabs */}
                    <FilterTabs
                        value={viewFilter}
                        onChange={(v) => setViewFilter(v as ViewFilter)}
                        options={[
                            { value: "all", label: "Alla", icon: <FileText className="h-3.5 w-3.5" /> },
                            { value: "kundfakturor", label: "Inkommande", icon: <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" /> },
                            { value: "leverantorsfakturor", label: "Utgående", icon: <ArrowUpRight className="h-3.5 w-3.5 text-red-600" /> },
                        ]}
                    />

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

            {/* Kanban */}
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
})

UnifiedInvoicesView.displayName = 'UnifiedInvoicesView'
