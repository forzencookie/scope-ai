"use client"

import * as React from "react"
import { useState, useMemo, useEffect, useCallback } from "react"
import {
    Search,
    FileText,
    MoreHorizontal,
    Plus,
    Clock,
    CheckCircle2,
    Send,
    Mail,
    AlertTriangle,
    TrendingUp,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { useToast } from "@/components/ui/toast"
import { AmountText } from "../table/table-shell"
import {
    DataTable,
    DataTableHeader,
    DataTableHeaderCell,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    DataTableAddRow
} from "@/components/ui/data-table"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { DialogBody, DetailsGrid } from "@/components/ui/field-grid"
import { AppStatusBadge } from "@/components/ui/status-badge"
import {
    type InvoiceStatus,
    INVOICE_STATUSES
} from "@/lib/status-types"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { type Invoice } from "@/data/invoices"
import { useTableData, commonSortHandlers } from "@/hooks/use-table"
import { useTextMode } from "@/providers/text-mode-provider"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { BulkActionToolbar, useBulkSelection, type BulkAction } from "../shared/bulk-action-toolbar"
import { DeleteConfirmDialog, useDeleteConfirmation } from "@/components/shared/delete-confirm-dialog"
import { Trash2, Download } from "lucide-react"
import { InvoiceCreateDialog } from "./invoice-create-dialog"

// Sort handlers specific to invoices
const invoiceSortHandlers = {
    issueDate: commonSortHandlers.date as (a: Invoice, b: Invoice) => number,
    amount: commonSortHandlers.amount as (a: Invoice, b: Invoice) => number,
}

export function InvoicesTable() {
    const { text } = useTextMode()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newInvoiceDialogOpen, setNewInvoiceDialogOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [reminderSent, setReminderSent] = useState<string | null>(null)

    // Delete confirmation using shared hook
    const deleteConfirmation = useDeleteConfirmation()

    // Fetch invoices from API
    const fetchInvoices = useCallback(async () => {
        try {
            const response = await fetch('/api/invoices', { cache: 'no-store' })
            const data = await response.json()

            if (data.invoices && data.invoices.length > 0) {
                const mapped: Invoice[] = data.invoices.map((inv: any) => ({
                    id: inv.id || inv.invoiceNumber,
                    customer: inv.customer,
                    email: inv.email,
                    issueDate: inv.issueDate || inv.date,
                    dueDate: inv.dueDate,
                    amount: typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount,
                    vatAmount: typeof inv.vatAmount === 'string' ? parseFloat(inv.vatAmount) : inv.vatAmount,
                    status: inv.status,
                }))
                setInvoices(mapped)
            } else {
                setInvoices([])
            }
        } catch {
            console.error("Failed to fetch invoices")
            setInvoices([])
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchInvoices()
    }, [fetchInvoices])

    // Toast notifications
    const toast = useToast()

    // Use the unified table data hook for filtering and sorting
    const tableData = useTableData<Invoice>({
        filter: {
            searchFields: ['customer', 'id'],
        },
        sort: {
            initialSortBy: 'issueDate',
            initialSortOrder: 'desc',
            sortHandlers: invoiceSortHandlers,
        },
    })

    // Process invoices through filter and sort
    const filteredInvoices = useMemo(() =>
        tableData.processItems(invoices),
        [tableData, invoices]
    )

    // Calculate stats for stat cards
    const stats = useMemo(() => {
        const outstanding = invoices.filter(inv =>
            inv.status !== INVOICE_STATUS_LABELS.PAID && inv.status !== INVOICE_STATUS_LABELS.CANCELLED
        )
        const overdue = invoices.filter(inv =>
            inv.status === INVOICE_STATUS_LABELS.OVERDUE ||
            (inv.status !== INVOICE_STATUS_LABELS.PAID && new Date(inv.dueDate) < new Date())
        )
        const paid = invoices.filter(inv => inv.status === INVOICE_STATUS_LABELS.PAID)

        const outstandingAmount = outstanding.reduce((sum, inv) => sum + inv.amount, 0)
        const overdueAmount = overdue.reduce((sum, inv) => sum + inv.amount, 0)
        const paidAmount = paid.reduce((sum, inv) => sum + inv.amount, 0)

        return {
            outstandingCount: outstanding.length,
            outstandingAmount,
            overdueCount: overdue.length,
            overdueAmount,
            paidAmount,
            total: invoices.length
        }
    }, [invoices])

    // Bulk selection
    const bulkSelection = useBulkSelection(filteredInvoices)

    const bulkActions: BulkAction[] = useMemo(() => [
        {
            id: 'send',
            label: text.actions.send,
            icon: Send,
            onClick: (ids) => {
                toast.info(`Skickar ${ids.length} fakturor...`, "Uppdaterar status")
            }
        },
        {
            id: 'reminder',
            label: text.invoices.sendReminder,
            icon: Mail,
            onClick: (ids) => {
                toast.success(`Påminnelser skickade`, `${ids.length} påminnelser har skickats`)
            }
        },
        {
            id: 'download',
            label: text.actions.download,
            icon: Download,
            onClick: (ids) => {
                toast.info(`Laddar ner ${ids.length} fakturor...`, "Förbereder PDF")
            }
        },
        {
            id: 'delete',
            label: text.actions.delete,
            icon: Trash2,
            variant: 'destructive' as const,
            onClick: (ids) => {
                toast.error(`Tar bort ${ids.length} fakturor`, "Åtgärden kan inte ångras")
            }
        },
    ], [text, toast])

    const handleDeleteClick = (id: string) => {
        deleteConfirmation.requestDelete(id)
    }

    const handleConfirmDelete = () => {
        const id = deleteConfirmation.confirmDelete()
        if (id) {
            setInvoices(prev => prev.filter(inv => inv.id !== id))
            toast.success("Borttagen", "Fakturan har tagits bort")
        }
    }

    const handleInvoiceCreated = (newInvoice: Invoice) => {
        setInvoices(prev => [newInvoice, ...prev])
    }

    const handleViewDetails = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setDetailsDialogOpen(true)
    }

    const handleSendInvoice = async (id: string) => {
        const invoice = invoices.find(inv => inv.id === id)

        try {
            toast.info("Skickar faktura...", "Bokför och uppdaterar status")

            const response = await fetch(`/api/invoices/${id}/book`, {
                method: 'POST'
            })

            if (!response.ok) {
                throw new Error('Failed to book invoice')
            }

            await response.json()

            setInvoices(prev => prev.map(inv =>
                inv.id === id
                    ? { ...inv, status: INVOICE_STATUS_LABELS.SENT }
                    : inv
            ))

            toast.success("Faktura skickad!", `Faktura ${id} har skickats till ${invoice?.customer || 'kunden'} och bokförts`)

        } catch (error) {
            console.error('Failed to send invoice:', error)
            toast.error("Kunde inte skicka faktura", "Ett fel uppstod vid bokföring")
        }
    }

    const handleMarkAsPaid = async (id: string) => {
        const invoice = invoices.find(inv => inv.id === id)

        try {
            toast.info("Registrerar betalning...", "Uppdaterar status")

            const response = await fetch(`/api/invoices/${id}/pay`, {
                method: 'POST'
            })

            if (!response.ok) {
                throw new Error('Failed to mark as paid')
            }

            setInvoices(prev => prev.map(inv =>
                inv.id === id
                    ? { ...inv, status: INVOICE_STATUS_LABELS.PAID }
                    : inv
            ))

            toast.success("Betalning registrerad!", `Faktura ${id} från ${invoice?.customer} har markerats som betald`)
        } catch (error) {
            console.error('Failed to mark as paid:', error)
            toast.error("Kunde inte registrera betalning", "Ett fel uppstod")
        }
    }

    const handleSendReminder = (id: string) => {
        const invoice = invoices.find(inv => inv.id === id)
        setReminderSent(id)
        toast.success("Påminnelse skickad", `Betalningspåminnelse har skickats till ${invoice?.customer || 'kunden'}`)
        setTimeout(() => setReminderSent(null), 2000)
    }

    return (
        <div className="w-full space-y-6">
            {/* Stats Cards */}
            <StatCardGrid columns={4}>
                <StatCard
                    label={text.stats.totalInvoices}
                    value={stats.total}
                    subtitle={text.invoices.allInvoices}
                    headerIcon={FileText}
                />
                <StatCard
                    label={text.stats.outstanding}
                    value={formatCurrency(stats.outstandingAmount)}
                    subtitle={`${stats.outstandingCount} ${text.invoices.invoices}`}
                    headerIcon={Clock}
                />
                <StatCard
                    label={text.stats.overdue}
                    value={formatCurrency(stats.overdueAmount)}
                    subtitle={`${stats.overdueCount} ${text.invoices.invoices}`}
                    headerIcon={AlertTriangle}
                    changeType="negative"
                />
                <StatCard
                    label={text.stats.paid}
                    value={formatCurrency(stats.paidAmount)}
                    headerIcon={TrendingUp}
                    changeType="positive"
                />
            </StatCardGrid>

            {/* Section Separator */}
            <div className="border-b-2 border-border/60" />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                {...deleteConfirmation.dialogProps}
                onConfirm={handleConfirmDelete}
            />

            {/* New Invoice Dialog - Extracted Component */}
            <InvoiceCreateDialog
                open={newInvoiceDialogOpen}
                onOpenChange={setNewInvoiceDialogOpen}
                onInvoiceCreated={handleInvoiceCreated}
                existingInvoiceCount={invoices.length}
            />

            {/* Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{text.invoices.details}</DialogTitle>
                    </DialogHeader>
                    {selectedInvoice && (
                        <DialogBody>
                            <DetailsGrid
                                items={[
                                    { label: text.invoices.invoiceNumber, value: selectedInvoice.id },
                                    { label: text.invoices.customer, value: selectedInvoice.customer },
                                    { label: text.invoices.issueDate, value: selectedInvoice.issueDate },
                                    { label: text.invoices.dueDate, value: selectedInvoice.dueDate },
                                    { label: text.labels.amount, value: formatCurrency(selectedInvoice.amount) },
                                    { label: text.labels.status, value: <AppStatusBadge status={selectedInvoice.status} /> },
                                ]}
                            />
                        </DialogBody>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">{text.actions.close}</Button>
                        </DialogClose>
                        <Button>
                            <Send className="h-4 w-4 mr-2" />
                            {text.actions.send}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Table */}
            <DataTable
                title={text.invoices.outgoingInvoices}
                headerActions={
                    <div className="flex items-center gap-2">
                        {reminderSent && (
                            <span className="text-sm text-green-600 dark:text-green-500/70 flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {text.invoices.reminderSent}!
                            </span>
                        )}
                        <InputGroup className="w-56">
                            <InputGroupAddon>
                                <InputGroupText>
                                    <Search />
                                </InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                                type="text"
                                placeholder="Sök faktura..."
                                value={tableData.searchQuery}
                                onChange={(e) => tableData.setSearchQuery(e.target.value)}
                            />
                            {tableData.searchQuery && (
                                <button
                                    onClick={() => tableData.setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <span className="sr-only">Rensa sökning</span>
                                    ×
                                </button>
                            )}
                        </InputGroup>

                        {/* Status Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <span>{text.labels.status}</span>
                                    {tableData.statusFilter.length > 0 && (
                                        <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
                                            {tableData.statusFilter.length}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Filtrera på status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.entries(INVOICE_STATUS_LABELS).map(([key, label]) => (
                                    <DropdownMenuCheckboxItem
                                        key={key}
                                        checked={tableData.statusFilter.includes(label)}
                                        onCheckedChange={(checked) => {
                                            tableData.setStatusFilter(
                                                checked
                                                    ? [...tableData.statusFilter, label]
                                                    : tableData.statusFilter.filter(s => s !== label)
                                            )
                                        }}
                                    >
                                        {label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                                {tableData.statusFilter.length > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => tableData.setStatusFilter([])}>
                                            Rensa filter
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button size="sm" onClick={() => setNewInvoiceDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-1.5" />
                            {text.invoices.create}
                        </Button>
                    </div>
                }
            >
                <DataTableHeader>
                    <DataTableHeaderCell>
                        {text.invoices.invoiceNumber}
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>{text.invoices.customer}</DataTableHeaderCell>
                    <DataTableHeaderCell>
                        {text.invoices.issueDate}
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>{text.invoices.dueDate}</DataTableHeaderCell>
                    <DataTableHeaderCell
                        className="text-right"
                    >
                        {text.labels.amount}
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>{text.labels.status}</DataTableHeaderCell>
                    <DataTableHeaderCell className="w-10" />
                    <DataTableHeaderCell className="w-10">
                        <Checkbox
                            checked={bulkSelection.allSelected}
                            onCheckedChange={bulkSelection.toggleAll}
                            aria-label={text.actions.selectAll}
                        />
                    </DataTableHeaderCell>
                </DataTableHeader>
                <DataTableBody>
                    {filteredInvoices.map((invoice) => (
                        <DataTableRow
                            key={invoice.id}
                            className={cn(
                                "group",
                                bulkSelection.isSelected(invoice.id) && "bg-muted/50"
                            )}
                        >

                            <DataTableCell className="font-mono text-sm">
                                {invoice.id}
                            </DataTableCell>
                            <DataTableCell className="font-medium">
                                {invoice.customer}
                            </DataTableCell>
                            <DataTableCell>{invoice.issueDate}</DataTableCell>
                            <DataTableCell>{invoice.dueDate}</DataTableCell>
                            <DataTableCell className="text-right">
                                <AmountText
                                    value={invoice.amount}
                                />
                            </DataTableCell>
                            <DataTableCell>
                                <AppStatusBadge status={invoice.status} />
                            </DataTableCell>
                            <DataTableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="sr-only">{text.actions.openMenu}</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>{text.labels.actions}</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                                            {text.actions.viewDetails}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                                            {text.actions.edit}
                                        </DropdownMenuItem>
                                        {invoice.status === INVOICE_STATUSES.DRAFT && (
                                            <DropdownMenuItem onClick={() => handleSendInvoice(invoice.id)}>
                                                <Send className="h-3.5 w-3.5 mr-2" />
                                                {text.actions.send}
                                            </DropdownMenuItem>
                                        )}
                                        {(invoice.status === INVOICE_STATUSES.SENT || invoice.status === INVOICE_STATUSES.OVERDUE) && (
                                            <>
                                                <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                                    {text.invoices.markPaid}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSendReminder(invoice.id)}>
                                                    <Mail className="h-3.5 w-3.5 mr-2" />
                                                    {text.invoices.sendReminder}
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(invoice.id)}>
                                            {text.actions.delete}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </DataTableCell>
                            <DataTableCell className="w-10 text-right">
                                <div className="flex justify-end pr-2">
                                    <Checkbox
                                        checked={bulkSelection.isSelected(invoice.id)}
                                        onCheckedChange={() => bulkSelection.toggleItem(invoice.id)}
                                        aria-label={`Select invoice ${invoice.id}`}
                                    />
                                </div>
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                    {filteredInvoices.length === 0 && (
                        <DataTableRow>
                            <DataTableCell className="text-center py-8" colSpan={8}>
                                {tableData.searchQuery || tableData.statusFilter.length > 0
                                    ? text.errors.noMatchingInvoices
                                    : text.invoices.empty}
                            </DataTableCell>
                        </DataTableRow>
                    )}
                </DataTableBody>
            </DataTable>
            <DataTableAddRow
                label={text.invoices.create}
                onClick={() => setNewInvoiceDialogOpen(true)}
            />

            {/* Bulk Action Toolbar */}
            <BulkActionToolbar
                selectedCount={bulkSelection.selectedCount}
                selectedIds={bulkSelection.selectedIds}
                onClearSelection={bulkSelection.clearSelection}
                actions={bulkActions}
            />
        </div>
    )
}
