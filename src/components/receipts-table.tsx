"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
    Calendar,
    Search,
    SlidersHorizontal,
    Tag,
    FileText,
    Paperclip,
    MoreHorizontal,
    UploadCloud,
    Building2,
    X,
    Banknote,
    CheckCircle2,
    Clock,
    Link2,
} from "lucide-react"
import { cn, parseAmount } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { CategoryBadge, AmountText } from "@/components/table/table-shell"
import { 
    DataTable, 
    DataTableHeader, 
    DataTableHeaderCell,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    DataTableAddRow 
} from "@/components/ui/data-table"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { 
    type ReceiptStatus, 
    RECEIPT_STATUSES 
} from "@/lib/status-types"
import { type Receipt, mockReceipts } from "@/data/receipts"
import { useTableData, commonSortHandlers } from "@/hooks/use-table"
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/toast"
import { Checkbox } from "@/components/ui/checkbox"
import { BulkActionToolbar, useBulkSelection, type BulkAction } from "@/components/bulk-action-toolbar"
import { Trash2, Download, Archive } from "lucide-react"

// Sort handlers specific to receipts
const receiptSortHandlers = {
    date: commonSortHandlers.date as (a: Receipt, b: Receipt) => number,
    amount: commonSortHandlers.amount as (a: Receipt, b: Receipt) => number,
}

