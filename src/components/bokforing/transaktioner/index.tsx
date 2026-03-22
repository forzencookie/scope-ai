"use client"

import * as React from "react"
import { memo } from "react"
import { TransactionDetailsOverlay } from "./components/transaction-details-overlay"
import { TransactionWithAI } from "@/types"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BulkActionToolbar } from "@/components/shared/bulk-action-toolbar"
import { PageHeader } from "@/components/shared"
import { text } from "@/lib/translations"
import { useChatNavigation } from "@/hooks/use-chat-navigation"

// Components
import { TransactionFilters } from "./components/transaction-filters"
import { TransactionsTableGrid } from "./components/transactions-table-grid"
import { TransactionsStats } from "./components/transactions-stats"

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

    const {
        // Hooks
        filter,
        selection,

        // Data
        filteredTransactions,
        stats,
        bulkActions,
        isLoading,

        // Handlers
        handleTransactionClick,
    } = useTransactionsLogic(props)

    const { navigateToAI } = useChatNavigation()
    const [selectedTransaction, setSelectedTransaction] = React.useState<TransactionWithAI | null>(null)

    const onRowClick = (transaction: TransactionWithAI) => {
        const isBooked = transaction.status === "Bokförd"
        if (isBooked) {
            setSelectedTransaction(transaction)
        } else {
            handleTransactionClick(transaction)
        }
    }

    return (
        <div className="w-full space-y-4 md:space-y-6">
            {/* Overlay for booked details */}
            <TransactionDetailsOverlay
                isOpen={!!selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
                transaction={selectedTransaction}
            />

            {/* Page Heading */}
            <PageHeader
                title={text.transactions?.title || "Transaktioner"}
                subtitle={text.transactions?.subtitle || "Hantera dina bokförda transaktioner"}
                actions={
                    <Button
                        className="gap-2 shrink-0"
                        onClick={() => navigateToAI({ prompt: "Hjälp mig att bokföra mina senaste transaktioner" })}
                    >
                        <Plus className="h-4 w-4" />
                        Bokför
                    </Button>
                }
            />

            {/* Stats Cards */}
            <TransactionsStats
                totalCount={stats.totalCount}
                income={stats.income}
                expenses={stats.expenses}
                isLoading={isLoading}
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
                    onTransactionClick={onRowClick}
                    hasActiveFilters={filter.hasActiveFilters}
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

        </div>
    )
})
