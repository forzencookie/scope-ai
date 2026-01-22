"use client"

import { useState, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn, formatCurrency } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { CategoryBadge, AmountText, RowCheckbox } from "@/components/ui/table-shell"
import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import {
    Link2,
    Paperclip,
    FolderTree,
    ChevronDown,
    Check,
    Calendar,
    Hash,
    CreditCard,
    Tag,
    Banknote,
    CheckCircle2,
    Circle,
    MoreHorizontal,
    Eye,
    Download,
    Trash2,
    AlertTriangle,
    FileCheck,
    Plus,
    Printer,
    FileText,
    Filter,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, useBulkSelection } from "@/components/shared/bulk-action-toolbar"
import { SearchBar } from "@/components/ui/search-bar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { useTransactions } from "@/hooks/use-transactions"
import { basAccounts, accountClassLabels, type AccountClass } from "@/data/accounts"
import { TRANSACTION_STATUS_LABELS } from "@/lib/localization"

import { VerifikationDialog } from "./verifikation-dialog"

interface Verification {
    id: number | string // Allow string IDs from transactions
    date: string
    description: string
    amount: number
    konto: string
    kontoName: string
    hasTransaction: boolean
    hasUnderlag: boolean
}

export function VerifikationerTable() {
    const toast = useToast()
    const { transactions, isLoading } = useTransactions()
    const searchParams = useSearchParams()
    const router = useRouter()
    const accountParam = searchParams.get("account")

    const [classFilter, setClassFilter] = useState<AccountClass | "all Glad">("all")
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedVerifikation, setSelectedVerifikation] = useState<Verification | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    // Helper to update filter via URL
    const setAccountFilter = useCallback((account: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (account) {
            params.set("account", account)
        } else {
            params.delete("account")
        }
        router.push(`/dashboard/bokforing?${params.toString()}`, { scroll: false })
    }, [searchParams, router])


    // Derive verifications from actual booked transactions
    const verifikationer = useMemo(() => {
        if (!transactions) return []

        // Filter for transactions that are "Recorded" (Bokförd)
        // In a real app, this would query a dedicated verifications endpoint
        const bookedTransactions = transactions.filter(t =>
            t.status === TRANSACTION_STATUS_LABELS.RECORDED
        )

        return bookedTransactions.map(t => {
            // Find account name
            const accountInfo = basAccounts.find(a => a.number === t.account) ||
                basAccounts.find(a => a.number === t.category) // Fallback if category is account number

            // Extract numeric ID if possible, otherwise hash or use index for numeric requirement (if needed)
            // But better to update ID type to string | number.

            return {
                id: t.id,
                date: t.date,
                description: t.name,
                amount: t.amountValue,
                konto: t.account || "1930", // Default to business account if missing
                kontoName: accountInfo?.name || t.category || "Okänt konto",
                hasTransaction: true,
                hasUnderlag: true // Simplified assumption for booked transactions
            }
        })
    }, [transactions])

    // Filter verifikationer by search query and class filter
    const filteredVerifikationer = useMemo(() => {
        let result = [...verifikationer]

        // 1. Account drill-down (Strict filter from URL)
        if (accountParam) {
            result = result.filter(v => v.konto === accountParam)
        }

        // 2. Search query (Fuzzy)
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(v =>
                v.description.toLowerCase().includes(query) ||
                v.konto.includes(query) ||
                v.kontoName.toLowerCase().includes(query) ||
                String(v.id).includes(query)
            )
        }

        // 3. Class filter (1xxx, 3xxx etc)
        if (classFilter !== "all" && !accountParam) { // Disable class filter if specific account is selected
            const classPrefix = String(classFilter)
            result = result.filter(v => v.konto.startsWith(classPrefix))
        }

        return result
    }, [searchQuery, classFilter, verifikationer, accountParam])


    // Calculate stats for stat cards
    const stats = useMemo(() => {
        const withTransaction = verifikationer.filter(v => v.hasTransaction).length
        const withUnderlag = verifikationer.filter(v => v.hasUnderlag).length
        const missingUnderlag = verifikationer.filter(v => !v.hasUnderlag).length
        const totalAmount = verifikationer.reduce((sum, v) => sum + Math.abs(v.amount), 0)

        return {
            total: verifikationer.length,
            withTransaction,
            withUnderlag,
            missingUnderlag,
            totalAmount
        }
    }, [verifikationer])

    // Calculate breakdown by account class
    const accountClassBreakdown = useMemo(() => {
        const breakdown: Record<AccountClass, { count: number; amount: number }> = {
            1: { count: 0, amount: 0 },
            2: { count: 0, amount: 0 },
            3: { count: 0, amount: 0 },
            4: { count: 0, amount: 0 },
            5: { count: 0, amount: 0 },
            6: { count: 0, amount: 0 },
            7: { count: 0, amount: 0 },
            8: { count: 0, amount: 0 },
        }

        verifikationer.forEach(v => {
            const classNum = parseInt(v.konto.charAt(0)) as AccountClass
            if (classNum >= 1 && classNum <= 8) {
                breakdown[classNum].count++
                breakdown[classNum].amount += Math.abs(v.amount)
            }
        })

        return breakdown
    }, [verifikationer])

    const handleViewDetails = (v: typeof verifikationer[0]) => {
        setSelectedVerifikation(v)
        setDetailsDialogOpen(true)
    }

    // Map verifikationer to have string id for useBulkSelection
    const verifikationerWithId = useMemo(() =>
        filteredVerifikationer.map(v => ({ ...v, id: String(v.id) })),
        [filteredVerifikationer]
    )

    // Use shared bulk selection hook
    const selection = useBulkSelection(verifikationerWithId)

    const handleBulkAction = (action: string) => {
        toast.info(`${action} startad`, `Bearbetar ${selection.selectedCount} verifikationer...`)
    }

    return (
        <div className="w-full space-y-6">
            {/* Page Heading */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {accountParam ? `Huvudbok: ${accountParam}` : "Verifikationer"}
                        </h2>
                        <p className="text-muted-foreground">
                            {accountParam
                                ? `Systematisk översikt för konto ${accountParam} (${filteredVerifikationer[0]?.kontoName || 'Laddar...'})`
                                : "Se alla bokförda transaktioner och verifikationer."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" className="h-8 w-full sm:w-auto px-3 gap-1" onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Ny verifikation</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Active Account Filter Badge */}
            {accountParam && (
                <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 animate-in fade-in slide-in-from-top-1">
                    <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                        Filtrerat på konto: <span className="font-bold underline tabular-nums">{accountParam}</span>
                    </span>
                    <button
                        onClick={() => setAccountFilter(null)}
                        className="ml-auto text-indigo-500 hover:text-indigo-700 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Compact Stats Row */}
            <div className="flex flex-wrap items-center gap-4 py-3 px-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm"><span className="font-semibold tabular-nums">{stats.total}</span> verifikationer</span>
                </div>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(stats.totalAmount)}</span>
                </div>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm"><span className="font-semibold tabular-nums">{stats.withTransaction}</span> kopplade</span>
                </div>
                {stats.missingUnderlag > 0 && (
                    <>
                        <div className="h-4 w-px bg-border hidden sm:block" />
                        <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span className="text-sm font-medium">{stats.missingUnderlag} saknar underlag</span>
                        </div>
                    </>
                )}
            </div>

            {/* Create Dialog */}
            <VerifikationDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onVerifikationCreated={(transactionId, underlagId, type) => {
                    toast.success("Verifikation skapad", "Kopplingen har sparats och status har uppdaterats till Bokförd.")
                }}
            />

            {/* Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verifikation #{selectedVerifikation?.id}</DialogTitle>
                    </DialogHeader>
                    {selectedVerifikation && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Datum</p>
                                    <p className="font-medium">{selectedVerifikation.date}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Konto</p>
                                    <p className="font-medium">{selectedVerifikation.konto} - {selectedVerifikation.kontoName}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-muted-foreground">Beskrivning</p>
                                    <p className="font-medium">{selectedVerifikation.description}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Belopp</p>
                                    <p className={`font-medium ${selectedVerifikation.amount >= 0 ? "text-green-600 dark:text-green-500/70" : ""}`}>
                                        {selectedVerifikation.amount.toLocaleString('sv-SE')} kr
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <div className="flex gap-2 mt-1">
                                        <AppStatusBadge
                                            status={selectedVerifikation.hasTransaction ? "Transaktion kopplad" : "Transaktion saknas"}
                                            size="sm"
                                        />
                                        <AppStatusBadge
                                            status={selectedVerifikation.hasUnderlag ? "Underlag finns" : "Underlag saknas"}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Stäng</Button>
                        </DialogClose>
                        <Button
                            variant="outline"
                            onClick={() => {
                                toast.info("Laddar ner...", `Verifikation #${selectedVerifikation?.id} förbereds för nedladdning.`)
                            }}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Ladda ner
                        </Button>
                        <Button
                            onClick={() => {
                                toast.success("Verifikation godkänd", `Verifikation #${selectedVerifikation?.id} har markerats som godkänd.`)
                                setDetailsDialogOpen(false)
                            }}
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Godkänn
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Table Section */}
            <div className="space-y-2">
                <div className="border-b-2 border-border/60" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Verifikationer</h3>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <SearchBar
                            placeholder="Sök..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            className="flex-1 sm:w-48 min-w-0"
                        />

                        <div className="flex items-center gap-2 shrink-0">
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn("h-9 w-9 sm:w-auto px-0 sm:px-3 gap-2", classFilter !== "all" && "border-primary text-primary")}
                                    onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                                >
                                    <Filter className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">
                                        {classFilter !== "all" ? accountClassLabels[classFilter] : "Alla kategorier"}
                                    </span>
                                    <ChevronDown className="h-4 w-4 hidden sm:block" />
                                </Button>
                                {filterDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-1 w-[280px] bg-background border border-border rounded-md shadow-lg z-10">
                                        <div className="p-1">
                                            <button
                                                onClick={() => { setClassFilter("all"); setFilterDropdownOpen(false); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors text-left"
                                            >
                                                <div className="w-4 h-4 flex items-center justify-center">
                                                    {classFilter === "all" && <Check className="h-4 w-4" />}
                                                </div>
                                                <span className="font-medium">Alla kategorier</span>
                                            </button>
                                            <Separator className="my-1" />
                                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">BAS Kontoklasser</div>
                                            {([1, 2, 3, 4, 5, 6, 7, 8] as AccountClass[]).map((classNum) => (
                                                <button
                                                    key={classNum}
                                                    onClick={() => { setClassFilter(classNum); setFilterDropdownOpen(false); }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors text-left"
                                                >
                                                    <div className="w-4 h-4 flex items-center justify-center">
                                                        {classFilter === classNum && <Check className="h-4 w-4" />}
                                                    </div>
                                                    <span className="tabular-nums text-muted-foreground w-6">{classNum}xxx</span>
                                                    <span className="truncate">{accountClassLabels[classNum]}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 w-9 sm:w-auto px-0 sm:px-3 gap-2"
                                onClick={() => {
                                    toast.info("Kommer snart", "Export-funktionen är under utveckling.")
                                }}
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Exportera</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="w-full overflow-x-auto pb-2">
                    <div className="min-w-[800px] px-2">
                        <GridTableHeader
                            columns={[
                                { label: "Nr", icon: Hash, span: 1 },
                                { label: "Datum", icon: Calendar, span: 2 },
                                { label: "Konto", icon: CreditCard, span: 2 },
                                { label: "Beskrivning", icon: FileText, span: 4 },
                                { label: "Belopp", icon: Banknote, span: 2, align: "right" },
                            ]}
                            trailing={
                                <Checkbox
                                    checked={selection.allSelected && filteredVerifikationer.length > 0}
                                    onCheckedChange={selection.toggleAll}
                                    className="mr-2"
                                />
                            }
                        />

                        <GridTableRows>
                            {filteredVerifikationer.map((v) => (
                                <GridTableRow
                                    key={v.id}
                                    onClick={() => handleViewDetails(v)}
                                    selected={selection.isSelected(String(v.id))}
                                    className="cursor-pointer group"
                                >
                                    <div className="col-span-1 font-mono text-muted-foreground text-xs">
                                        {v.id}
                                    </div>
                                    <div className="col-span-2 text-muted-foreground">
                                        {v.date}
                                    </div>
                                    <div className="col-span-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setAccountFilter(v.konto);
                                            }}
                                            className="flex flex-col items-start hover:bg-muted/50 p-1 -m-1 rounded transition-colors text-left"
                                        >
                                            <span className="tabular-nums font-medium text-primary hover:underline">{v.konto}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-full">{v.kontoName}</span>
                                        </button>
                                    </div>
                                    <div className="col-span-4 font-medium truncate">
                                        {v.description}
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className={cn(
                                            "tabular-nums font-medium",
                                            v.amount > 0 && "text-green-600 dark:text-green-400",
                                            v.amount < 0 && "text-red-600 dark:text-red-400",
                                            v.amount === 0 && "text-muted-foreground"
                                        )}>
                                            {formatCurrency(v.amount)}
                                        </span>
                                    </div>
                                    <div className="col-span-1 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selection.isSelected(String(v.id))}
                                            onCheckedChange={() => selection.toggleItem(String(v.id))}
                                            className="mr-2"
                                        />
                                    </div>
                                </GridTableRow>
                            ))}

                            {filteredVerifikationer.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Inga verifikationer matchar din sökning</p>
                                </div>
                            )}
                        </GridTableRows>
                    </div>
                </div>
            </div>

            <BulkActionToolbar
                selectedCount={selection.selectedCount}
                selectedIds={selection.selectedIds}
                onClearSelection={selection.clearSelection}
                actions={[
                    {
                        id: "export",
                        label: "Exportera PDF",
                        icon: FileText,
                        onClick: () => handleBulkAction("Export")
                    },
                    {
                        id: "print",
                        label: "Skriv ut",
                        icon: Printer,
                        onClick: () => handleBulkAction("Utskrift")
                    }
                ]}
            />
        </div>
    )
}
