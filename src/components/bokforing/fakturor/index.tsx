"use client"

import * as React from "react"
import { memo } from "react"
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
import { FilterTabs } from "@/components/ui/filter-tabs"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

// Child Components
import { KanbanBoard, KanbanColumn } from "@/components/shared/kanban"
import { InvoicesEmptyState } from "./components/InvoicesEmptyState"
import { InvoicesStats } from "./components/invoices-stats"
import { InvoiceCard } from "./components/InvoiceCard"
import { useChatNavigation } from "@/hooks/use-chat-navigation"

// Constants & Types
import { UNIFIED_COLUMNS, CUSTOMER_COLUMNS, SUPPLIER_COLUMNS } from "./constants"
import { ViewFilter, UnifiedInvoice } from "./types"

// Logic
import { useInvoicesLogic } from "./use-invoices-logic"
import { useCompany } from "@/providers/company-provider"
import { generateInvoicePDF, type InvoicePDFCompanyInfo } from "@/lib/generators/pdf-generator"

export const UnifiedInvoicesView = memo(function UnifiedInvoicesView() {
    const { navigateToAI } = useChatNavigation()
    const {
        // State
        viewFilter, setViewFilter,
        setPeriodFilter,
        customerDialogOpen, setCustomerDialogOpen,
        isLoading,

        // Pagination
        page, setPage, pageSize,
        totalCustomerCount, totalSupplierCount,

        // Data
        customerInvoices,
        unifiedInvoices,
        stats,

        // Handlers
        handleSendInvoice,
        handleMarkCustomerPaid,
        handleApproveSupplier,
        handleMarkSupplierPaid,
        handleCreateCreditNote,
        handleInvoiceCreated
    } = useInvoicesLogic()

    const { company } = useCompany()

    const handleDownloadPDF = React.useCallback((unified: UnifiedInvoice) => {
        const inv = unified.originalCustomerInvoice
        if (!inv) return

        const companyInfo: InvoicePDFCompanyInfo = {
            name: company?.name || '',
            orgNumber: company?.orgNumber || '',
            address: company?.address,
            zipCode: company?.zipCode,
            city: company?.city,
            vatNumber: company?.vatNumber,
            hasFskatt: company?.hasFskatt,
        }

        generateInvoicePDF({
            invoiceNumber: inv.id,
            invoiceDate: inv.issueDate,
            dueDate: inv.dueDate,
            customerName: inv.customer,
            customerAddress: inv.address,
            customerOrgNumber: inv.orgNumber,
            reference: inv.reference,
            lineItems: (inv.items || []).map(i => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                vatRate: i.vatRate,
            })),
            currency: inv.currency,
            bankgiro: inv.bankgiro,
            plusgiro: inv.plusgiro,
            notes: inv.notes,
        }, companyInfo)
    }, [company])

    // Render Helpers
    const renderCard = (invoice: UnifiedInvoice) => (
        <InvoiceCard
            key={invoice.id}
            invoice={invoice}
            onSend={handleSendInvoice}
            onMarkCustomerPaid={handleMarkCustomerPaid}
            onApproveSupplier={handleApproveSupplier}
            onMarkSupplierPaid={handleMarkSupplierPaid}
            onDownloadPDF={handleDownloadPDF}
            onCreateCreditNote={handleCreateCreditNote}
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
                        onAddNew={column.id === "draft" ? () => navigateToAI({ prompt: "Skapa en ny kundfaktura" }) : undefined}
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
                        onAddNew={column.id === "mottagen" ? () => navigateToAI({ prompt: "Registrera en ny leverantörsfaktura" }) : undefined}
                    >
                        {columnInvoices.map(renderCard)}
                    </KanbanColumn>
                )
            })}
        </KanbanBoard>
    )

    return (
        <div className="w-full space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight truncate">Fakturor</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">Hantera alla fakturor</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="gap-2 shrink-0">
                            <Plus className="h-4 w-4" />
                            <span className="sm:inline">Ny faktura</span>
                            <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigateToAI({ prompt: "Skapa en ny kundfaktura" })}>
                            <ArrowDownLeft className="h-4 w-4 mr-2 text-green-600" />
                            Kundfaktura (inkommande)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigateToAI({ prompt: "Registrera en ny leverantörsfaktura" })}>
                            <ArrowUpRight className="h-4 w-4 mr-2 text-red-600" />
                            Leverantörsfaktura (utgående)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Stats - full width */}
            <InvoicesStats
                incoming={stats.incoming}
                outgoing={stats.outgoing}
                overdueCount={stats.overdueCount}
                isLoading={isLoading}
            />

            {/* Filters */}
            <div className="flex items-center justify-between">
                    <FilterTabs
                        value={viewFilter}
                        onChange={(v) => setViewFilter(v as ViewFilter)}
                        options={[
                            { value: "all", label: "Alla", icon: <FileText className="h-3.5 w-3.5" /> },
                            { value: "kundfakturor", label: "Inkommande", icon: <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" /> },
                            { value: "leverantorsfakturor", label: "Utgående", icon: <ArrowUpRight className="h-3.5 w-3.5 text-red-600" /> },
                        ]}
                    />

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

        </div>
    )
})

// For backward compatibility if someone imports it directly
export const InvoicesTable = UnifiedInvoicesView
