"use client"

import { useState, useMemo } from "react"
import { cn, formatCurrency } from "@/lib/utils"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import {
    Link2,
    ChevronDown,
    Check,
    Banknote,
    AlertTriangle,
    FileCheck,
    Printer,
    FileText,
    Filter,
    Download,
    Plus,
    Hash,
    Calendar,
    BookOpen,
    Coins,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, useBulkSelection } from "@/components/shared/bulk-action-toolbar"
import { SearchBar } from "@/components/ui/search-bar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Separator } from "@/components/ui/separator"
import { Table3Header, Table3Rows, Table3Row } from "@/components/bokforing/report-table"

interface Verification {
    id: number | string
    date: string
    description: string
    amount: number
    konto: string
    kontoName: string
    hasTransaction: boolean
    hasUnderlag: boolean
}

export function VerifikationerList() {
    const toast = useToast()
    const { transactions } = useTransactions()
    const [classFilter, setClassFilter] = useState<AccountClass | "all">("all")
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedVerifikation, setSelectedVerifikation] = useState<Verification | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    // Derive verifications from actual booked transactions
    const verifikationer = useMemo(() => {
        if (!transactions) return []

        const bookedTransactions = transactions.filter(t =>
            t.status === TRANSACTION_STATUS_LABELS.RECORDED
        )

        return bookedTransactions.map(t => {
            const accountInfo = basAccounts.find(a => a.number === t.account) ||
                basAccounts.find(a => a.number === t.category)

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

    // Filter verifikationer
    const filteredVerifikationer = useMemo(() => {
        let result = [...verifikationer]

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(v =>
                v.description.toLowerCase().includes(query) ||
                v.konto.includes(query) ||
                v.kontoName.toLowerCase().includes(query) ||
                String(v.id).includes(query)
            )
        }

        if (classFilter !== "all") {
            const classPrefix = String(classFilter)
            result = result.filter(v => v.konto.startsWith(classPrefix))
        }

        return result
    }, [searchQuery, classFilter, verifikationer])

    // Calculate stats
    const stats = useMemo(() => {
        const withTransaction = verifikationer.filter(v => v.hasTransaction).length
        const missingUnderlag = verifikationer.filter(v => !v.hasUnderlag).length
        const totalAmount = verifikationer.reduce((sum, v) => sum + Math.abs(v.amount), 0)

        return {
            total: verifikationer.length,
            withTransaction,
            missingUnderlag,
            totalAmount
        }
    }, [verifikationer])

    const handleViewDetails = (v: typeof verifikationer[0]) => {
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
        <div className="space-y-6">
            {/* Stats Cards */}
            <StatCardGrid columns={4}>
                <StatCard
                    label="Totalt verifikationer"
                    value={stats.total}
                    subtitle="Denna period"
                    headerIcon={FileCheck}
                />
                <StatCard
                    label="Med transaktion"
                    value={stats.withTransaction}
                    subtitle="Kopplade"
                    headerIcon={Link2}
                    changeType="positive"
                />
                <StatCard
                    label="Saknar underlag"
                    value={stats.missingUnderlag}
                    subtitle="Behöver åtgärdas"
                    headerIcon={AlertTriangle}
                    changeType={stats.missingUnderlag > 0 ? "negative" : "neutral"}
                />
                <StatCard
                    label="Totalt belopp"
                    value={formatCurrency(stats.totalAmount)}
                    headerIcon={Banknote}
                />
            </StatCardGrid>

            {/* Table Section */}
            <div>
                {/* Separator similar to Inkomstdeklaration */}
                <div className="border-b-2 border-border/60" />

                {/* Sub-header row like INK2: Title on left, actions on right */}
                <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold tracking-tight">
                            {classFilter === "all"
                                ? "BAS Kontoplan"
                                : accountClassLabels[classFilter]
                            }
                        </h3>
                        <span className="text-sm text-muted-foreground tabular-nums">
                            {classFilter === "all" ? "1xxx–8xxx" : `${classFilter}xxx`}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <SearchBar
                            placeholder="Sök verifikationer..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            className="w-64"
                        />

                        <div className="relative">
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn("h-8 gap-2", classFilter !== "all" && "border-primary text-primary")}
                                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                            >
                                {classFilter !== "all" ? accountClassLabels[classFilter] : "Alla kategorier"}
                                <ChevronDown className="h-4 w-4" />
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
                                        <div className="max-h-[200px] overflow-y-auto">
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
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table3 Header */}
                <Table3Header
                    columns={[
                        { label: "Nr", icon: Hash, span: 1 },
                        { label: "Datum", icon: Calendar, span: 2 },
                        { label: "Konto", icon: BookOpen, span: 2 },
                        { label: "Beskrivning", icon: FileText, span: 5 },
                        { label: "Belopp", icon: Coins, span: 1, align: "right" },
                    ]}
                    trailing={
                        <Checkbox
                            checked={selection.allSelected && filteredVerifikationer.length > 0}
                            onCheckedChange={selection.toggleAll}
                        />
                    }
                />

                {/* Table3 Rows */}
                <Table3Rows>
                    {filteredVerifikationer.map((v) => (
                        <Table3Row
                            key={v.id}
                            onClick={() => handleViewDetails(v)}
                            selected={selection.isSelected(String(v.id))}
                        >
                            <div style={{ gridColumn: 'span 1' }} className="font-mono text-muted-foreground text-xs">
                                {v.id}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground">
                                {v.date}
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <div className="flex flex-col">
                                    <span className="tabular-nums font-medium">{v.konto}</span>
                                    <span className="text-xs text-muted-foreground truncate">{v.kontoName}</span>
                                </div>
                            </div>
                            <div style={{ gridColumn: 'span 5' }} className="font-medium truncate">
                                {v.description}
                            </div>
                            <div style={{ gridColumn: 'span 1' }} className="text-right">
                                <span className={cn(
                                    "tabular-nums font-medium",
                                    v.amount > 0 && "text-green-600 dark:text-green-400",
                                    v.amount < 0 && "text-foreground"
                                )}>
                                    {formatCurrency(v.amount)}
                                </span>
                            </div>
                            <div
                                style={{ gridColumn: 'span 1' }}
                                className="flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Checkbox
                                    checked={selection.isSelected(String(v.id))}
                                    onCheckedChange={() => selection.toggleItem(String(v.id))}
                                />
                            </div>
                        </Table3Row>
                    ))}

                    {filteredVerifikationer.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Inga verifikationer matchar din sökning</p>
                        </div>
                    )}
                </Table3Rows>
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

            {/* Hidden components (Dialogs) */}
            <VerifikationDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onVerifikationCreated={(transactionId, underlagId, type) => {
                    toast.success("Verifikation skapad", "Kopplingen har sparats.")
                }}
            />

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
                                <div className="col-span-2">
                                    <p className="text-sm text-muted-foreground">Beskrivning</p>
                                    <p className="font-medium">{selectedVerifikation.description}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Belopp</p>
                                    <p className="font-medium">{formatCurrency(selectedVerifikation.amount)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Stäng</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}