export function ReceiptsTable() {
    const [receipts, setReceipts] = useState<Receipt[]>(mockReceipts)
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null)
    
    // Toast notifications
    const toast = useToast()

    // Use the unified table data hook for filtering and sorting
    const tableData = useTableData<Receipt>({
        filter: {
            searchFields: ['supplier', 'category'],
        },
        sort: {
            initialSortBy: 'date',
            initialSortOrder: 'desc',
            sortHandlers: receiptSortHandlers,
        },
    })

    // Process receipts through filter and sort
    const filteredReceipts = useMemo(() => 
        tableData.processItems(receipts),
        [tableData, receipts]
    )

    // Calculate stats for stat cards
    const stats = useMemo(() => {
        const matched = receipts.filter(r => r.status === RECEIPT_STATUSES.MATCHED)
        const unmatched = receipts.filter(r => r.status === RECEIPT_STATUSES.UNMATCHED || r.status === RECEIPT_STATUSES.UPLOADED)
        const totalAmount = receipts.reduce((sum, r) => sum + parseAmount(r.amount), 0)
        
        return { 
            total: receipts.length,
            matchedCount: matched.length,
            unmatchedCount: unmatched.length,
            totalAmount
        }
    }, [receipts])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('sv-SE', {
            style: 'currency',
            currency: 'SEK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    // Bulk selection
    const bulkSelection = useBulkSelection(filteredReceipts)
    
    const bulkActions: BulkAction[] = useMemo(() => [
        {
            id: "delete",
            label: "Radera",
            icon: Trash2,
            variant: "destructive",
            onClick: (ids) => {
                setReceipts(prev => prev.filter(r => !ids.includes(r.id)))
                toast.success("Underlag raderade", `${ids.length} underlag har raderats`)
                bulkSelection.clearSelection()
            },
        },
        {
            id: "archive",
            label: "Arkivera",
            icon: Archive,
            onClick: (ids) => {
                toast.success("Underlag arkiverade", `${ids.length} underlag har arkiverats`)
                bulkSelection.clearSelection()
            },
        },
        {
            id: "download",
            label: "Ladda ner",
            icon: Download,
            onClick: (ids) => {
                toast.info("Laddar ner", `Förbereder ${ids.length} underlag för nedladdning...`)
                bulkSelection.clearSelection()
            },
        },
    ], [toast, bulkSelection])

    const handleDeleteClick = (id: string) => {
        setReceiptToDelete(id)
        setDeleteDialogOpen(true)
    }

    const handleConfirmDelete = () => {
        if (receiptToDelete) {
            const receipt = receipts.find(r => r.id === receiptToDelete)
            setReceipts(prev => prev.filter(r => r.id !== receiptToDelete))
            toast.success("Underlag raderat", `${receipt?.supplier || 'Underlaget'} har raderats`)
        }
        setDeleteDialogOpen(false)
        setReceiptToDelete(null)
    }

    const handleViewDetails = (receipt: Receipt) => {
        setSelectedReceipt(receipt)
        setDetailsDialogOpen(true)
    }

    return (
        <div className="w-full space-y-6">
            {/* Stats Cards */}
            <StatCardGrid columns={4}>
                <StatCard
                    label="Totalt underlag"
                    value={stats.total}
                    subtitle="Alla kvitton"
                    icon={FileText}
                />
                <StatCard
                    label="Matchade"
                    value={stats.matchedCount}
                    subtitle="Kopplade till transaktion"
                    icon={Link2}
                    changeType="positive"
                />
                <StatCard
                    label="Omatchade"
                    value={stats.unmatchedCount}
                    subtitle="Behöver granskas"
                    icon={Clock}
                    changeType={stats.unmatchedCount > 0 ? "negative" : "neutral"}
                />
                <StatCard
                    label="Totalt belopp"
                    value={formatCurrency(stats.totalAmount)}
                    icon={Banknote}
                />
            </StatCardGrid>

            {/* Section Separator */}
            <div className="border-b-2 border-border/60" />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Denna åtgärd kan inte ångras. Underlaget kommer att raderas permanent.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Radera
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ladda upp underlag</DialogTitle>
                    </DialogHeader>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">Dra och släpp filer här, eller klicka för att välja</p>
                        <p className="text-xs text-muted-foreground">PDF, JPG, PNG upp till 10MB</p>
                        <Button className="mt-4" size="sm">Välj filer</Button>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Avbryt</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Underlagsdetaljer</DialogTitle>
                    </DialogHeader>
                    {selectedReceipt && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Leverantör</p>
                                    <p className="font-medium">{selectedReceipt.supplier}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Datum</p>
                                    <p className="font-medium">{selectedReceipt.date}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Belopp</p>
                                    <p className="font-medium">{selectedReceipt.amount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Kategori</p>
                                    <p className="font-medium">{selectedReceipt.category}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <AppStatusBadge status={selectedReceipt.status} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Bilaga</p>
                                    <p className="font-medium text-primary cursor-pointer hover:underline">{selectedReceipt.attachment}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Stäng</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Table */}
            <DataTable
                title="Inkomna Underlag"
                headerActions={
                    <div className="flex items-center gap-2">
                        <InputGroup className="w-56">
                            <InputGroupAddon>
                                <InputGroupText>
                                    <Search />
                                </InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput 
                                placeholder="Sök underlag..." 
                                value={tableData.searchQuery}
                                onChange={(e) => tableData.setSearchQuery(e.target.value)}
                            />
                        </InputGroup>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("h-9 gap-1", tableData.statusFilter.length > 0 && "border-primary text-primary")}>
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    Filter
                                    {tableData.statusFilter.length > 0 && <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs">{tableData.statusFilter.length}</span>}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Filtrera på status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.values(RECEIPT_STATUSES).map((status) => (
                                    <DropdownMenuCheckboxItem
                                        key={status}
                                        checked={tableData.statusFilter.includes(status)}
                                        onCheckedChange={() => tableData.toggleStatusFilter(status)}
                                    >
                                        {status}
                                    </DropdownMenuCheckboxItem>
                                ))}
                                {tableData.statusFilter.length > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => tableData.clearFilters()}>
                                            <X className="h-3.5 w-3.5 mr-2" />
                                            Rensa filter
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Sortera efter</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => tableData.toggleSort("date")}>
                                    Datum {tableData.getSortIndicator("date") === "asc" ? "↑" : tableData.getSortIndicator("date") === "desc" ? "↓" : ""}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => tableData.toggleSort("amount")}>
                                    Belopp {tableData.getSortIndicator("amount") === "asc" ? "↑" : tableData.getSortIndicator("amount") === "desc" ? "↓" : ""}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => tableData.toggleSort("supplier")}>
                                    Leverantör {tableData.getSortIndicator("supplier") === "asc" ? "↑" : tableData.getSortIndicator("supplier") === "desc" ? "↓" : ""}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm" className="h-8 gap-1" onClick={() => setUploadDialogOpen(true)}>
                            <UploadCloud className="h-3.5 w-3.5" />
                            Ladda upp
                        </Button>
                    </div>
                }
            >
                <DataTableHeader>
                    <DataTableHeaderCell width="40px">
                        <Checkbox 
                            checked={bulkSelection.allSelected}
                            onCheckedChange={bulkSelection.toggleAll}
                            aria-label="Välj alla"
                        />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell label="Leverantör" icon={Building2} />
                    <DataTableHeaderCell label="Datum" icon={Calendar} />
                    <DataTableHeaderCell label="Kategori" icon={Tag} />
                    <DataTableHeaderCell label="Belopp" icon={Banknote} />
                    <DataTableHeaderCell label="Status" icon={CheckCircle2} />
                    <DataTableHeaderCell label="Bilaga" icon={Paperclip} />
                    <DataTableHeaderCell label="" align="right" />
                </DataTableHeader>
                <DataTableBody>
                    {filteredReceipts.map((receipt) => (
                        <DataTableRow 
                            key={receipt.id}
                            selected={bulkSelection.isSelected(receipt.id)}
                            className="group"
                        >
                            <DataTableCell>
                                <Checkbox 
                                    checked={bulkSelection.isSelected(receipt.id)}
                                    onCheckedChange={() => bulkSelection.toggleItem(receipt.id)}
                                    aria-label={`Välj underlag ${receipt.supplier}`}
                                />
                            </DataTableCell>
                            <DataTableCell bold>{receipt.supplier}</DataTableCell>
                            <DataTableCell muted>{receipt.date}</DataTableCell>
                            <DataTableCell>
                                <CategoryBadge>{receipt.category}</CategoryBadge>
                            </DataTableCell>
                            <DataTableCell align="right">
                                <AmountText value={parseAmount(receipt.amount)} />
                            </DataTableCell>
                            <DataTableCell>
                                <AppStatusBadge 
                                    status={receipt.status} 
                                    size="sm"
                                />
                            </DataTableCell>
                            <DataTableCell muted>
                                <div className="flex items-center gap-2 hover:text-foreground cursor-pointer transition-colors">
                                    <span className="text-xs truncate max-w-[100px]">{receipt.attachment}</span>
                                </div>
                            </DataTableCell>
                            <DataTableCell align="right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" >
                                            <span className="sr-only">Öppna meny</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleViewDetails(receipt)}>
                                            Visa detaljer
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleViewDetails(receipt)}>
                                            Redigera
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(receipt.id)}>
                                            Radera
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                    {filteredReceipts.length === 0 && (
                        <DataTableRow>
                            <DataTableCell colSpan={8} className="text-center py-8">
                                {tableData.searchQuery || tableData.statusFilter.length > 0 
                                    ? "Inga underlag matchar din sökning" 
                                    : "Inga underlag ännu"}
                            </DataTableCell>
                        </DataTableRow>
                    )}
                </DataTableBody>
            </DataTable>
            <DataTableAddRow 
                label="Nytt underlag" 
                onClick={() => setUploadDialogOpen(true)} 
            />

            {/* Bulk Action Toolbar */}
            <BulkActionToolbar
                selectedCount={bulkSelection.selectedCount}
                selectedIds={bulkSelection.selectedIds}
                onClearSelection={bulkSelection.clearSelection}
                actions={bulkActions}
            />
        </div>
    )
}
