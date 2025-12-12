"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { CategoryBadge, AmountText, RowCheckbox } from "@/components/table/table-shell"
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
} from "lucide-react"
import { SearchBar } from "@/components/ui/search-bar"
import { Button } from "@/components/ui/button"
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

// Sample verifikationer data with account info
const verifikationer = [
    {
        id: 1,
        date: "2024-12-05",
        description: "IKEA kontorsmaterial",
        amount: -1200,
        konto: "5410",
        kontoName: "Förbrukningsinventarier",
        hasTransaction: true,
        hasUnderlag: true,
    },
    {
        id: 2,
        date: "2024-12-04",
        description: "Spotify Premium",
        amount: -169,
        konto: "5420",
        kontoName: "Programvaror",
        hasTransaction: true,
        hasUnderlag: true,
    },
    {
        id: 3,
        date: "2024-12-04",
        description: "Lunch kundmöte",
        amount: -450,
        konto: "6072",
        kontoName: "Representation",
        hasTransaction: true,
        hasUnderlag: false,
    },
    {
        id: 4,
        date: "2024-12-03",
        description: "Kundbetalning ABC AB",
        amount: 15000,
        konto: "3040",
        kontoName: "Försäljning tjänster",
        hasTransaction: true,
        hasUnderlag: true,
    },
    {
        id: 5,
        date: "2024-12-03",
        description: "Adobe Creative Cloud",
        amount: -599,
        konto: "5420",
        kontoName: "Programvaror",
        hasTransaction: true,
        hasUnderlag: true,
    },
    {
        id: 6,
        date: "2024-12-02",
        description: "Telia mobilabonnemang",
        amount: -349,
        konto: "6212",
        kontoName: "Telefon",
        hasTransaction: true,
        hasUnderlag: false,
    },
    {
        id: 7,
        date: "2024-12-01",
        description: "Clas Ohlson kontorsstol",
        amount: -2400,
        konto: "5410",
        kontoName: "Förbrukningsinventarier",
        hasTransaction: true,
        hasUnderlag: true,
    },
]

export function VerifikationerTable() {
    const [selectedKonto, setSelectedKonto] = useState<string | null>(null)
    const [kontoDropdownOpen, setKontoDropdownOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedVerifikation, setSelectedVerifikation] = useState<typeof verifikationer[0] | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

    // Get unique accounts from verifikationer for filter dropdown
    const availableAccounts = useMemo(() => {
        const uniqueAccounts = new Map<string, { konto: string; name: string }>()
        verifikationer.forEach(v => {
            if (!uniqueAccounts.has(v.konto)) {
                uniqueAccounts.set(v.konto, { konto: v.konto, name: v.kontoName })
            }
        })
        return Array.from(uniqueAccounts.values()).sort((a, b) => a.konto.localeCompare(b.konto))
    }, [])

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
    }, [searchQuery, selectedKonto])

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
    }, [])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('sv-SE', {
            style: 'currency',
            currency: 'SEK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const handleViewDetails = (v: typeof verifikationer[0]) => {
        setSelectedVerifikation(v)
        setDetailsDialogOpen(true)
    }

    return (
        <div className="flex flex-col space-y-6">
            {/* Stats Cards */}
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

            {/* Section Separator */}
            <div className="border-b-2 border-border/60" />

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

            {/* Main Verifikationer Table */}
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
                                className={cn("h-8 gap-2 border-2 border-border/60", selectedKonto && "border-primary text-primary")}
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
                                        {availableAccounts.map((k) => (
                                            <button
                                                key={k.konto}
                                                onClick={() => { setSelectedKonto(k.konto); setKontoDropdownOpen(false); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors text-left"
                                            >
                                                <div className="w-4 h-4 flex items-center justify-center">
                                                    {selectedKonto === k.konto && <Check className="h-4 w-4" />}
                                                </div>
                                                <span className="font-mono text-muted-foreground">{k.konto}</span>
                                                <span className="truncate">{k.name}</span>
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
                    <DataTableHeaderCell icon={Hash} label="Nr" />
                    <DataTableHeaderCell icon={Calendar} label="Datum" />
                    <DataTableHeaderCell icon={FolderTree} label="Konto" />
                    <DataTableHeaderCell icon={Tag} label="Kategori" />
                    <DataTableHeaderCell icon={Banknote} label="Belopp" align="right" />
                    <DataTableHeaderCell icon={Link2} label="Transaktion" align="center" />
                    <DataTableHeaderCell icon={Paperclip} label="Underlag" align="center" />
                </DataTableHeader>
                <DataTableBody>
                    {filteredVerifikationer.map((v) => (
                        <DataTableRow
                            key={v.id}
                            className="cursor-pointer"
                            onClick={() => handleViewDetails(v)}
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
                            <DataTableCell align="center">
                                <RowCheckbox checked={v.hasTransaction} />
                            </DataTableCell>
                            <DataTableCell align="center">
                                <RowCheckbox checked={v.hasUnderlag} />
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                    {filteredVerifikationer.length === 0 && (
                        <DataTableRow>
                            <DataTableCell colSpan={7} className="text-center py-8">
                                {searchQuery ? "Inga verifikationer matchar din sökning" : "Inga verifikationer"}
                            </DataTableCell>
                        </DataTableRow>
                    )}
                </DataTableBody>
            </DataTable>
        </div>
    )
}
