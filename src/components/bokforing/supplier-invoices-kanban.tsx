"use client"

import * as React from "react"
import { useState, useMemo, useEffect, useCallback, forwardRef, useImperativeHandle } from "react"
import {
    Plus,
    FileText,
    Clock,
    AlertTriangle,
    TrendingUp,
    CheckCircle2,
    CreditCard,
    Eye,
    Banknote,
    Calendar,
    ChevronDown,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
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
import { type SupplierInvoice } from "@/data/ownership"
import { SupplierInvoiceDialog } from "./supplier-invoice-dialog"

// Column configuration for supplier invoices
interface KanbanColumnConfig {
    id: string
    title: string
    status: SupplierInvoice['status']
}

const SUPPLIER_KANBAN_COLUMNS: KanbanColumnConfig[] = [
    { id: 'mottagen', title: 'Mottagna', status: 'mottagen' },
    { id: 'attesterad', title: 'Attesterade', status: 'attesterad' },
    { id: 'betald', title: 'Betalda', status: 'betald' },
    { id: 'förfallen', title: 'Förfallna', status: 'förfallen' },
]

// Ref type for parent to call refresh
export interface SupplierInvoicesKanbanRef {
    refresh: () => void
}

// Map status from API to internal status
const apiStatusToInternal: Record<string, SupplierInvoice['status']> = {
    'Mottagen': 'mottagen',
    'Attesterad': 'attesterad',
    'Betald': 'betald',
    'Förfallen': 'förfallen',
    'Tvist': 'tvist',
    'Bokförd': 'bokförd',
}

export const SupplierInvoicesKanban = forwardRef<SupplierInvoicesKanbanRef>(
    function SupplierInvoicesKanban(_, ref) {
        const { text } = useTextMode()
        const [invoices, setInvoices] = useState<SupplierInvoice[]>([])
        const [isLoading, setIsLoading] = useState(true)
        const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null)
        const [dialogOpen, setDialogOpen] = useState(false)
        const [periodFilter, setPeriodFilter] = useState<'week' | 'month' | 'quarter' | 'all'>('all')
        const toast = useToast()

        // Period filter labels
        const periodLabels = {
            week: 'Denna vecka',
            month: 'Denna månad',
            quarter: 'Detta kvartal',
            all: 'Alla'
        }

        // Fetch supplier invoices from API
        const fetchInvoices = useCallback(async () => {
            setIsLoading(true)
            try {
                const response = await fetch('/api/supplier-invoices/processed', { cache: 'no-store' })
                const data = await response.json()

                if (data.invoices && data.invoices.length > 0) {
                    const mapped: SupplierInvoice[] = data.invoices.map((inv: any) => ({
                        id: inv.id,
                        invoiceNumber: inv.invoiceNumber || inv.invoice_number,
                        supplierName: inv.supplierName || inv.supplier_name,
                        amount: typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount,
                        vatAmount: typeof inv.vatAmount === 'string' ? parseFloat(inv.vatAmount) : (inv.vatAmount || 0),
                        totalAmount: typeof inv.totalAmount === 'string' ? parseFloat(inv.totalAmount) : (inv.totalAmount || inv.amount),
                        dueDate: inv.dueDate || inv.due_date,
                        invoiceDate: inv.invoiceDate || inv.issue_date,
                        status: apiStatusToInternal[inv.status] || 'mottagen',
                        currency: inv.currency || 'SEK',
                        ocrReference: inv.ocrReference || inv.ocr,
                        bankgiro: inv.bankgiro,
                        plusgiro: inv.plusgiro,
                    }))
                    setInvoices(mapped)
                } else {
                    // Demo data
                    setInvoices([
                        { id: 'SI-001', invoiceNumber: 'INV-2024-1001', supplierName: 'Office Supplies AB', amount: 5000, vatAmount: 1250, totalAmount: 6250, dueDate: '2024-02-15', invoiceDate: '2024-01-15', status: 'mottagen', currency: 'SEK' },
                        { id: 'SI-002', invoiceNumber: 'INV-2024-1002', supplierName: 'IT Services Nordic', amount: 15000, vatAmount: 3750, totalAmount: 18750, dueDate: '2024-02-10', invoiceDate: '2024-01-10', status: 'attesterad', currency: 'SEK' },
                        { id: 'SI-003', invoiceNumber: 'INV-2024-1003', supplierName: 'Cloud Hosting AB', amount: 8500, vatAmount: 2125, totalAmount: 10625, dueDate: '2024-01-20', invoiceDate: '2024-01-01', status: 'förfallen', currency: 'SEK' },
                        { id: 'SI-004', invoiceNumber: 'INV-2024-1004', supplierName: 'Marketing Agency', amount: 25000, vatAmount: 6250, totalAmount: 31250, dueDate: '2024-01-31', invoiceDate: '2024-01-05', status: 'betald', currency: 'SEK' },
                        { id: 'SI-005', invoiceNumber: 'INV-2024-1005', supplierName: 'Consulting Firm', amount: 12000, vatAmount: 3000, totalAmount: 15000, dueDate: '2024-02-20', invoiceDate: '2024-01-20', status: 'mottagen', currency: 'SEK' },
                    ])
                }
            } catch {
                console.error("Failed to fetch supplier invoices")
                setInvoices([])
            } finally {
                setIsLoading(false)
            }
        }, [])

        useEffect(() => {
            fetchInvoices()
        }, [fetchInvoices])

        // Expose refresh method to parent
        useImperativeHandle(ref, () => ({
            refresh: fetchInvoices
        }))

        // Filter invoices by period
        const filteredInvoices = useMemo(() => {
            if (periodFilter === 'all') return invoices

            const now = new Date()
            let startDate: Date

            switch (periodFilter) {
                case 'week':
                    startDate = new Date(now)
                    startDate.setDate(now.getDate() - 7)
                    break
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                    break
                case 'quarter':
                    const quarterMonth = Math.floor(now.getMonth() / 3) * 3
                    startDate = new Date(now.getFullYear(), quarterMonth, 1)
                    break
                default:
                    return invoices
            }

            return invoices.filter(inv => {
                const invoiceDate = new Date(inv.invoiceDate)
                return invoiceDate >= startDate
            })
        }, [invoices, periodFilter])

        // Group invoices by status
        const invoicesByStatus = useMemo(() => {
            const grouped: Record<string, SupplierInvoice[]> = {}
            SUPPLIER_KANBAN_COLUMNS.forEach(col => {
                grouped[col.status] = filteredInvoices.filter(inv => inv.status === col.status)
            })
            return grouped
        }, [filteredInvoices])

        // Stats
        const stats = useMemo(() => {
            const pending = invoices.filter(inv => inv.status === 'mottagen' || inv.status === 'attesterad')
            const overdue = invoices.filter(inv => inv.status === 'förfallen')
            const paid = invoices.filter(inv => inv.status === 'betald')

            return {
                total: invoices.length,
                pendingAmount: pending.reduce((sum, inv) => sum + (inv.totalAmount || inv.amount), 0),
                pendingCount: pending.length,
                overdueAmount: overdue.reduce((sum, inv) => sum + (inv.totalAmount || inv.amount), 0),
                overdueCount: overdue.length,
                paidAmount: paid.reduce((sum, inv) => sum + (inv.totalAmount || inv.amount), 0),
            }
        }, [invoices])

        // Actions
        const handleApprove = async (id: string) => {
            try {
                await fetch(`/api/supplier-invoices/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Attesterad' })
                })
                setInvoices(prev => prev.map(inv =>
                    inv.id === id ? { ...inv, status: 'attesterad' as const } : inv
                ))
                toast.success("Faktura attesterad", "Fakturan har godkänts för betalning")
            } catch {
                toast.error("Kunde inte attestera", "Ett fel uppstod")
            }
        }

        const handleMarkPaid = async (id: string) => {
            try {
                await fetch(`/api/supplier-invoices/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Betald' })
                })
                setInvoices(prev => prev.map(inv =>
                    inv.id === id ? { ...inv, status: 'betald' as const } : inv
                ))
                toast.success("Betalning registrerad", "Fakturan har markerats som betald")
            } catch {
                toast.error("Kunde inte registrera betalning", "Ett fel uppstod")
            }
        }

        const handleViewDetails = (invoice: SupplierInvoice) => {
            // For now, just show a toast. A full detail view would need a separate dialog.
            toast.info(`Faktura ${invoice.invoiceNumber}`, `Leverantör: ${invoice.supplierName}, Belopp: ${formatCurrency(invoice.totalAmount)}`)
        }

        return (
            <div className="w-full space-y-6">
                {/* Page Heading */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{text.supplierInvoices.title}</h2>
                        <p className="text-muted-foreground">{text.supplierInvoices.subtitle}</p>
                    </div>
                    <Button className="gap-2" onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                        {text.supplierInvoices.addInvoice}
                    </Button>
                </div>

                {/* Stats Cards */}
                <StatCardGrid columns={4}>
                    <StatCard
                        label={text.stats.totalInvoices}
                        value={stats.total}
                        subtitle="Leverantörsfakturor"
                        icon={FileText}
                    />
                    <StatCard
                        label="Att betala"
                        value={formatCurrency(stats.pendingAmount)}
                        subtitle={`${stats.pendingCount} fakturor`}
                        icon={Clock}
                    />
                    <StatCard
                        label={text.stats.overdue}
                        value={formatCurrency(stats.overdueAmount)}
                        subtitle={`${stats.overdueCount} fakturor`}
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

                {/* Kanban Section */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{text.supplierInvoices.title}</h3>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {periodLabels[periodFilter]}
                                <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Visa period</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setPeriodFilter('week')}>
                                Denna vecka
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPeriodFilter('month')}>
                                Denna månad
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPeriodFilter('quarter')}>
                                Detta kvartal
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setPeriodFilter('all')}>
                                Alla
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Kanban Board */}
                <KanbanBoard>
                    {SUPPLIER_KANBAN_COLUMNS.map((column) => (
                        <KanbanColumn
                            key={column.id}
                            title={column.title}
                            count={(invoicesByStatus[column.status] || []).length}
                            onAddNew={column.id === 'mottagen' ? () => setDialogOpen(true) : undefined}
                        >
                            {(invoicesByStatus[column.status] || []).map((invoice) => (
                                <KanbanCard
                                    key={invoice.id}
                                    title={invoice.invoiceNumber || invoice.id}
                                    subtitle={`Leverantör: ${invoice.supplierName}`}
                                    amount={invoice.totalAmount || invoice.amount}
                                    date={invoice.dueDate}
                                    isOverdue={invoice.status === 'förfallen'}
                                >
                                    <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                                        <Eye className="h-3.5 w-3.5 mr-2" />
                                        Visa detaljer
                                    </DropdownMenuItem>
                                    {invoice.status === 'mottagen' && (
                                        <DropdownMenuItem onClick={() => handleApprove(invoice.id)}>
                                            <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                            Attestera
                                        </DropdownMenuItem>
                                    )}
                                    {invoice.status === 'attesterad' && (
                                        <DropdownMenuItem onClick={() => handleMarkPaid(invoice.id)}>
                                            <Banknote className="h-3.5 w-3.5 mr-2" />
                                            Markera betald
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                        Radera
                                    </DropdownMenuItem>
                                </KanbanCard>
                            ))}
                        </KanbanColumn>
                    ))}
                </KanbanBoard>

                {/* Create New Invoice Dialog */}
                <SupplierInvoiceDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                />
            </div>
        )
    }
)
