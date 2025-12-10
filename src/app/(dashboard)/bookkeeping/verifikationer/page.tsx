"use client"

import { useState } from "react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Checkbox } from "@/components/ui/checkbox"
import { TableShell, HeaderCell, CategoryBadge, AmountText, RowCheckbox } from "@/components/table/table-shell"
import { 
    Link2,
    Paperclip,
    Table,
    FolderTree,
    ChevronDown,
    Check,
    Calendar,
    Hash,
    Tag,
    Banknote,
    CheckCircle2,
    Circle
} from "lucide-react"

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

export default function VerifikationerPage() {
    const [view, setView] = useState<"table" | "kontoplan">("table")
    const [selectedKonto, setSelectedKonto] = useState<string | null>(null)
    const [kontoDropdownOpen, setKontoDropdownOpen] = useState(false)

    // Filter verifikationer by selected konto
    const filteredVerifikationer = selectedKonto 
        ? verifikationer.filter(v => v.konto === selectedKonto)
        : verifikationer

    // Group verifikationer by konto for kontoplan view
    const groupedByKonto = kontoplan.map(k => ({
        ...k,
        verifikationer: verifikationer.filter(v => v.konto === k.konto),
        total: verifikationer.filter(v => v.konto === k.konto).reduce((sum, v) => sum + v.amount, 0)
    })).filter(k => k.verifikationer.length > 0)

    const selectedKontoData = kontoplan.find(k => k.konto === selectedKonto)

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
        <div className="flex flex-col h-svh">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/accounting">Bokföring</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Verifikationer</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            
            <div className="flex-1 flex flex-col bg-background p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        📋 Verifikationer
                    </h1>
                </div>

                {/* View Toggle */}
                <div className="mb-4 flex items-center gap-2">
                    <button 
                        onClick={() => { setView("table"); setSelectedKonto(null); }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            view === "table" ? "bg-muted" : "hover:bg-muted/50"
                        }`}
                    >
                        <Table className="h-4 w-4" />
                        Tabell
                    </button>
                    <button 
                        onClick={() => setView("kontoplan")}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            view === "kontoplan" ? "bg-muted" : "hover:bg-muted/50"
                        }`}
                    >
                        <FolderTree className="h-4 w-4" />
                        Kontoplan
                    </button>

                    {/* Spacer to push dropdown to right */}
                    <div className="flex-1" />

                    {/* Konto Dropdown - shows when in kontoplan view */}
                    {view === "kontoplan" && (
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
                                <div className="absolute top-full left-0 mt-1 w-[280px] bg-background border border-border rounded-md shadow-lg z-10">
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
                    )}
                </div>

                {/* Table View */}
                {view === "table" && (
                    <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                    <TableShell
                        header={
                            <tr className="border-b border-border/40 text-left text-muted-foreground">
                                {tableHeaders.map((h) => (
                                    <HeaderCell key={h.label} {...h} />
                                ))}
                            </tr>
                        }
                    >
                        {verifikationer.map((v) => (
                            <tr
                                key={v.id}
                                className="border-b border-border/40 hover:bg-muted/30 group"
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
                                <td className="px-4 py-3">
                                    <RowCheckbox showOnHover />
                                </td>
                            </tr>
                        ))}
                    </TableShell>
                    </div>
                )}

                {/* Kontoplan View */}
                {view === "kontoplan" && (
                    <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                    <TableShell
                        header={
                            selectedKonto ? (
                                <tr className="border-b border-border/40 text-left text-muted-foreground">
                                    <HeaderCell label="Nr" icon={<Hash className="h-3.5 w-3.5" />} minWidth="min-w-[70px]" />
                                    <HeaderCell label="Datum" icon={<Calendar className="h-3.5 w-3.5" />} minWidth="min-w-[140px]" />
                                    <HeaderCell label="Konto" icon={<FolderTree className="h-3.5 w-3.5" />} minWidth="min-w-[120px]" />
                                    <HeaderCell label="Kategori" icon={<Tag className="h-3.5 w-3.5" />} minWidth="min-w-[160px]" />
                                    <HeaderCell label="Belopp" icon={<Banknote className="h-3.5 w-3.5" />} minWidth="min-w-[130px]" align="right" />
                                    <HeaderCell label="Transaktion" icon={<Link2 className="h-3.5 w-3.5" />} minWidth="min-w-[110px]" align="center" />
                                    <HeaderCell label="Underlag" icon={<Paperclip className="h-3.5 w-3.5" />} minWidth="min-w-[110px]" align="center" />
                                </tr>
                            ) : (
                                <tr className="border-b border-border/40 text-left text-muted-foreground">
                                    <HeaderCell label="Konto" icon={<FolderTree className="h-3.5 w-3.5" />} minWidth="min-w-[120px]" />
                                    <HeaderCell label="Kategori" icon={<Tag className="h-3.5 w-3.5" />} minWidth="min-w-[140px]" />
                                    <HeaderCell label="Typ" icon={<Calendar className="h-3.5 w-3.5" />} minWidth="min-w-[140px]" />
                                    <HeaderCell label="Summa" icon={<Banknote className="h-3.5 w-3.5" />} minWidth="min-w-[130px]" align="right" />
                                    <HeaderCell label="Antal ver." icon={<Circle className="h-3.5 w-3.5" />} minWidth="min-w-[120px]" align="center" />
                                    <HeaderCell label="Öppna" icon={<ChevronDown className="h-3.5 w-3.5" />} minWidth="min-w-[80px]" align="center" />
                                </tr>
                            )
                        }
                    >
                        {selectedKonto ? (
                            <>
                                {filteredVerifikationer.map((v) => (
                                    <tr
                                        key={v.id}
                                        className="border-b border-border/40 hover:bg-muted/30 group"
                                    >
                                        <td className="px-4 py-3 font-mono text-muted-foreground">{v.id}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{v.date}</td>
                                        <td className="px-4 py-3 font-mono text-muted-foreground">{v.konto}</td>
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
                                <tr className="bg-muted/30 border-t border-border/40">
                                    <td colSpan={4} className="px-4 py-3 font-medium text-muted-foreground text-right">
                                        Summa {selectedKontoData?.name}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold">
                                        <AmountText value={filteredVerifikationer.reduce((sum, v) => sum + v.amount, 0)} />
                                    </td>
                                    <td className="text-center"></td>
                                    <td className="text-center"></td>
                                </tr>
                            </>
                        ) : (
                            groupedByKonto.map((k) => (
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
                                    <td className="px-4 py-3 text-center text-muted-foreground">→</td>
                                </tr>
                            ))
                        )}
                    </TableShell>
                    </div>
                )}
            </div>
        </div>
    )
}
