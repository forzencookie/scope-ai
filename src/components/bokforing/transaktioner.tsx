"use client"

import { useState, useCallback, useMemo, memo } from "react"
import {
    Plus,
    Building2,
    Calendar,
    Banknote,
    CheckCircle2,
    CreditCard,
    ArrowRightLeft,
    SlidersHorizontal,
    X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { TRANSACTION_STATUSES, type TransactionWithAI } from "@/types"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { BulkActionToolbar, useBulkSelection, type BulkAction } from "@/components/shared/bulk-action-toolbar"
import { useTableFilter, useTableSort, commonSortHandlers } from "@/hooks/use-table"
import { useTextMode } from "@/providers/text-mode-provider"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { NewTransactionDialog } from "../dialogs/ny-transaktion"
import { BookingDialog, type BookingData } from "../dialogs/bokforing"
import { Checkbox } from "@/components/ui/checkbox"
import { BookOpen } from "lucide-react"

// New components
import { TransactionsTableProps } from "./transaktioner/types"
import { StatusHero } from "./transaktioner/components/StatusHero"
import { StatsOverview } from "./transaktioner/components/StatsOverview"

// Memoized to prevent unnecessary re-renders when parent state changes
export const TransactionsTable = memo(function TransactionsTable({
    title,
    subtitle,
    transactions = [],
    stats: externalStats,
    onTransactionBooked,
}: TransactionsTableProps) {
    const { text } = useTextMode()
    const [newTransactionDialogOpen, setNewTransactionDialogOpen] = useState(false)
    const [selectedTransactions, setSelectedTransactions] = useState<TransactionWithAI[]>([])
    const [bookingDialogOpen, setBookingDialogOpen] = useState(false)

    const filter = useTableFilter<TransactionWithAI>({
        searchFields: ["name", "account", "amount"],
        initialStatusFilter: []
    })

    const sort = useTableSort<TransactionWithAI>({
        initialSortBy: "date",
        initialSortOrder: "desc",
        sortHandlers: {
            date: commonSortHandlers.date,
            amount: commonSortHandlers.amount,
            name: (a, b) => a.name.localeCompare(b.name)
        }
    })

    const filteredTransactions = useMemo(() => {
        const filtered = filter.filterItems(transactions)
        return sort.sortItems(filtered)
    }, [transactions, filter, sort])

    // Use shared bulk selection hook
    const selection = useBulkSelection(filteredTransactions)

    const handleTransactionClick = useCallback((transaction: TransactionWithAI) => {
        selection.toggleItem(transaction.id)
    }, [selection])

    const handleBook = useCallback(async (bookingData: BookingData) => {
        await new Promise(resolve => setTimeout(resolve, 500))
        if (onTransactionBooked) {
            onTransactionBooked(bookingData.entityId, bookingData)
        }
        setBookingDialogOpen(false)
        setSelectedTransactions([])
        selection.clearSelection()
    }, [onTransactionBooked, selection])

    // Use external stats if provided, otherwise calculate locally (fallback)
    const stats = useMemo(() => {
        if (externalStats) return externalStats

        const parseAmount = (amount: string | number) => {
            if (typeof amount === 'number') return amount
            const cleaned = amount.replace(/[^\d,.-]/g, '').replace(',', '.')
            return parseFloat(cleaned) || 0
        }

        const income = transactions
            .filter(t => parseAmount(t.amount) > 0)
            .reduce((sum, t) => sum + parseAmount(t.amount), 0)

        const expenses = transactions
            .filter(t => parseAmount(t.amount) < 0)
            .reduce((sum, t) => sum + Math.abs(parseAmount(t.amount)), 0)

        // Count both "Att bokföra" and "Saknar underlag" as pending review
        const pending = transactions.filter(t =>
            t.status === TRANSACTION_STATUSES.TO_RECORD ||
            t.status === TRANSACTION_STATUSES.MISSING_DOCUMENTATION
        ).length

        return { income, expenses, pending, totalCount: transactions.length }
    }, [transactions, externalStats])

    // Handle booking button click from bulk action
    const handleBulkBooking = useCallback((ids: string[]) => {
        const selected = transactions.filter(t => ids.includes(t.id))
        if (selected.length > 0) {
            setSelectedTransactions(selected)
            setBookingDialogOpen(true)
        }
    }, [transactions])

    // Bulk actions for the toolbar
    const bulkActions: BulkAction[] = useMemo(() => [
        {
            id: "book",
            label: "Bokför",
            icon: BookOpen,
            onClick: handleBulkBooking,
        },
    ], [handleBulkBooking])

    return (
        <div className="w-full space-y-6">
            {/* Page Heading */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{text.transactions.title}</h2>
                        <p className="text-muted-foreground">{text.transactions.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button className="gap-2 w-full sm:w-auto" onClick={() => setNewTransactionDialogOpen(true)}>
                            <Plus className="h-4 w-4" />
                            {text.transactions.newTransaction}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Status Hero */}
            <StatusHero
                pendingCount={stats.pending}
                onViewPending={() => filter.setStatusFilter([TRANSACTION_STATUSES.TO_RECORD, TRANSACTION_STATUSES.MISSING_DOCUMENTATION])}
            />

            {/* Stats Overview */}
            <StatsOverview
                totalCount={stats.totalCount}
                income={stats.income}
                expenses={stats.expenses}
            />

            <NewTransactionDialog
                open={newTransactionDialogOpen}
                onOpenChange={setNewTransactionDialogOpen}
            />

            {/* Table with Add Row */}
            <div>
                <div className="border-b-2 border-border/60" />
                {/* Sub-header with title and actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">{title || text.transactions.allTransactions}</h3>
                    <div className="flex items-center gap-2">
                        <SearchBar
                            placeholder={text.transactions.search}
                            value={filter.searchQuery}
                            onChange={filter.setSearchQuery}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn("h-9 gap-1", filter.statusFilter.length > 0 && "border-primary text-primary")}
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    {text.actions.filter}
                                    {filter.statusFilter.length > 0 && (
                                        <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs">
                                            {filter.statusFilter.length}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>{text.labels.filterByStatus}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.values(TRANSACTION_STATUSES).map((status) => (
                                    <DropdownMenuCheckboxItem
                                        key={status}
                                        checked={filter.statusFilter.includes(status)}
                                        onCheckedChange={() => filter.toggleStatusFilter(status)}
                                    >
                                        {status}
                                    </DropdownMenuCheckboxItem>
                                ))}
                                {filter.statusFilter.length > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => filter.setStatusFilter([])}>
                                            <X className="h-3.5 w-3.5 mr-2" />
                                            {text.actions.clearFilter}
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                </div>


                <div className="w-full overflow-x-auto pb-2">
                    <div className="min-w-[800px] px-2">
                        {/* GridTable Header */}
                        <GridTableHeader
                            columns={[
                                { label: text.labels.supplier, icon: Building2, span: 3 },
                                { label: text.labels.date, icon: Calendar, span: 2 },
                                { label: text.labels.amount, icon: Banknote, span: 2 },
                                { label: text.labels.status, icon: CheckCircle2, span: 2 },
                                { label: text.labels.account, icon: CreditCard, span: 2 },
                            ]}
                            trailing={
                                <Checkbox
                                    checked={selection.allSelected && filteredTransactions.length > 0}
                                    onCheckedChange={selection.toggleAll}
                                />
                            }
                        />

                        {/* GridTable Rows */}
                        <GridTableRows>
                            {filteredTransactions.map((transaction) => (
                                <GridTableRow
                                    key={transaction.id}
                                    onClick={() => handleTransactionClick(transaction)}
                                    selected={selection.isSelected(transaction.id)}
                                >
                                    <div style={{ gridColumn: 'span 3' }} className="font-medium truncate">
                                        {transaction.name}
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground truncate">
                                        {transaction.date}
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <span className={cn(
                                            "font-medium tabular-nums",
                                            String(transaction.amount).startsWith("+") && "text-green-600 dark:text-green-400"
                                        )}>
                                            {transaction.amount}
                                        </span>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <AppStatusBadge status={transaction.status} size="sm" />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground truncate">
                                        {transaction.account}
                                    </div>
                                    <div
                                        className={cn(
                                            "flex justify-end items-center transition-opacity",
                                            selection.isSelected(transaction.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                        )}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Checkbox
                                            checked={selection.isSelected(transaction.id)}
                                            onCheckedChange={() => selection.toggleItem(transaction.id)}
                                        />
                                    </div>
                                </GridTableRow>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>{filter.hasActiveFilters ? text.transactions.empty : text.transactions.empty}</p>
                                    {!filter.hasActiveFilters && (
                                        <Button
                                            variant="outline"
                                            className="mt-4"
                                            onClick={() => setNewTransactionDialogOpen(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            {text.transactions.newTransaction}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </GridTableRows>

                        {/* Only show add row button when table is empty - avoids redundancy with header button */}
                        {filteredTransactions.length === 0 && !filter.hasActiveFilters && (
                            <Button variant="ghost" className="w-full border-2 border-dashed border-border/50 text-muted-foreground h-12" onClick={() => setNewTransactionDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                {text.transactions.newTransaction}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bulk Action Toolbar - appears when items are selected */}
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

TransactionsTable.displayName = 'TransactionsTable'
