"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
    Calendar,
    Search,
    SlidersHorizontal,
    FileText,
    MoreHorizontal,
    Plus,
    User,
    Clock,
    Banknote,
    CheckCircle2,
    Hash,
    X,
    Send,
    Mail,
    AlertCircle,
    AlertTriangle,
    TrendingUp,
} from "lucide-react"
import { cn, parseAmount } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { useToast } from "@/components/ui/toast"
import { AmountText } from "@/components/table/table-shell"
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
import { AppStatusBadge } from "@/components/ui/status-badge"
import { 
    type InvoiceStatus, 
    INVOICE_STATUSES 
} from "@/lib/status-types"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { type Invoice, mockInvoices } from "@/data/invoices"
import { useTableData, commonSortHandlers } from "@/hooks/use-table"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { BulkActionToolbar, useBulkSelection, type BulkAction } from "@/components/bulk-action-toolbar"
import { Trash2, Download } from "lucide-react"

// Sort handlers specific to invoices
const invoiceSortHandlers = {
    issueDate: commonSortHandlers.date as (a: Invoice, b: Invoice) => number,
    amount: commonSortHandlers.amount as (a: Invoice, b: Invoice) => number,
}

export function InvoicesTable() {
    const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices)
    const [newInvoiceDialogOpen, setNewInvoiceDialogOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [reminderSent, setReminderSent] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null)
    
    // Form validation state for new invoice
    const [newInvoiceForm, setNewInvoiceForm] = useState({
        customer: '',
        amount: '',
        dueDate: '',
    })
    const [formErrors, setFormErrors] = useState<{
        customer?: string;
        amount?: string;
        dueDate?: string;
    }>({})
    
    // New invoice form state
    const [newInvoiceCustomer, setNewInvoiceCustomer] = useState("")
    const [newInvoiceAmount, setNewInvoiceAmount] = useState("")
    const [newInvoiceDueDate, setNewInvoiceDueDate] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    
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
        
        const outstandingAmount = outstanding.reduce((sum, inv) => sum + parseAmount(inv.amount), 0)
        const overdueAmount = overdue.reduce((sum, inv) => sum + parseAmount(inv.amount), 0)
        const paidAmount = paid.reduce((sum, inv) => sum + parseAmount(inv.amount), 0)
        
        return { 
            outstandingCount: outstanding.length,
            outstandingAmount,
            overdueCount: overdue.length,
            overdueAmount,
            paidAmount,
            total: invoices.length
        }
    }, [invoices])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('sv-SE', {
            style: 'currency',
            currency: 'SEK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    // Bulk selection
    const bulkSelection = useBulkSelection(filteredInvoices)
    
    const bulkActions: BulkAction[] = useMemo(() => [
        {
            id: "delete",
            label: "Radera",
            icon: Trash2,
            variant: "destructive",
            onClick: (ids) => {
                setInvoices(prev => prev.filter(inv => !ids.includes(inv.id)))
                toast.success("Fakturor raderade", `${ids.length} fakturor har raderats`)
                bulkSelection.clearSelection()
            },
        },
        {
            id: "send",
            label: "Skicka",
            icon: Send,
            onClick: (ids) => {
                toast.success("Fakturor skickade", `${ids.length} fakturor har skickats`)
                bulkSelection.clearSelection()
            },
        },
        {
            id: "download",
            label: "Ladda ner",
            icon: Download,
            onClick: (ids) => {
                toast.info("Laddar ner", `Förbereder ${ids.length} fakturor för nedladdning...`)
                bulkSelection.clearSelection()
            },
        },
    ], [toast, bulkSelection])

    const handleDeleteClick = (id: string) => {
        setInvoiceToDelete(id)
        setDeleteDialogOpen(true)
    }

    const handleConfirmDelete = () => {
        if (invoiceToDelete) {
            setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete))
            toast.success("Faktura raderad", `Faktura ${invoiceToDelete} har raderats`)
        }
        setDeleteDialogOpen(false)
        setInvoiceToDelete(null)
    }

    const handleCreateInvoice = () => {
        // Validate form
        const errors: typeof formErrors = {}
        
        if (!newInvoiceCustomer.trim()) {
            errors.customer = "Kundnamn krävs"
        } else if (newInvoiceCustomer.trim().length < 2) {
            errors.customer = "Kundnamn måste vara minst 2 tecken"
        }
        
        if (!newInvoiceAmount) {
            errors.amount = "Belopp krävs"
        } else if (parseFloat(newInvoiceAmount) <= 0) {
            errors.amount = "Belopp måste vara större än 0"
        } else if (parseFloat(newInvoiceAmount) > 10000000) {
            errors.amount = "Belopp är för stort"
        }
        
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)
            return
        }

        setIsCreating(true)
        
        // Simulate API call
        setTimeout(() => {
            const newId = `INV-${String(invoices.length + 1).padStart(3, '0')}`
            const today = new Date().toISOString().split('T')[0]
            const dueDate = newInvoiceDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            
            const newInvoice: Invoice = {
                id: newId,
                customer: newInvoiceCustomer,
                amount: `${newInvoiceAmount} kr`,
                issueDate: today,
                dueDate: dueDate,
                status: INVOICE_STATUS_LABELS.DRAFT,
            }
            
            setInvoices(prev => [newInvoice, ...prev])
            setNewInvoiceDialogOpen(false)
            setIsCreating(false)
            
            // Reset form
            setNewInvoiceCustomer("")
            setNewInvoiceAmount("")
            setNewInvoiceDueDate("")
            setFormErrors({})
            
            // Show success toast with action
            toast.addToast({
                title: "Faktura skapad!",
                description: `Faktura ${newId} till ${newInvoiceCustomer} har skapats`,
                variant: "success",
                duration: 8000,
                action: {
                    label: "Visa",
                    onClick: () => {
                        const createdInvoice = invoices.find(inv => inv.id === newId) || newInvoice
                        setSelectedInvoice(createdInvoice)
                        setDetailsDialogOpen(true)
                    }
                }
            })
        }, 600)
    }

    const handleViewDetails = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setDetailsDialogOpen(true)
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
                    label="Totalt fakturor"
                    value={stats.total}
                    subtitle="Alla fakturor"
                    icon={FileText}
                />
                <StatCard
                    label="Utestående"
                    value={formatCurrency(stats.outstandingAmount)}
                    subtitle={`${stats.outstandingCount} fakturor`}
                    icon={Clock}
                />
                <StatCard
                    label="Förfallna"
                    value={formatCurrency(stats.overdueAmount)}
                    subtitle={`${stats.overdueCount} fakturor`}
                    icon={AlertTriangle}
                    changeType="negative"
                />
                <StatCard
                    label="Betalt"
                    value={formatCurrency(stats.paidAmount)}
                    icon={TrendingUp}
                    changeType="positive"
                />
            </StatCardGrid>

            {/* Section Separator */}
            <div className="border-b-2 border-border/60" />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Denna åtgärd kan inte ångras. Fakturan kommer att raderas permanent.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Radera
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* New Invoice Dialog */}
            <Dialog open={newInvoiceDialogOpen} onOpenChange={(open) => {
                setNewInvoiceDialogOpen(open)
                if (!open) {
                    // Reset form errors when closing
                    setFormErrors({})
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Skapa ny faktura</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Kund <span className="text-destructive">*</span>
                            </label>
                            <Input 
                                placeholder="Ange kundnamn..." 
                                value={newInvoiceCustomer}
                                onChange={(e) => {
                                    setNewInvoiceCustomer(e.target.value)
                                    if (formErrors.customer) {
                                        setFormErrors(prev => ({ ...prev, customer: undefined }))
                                    }
                                }}
                                aria-invalid={!!formErrors.customer}
                                className={formErrors.customer ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                            {formErrors.customer && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {formErrors.customer}
                                </p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Belopp <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <Input 
                                        placeholder="0.00" 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={newInvoiceAmount}
                                        onChange={(e) => {
                                            setNewInvoiceAmount(e.target.value)
                                            if (formErrors.amount) {
                                                setFormErrors(prev => ({ ...prev, amount: undefined }))
                                            }
                                        }}
                                        aria-invalid={!!formErrors.amount}
                                        className={cn(
                                            "pr-10",
                                            formErrors.amount ? "border-destructive focus-visible:ring-destructive" : ""
                                        )}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        kr
                                    </span>
                                </div>
                                {formErrors.amount && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {formErrors.amount}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Förfallodatum</label>
                                <Input 
                                    type="date" 
                                    value={newInvoiceDueDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setNewInvoiceDueDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Förfallodatum</label>
                                <Input 
                                    type="date" 
                                    value={newInvoiceDueDate}
                                    onChange={(e) => setNewInvoiceDueDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">* Obligatoriska fält</p>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isCreating}>Avbryt</Button>
                        </DialogClose>
                        <Button 
                            onClick={handleCreateInvoice}
                            disabled={isCreating}
                        >
                            {isCreating ? "Skapar..." : "Skapa faktura"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Fakturadetaljer</DialogTitle>
                    </DialogHeader>
                    {selectedInvoice && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Fakturanummer</p>
                                    <p className="font-medium">{selectedInvoice.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Kund</p>
                                    <p className="font-medium">{selectedInvoice.customer}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Fakturadatum</p>
                                    <p className="font-medium">{selectedInvoice.issueDate}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Förfallodatum</p>
                                    <p className="font-medium">{selectedInvoice.dueDate}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Belopp</p>
                                    <p className="font-medium">{selectedInvoice.amount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <AppStatusBadge status={selectedInvoice.status} />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Stäng</Button>
                        </DialogClose>
                        <Button>
                            <Send className="h-4 w-4 mr-2" />
                            Skicka
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Table */}
            <DataTable 
                title="Utgående Fakturor"
                headerActions={
                    <div className="flex items-center gap-2">
                        {reminderSent && (
                            <span className="text-sm text-green-600 dark:text-green-500/70 flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                Påminnelse skickad!
                            </span>
                        )}
                        <InputGroup className="w-56">
                            <InputGroupAddon>
                                <InputGroupText>
                                    <Search />
                                </InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput 
                                placeholder="Sök fakturor..." 
                                value={tableData.searchQuery}
                                onChange={(e) => tableData.setSearchQuery(e.target.value)}
                            />
                        </InputGroup>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("h-9 gap-1", tableData.statusFilter.length > 0 && "border-primary text-primary")}>
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    Filter
                                    {tableData.statusFilter.length > 0 && <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs">{tableData.statusFilter.length}</span>}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Filtrera på status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.values(INVOICE_STATUSES).map((status) => (
                                    <DropdownMenuCheckboxItem
                                        key={status}
                                        checked={tableData.statusFilter.includes(status)}
                                        onCheckedChange={() => tableData.toggleStatusFilter(status)}
                                    >
                                        {status}
                                    </DropdownMenuCheckboxItem>
                                ))}
                                {tableData.statusFilter.length > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => tableData.clearFilters()}>
                                            <X className="h-3.5 w-3.5 mr-2" />
                                            Rensa filter
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Sortera efter</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => tableData.toggleSort("issueDate")}>
                                    Datum {tableData.getSortIndicator("issueDate") === "asc" ? "↑" : tableData.getSortIndicator("issueDate") === "desc" ? "↓" : ""}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => tableData.toggleSort("amount")}>
                                    Belopp {tableData.getSortIndicator("amount") === "asc" ? "↑" : tableData.getSortIndicator("amount") === "desc" ? "↓" : ""}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => tableData.toggleSort("customer")}>
                                    Kund {tableData.getSortIndicator("customer") === "asc" ? "↑" : tableData.getSortIndicator("customer") === "desc" ? "↓" : ""}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm" className="h-8 gap-1" onClick={() => setNewInvoiceDialogOpen(true)}>
                            <Plus className="h-3.5 w-3.5" />
                            Ny Faktura
                        </Button>
                    </div>
                }
            >
                <DataTableHeader>
                    <DataTableHeaderCell width="40px">
                        <Checkbox 
                            checked={bulkSelection.allSelected}
                            onCheckedChange={bulkSelection.toggleAll}
                            aria-label="Välj alla"
                        />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell label="Faktura Nr" icon={Hash} />
                    <DataTableHeaderCell label="Kund" icon={User} />
                    <DataTableHeaderCell label="Fakturadatum" icon={Calendar} />
                    <DataTableHeaderCell label="Förfallodatum" icon={Clock} />
                    <DataTableHeaderCell label="Belopp" icon={Banknote} />
                    <DataTableHeaderCell label="Status" icon={CheckCircle2} />
                    <DataTableHeaderCell label="" align="right" />
                </DataTableHeader>
                <DataTableBody>
                    {filteredInvoices.map((invoice) => (
                        <DataTableRow 
                            key={invoice.id}
                            selected={bulkSelection.isSelected(invoice.id)}
                            className="group"
                        >
                            <DataTableCell>
                                <Checkbox 
                                    checked={bulkSelection.isSelected(invoice.id)}
                                    onCheckedChange={() => bulkSelection.toggleItem(invoice.id)}
                                    aria-label={`Välj faktura ${invoice.id}`}
                                />
                            </DataTableCell>
                            <DataTableCell bold>{invoice.id}</DataTableCell>
                            <DataTableCell bold>{invoice.customer}</DataTableCell>
                            <DataTableCell muted>{invoice.issueDate}</DataTableCell>
                            <DataTableCell muted>{invoice.dueDate}</DataTableCell>
                            <DataTableCell align="right">
                                <AmountText value={parseAmount(invoice.amount)} />
                            </DataTableCell>
                            <DataTableCell>
                                <AppStatusBadge 
                                    status={invoice.status} 
                                    size="sm"
                                />
                            </DataTableCell>
                            <DataTableCell align="right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="sr-only">Öppna meny</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                                            Visa detaljer
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                                            Redigera
                                        </DropdownMenuItem>
                                        {(invoice.status === INVOICE_STATUSES.SENT || invoice.status === INVOICE_STATUSES.OVERDUE) && (
                                            <DropdownMenuItem onClick={() => handleSendReminder(invoice.id)}>
                                                <Mail className="h-3.5 w-3.5 mr-2" />
                                                Skicka påminnelse
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(invoice.id)}>
                                            Radera
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                    {filteredInvoices.length === 0 && (
                        <DataTableRow>
                            <DataTableCell className="text-center py-8" colSpan={8}>
                                {tableData.searchQuery || tableData.statusFilter.length > 0 
                                    ? "Inga fakturor matchar din sökning" 
                                    : "Inga fakturor ännu"}
                            </DataTableCell>
                        </DataTableRow>
                    )}
                </DataTableBody>
            </DataTable>
            <DataTableAddRow 
                label="Ny Faktura" 
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
