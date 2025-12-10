"use client"

import { useState, useCallback, useMemo } from "react"
import {
    ArrowRightLeft,
    Search,
    SlidersHorizontal,
    ArrowUpDown,
    Settings,
    X,
    Plus,
    Banknote,
    Building2,
    Calendar,
    CheckCircle2,
    CreditCard,
    Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { TRANSACTION_STATUSES, type TransactionStatus, type Transaction, type AISuggestion } from "@/types"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { HeaderCell } from "@/components/table/table-shell"
import { DataTableRaw, DataTableAddRow } from "@/components/ui/data-table"
import { useTableFilter, useTableSort, commonSortHandlers } from "@/hooks/use-table"

import {
    MIN_CONFIDENCE_AUTO_APPROVE,
    TransactionRow,
    NewTransactionDialog,
    TransactionDetailsDialog,
    AISuggestionsBanner,
    TransactionsEmptyState,
} from "./components"

// =============================================================================
// TransactionsToolbar
// =============================================================================

interface TransactionsToolbarProps {
    title: string
    subtitle?: string
    transactionCount: number
    searchQuery: string
    onSearchChange: (value: string) => void
    statusFilter: TransactionStatus[]
    onStatusFilterChange: (status: TransactionStatus) => void
    onClearStatusFilter: () => void
    sortBy: "date" | "amount" | "name"
    sortOrder: "asc" | "desc"
    onSortChange: (sortBy: "date" | "amount" | "name") => void
    onNewTransaction: () => void
}

export function TransactionsToolbar({
    title,
    transactionCount,
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    onClearStatusFilter,
    sortBy,
    sortOrder,
    onSortChange,
    onNewTransaction,
}: TransactionsToolbarProps) {
    return (
        <div className="flex items-center justify-between pb-2">
            <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                        <ArrowRightLeft className="h-4 w-4 text-primary" />
                    </div>
                    {title}
                </h2>
            </div>
            <div className="flex items-center gap-2">
                <InputGroup className="w-64">
                    <InputGroupAddon>
                        <InputGroupText>
                            <Search />
                        </InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput 
                        placeholder="Sök transaktioner..." 
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </InputGroup>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn("h-9 w-9", statusFilter.length > 0 && "text-blue-600")}>
                            <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filtrera på status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.values(TRANSACTION_STATUSES).map((status) => (
                            <DropdownMenuCheckboxItem
                                key={status}
                                checked={statusFilter.includes(status)}
                                onCheckedChange={() => onStatusFilterChange(status)}
                            >
                                {status}
                            </DropdownMenuCheckboxItem>
                        ))}
                        {statusFilter.length > 0 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onClearStatusFilter}>
                                    <X className="h-3.5 w-3.5 mr-2" />
                                    Rensa filter
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <ArrowUpDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Sortera efter</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onSortChange("date")}>
                            Datum {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("amount")}>
                            Belopp {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("name")}>
                            Namn {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Settings className="h-4 w-4" />
                </Button>
                <Button size="sm" className="h-9 gap-1 bg-blue-600 hover:bg-blue-700" onClick={onNewTransaction}>
                    <Plus className="h-3.5 w-3.5" />
                    Ny
                </Button>
            </div>
        </div>
    )
}

// =============================================================================
// TransactionsTable
// =============================================================================

export type AISuggestionsMap = Record<string, AISuggestion>

interface TransactionsTableProps {
    title?: string
    subtitle?: string
    transactions?: Transaction[]
    aiSuggestions?: AISuggestionsMap
}

