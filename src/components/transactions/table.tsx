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
    Bot,
    TrendingUp,
    TrendingDown,
    Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
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
import { 
    DataTable, 
    DataTableHeader, 
    DataTableHeaderCell,
    DataTableBody,
    DataTableAddRow 
} from "@/components/ui/data-table"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
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
        
        const pending = transactions.filter(t => t.status === 'Väntar på granskning').length
        
        return { income, expenses, pending, total: transactions.length }
    }, [transactions])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('sv-SE', {
            style: 'currency',
            currency: 'SEK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const handleApproveAll = useCallback(() => {
        filteredTransactions.forEach(t => {
            const suggestion = aiSuggestions[t.id]
            if (suggestion && suggestion.confidence >= MIN_CONFIDENCE_AUTO_APPROVE && !approvedSuggestions.has(t.id)) {
                handleApprove(t.id)
            }
        })
    }, [filteredTransactions, approvedSuggestions, handleApprove, aiSuggestions])

    return (
        <div className="w-full space-y-6">
            <StatCardGrid columns={4}>
                <StatCard
                    label="Totalt transaktioner"
                    value={stats.total}
                    subtitle="Denna period"
                    icon={ArrowRightLeft}
                />
                <StatCard
                    label="Inkomster"
                    value={formatCurrency(stats.income)}
                    icon={TrendingUp}
                    changeType="positive"
                />
                <StatCard
                    label="Utgifter"
                    value={formatCurrency(stats.expenses)}
                    icon={TrendingDown}
                    changeType="negative"
                />
                <StatCard
                    label="Väntar på granskning"
                    value={stats.pending}
                    subtitle={pendingSuggestions > 0 ? `${pendingSuggestions} AI-förslag` : undefined}
                    icon={Clock}
                />
            </StatCardGrid>

            {/* Section Separator */}
            <div className="border-b-2 border-border/60" />

            <NewTransactionDialog 
                open={newTransactionDialogOpen} 
                onOpenChange={setNewTransactionDialogOpen} 
            />
            <TransactionDetailsDialog 
                open={detailsDialogOpen} 
                onOpenChange={setDetailsDialogOpen}
                transaction={selectedTransaction}
            />

            <AISuggestionsBanner 
                pendingSuggestions={pendingSuggestions}
                onApproveAll={handleApproveAll}
            />

            <DataTable
                title={title}
                headerActions={
                    <div className="flex items-center gap-2">
                        <SearchBar
                            placeholder="Sök transaktioner..."
                            value={filter.searchQuery}
                            onChange={filter.setSearchQuery}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <FilterButton
                                    label="Filter"
                                    isActive={filter.statusFilter.length > 0}
                                    activeCount={filter.statusFilter.length}
                                />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Filtrera på status</DropdownMenuLabel>
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
                                            Rensa filter
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Sortera efter</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleSortChange("date")}>
                                    Datum {sort.sortBy === "date" && (sort.sortOrder === "asc" ? "↑" : "↓")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSortChange("amount")}>
                                    Belopp {sort.sortBy === "amount" && (sort.sortOrder === "asc" ? "↑" : "↓")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSortChange("name")}>
                                    Namn {sort.sortBy === "name" && (sort.sortOrder === "asc" ? "↑" : "↓")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm" className="h-8 gap-1" onClick={() => setNewTransactionDialogOpen(true)}>
                            <Plus className="h-3.5 w-3.5" />
                            Ny
                        </Button>
                    </div>
                }
            >
                <DataTableHeader>
                    <DataTableHeaderCell icon={Building2} label="Leverantör" />
                    <DataTableHeaderCell icon={Calendar} label="Datum" />
                    <DataTableHeaderCell 
                        icon={Bot} 
                        label="AI-kategorisering" 
                        className="text-violet-600 dark:text-violet-400/70"
                    />
                    <DataTableHeaderCell icon={Banknote} label="Belopp" />
                    <DataTableHeaderCell icon={CheckCircle2} label="Status" />
                    <DataTableHeaderCell icon={CreditCard} label="Konto" />
                    <DataTableHeaderCell label="" />
                </DataTableHeader>
                <DataTableBody>
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
                </DataTableBody>
            </DataTable>
            <DataTableAddRow 
                label="Ny transaktion" 
                onClick={() => setNewTransactionDialogOpen(true)} 
            />
        </div>
    )
}
