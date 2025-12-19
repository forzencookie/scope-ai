"use client"

import React, { useState, useMemo } from "react"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import {
    Search,
    Filter,
    ChevronDown,
    ChevronRight,
    Check,
    Hash,
    Banknote,
    TrendingUp,
    TrendingDown,
    BookOpen,
    Activity,
    Clock,
    Loader2,
    CalendarDays,
    FileText,
    Tag,
    Wallet,
    Coins,
    Candy,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AmountText } from "../table/table-shell"
import {
    DataTable,
    DataTableHeader,
    DataTableHeaderCell,
    DataTableBody
} from "@/components/ui/data-table"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"
import {
    basAccounts,
    accountClassLabels,
    accountTypeLabels,
    type Account,
    type AccountClass,
} from "@/data/accounts"
import { useAccountBalances, type DateRangeFilter } from "@/hooks/use-account-balances"

type ViewMode = "activity" | "all"
type AccountClassFilter = "all" | AccountClass

interface AccountWithActivity {
    number: string
    name: string
    type: Account['type']
    class: AccountClass
    group: string
    lastDate: string
    transactionCount: number
    balance: number
    transactions: Array<{
        id: string
        date: string
        description: string
        amount: number
    }>
}

export function Huvudbok() {
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState<ViewMode>("activity")
    const [classFilter, setClassFilter] = useState<AccountClassFilter>("all")
    const [dateRange, setDateRange] = useState<DateRangeFilter>("allTime")
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
    const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
    const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())

    // Use real data from the hook
    const { activeAccounts, totals, isLoading, error } = useAccountBalances({ dateRange })

    // Transform active accounts to our display format
    const accountsWithActivity = useMemo((): AccountWithActivity[] => {
        return activeAccounts
            .filter(a => a.account !== null)
            .map(a => ({
                number: a.accountNumber,
                name: a.account!.name,
                type: a.account!.type,
                class: a.account!.class,
                group: a.account!.group,
                lastDate: a.lastTransactionDate || "",
                transactionCount: a.transactionCount,
                balance: a.balance,
                transactions: a.transactions,
            }))
    }, [activeAccounts])

    // Filter accounts based on search and filters
    const filteredAccounts = useMemo(() => {
        let accounts: AccountWithActivity[]

        if (viewMode === "activity") {
            accounts = accountsWithActivity
        } else {
            // Show all BAS accounts, enriched with activity data
            accounts = basAccounts.map(a => {
                const activity = accountsWithActivity.find(act => act.number === a.number)
                return {
                    number: a.number,
                    name: a.name,
                    type: a.type,
                    class: a.class,
                    group: a.group,
                    lastDate: activity?.lastDate || "",
                    transactionCount: activity?.transactionCount || 0,
                    balance: activity?.balance || 0,
                    transactions: activity?.transactions || [],
                }
            })
        }

        // Filter by account class
        if (classFilter !== "all") {
            accounts = accounts.filter(a => a.class === classFilter)
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            accounts = accounts.filter(a =>
                a.number.includes(query) ||
                a.name.toLowerCase().includes(query) ||
                a.group.toLowerCase().includes(query)
            )
        }

        return accounts
    }, [viewMode, classFilter, searchQuery, accountsWithActivity])

    const toggleAccountExpanded = (accountNumber: string) => {
        setExpandedAccounts(prev => {
            const newSet = new Set(prev)
            if (newSet.has(accountNumber)) {
                newSet.delete(accountNumber)
            } else {
                newSet.add(accountNumber)
            }
            return newSet
        })
    }

    const getDateRangeLabel = () => {
        switch (dateRange) {
            case "thisMonth": return "Denna månad"
            case "thisYear": return "I år"
            case "allTime": return "All tid"
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center h-64 text-destructive">
                <p>Kunde inte ladda kontodata: {typeof error === 'string' ? error : 'Ett fel uppstod'}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Heading */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Huvudbok</h2>
                <p className="text-muted-foreground">Översikt över alla bokföringskonton och saldon.</p>
            </div>

            {/* Stats Cards */}
            <StatCardGrid columns={4}>
                <StatCard
                    label="Aktiva konton"
                    value={accountsWithActivity.length}
                    subtitle="Med aktivitet"
                    icon={BookOpen}
                />
                <StatCard
                    label="Tillgångar"
                    value={formatCurrency(totals.assets)}
                    icon={Wallet}
                    changeType="positive"
                />
                <StatCard
                    label="Skulder"
                    value={formatCurrency(Math.abs(totals.liabilities))}
                    icon={Coins}
                />
                <StatCard
                    label="Resultat"
                    value={formatCurrency(totals.netIncome)}
                    icon={Candy}
                    changeType={totals.netIncome >= 0 ? "positive" : "negative"}
                />
            </StatCardGrid>

            {/* Section Separator */}
            <div className="border-b-2 border-border/60" />

            {/* Main Table */}
            <DataTable
                title="Huvudbok"
                headerActions={
                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Sök konto..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-44 h-9"
                            />
                        </div>

                        {/* Date range dropdown */}
                        <div className="relative">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2"
                                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                            >
                                <CalendarDays className="h-3.5 w-3.5" />
                                {getDateRangeLabel()}
                                <ChevronDown className="h-3.5 w-3.5" />
                            </Button>

                            {dateDropdownOpen && (
                                <div className="absolute top-full right-0 mt-1 w-[160px] bg-background border border-border rounded-md shadow-lg z-10">
                                    <div className="p-1">
                                        {(["thisMonth", "thisYear", "allTime"] as DateRangeFilter[]).map((range) => (
                                            <button
                                                key={range}
                                                onClick={() => { setDateRange(range); setDateDropdownOpen(false) }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors text-left"
                                            >
                                                <div className="w-4 h-4 flex items-center justify-center">
                                                    {dateRange === range && <Check className="h-4 w-4" />}
                                                </div>
                                                <span>
                                                    {range === "thisMonth" && "Denna månad"}
                                                    {range === "thisYear" && "I år"}
                                                    {range === "allTime" && "All tid"}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Combined Filter dropdown (view mode + class filter) */}
                        <div className="relative">
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn("h-9 gap-2", (viewMode === "all" || classFilter !== "all") && "border-primary text-primary")}
                                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                            >
                                <Filter className="h-3.5 w-3.5" />
                                {classFilter !== "all"
                                    ? `${classFilter}xxx`
                                    : viewMode === "activity" ? "Med aktivitet" : "Alla konton"
                                }
                                <ChevronDown className="h-3.5 w-3.5" />
                            </Button>

                            {filterDropdownOpen && (
                                <div className="absolute top-full right-0 mt-1 w-[260px] bg-background border border-border rounded-md shadow-lg z-10">
                                    <div className="p-1">
                                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Visa</div>
                                        <button
                                            onClick={() => { setViewMode("activity"); setClassFilter("all"); setFilterDropdownOpen(false) }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors text-left"
                                        >
                                            <div className="w-4 h-4 flex items-center justify-center">
                                                {viewMode === "activity" && classFilter === "all" && <Check className="h-4 w-4" />}
                                            </div>
                                            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>Konton med aktivitet</span>
                                        </button>
                                        <button
                                            onClick={() => { setViewMode("all"); setClassFilter("all"); setFilterDropdownOpen(false) }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors text-left"
                                        >
                                            <div className="w-4 h-4 flex items-center justify-center">
                                                {viewMode === "all" && classFilter === "all" && <Check className="h-4 w-4" />}
                                            </div>
                                            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>Alla konton</span>
                                        </button>
                                        <Separator className="my-1" />
                                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Kontoklass</div>
                                        {([1, 2, 3, 4, 5, 6, 7, 8] as AccountClass[]).map((classNum) => (
                                            <button
                                                key={classNum}
                                                onClick={() => { setClassFilter(classNum); setFilterDropdownOpen(false) }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors text-left"
                                            >
                                                <div className="w-4 h-4 flex items-center justify-center">
                                                    {classFilter === classNum && <Check className="h-4 w-4" />}
                                                </div>
                                                <span className="tabular-nums text-muted-foreground w-10">{classNum}xxx</span>
                                                <span className="truncate">{accountClassLabels[classNum]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                }
            >
                <DataTableHeader>
                    <DataTableHeaderCell label="" width="40px" />
                    <DataTableHeaderCell icon={Hash} label="Konto" />
                    <DataTableHeaderCell icon={FileText} label="Kontonamn" />
                    <DataTableHeaderCell icon={Tag} label="Typ" />
                    <DataTableHeaderCell icon={Clock} label="Senast" />
                    <DataTableHeaderCell icon={Activity} label="Antal" align="center" />
                    <DataTableHeaderCell icon={Banknote} label="Saldo" align="right" />
                </DataTableHeader>
                <DataTableBody>
                    {filteredAccounts.map((account) => {
                        const isExpanded = expandedAccounts.has(account.number)
                        const hasTransactions = account.transactionCount > 0

                        return (
                            <React.Fragment key={account.number}>
                                <tr
                                    onClick={() => hasTransactions && toggleAccountExpanded(account.number)}
                                    className={cn(
                                        "border-b border-border/40 hover:bg-muted/30 transition-colors",
                                        hasTransactions && "cursor-pointer",
                                        isExpanded && "bg-muted/20"
                                    )}
                                >
                                    <td className="px-4 py-3">
                                        {hasTransactions && (
                                            isExpanded
                                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums font-medium">
                                        {account.number}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{account.name}</span>
                                            <span className="text-xs text-muted-foreground">{account.group}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <AppStatusBadge
                                            status={accountTypeLabels[account.type]}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDateShort(account.lastDate)}
                                    </td>
                                    <td className="px-4 py-3 text-center text-muted-foreground">
                                        {account.transactionCount > 0 ? `${account.transactionCount} st` : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {account.balance !== 0 ? (
                                            <AmountText value={account.balance} />
                                        ) : (
                                            <span className="text-muted-foreground">0 kr</span>
                                        )}
                                    </td>
                                </tr>

                                {/* Expanded transactions */}
                                {isExpanded && account.transactions.length > 0 && (
                                    <tr key={`${account.number}-expanded`}>
                                        <td colSpan={7} className="bg-muted/10 px-0 py-0">
                                            <div className="pl-12 pr-4 py-2">
                                                <div className="text-xs font-medium text-muted-foreground mb-2">
                                                    Senaste transaktioner
                                                </div>
                                                <div className="space-y-1">
                                                    {account.transactions.slice(0, 5).map(tx => (
                                                        <div
                                                            key={tx.id}
                                                            className="flex items-center justify-between py-1.5 px-3 rounded bg-background/50 text-sm"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-muted-foreground w-16">
                                                                    {formatDateShort(tx.date)}
                                                                </span>
                                                                <span>{tx.description}</span>
                                                            </div>
                                                            <AmountText value={tx.amount} />
                                                        </div>
                                                    ))}
                                                    {account.transactionCount > 5 && (
                                                        <div className="text-xs text-muted-foreground text-center py-1">
                                                            + {account.transactionCount - 5} fler transaktioner
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )
                    })}

                    {filteredAccounts.length === 0 && (
                        <tr className="h-[200px]">
                            <td colSpan={7} className="text-center text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Inga konton hittades</p>
                                <p className="text-sm">
                                    {viewMode === "activity"
                                        ? "Inga transaktioner har bokförts ännu"
                                        : "Försök med en annan sökning eller filter"
                                    }
                                </p>
                            </td>
                        </tr>
                    )}
                </DataTableBody>
            </DataTable>

            {/* Summary footer */}
            {viewMode === "activity" && filteredAccounts.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                    <span>
                        Visar {filteredAccounts.length} konton med aktivitet
                    </span>
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => setViewMode("all")}
                        className="text-muted-foreground"
                    >
                        Visa alla konton →
                    </Button>
                </div>
            )}
        </div>
    )
}
