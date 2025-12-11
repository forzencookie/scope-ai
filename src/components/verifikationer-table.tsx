"use client"

import { useState, useMemo } from "react"
import { Separator } from "@/components/ui/separator"
import { TableShell, HeaderCell, CategoryBadge, AmountText, RowCheckbox } from "@/components/table/table-shell"
import { DataTableRaw } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
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
    Search,
    X,
    MoreHorizontal,
    Eye,
    Download,
    Trash2,
} from "lucide-react"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
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

// Kontoplan categories
const kontoplan = [
    { konto: "1930", name: "Företagskonto", type: "Tillgångar" },
    { konto: "3010", name: "Försäljning varor", type: "Intäkter" },
    { konto: "3040", name: "Försäljning tjänster", type: "Intäkter" },
    { konto: "5410", name: "Förbrukningsinventarier", type: "Kostnader" },
    { konto: "5420", name: "Programvaror", type: "Kostnader" },
    { konto: "6072", name: "Representation", type: "Kostnader" },
    { konto: "6212", name: "Telefon", type: "Kostnader" },
]

const kontoLookup = Object.fromEntries(
    kontoplan.map((k) => [k.konto, k])
)

// Sample verifikationer data
const verifikationer = [
    {
        id: 1,
        date: "2024-12-05",
        description: "IKEA kontorsmaterial",
        amount: -1200,
        konto: "5410",
        hasTransaction: true,
        hasUnderlag: true,
    },
    {
        id: 2,
        date: "2024-12-04",
        description: "Spotify Premium",
        amount: -169,
        konto: "5420",
        hasTransaction: true,
        hasUnderlag: true,
    },
    {
        id: 3,
        date: "2024-12-04",
        description: "Lunch kundmöte",
        amount: -450,
        konto: "6072",
        hasTransaction: true,
        hasUnderlag: false,
    },
    {
        id: 4,
        date: "2024-12-03",
        description: "Kundbetalning ABC AB",
        amount: 15000,
        konto: "3040",
        hasTransaction: true,
        hasUnderlag: true,
    },
    {
        id: 5,
        date: "2024-12-03",
        description: "Adobe Creative Cloud",
        amount: -599,
        konto: "5420",
        hasTransaction: true,
        hasUnderlag: true,
    },
    {
        id: 6,
        date: "2024-12-02",
        description: "Telia mobilabonnemang",
        amount: -349,
        konto: "6212",
        hasTransaction: true,
        hasUnderlag: false,
    },
    {
        id: 7,
        date: "2024-12-01",
        description: "Clas Ohlson kontorsstol",
        amount: -2400,
        konto: "5410",
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

    // Filter verifikationer by search query and selected konto
    const filteredVerifikationer = useMemo(() => {
        let result = [...verifikationer]
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(v => 
                v.description.toLowerCase().includes(query) ||
                v.konto.includes(query) ||
                kontoLookup[v.konto]?.name.toLowerCase().includes(query)
            )
        }
        
        if (selectedKonto) {
            result = result.filter(v => v.konto === selectedKonto)
        }
        
        return result
    }, [searchQuery, selectedKonto])

    // Group verifikationer by konto for kontoplan view
    const groupedByKonto = kontoplan.map(k => ({
        ...k,
        verifikationer: filteredVerifikationer.filter(v => v.konto === k.konto),
        total: filteredVerifikationer.filter(v => v.konto === k.konto).reduce((sum, v) => sum + v.amount, 0)
    })).filter(k => k.verifikationer.length > 0)

    const selectedKontoData = kontoplan.find(k => k.konto === selectedKonto)

    const handleViewDetails = (v: typeof verifikationer[0]) => {
        setSelectedVerifikation(v)
        setDetailsDialogOpen(true)
    }

    const tableHeaders = [
        { label: "Nr", icon: <Hash className="h-3.5 w-3.5" />, minWidth: "min-w-[70px]" },
        { label: "Datum", icon: <Calendar className="h-3.5 w-3.5" />, minWidth: "min-w-[140px]" },
        { label: "Konto", icon: <FolderTree className="h-3.5 w-3.5" />, minWidth: "min-w-[120px]" },
        { label: "Kategori", icon: <Tag className="h-3.5 w-3.5" />, minWidth: "min-w-[160px]" },
        { label: "Belopp", icon: <Banknote className="h-3.5 w-3.5" />, minWidth: "min-w-[130px]", align: "right" as const },
        { label: "Transaktion", icon: <Link2 className="h-3.5 w-3.5" />, minWidth: "min-w-[110px]", align: "center" as const },
        { label: "Underlag", icon: <Paperclip className="h-3.5 w-3.5" />, minWidth: "min-w-[110px]", align: "center" as const },
    ]

    return (
        <div className="flex flex-col">
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
                                    <p className="font-medium">{selectedVerifikation.konto} - {kontoLookup[selectedVerifikation.konto]?.name}</p>
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
                                        <StatusBadge 
                                            status={selectedVerifikation.hasTransaction ? "Transaktion kopplad" : "Transaktion saknas"}
                                            variant={selectedVerifikation.hasTransaction ? "success" : "error"}
                                            size="sm"
                                            showIcon={false}
                                        />
                                        <StatusBadge 
                                            status={selectedVerifikation.hasUnderlag ? "Underlag finns" : "Underlag saknas"}
                                            variant={selectedVerifikation.hasUnderlag ? "success" : "warning"}
                                            size="sm"
                                            showIcon={false}
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

            {/* Header */}
            <div className="flex flex-col gap-0.5 mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    Verifikationer
                </h2>
            </div>

            {/* Toolbar with Search */}
            <div className="mb-4 flex items-center gap-2">
                {/* Search Input */}
                <InputGroup className="w-64">
                    <InputGroupAddon>
                        <InputGroupText>
                            <Search className="h-4 w-4" />
                        </InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput 
                        placeholder="Sök verifikationer..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </InputGroup>
                
                {searchQuery && (
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSearchQuery("")}>
                        <X className="h-4 w-4" />
                    </Button>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Konto Filter Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setKontoDropdownOpen(!kontoDropdownOpen)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md text-sm font-medium hover:bg-muted/50 transition-colors min-w-[200px] justify-between"
                    >
                        <span>
                            {selectedKonto 
                                ? `${selectedKonto} ${selectedKontoData?.name}` 
                                : "Alla konton"
                            }
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                    
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
                                {kontoplan.map((k) => (
                                    <button
                                        key={k.konto}
                                        onClick={() => { setSelectedKonto(k.konto); setKontoDropdownOpen(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors text-left"
                                    >
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            {selectedKonto === k.konto && <Check className="h-4 w-4" />}
                                        </div>
                                        <span className="font-mono text-muted-foreground">{k.konto}</span>
                                        <span>{k.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Verifikationer Table */}
            <DataTableRaw>
            <TableShell
                header={
                    <tr className="border-b border-border/40 text-left text-muted-foreground">
                        {tableHeaders.map((h) => (
                            <HeaderCell key={h.label} {...h} />
                        ))}
                    </tr>
                }
            >
                {filteredVerifikationer.map((v) => (
                    <tr
                        key={v.id}
                        className="border-b border-border/40 hover:bg-muted/30 group cursor-pointer"
                        onClick={() => handleViewDetails(v)}
                    >
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                            {v.id}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                            {v.date}
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                            {v.konto}
                        </td>
                        <td className="px-4 py-3">
                            <CategoryBadge>{kontoLookup[v.konto]?.name ?? "Kategori saknas"}</CategoryBadge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                            <AmountText value={v.amount} />
                        </td>
                        <td className="px-4 py-3 text-center">
                            <RowCheckbox checked={v.hasTransaction} />
                        </td>
                        <td className="px-4 py-3 text-center">
                            <RowCheckbox checked={v.hasUnderlag} />
                        </td>
                    </tr>
                ))}
                {filteredVerifikationer.length === 0 && (
                    <tr className="h-[100px]">
                        <td colSpan={7} className="text-center text-muted-foreground">
                            {searchQuery ? "Inga verifikationer matchar din sökning" : "Inga verifikationer"}
                        </td>
                    </tr>
                )}
            </TableShell>
            </DataTableRaw>

            {/* Kontoplan Summary - below main table */}
            <div className="mt-6">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-3">
                    <FolderTree className="h-4 w-4 text-muted-foreground" />
                    Kontoplan översikt
                </h3>
                <DataTableRaw>
                <TableShell
                    header={
                        <tr className="border-b border-border/40 text-left text-muted-foreground">
                            <HeaderCell icon={<Hash className="h-3.5 w-3.5" />} label="Konto" className="min-w-[100px]" />
                            <HeaderCell icon={<Tag className="h-3.5 w-3.5" />} label="Kategori" className="min-w-[160px]" />
                            <HeaderCell icon={<FolderTree className="h-3.5 w-3.5" />} label="Typ" className="min-w-[120px]" />
                            <HeaderCell icon={<Banknote className="h-3.5 w-3.5" />} label="Summa" className="min-w-[130px] text-right" align="right" />
                            <HeaderCell icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Antal" className="min-w-[80px] text-center" align="center" />
                        </tr>
                    }
                >
                    {groupedByKonto.map((k) => (
                        <tr
                            key={k.konto}
                            onClick={() => setSelectedKonto(k.konto)}
                            className="border-b border-border/40 hover:bg-muted/30 cursor-pointer"
                        >
                            <td className="px-4 py-3 font-mono text-muted-foreground">{k.konto}</td>
                            <td className="px-4 py-3">
                                <CategoryBadge>{k.name}</CategoryBadge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{k.type}</td>
                            <td className="px-4 py-3 text-right font-medium">
                                <AmountText value={k.total} />
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{k.verifikationer.length} st</td>
                        </tr>
                    ))}
                </TableShell>
                </DataTableRaw>
            </div>
        </div>
    )
}
