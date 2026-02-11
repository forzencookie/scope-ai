"use client"

import { memo } from "react"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BulkActionToolbar } from "@/components/shared/bulk-action-toolbar"
import { PageHeader } from "@/components/shared"
import { useTextMode } from "@/providers/text-mode-provider"
import { NewTransactionDialog } from "../dialogs/ny-transaktion"
import { BookingDialog } from "../dialogs/bokforing"

// Components
import { TransactionsStatusCard } from "./components/transactions-status-card"
import { TransactionsStats } from "./components/transactions-stats"
import { TransactionFilters } from "./components/transaction-filters"
import { TransactionsTableGrid } from "./components/transactions-table-grid"

// Logic
import { useTransactionsLogic } from "./use-transactions-logic"
import { TransactionsTableProps } from "./types"
import { TRANSACTION_STATUSES } from "@/types"

export const TransactionsTable = memo(function TransactionsTable(props: TransactionsTableProps) {
    const { 
        title, 
        page = 1, 
        pageSize = 20, 
        total = 0, 
        onPageChange 
    } = props

    const { text } = useTextMode()
    
    const {
        // State
        newTransactionDialogOpen, setNewTransactionDialogOpen,
        bookingDialogOpen, setBookingDialogOpen,
        selectedTransactions,
        
        // Hooks
        filter,
        selection,
        
        // Data
        filteredTransactions,
        stats,
        bulkActions,
        
        // Handlers
        handleTransactionClick,
        handleBook
    } = useTransactionsLogic(props)

    return (
        <div className="w-full space-y-4 md:space-y-6">
            {/* Page Heading */}
            <PageHeader
                title={text.transactions?.title || "Transaktioner"}
                subtitle={text.transactions?.subtitle || "Hantera dina bokförda transaktioner"}
                actions={
                    <div className="hidden md:block">
                        <Button className="gap-2" onClick={() => setNewTransactionDialogOpen(true)}>
                            <Plus className="h-4 w-4" />
                            <span>{text.transactions?.newTransaction || "Ny händelse"}</span>
                        </Button>
                    </div>
                }
            />

            {/* Mobile-only action button */}
            <div className="md:hidden w-full">
                <Button className="w-full" size="lg" onClick={() => setNewTransactionDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ny transaktion
                </Button>
            </div>

            {/* Status Hero */}
            <TransactionsStatusCard
                pendingCount={stats.pending}
                onViewPending={() => filter.setStatusFilter([TRANSACTION_STATUSES.TO_RECORD, TRANSACTION_STATUSES.MISSING_DOCUMENTATION])}
            />

            {/* Stats Overview */}
            <TransactionsStats
                totalCount={stats.totalCount}
                income={stats.income}
                expenses={stats.expenses}
            />

            <NewTransactionDialog
                open={newTransactionDialogOpen}
                onOpenChange={setNewTransactionDialogOpen}
            />

            {/* Table Area */}
            <div>
                <div className="border-b-2 border-border/60" />
                
                <TransactionFilters 
                    title={title || (text.transactions?.allTransactions || "Alla transaktioner")}
                    searchQuery={filter.searchQuery}
                    onSearchChange={filter.setSearchQuery}
                    statusFilter={filter.statusFilter}
                    onStatusFilterChange={filter.toggleStatusFilter}
                    onStatusFilterClear={() => filter.setStatusFilter([])}
                />

                <TransactionsTableGrid 
                    transactions={filteredTransactions}
                    selection={selection}
                    onTransactionClick={handleTransactionClick}
                    hasActiveFilters={filter.hasActiveFilters}
                    onAddTransaction={() => setNewTransactionDialogOpen(true)}
                />
            </div>

            {/* Pagination */}
            {onPageChange && total > pageSize && (
                <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        Visar {Math.min((page - 1) * pageSize + 1, total)} till {Math.min(page * pageSize, total)} av {total} transaktioner
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Föregående
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(page + 1)}
                            disabled={page * pageSize >= total}
                        >
                            Nästa
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Bulk Action Toolbar */}
            <BulkActionToolbar
                selectedCount={selection.selectedCount}
                selectedIds={selection.selectedIds}
                onClearSelection={selection.clearSelection}
                actions={bulkActions}
            />

            {/* Booking Dialog */}
            <BookingDialog
                open={bookingDialogOpen}
                onOpenChange={setBookingDialogOpen}
                entity={selectedTransactions[0] ? {
                    id: selectedTransactions[0].id,
                    name: selectedTransactions[0].name,
                    date: selectedTransactions[0].date,
                    amount: selectedTransactions[0].amount,
                    type: 'transaction',
                    status: selectedTransactions[0].status,
                    account: selectedTransactions[0].account,
                    category: selectedTransactions[0].category
                } : null}
                onBook={handleBook}
            />
        </div>
    )
})