export function TransactionsTable({ 
    title = "Alla transaktioner",
    subtitle,
    transactions = [],
    aiSuggestions = {},
}: TransactionsTableProps) {
    const [approvedSuggestions, setApprovedSuggestions] = useState<Set<string>>(new Set())
    const [rejectedSuggestions, setRejectedSuggestions] = useState<Set<string>>(new Set())
    const [newTransactionDialogOpen, setNewTransactionDialogOpen] = useState(false)
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

    const filter = useTableFilter<Transaction>({
        searchFields: ["name", "account", "amount"],
        initialStatusFilter: []
    })

    const sort = useTableSort<Transaction>({
        initialSortBy: "date",
        initialSortOrder: "desc",
        sortHandlers: {
            date: commonSortHandlers.date,
            amount: commonSortHandlers.amount,
            name: (a, b) => a.name.localeCompare(b.name)
        }
    })

    const handleApprove = useCallback((transactionId: string) => {
        setApprovedSuggestions(prev => new Set([...prev, transactionId]))
        setRejectedSuggestions(prev => {
            const next = new Set(prev)
            next.delete(transactionId)
            return next
        })
    }, [])

    const handleReject = useCallback((transactionId: string) => {
        setRejectedSuggestions(prev => new Set([...prev, transactionId]))
        setApprovedSuggestions(prev => {
            const next = new Set(prev)
            next.delete(transactionId)
            return next
        })
    }, [])

    const handleSortChange = useCallback((newSortBy: "date" | "amount" | "name") => {
        sort.toggleSort(newSortBy)
    }, [sort])

    const filteredTransactions = useMemo(() => {
        const filtered = filter.filterItems(transactions)
        return sort.sortItems(filtered)
    }, [transactions, filter, sort])

    const pendingSuggestions = filteredTransactions.filter(
        t => aiSuggestions[t.id] && !approvedSuggestions.has(t.id) && !rejectedSuggestions.has(t.id)
    ).length

    const handleApproveAll = useCallback(() => {
        filteredTransactions.forEach(t => {
            const suggestion = aiSuggestions[t.id]
            if (suggestion && suggestion.confidence >= MIN_CONFIDENCE_AUTO_APPROVE && !approvedSuggestions.has(t.id)) {
                handleApprove(t.id)
            }
        })
    }, [filteredTransactions, approvedSuggestions, handleApprove, aiSuggestions])

    return (
        <div className="w-full space-y-4">
            <NewTransactionDialog 
                open={newTransactionDialogOpen} 
                onOpenChange={setNewTransactionDialogOpen} 
            />
            <TransactionDetailsDialog 
                open={detailsDialogOpen} 
                onOpenChange={setDetailsDialogOpen}
                transaction={selectedTransaction}
            />

            <TransactionsToolbar
                title={title}
                subtitle={subtitle}
                transactionCount={filteredTransactions.length}
                searchQuery={filter.searchQuery}
                onSearchChange={filter.setSearchQuery}
                statusFilter={filter.statusFilter as TransactionStatus[]}
                onStatusFilterChange={filter.toggleStatusFilter}
                onClearStatusFilter={() => filter.setStatusFilter([])}
                sortBy={sort.sortBy as "date" | "amount" | "name"}
                sortOrder={sort.sortOrder}
                onSortChange={handleSortChange}
                onNewTransaction={() => setNewTransactionDialogOpen(true)}
            />

            <AISuggestionsBanner 
                pendingSuggestions={pendingSuggestions}
                onApproveAll={handleApproveAll}
            />

            <DataTableRaw
                footer={
                    <DataTableAddRow 
                        label="Ny transaktion" 
                        onClick={() => setNewTransactionDialogOpen(true)} 
                    />
                }
            >
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr className="border-b border-border/40 text-left text-muted-foreground">
                            <HeaderCell icon={<Building2 className="h-3.5 w-3.5" />} label="Leverantör" />
                            <HeaderCell icon={<Calendar className="h-3.5 w-3.5" />} label="Datum" />
                            <HeaderCell 
                                icon={<Sparkles className="h-3.5 w-3.5 text-violet-500" />} 
                                label="AI-kategorisering" 
                                className="text-violet-600"
                            />
                            <HeaderCell icon={<Banknote className="h-3.5 w-3.5" />} label="Belopp" />
                            <HeaderCell icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" />
                            <HeaderCell icon={<CreditCard className="h-3.5 w-3.5" />} label="Konto" />
                            <HeaderCell label="" />
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {filteredTransactions.map((transaction) => {
                            const suggestion = aiSuggestions[transaction.id]
                            const isRejected = rejectedSuggestions.has(transaction.id)
                            return (
                                <TransactionRow 
                                    key={transaction.id} 
                                    transaction={transaction}
                                    suggestion={!isRejected ? suggestion : undefined}
                                    onApproveSuggestion={() => handleApprove(transaction.id)}
                                    onRejectSuggestion={() => handleReject(transaction.id)}
                                    isApproved={approvedSuggestions.has(transaction.id)}
                                    isRejected={isRejected}
                                />
                            )
                        })}
                        {filteredTransactions.length === 0 && (
                            <TransactionsEmptyState 
                                hasFilters={filter.hasActiveFilters}
                                onAddTransaction={() => setNewTransactionDialogOpen(true)}
                            />
                        )}
                    </tbody>
                </table>
            </DataTableRaw>
        </div>
    )
}
