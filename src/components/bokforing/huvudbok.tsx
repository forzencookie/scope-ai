"use client"

import React, { useState, useMemo } from "react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
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
import { AmountText } from "@/components/ui/table-shell"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import {
    Table2Container,
    Table2Header,
    Table2Section,
    Table2Row,
} from "./report-table"
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
    const [viewMode, setViewMode] = useState<ViewMode>("all")
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

    // Group accounts by class for the report structre
    const groupedAccounts = useMemo(() => {
        const groups: Record<number, AccountWithActivity[]> = {}
        const classes = [1, 2, 3, 4, 5, 6, 7, 8] as const

        classes.forEach(c => {
            groups[c] = filteredAccounts.filter(a => a.class === c)
        })

        return groups
    }, [filteredAccounts])


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
            {/* Removed generic heading, now using Table2Header inside container */}

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

            {/* Separator similar to Inkomstdeklaration */}
            <div className="border-b-2 border-border/60" />

            <Table2Container>
                <Table2Header
                    title="Huvudbok"
                    subtitle="Översikt över alla bokföringskonton och saldon."
                >
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

                        {/* Filter dropdown */}
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
                </Table2Header>

                <div className="space-y-8">
                    {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((classNum) => {
                        const accounts = groupedAccounts[classNum]
                        // Only show class section if there are accounts or if looking at all accounts
                        // For "all" mode, we might want to hide empty sections if absolutely no matches?
                        // But "all" usually implies showing structure.
                        // However, if we filter by class, other classes will be empty array.
                        if (accounts.length === 0) return null

                        return (
                            <Table2Section
                                key={classNum}
                                title={`${classNum}xxx - ${accountClassLabels[classNum]}`}
                                items={accounts.map(acc => ({
                                    id: acc.number,
                                    label: acc.name,
                                    value: acc.balance,
                                    // Custom tooltip or data? 
                                    // Table2Row doesn't strictly support transaction list expansion natively yet.
                                    // But we can check if we can make it clickable.
                                    // Actually Table2Section renders Table2Rows.
                                    // We might need to render custom content if expanding.
                                }))}
                                // Total is implicit sum of values
                                defaultOpen={accounts.length < 10 && accounts.some(a => a.balance !== 0)}
                            />
                        )
                    })}

                    {filteredAccounts.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Inga konton hittades</p>
                        </div>
                    )}
                </div>
            </Table2Container>

        </div>
    )
}
