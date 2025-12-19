"use client"

import * as React from "react"
import { useState, useMemo, useEffect, useCallback } from "react"
import {
    Plus,
    MoreHorizontal,
    Send,
    Mail,
    CheckCircle2,
    Building2,
    Calendar,
    Clock,
    AlertTriangle,
    FileText,
    TrendingUp,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { type Invoice } from "@/data/invoices"
import { useTextMode } from "@/providers/text-mode-provider"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InvoiceCreateDialog } from "./invoice-create-dialog"

// Kanban column configuration
interface KanbanColumn {
    id: string
    title: string
    status: string
    color: string
    bgColor: string
    borderColor: string
}

const KANBAN_COLUMNS: KanbanColumn[] = [
    {
        id: 'draft',
        title: 'Utkast',
        status: INVOICE_STATUS_LABELS.DRAFT,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
    },
    {
        id: 'sent',
        title: 'Skickade',
        status: INVOICE_STATUS_LABELS.SENT,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
        id: 'overdue',
        title: 'Förfallna',
        status: INVOICE_STATUS_LABELS.OVERDUE,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
        id: 'paid',
        title: 'Betalda',
        status: INVOICE_STATUS_LABELS.PAID,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
    },
]

// Invoice Card Component
function InvoiceCard({
    invoice,
    onSend,
    onMarkPaid,
    onSendReminder,
    onViewDetails,
}: {
    invoice: Invoice
    onSend: (id: string) => void
    onMarkPaid: (id: string) => void
    onSendReminder: (id: string) => void
    onViewDetails: (invoice: Invoice) => void
}) {
    const isOverdue = invoice.status === INVOICE_STATUS_LABELS.OVERDUE ||
        (invoice.status === INVOICE_STATUS_LABELS.SENT && new Date(invoice.dueDate) < new Date())

    return (
        <div className="bg-background rounded-lg border-2 border-border/60 p-4 hover:shadow-md transition-all cursor-pointer group">
            {/* Client Label */}
            <div className="text-xs text-muted-foreground mb-2">
                Kund: {invoice.customer}
            </div>

            {/* Invoice Title */}
            <h4 className="font-medium text-sm mb-3 line-clamp-2">
                Faktura {invoice.id}
            </h4>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    isOverdue
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                )}>
                    {formatCurrency(invoice.amount)}
                </span>
                {invoice.vatAmount && invoice.vatAmount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        +moms
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                <div className="flex items-center gap-3">
                    {/* Due date */}
                    <div className={cn(
                        "flex items-center gap-1",
                        isOverdue && "text-red-600 dark:text-red-400"
                    )}>
                        <Calendar className="h-3 w-3" />
                        <span>{invoice.dueDate}</span>
                    </div>
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewDetails(invoice)}>
                            Visa detaljer
                        </DropdownMenuItem>
                        {invoice.status === INVOICE_STATUS_LABELS.DRAFT && (
                            <DropdownMenuItem onClick={() => onSend(invoice.id)}>
                                <Send className="h-3.5 w-3.5 mr-2" />
                                Skicka faktura
                            </DropdownMenuItem>
                        )}
                        {(invoice.status === INVOICE_STATUS_LABELS.SENT || invoice.status === INVOICE_STATUS_LABELS.OVERDUE) && (
                            <>
                                <DropdownMenuItem onClick={() => onMarkPaid(invoice.id)}>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                    Markera betald
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onSendReminder(invoice.id)}>
                                    <Mail className="h-3.5 w-3.5 mr-2" />
                                    Skicka påminnelse
                                </DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                            Radera
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

// Kanban Column Component
function KanbanColumnComponent({
    column,
    invoices,
    onAddNew,
    onSend,
    onMarkPaid,
    onSendReminder,
    onViewDetails,
}: {
    column: KanbanColumn
    invoices: Invoice[]
    onAddNew?: () => void
    onSend: (id: string) => void
    onMarkPaid: (id: string) => void
    onSendReminder: (id: string) => void
    onViewDetails: (invoice: Invoice) => void
}) {
    return (
        <div className="flex flex-col flex-1 bg-muted/50 rounded-lg min-w-0">
            {/* Column Header */}
            {/* Column Header */}
            <div className={cn(
                "flex items-center justify-between px-3 py-2 rounded-t-lg",
                // column.bgColor removed
                // Border removed
            )}>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                        {column.title}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-background/80 border shadow-sm text-muted-foreground">
                        {invoices.length}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {onAddNew && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={onAddNew}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Column Content - auto height up to 60vh max, then scrolls */}
            <div className={cn(
                "p-2 space-y-2 rounded-b-lg max-h-[60vh] overflow-y-auto",
            )}>
                {invoices.map((invoice) => (
                    <InvoiceCard
                        key={invoice.id}
                        invoice={invoice}
                        onSend={onSend}
                        onMarkPaid={onMarkPaid}
                        onSendReminder={onSendReminder}
                        onViewDetails={onViewDetails}
                    />
                ))}

                {/* Add New Button at bottom of first column */}
                {onAddNew && invoices.length === 0 && (
                    <button
                        onClick={onAddNew}
                        className="w-full p-4 border-2 border-dashed border-border/60 rounded-lg text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Lägg till ny
                    </button>
                )}
            </div>

            {/* Add New Row */}
            {onAddNew && invoices.length > 0 && (
                <button
                    onClick={onAddNew}
                    className="mt-2 w-full p-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Lägg till ny
                </button>
            )}
        </div>
    )
}

export function InvoicesKanban() {
    const { text } = useTextMode()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newInvoiceDialogOpen, setNewInvoiceDialogOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const toast = useToast()

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
                // Demo data for visualization
                setInvoices([
                    { id: 'FAK-2024-001', customer: 'Acme AB', email: 'info@acme.se', issueDate: '2024-01-15', dueDate: '2024-02-14', amount: 15000, vatAmount: 3750, status: INVOICE_STATUS_LABELS.DRAFT },
                    { id: 'FAK-2024-002', customer: 'Tech Solutions', email: 'billing@tech.se', issueDate: '2024-01-10', dueDate: '2024-02-09', amount: 8500, vatAmount: 2125, status: INVOICE_STATUS_LABELS.SENT },
                    { id: 'FAK-2024-003', customer: 'Nordic Consulting', email: 'pay@nordic.se', issueDate: '2024-01-05', dueDate: '2024-01-20', amount: 22000, vatAmount: 5500, status: INVOICE_STATUS_LABELS.OVERDUE },
                    { id: 'FAK-2024-004', customer: 'StartupX', email: 'finance@startupx.se', issueDate: '2024-01-01', dueDate: '2024-01-31', amount: 45000, vatAmount: 11250, status: INVOICE_STATUS_LABELS.PAID },
                    { id: 'FAK-2024-005', customer: 'Design Studio', email: 'hello@design.se', issueDate: '2024-01-12', dueDate: '2024-02-11', amount: 12000, vatAmount: 3000, status: INVOICE_STATUS_LABELS.DRAFT },
                    { id: 'FAK-2024-006', customer: 'Cloud Services AB', email: 'billing@cloud.se', issueDate: '2024-01-08', dueDate: '2024-02-07', amount: 35000, vatAmount: 8750, status: INVOICE_STATUS_LABELS.SENT },
                ])
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

    // Group invoices by status
    const invoicesByStatus = useMemo(() => {
        const grouped: Record<string, Invoice[]> = {}
        KANBAN_COLUMNS.forEach(col => {
            grouped[col.status] = invoices.filter(inv => inv.status === col.status)
        })
        return grouped
    }, [invoices])

    // Stats
    const stats = useMemo(() => {
        const outstanding = invoices.filter(inv =>
            inv.status !== INVOICE_STATUS_LABELS.PAID && inv.status !== INVOICE_STATUS_LABELS.CANCELLED
        )
        const overdue = invoices.filter(inv => inv.status === INVOICE_STATUS_LABELS.OVERDUE)
        const paid = invoices.filter(inv => inv.status === INVOICE_STATUS_LABELS.PAID)

        return {
            total: invoices.length,
            outstandingAmount: outstanding.reduce((sum, inv) => sum + inv.amount, 0),
            outstandingCount: outstanding.length,
            overdueAmount: overdue.reduce((sum, inv) => sum + inv.amount, 0),
            overdueCount: overdue.length,
            paidAmount: paid.reduce((sum, inv) => sum + inv.amount, 0),
        }
    }, [invoices])

    // Actions
    const handleSendInvoice = async (id: string) => {
        try {
            toast.info("Skickar faktura...", "Bokför och uppdaterar status")
            await fetch(`/api/invoices/${id}/book`, { method: 'POST' })
            setInvoices(prev => prev.map(inv =>
                inv.id === id ? { ...inv, status: INVOICE_STATUS_LABELS.SENT } : inv
            ))
            toast.success("Faktura skickad!", "Fakturan har bokförts och skickats")
        } catch {
            toast.error("Kunde inte skicka faktura", "Ett fel uppstod")
        }
    }

    const handleMarkAsPaid = async (id: string) => {
        try {
            toast.info("Registrerar betalning...", "Uppdaterar status")
            await fetch(`/api/invoices/${id}/pay`, { method: 'POST' })
            setInvoices(prev => prev.map(inv =>
                inv.id === id ? { ...inv, status: INVOICE_STATUS_LABELS.PAID } : inv
            ))
            toast.success("Betalning registrerad!", "Fakturan har markerats som betald")
        } catch {
            toast.error("Kunde inte registrera betalning", "Ett fel uppstod")
        }
    }

    const handleSendReminder = (id: string) => {
        const invoice = invoices.find(inv => inv.id === id)
        toast.success("Påminnelse skickad", `Betalningspåminnelse har skickats till ${invoice?.customer}`)
    }

    const handleViewDetails = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        toast.info("Visa detaljer", `Öppnar faktura ${invoice.id}`)
    }

    const handleInvoiceCreated = (newInvoice: Invoice) => {
        setInvoices(prev => [newInvoice, ...prev])
    }

    return (
        <div className="w-full space-y-6">
            {/* Page Heading */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight">{text.invoices.title}</h2>
                <p className="text-muted-foreground">Skapa och hantera fakturor till dina kunder.</p>
            </div>

            {/* Stats Cards */}
            <StatCardGrid columns={4}>
                <StatCard
                    label={text.stats.totalInvoices}
                    value={stats.total}
                    subtitle={text.invoices.allInvoices}
                    icon={FileText}
                />
                <StatCard
                    label={text.stats.outstanding}
                    value={formatCurrency(stats.outstandingAmount)}
                    subtitle={`${stats.outstandingCount} ${text.invoices.invoices}`}
                    icon={Clock}
                />
                <StatCard
                    label={text.stats.overdue}
                    value={formatCurrency(stats.overdueAmount)}
                    subtitle={`${stats.overdueCount} ${text.invoices.invoices}`}
                    icon={AlertTriangle}
                    changeType="negative"
                />
                <StatCard
                    label={text.stats.paid}
                    value={formatCurrency(stats.paidAmount)}
                    icon={TrendingUp}
                    changeType="positive"
                />
            </StatCardGrid>

            {/* Section Separator */}
            <div className="border-b-2 border-border/60" />

            {/* Kanban Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{text.invoices.outgoingInvoices}</h2>
                <Button size="sm" onClick={() => setNewInvoiceDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    {text.invoices.create}
                </Button>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {KANBAN_COLUMNS.map((column, index) => (
                    <KanbanColumnComponent
                        key={column.id}
                        column={column}
                        invoices={invoicesByStatus[column.status] || []}
                        onAddNew={index === 0 ? () => setNewInvoiceDialogOpen(true) : undefined}
                        onSend={handleSendInvoice}
                        onMarkPaid={handleMarkAsPaid}
                        onSendReminder={handleSendReminder}
                        onViewDetails={handleViewDetails}
                    />
                ))}
            </div>

            {/* New Invoice Dialog */}
            <InvoiceCreateDialog
                open={newInvoiceDialogOpen}
                onOpenChange={setNewInvoiceDialogOpen}
                onInvoiceCreated={handleInvoiceCreated}
                existingInvoiceCount={invoices.length}
            />
        </div>
    )
}
