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
    ChevronLeft,
    ChevronRight,
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
import { InvoiceCreateDialog } from "./dialogs/faktura"
import { SupplierInvoiceDialog } from "./dialogs/leverantor"
import { invoiceService } from "@/lib/services/invoice-service"
import { useInvoicesPaginated } from "@/hooks/use-invoices"

// Imported newly created components
import { UnifiedInvoice, ViewFilter, PeriodFilter } from "./fakturor/types"
import { UNIFIED_COLUMNS, CUSTOMER_COLUMNS, SUPPLIER_COLUMNS } from "./fakturor/constants"
import { InvoicesEmptyState } from "./fakturor/components/InvoicesEmptyState"
import { InvoiceSummaryBar } from "./fakturor/components/InvoiceSummaryBar"
import { InvoiceCard } from "./fakturor/components/InvoiceCard"

import { mapCustomerInvoices, mapSupplierInvoices, mapToUnifiedInvoices } from "./fakturor/mappers"

// Memoized to prevent unnecessary re-renders when parent state changes
export const UnifiedInvoicesView = memo(function UnifiedInvoicesView() {
    const { text } = useTextMode()
    const toast = useToast()

    // State
    const [viewFilter, setViewFilter] = useState<ViewFilter>("all")

    // Calculate start date based on period filter
    const startDate = useMemo(() => {
        const now = new Date()
        switch (periodFilter) {
            case "week": {
                const start = new Date(now)
                start.setDate(now.getDate() - 7)
                return start.toISOString().split('T')[0]
            }
            case "month": {
                const start = new Date(now.getFullYear(), now.getMonth(), 1)
                return start.toISOString().split('T')[0]
            }
            case "quarter": {
                const quarterMonth = Math.floor(now.getMonth() / 3) * 3
                const start = new Date(now.getFullYear(), quarterMonth, 1)
                return start.toISOString().split('T')[0]
            }
            default:
                return undefined
        }
    }, [periodFilter])

    // Use paginated hook
    const {
        customerInvoices: apiCustomerInvoices,
        supplierInvoices: apiSupplierInvoices,
        isLoading,
        error: fetchError,
        page,
        setPage,
        pageSize,
        totalCustomerCount,
        totalSupplierCount,
        refetch: fetchInvoices
    } = useInvoicesPaginated(25, viewFilter, startDate) // Show 25 of each per page

    // Map service types to component types
    const customerInvoices = useMemo<Invoice[]>(() => 
        mapCustomerInvoices(apiCustomerInvoices), 
    [apiCustomerInvoices])

    const supplierInvoices = useMemo<SupplierInvoice[]>(() => 
        mapSupplierInvoices(apiSupplierInvoices), 
    [apiSupplierInvoices])

    // Update the hook's view filter when local view filter changes
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")
    const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
    const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)

    // =============================================================================
    // Unified Invoice List
    // =============================================================================

    const unifiedInvoices = useMemo<UnifiedInvoice[]>(() => 
        mapToUnifiedInvoices(customerInvoices, supplierInvoices), 
    [customerInvoices, supplierInvoices])


    // =============================================================================
    // Stats
    // =============================================================================

    const stats = useMemo(() => {
        const incoming = customerInvoices
            .filter(i => i.status === INVOICE_STATUS_LABELS.SENT || i.status === INVOICE_STATUS_LABELS.OVERDUE)
            .reduce((sum, start) => sum + (start.amount + (start.vatAmount || 0)), 0)

        const outgoing = supplierInvoices
            .filter(i => i.status !== 'betald')
            .reduce((sum, i) => sum + (i.totalAmount || i.amount), 0)

        const today = new Date().toISOString().split('T')[0]
        const overdueCustomer = customerInvoices.filter(i => i.status === INVOICE_STATUS_LABELS.OVERDUE || (i.status === INVOICE_STATUS_LABELS.SENT && i.dueDate < today))
        const overdueSupplier = supplierInvoices.filter(i => i.status === 'förfallen' || (i.status !== 'betald' && i.dueDate < today))

        const overdueCount = overdueCustomer.length + overdueSupplier.length
        const overdueAmount = overdueCustomer.reduce((sum, i) => sum + (i.amount + (i.vatAmount || 0)), 0) + overdueSupplier.reduce((sum, i) => sum + (i.totalAmount || 0), 0)

        const paidCustomer = customerInvoices
            .filter(i => i.status === INVOICE_STATUS_LABELS.PAID)
            .reduce((sum, i) => sum + (i.amount + (i.vatAmount || 0)), 0)

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
            fetchInvoices()
            toast.success("Faktura skickad!", "Fakturan har bokförts och skickats")
        } catch {
            toast.error("Kunde inte skicka faktura", "Ett fel uppstod")
        }
    }

    const handleMarkCustomerPaid = async (id: string) => {
        try {
            await fetch(`/api/invoices/${id}/pay`, { method: "POST" })
            fetchInvoices()
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
            fetchInvoices()
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
            fetchInvoices()
            toast.success("Betalning registrerad", "Fakturan har markerats som betald")
        } catch {
            toast.error("Kunde inte registrera betalning", "Ett fel uppstod")
        }
    }

    const handleInvoiceCreated = (newInvoice: Invoice) => {
        fetchInvoices()
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
                <InvoicesEmptyState hasFilters={viewFilter !== "all"} />
            )}

            {/* Pagination Footer */}
            {((viewFilter === 'kundfakturor' && totalCustomerCount > pageSize) ||
                (viewFilter === 'leverantorsfakturor' && totalSupplierCount > pageSize) ||
                (viewFilter === 'all' && (totalCustomerCount > pageSize || totalSupplierCount > pageSize))) && (
                    <div className="flex items-center justify-between px-2 py-4 mt-6 border-t border-border/40">
                        <div className="text-sm text-muted-foreground">
                            {viewFilter === 'all' && (
                                <span>Visar sida {page} av fakturor</span>
                            )}
                            {viewFilter === 'kundfakturor' && (
                                <span>Visar {Math.min((page - 1) * pageSize + 1, totalCustomerCount)}-{Math.min(page * pageSize, totalCustomerCount)} av {totalCustomerCount} kundfakturor</span>
                            )}
                            {viewFilter === 'leverantorsfakturor' && (
                                <span>Visar {Math.min((page - 1) * pageSize + 1, totalSupplierCount)}-{Math.min(page * pageSize, totalSupplierCount)} av {totalSupplierCount} leverantörsfakturor</span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1 || isLoading}
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Föregående
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page + 1)}
                                disabled={
                                    (viewFilter === 'kundfakturor' && page * pageSize >= totalCustomerCount) ||
                                    (viewFilter === 'leverantorsfakturor' && page * pageSize >= totalSupplierCount) ||
                                    (viewFilter === 'all' && page * pageSize >= Math.max(totalCustomerCount, totalSupplierCount)) ||
                                    isLoading
                                }
                            >
                                Nästa
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
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
