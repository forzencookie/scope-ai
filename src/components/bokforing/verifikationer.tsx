"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import {
    Plus,
    FileText,
    Filter,
    Check,
    Download,
    Printer,
    ChevronDown,
    X,
    CreditCard
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, useBulkSelection } from "@/components/shared/bulk-action-toolbar"
import { SearchBar } from "@/components/ui/search-bar"
import { Button } from "@/components/ui/button"
import { useTransactions } from "@/hooks/use-transactions"
import { basAccounts, accountClassLabels, type AccountClass } from "@/data/accounts"
import { TRANSACTION_STATUS_LABELS } from "@/lib/localization"
import { VerifikationDialog } from "../verifikation-dialog"

// Imported sub-components
import { Verification } from "./verifikationer/types"
import { VerifikationerStats } from "./verifikationer/components/VerifikationerStats"
import { VerifikationDetailsDialog } from "./verifikationer/components/VerifikationDetailsDialog"
import { VerifikationerGrid } from "./verifikationer/components/VerifikationerGrid"

// Memoized to prevent unnecessary re-renders
export const VerifikationerTable = memo(function VerifikationerTable() {
    const toast = useToast()
    const { transactions, isLoading } = useTransactions()
    const searchParams = useSearchParams()
    const router = useRouter()
    const accountParam = searchParams.get("account")

    const [classFilter, setClassFilter] = useState<AccountClass | "all">("all")
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

        const bookedTransactions = transactions.filter(t =>
            t.status === TRANSACTION_STATUS_LABELS.RECORDED
        )

         // Optimization: Create a lookup map for accounts to avoid O(N) search per row
        const accountMap = new Map<string, any>();
        basAccounts.forEach(a => accountMap.set(a.number, a));

        return bookedTransactions.map(t => {
            const accountInfo = accountMap.get(t.account) || accountMap.get(t.category);

            return {
                id: t.id,
                date: t.date,
                description: t.name,
                amount: t.amountValue,
                konto: t.account || "1930",
                kontoName: accountInfo?.name || t.category || "Okänt konto",
                hasTransaction: true,
                hasUnderlag: true
            }
        })
    }, [transactions])

    // Filter verifikationer by search query and class filter
    const filteredVerifikationer = useMemo(() => {
        let result = [...verifikationer]

        if (accountParam) {
            result = result.filter(v => v.konto === accountParam)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(v =>
                v.description.toLowerCase().includes(query) ||
                v.konto.includes(query) ||
                v.kontoName.toLowerCase().includes(query) ||
                String(v.id).includes(query)
            )
        }

        if (classFilter !== "all" && !accountParam) {
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

    const handleViewDetails = (v: Verification) => {
        setSelectedVerifikation(v)
        setDetailsDialogOpen(true)
    }

    const verifikationerWithId = useMemo(() =>
        filteredVerifikationer.map(v => ({ ...v, id: String(v.id) })),
        [filteredVerifikationer]
    )

    const selection = useBulkSelection(verifikationerWithId)

    const handleBulkAction = (action: string) => {
        toast.info(`${action} startad`, `Bearbetar ${selection.selectedCount} verifikationer...`)
    }

    return (
        <div className="w-full space-y-6">
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

            <VerifikationerStats stats={stats} />

            <VerifikationDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onVerifikationCreated={(transactionId, underlagId, type) => {
                    toast.success("Verifikation skapad", "Kopplingen har sparats och status har uppdaterats till Bokförd.")
                }}
            />

            <VerifikationDetailsDialog
                open={detailsDialogOpen}
                onOpenChange={setDetailsDialogOpen}
                verification={selectedVerifikation}
                onDownload={() => {
                    toast.info("Laddar ner...", `Verifikation #${selectedVerifikation?.id} förbereds för nedladdning.`)
                }}
                onApprove={() => {
                    toast.success("Verifikation godkänd", `Verifikation #${selectedVerifikation?.id} har markerats som godkänd.`)
                    setDetailsDialogOpen(false)
                }}
            />

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

                <VerifikationerGrid
                    verifications={filteredVerifikationer}
                    selection={selection}
                    onViewDetails={handleViewDetails}
                    onAccountFilter={setAccountFilter}
                />
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
})

VerifikationerTable.displayName = 'VerifikationerTable'
