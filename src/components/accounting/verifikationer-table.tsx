"use client"

import { useState, useMemo } from "react"
import { cn, formatCurrency } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { CategoryBadge, AmountText, RowCheckbox } from "../table/table-shell"
import {
    DataTable,
    DataTableHeader,
    DataTableHeaderCell,
    DataTableBody,
    DataTableRow,
    DataTableCell
} from "@/components/ui/data-table"
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
import { basAccounts } from "@/data/accounts"
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
    const [selectedKonto, setSelectedKonto] = useState<string | null>(null)
    const [kontoDropdownOpen, setKontoDropdownOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedVerifikation, setSelectedVerifikation] = useState<Verification | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

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

    // Get unique accounts from verifikationer for filter dropdown
    const availableAccounts = useMemo(() => {
        const uniqueAccounts = new Map<string, { konto: string; name: string }>()
        verifikationer.forEach(v => {
            if (!uniqueAccounts.has(v.konto)) {
                uniqueAccounts.set(v.konto, { konto: v.konto, name: v.kontoName })
            }
        })
        return Array.from(uniqueAccounts.values()).sort((a, b) => a.konto.localeCompare(b.konto))
    }, [verifikationer])

    // Filter verifikationer by search query and selected konto
    const filteredVerifikationer = useMemo(() => {
        let result = [...verifikationer]

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(v =>
                v.description.toLowerCase().includes(query) ||
                v.konto.includes(query) ||
                v.kontoName.toLowerCase().includes(query)
            )
        }

        if (selectedKonto) {
            result = result.filter(v => v.konto === selectedKonto)
        }

        return result
    }, [searchQuery, selectedKonto, verifikationer])

    const selectedKontoData = availableAccounts.find(k => k.konto === selectedKonto)

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
        <div className="flex flex-col space-y-6">
            {/* Page Heading */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Verifikationer</h2>
                <p className="text-muted-foreground">Se alla bokförda transaktioner och verifikationer.</p>
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" className="h-8 gap-1" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Ny verifikation
                </Button>
            </div>
        </div>

            {/* Stats Cards */ }
    <StatCardGrid columns={4}>
        <StatCard
            label="Totalt verifikationer"
            value={stats.total}
            subtitle="Denna period"
            icon={FileCheck}
        />
        <StatCard
            label="Med transaktion"
            value={stats.withTransaction}
            subtitle="Kopplade"
            icon={Link2}
            changeType="positive"
        />
        <StatCard
            label="Saknar underlag"
            value={stats.missingUnderlag}
            subtitle="Behöver åtgärdas"
            icon={AlertTriangle}
            changeType={stats.missingUnderlag > 0 ? "negative" : "neutral"}
        />
        <StatCard
            label="Totalt belopp"
            value={formatCurrency(stats.totalAmount)}
            icon={Banknote}
        />
    </StatCardGrid>

    {/* Create Dialog */ }
    <VerifikationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onVerifikationCreated={(transactionId, underlagId, type) => {
            toast.success("Verifikation skapad", "Kopplingen har sparats och status har uppdaterats till Bokförd.")
        }}
    />

    {/* Details Dialog */ }
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
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Ladda ner
                </Button>
                <Button>
                    <Check className="h-4 w-4 mr-2" />
                    Godkänn
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Main Verifikationer Table */ }
    <DataTable
        title="Verifikationer"
        headerActions={
            <div className="flex items-center gap-2">
                {/* Search Input */}
                <SearchBar
                    placeholder="Sök verifikationer..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                />

                {/* Konto Filter Dropdown */}
                <div className="relative">
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn("h-8 gap-2", selectedKonto && "border-primary text-primary")}
                        onClick={() => setKontoDropdownOpen(!kontoDropdownOpen)}
                    >
                        <FolderTree className="h-4 w-4" />
                        {selectedKonto ? selectedKonto : "Alla konton"}
                        <ChevronDown className="h-4 w-4" />
                    </Button>

                    {kontoDropdownOpen && (
                        <div className="absolute top-full right-0 mt-1 w-[280px] bg-background border border-border rounded-md shadow-lg z-10">
                            <div className="p-1">
                                <button
                                    onClick={() => { setSelectedKonto(null); setKontoDropdownOpen(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors text-left"
                                >
                                    <div className="w-4 h-4 flex items-center justify-center">
                                        {selectedKonto === null && <Check className="h-4 w-4" />}
                                    </div>
                                    <span className="font-medium">Alla konton</span>
                                </button>
                                <Separator className="my-1" />
                                {basAccounts.map((account) => (
                                    <button
                                        key={account.number}
                                        onClick={() => { setSelectedKonto(account.number); setKontoDropdownOpen(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors text-left"
                                    >
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            {selectedKonto === account.number && <Check className="h-4 w-4" />}
                                        </div>
                                        <span className="tabular-nums text-muted-foreground">{account.number}</span>
                                        <span className="truncate">{account.name}</span>
                                    </button>
                                ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button size="sm" variant="outline" className="h-8 gap-1">
                            <Download className="h-3.5 w-3.5" />
                            Exportera
                        </Button>
                        </div>
                }
            >
                    <DataTableHeader>
                        <DataTableHeaderCell icon={Hash} label="Nr" />
                        <DataTableHeaderCell icon={Calendar} label="Datum" />
                        <DataTableHeaderCell icon={FolderTree} label="Konto" />
                        <DataTableHeaderCell icon={Tag} label="Kategori" />
                        <DataTableHeaderCell icon={Banknote} label="Belopp" align="right" />
                        <DataTableHeaderCell className="w-10">
                            <Checkbox
                                checked={selection.allSelected && filteredVerifikationer.length > 0}
                                onCheckedChange={selection.toggleAll}
                            />
                        </DataTableHeaderCell>
                    </DataTableHeader>
                    <DataTableBody>
                        {filteredVerifikationer.map((v) => (
                            <DataTableRow
                                key={v.id}
                                className="cursor-pointer"
                                onClick={() => handleViewDetails(v)}
                                selected={selection.isSelected(String(v.id))}
                            >

                                <DataTableCell mono muted>{v.id}</DataTableCell>
                                <DataTableCell muted>{v.date}</DataTableCell>
                                <DataTableCell mono muted>{v.konto}</DataTableCell>
                                <DataTableCell>
                                    <CategoryBadge>{v.kontoName}</CategoryBadge>
                                </DataTableCell>
                                <DataTableCell align="right" bold>
                                    <AmountText value={v.amount} />
                                </DataTableCell>
                                <DataTableCell className="w-10 text-right">
                                    <div className="flex justify-end pr-2">
                                        <Checkbox
                                            checked={selection.isSelected(String(v.id))}
                                            onCheckedChange={() => selection.toggleItem(String(v.id))}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                        {filteredVerifikationer.length === 0 && (
                            <DataTableRow>
                                <DataTableCell colSpan={8} className="text-center py-8">
                                    {searchQuery ? "Inga verifikationer matchar din sökning" : "Inga verifikationer"}
                                </DataTableCell>
                            </DataTableRow>
                        )}
                    </DataTableBody>
                </DataTable>


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
            </div >
    )
}
