"use client"

import { useState, useCallback, useMemo } from "react"
import {
    ArrowRightLeft,
    X,
    Plus,
    Banknote,
    Building2,
    Calendar,
    CheckCircle2,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Clock,
    BookOpen,
    SlidersHorizontal,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
import { TRANSACTION_STATUSES, type TransactionStatus, type Transaction, type TransactionWithAI } from "@/types"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Table3Header, Table3Rows, Table3Row } from "@/components/bokforing/report-table"
import { DataTableAddRow } from "@/components/ui/data-table"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { SectionCard } from "@/components/ui/section-card"
import { BulkActionToolbar, useBulkSelection, type BulkAction } from "@/components/shared/bulk-action-toolbar"
import { useTableFilter, useTableSort, commonSortHandlers } from "@/hooks/use-table"
import { useTextMode } from "@/providers/text-mode-provider"
import { AppStatusBadge } from "@/components/ui/status-badge"

import {
    TransactionRow,
    NewTransactionDialog,
    TransactionsEmptyState,
} from "./components"
import { BookingDialog, type BookingData } from "./BookingDialog"
import { Checkbox } from "@/components/ui/checkbox"

// =============================================================================
// TransactionsTable
// =============================================================================

interface TransactionsTableProps {
    title?: string
    subtitle?: string
    transactions?: TransactionWithAI[]
    onTransactionBooked?: (transactionId: string, bookingData: BookingData) => void
}

export function TransactionsTable({
    title,
    subtitle,
    transactions = [],
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

    const handleSortChange = useCallback((newSortBy: "date" | "amount" | "name") => {
        sort.toggleSort(newSortBy)
    }, [sort])

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

    // Calculate stats for the stat cards
    const stats = useMemo(() => {
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

        return { income, expenses, pending, total: transactions.length }
    }, [transactions])

    // Get transactions ready to book (have documentation)
    const transactionsToBook = useMemo(() =>
        transactions.filter(t => t.status === TRANSACTION_STATUSES.TO_RECORD),
        [transactions]
    )

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
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{text.transactions.title}</h2>
                    <p className="text-muted-foreground">{text.transactions.subtitle}</p>
                </div>
                <Button className="gap-2" onClick={() => setNewTransactionDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {text.transactions.newTransaction}
                </Button>
            </div>

            <StatCardGrid columns={4}>
                <StatCard
                    label={text.stats.totalTransactions}
                    value={stats.total}
                    subtitle={text.stats.thisPeriod}
                    headerIcon={ArrowRightLeft}
                />
                <StatCard
                    label={text.stats.income}
                    value={formatCurrency(stats.income)}
                    headerIcon={TrendingUp}
                    changeType="positive"
                />
                <StatCard
                    label={text.stats.expenses}
                    value={formatCurrency(stats.expenses)}
                    headerIcon={TrendingDown}
                    changeType="negative"
                />
                <StatCard
                    label={text.stats.pendingReview}
                    value={stats.pending}
                    headerIcon={Clock}
                />
            </StatCardGrid>

            <NewTransactionDialog
                open={newTransactionDialogOpen}
                onOpenChange={setNewTransactionDialogOpen}
            />

            {/* Table with Add Row */}
            <div>
                <div className="border-b-2 border-border/60" />
                {/* Sub-header with title and actions */}
                <div className="flex items-center justify-between py-3">
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


                {/* Table3 Header */}
                <Table3Header
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

                {/* Table3 Rows */}
                <Table3Rows>
                    {filteredTransactions.map((transaction) => (
                        <Table3Row
                            key={transaction.id}
                            onClick={() => handleTransactionClick(transaction)}
                            selected={selection.isSelected(transaction.id)}
                        >
                            <div style={{ gridColumn: 'span 3' }} className="font-medium truncate">
                                {transaction.name}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground">
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
                            <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground">
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
                        </Table3Row>
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
                </Table3Rows>

                <DataTableAddRow
                    label={text.transactions.newTransaction}
                    onClick={() => setNewTransactionDialogOpen(true)}
                />
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
}
